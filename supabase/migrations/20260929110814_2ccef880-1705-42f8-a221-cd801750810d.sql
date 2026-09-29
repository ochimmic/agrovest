ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by uuid,
  ADD COLUMN IF NOT EXISTS payout_method jsonb;

CREATE OR REPLACE FUNCTION public.gen_ref_code() RETURNS text LANGUAGE plpgsql SET search_path = public AS $$
DECLARE c text;
BEGIN
  LOOP
    c := 'AGV-BR-' || lpad((floor(random()*1000000))::int::text, 6, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE referral_code = c);
  END LOOP;
  RETURN c;
END $$;

-- Backfill codes for existing brokers
UPDATE public.profiles p SET referral_code = public.gen_ref_code()
WHERE referral_code IS NULL AND EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = p.id AND r.role = 'broker');

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  requested_role public.app_role;
  ref_user uuid;
BEGIN
  SELECT id INTO ref_user FROM public.profiles
   WHERE referral_code = upper(NULLIF(trim(NEW.raw_user_meta_data ->> 'ref'), '')) LIMIT 1;

  BEGIN
    requested_role := COALESCE((NEW.raw_user_meta_data ->> 'role')::public.app_role, 'investor');
  EXCEPTION WHEN others THEN
    requested_role := 'investor';
  END;
  IF requested_role = 'admin' THEN requested_role := 'investor'; END IF;

  INSERT INTO public.profiles (id, full_name, email, phone, country, referred_by, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.email, ''),
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'country',
    ref_user,
    CASE WHEN requested_role = 'broker' THEN public.gen_ref_code() ELSE NULL END
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, requested_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.guard_profile_kyc()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
BEGIN
  IF current_user = 'authenticated' AND NOT has_role(auth.uid(),'admin') THEN
    IF NEW.kyc IS DISTINCT FROM OLD.kyc THEN RAISE EXCEPTION 'KYC status can only be changed by AgroVest'; END IF;
    IF NEW.referred_by IS DISTINCT FROM OLD.referred_by OR NEW.referral_code IS DISTINCT FROM OLD.referral_code THEN
      RAISE EXCEPTION 'Referral details cannot be changed';
    END IF;
  END IF;
  RETURN NEW;
END $function$;

-- Broker: list own referrals
CREATE OR REPLACE FUNCTION public.my_referrals()
 RETURNS TABLE(full_name text, joined_at timestamptz, kyc kyc_status, purchases bigint)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT p.full_name, p.created_at, p.kyc,
    (SELECT count(*) FROM holdings h WHERE h.user_id = p.id)
  FROM profiles p WHERE p.referred_by = auth.uid() ORDER BY p.created_at DESC
$$;
REVOKE EXECUTE ON FUNCTION public.my_referrals() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_referrals() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.gen_ref_code() FROM PUBLIC, anon, authenticated;

-- Documents
CREATE TABLE public.investor_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  holding_id uuid NOT NULL REFERENCES public.holdings(id) ON DELETE CASCADE,
  doc_type text NOT NULL CHECK (doc_type IN ('receipt','contract_of_sale','deed_of_assignment','survey_plan','rofo')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','under_review','issued')),
  due_note text,
  file_path text,
  issued_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (holding_id, doc_type)
);
GRANT SELECT, UPDATE ON public.investor_documents TO authenticated;
GRANT ALL ON public.investor_documents TO service_role;
ALTER TABLE public.investor_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners and admins view documents" ON public.investor_documents FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update documents" ON public.investor_documents FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER investor_documents_updated BEFORE UPDATE ON public.investor_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.holding_create_documents()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO investor_documents(user_id, holding_id, doc_type, status, due_note, issued_at) VALUES
    (NEW.user_id, NEW.id, 'receipt', 'issued', NULL, now()),
    (NEW.user_id, NEW.id, 'contract_of_sale', 'pending', 'Within 48 hours', NULL),
    (NEW.user_id, NEW.id, 'deed_of_assignment', 'pending', 'Within 48 hours', NULL),
    (NEW.user_id, NEW.id, 'survey_plan', 'under_review', 'Government review · 3–12 months', NULL),
    (NEW.user_id, NEW.id, 'rofo', 'under_review', 'Government review · 3–12 months', NULL)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.holding_create_documents() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER holdings_create_documents AFTER INSERT ON public.holdings
  FOR EACH ROW EXECUTE FUNCTION public.holding_create_documents();

-- Backfill for existing holdings
INSERT INTO public.investor_documents(user_id, holding_id, doc_type, status, due_note, issued_at)
SELECT h.user_id, h.id, d.t, d.s, d.n, CASE WHEN d.t='receipt' THEN now() END
FROM public.holdings h CROSS JOIN (VALUES
  ('receipt','issued',NULL),
  ('contract_of_sale','pending','Within 48 hours'),
  ('deed_of_assignment','pending','Within 48 hours'),
  ('survey_plan','under_review','Government review · 3–12 months'),
  ('rofo','under_review','Government review · 3–12 months')) d(t,s,n)
ON CONFLICT DO NOTHING;

-- Payout requests
CREATE TABLE public.payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  amount_usd numeric NOT NULL CHECK (amount_usd > 0),
  method text NOT NULL CHECK (method IN ('bank','crypto')),
  details jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','rejected')),
  admin_note text,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.payout_requests TO authenticated;
GRANT ALL ON public.payout_requests TO service_role;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners and admins view payouts" ON public.payout_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));
CREATE POLICY "Brokers request payouts" ON public.payout_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending' AND reviewed_by IS NULL AND admin_note IS NULL
    AND has_role(auth.uid(),'broker'));
CREATE POLICY "Admins review payouts" ON public.payout_requests FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER payout_requests_updated BEFORE UPDATE ON public.payout_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage policies for signed documents bucket (bucket created separately)
CREATE POLICY "Owners read own investor docs" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'investor-documents' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(),'admin')));
CREATE POLICY "Admins upload investor docs" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'investor-documents' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update investor docs" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'investor-documents' AND public.has_role(auth.uid(),'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.investor_documents, public.payout_requests;