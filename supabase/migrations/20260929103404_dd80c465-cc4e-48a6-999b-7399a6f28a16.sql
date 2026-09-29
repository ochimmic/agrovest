CREATE TABLE public.kyc_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  id_type text NOT NULL,
  id_number text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  postcode text,
  id_doc_path text NOT NULL,
  selfie_path text NOT NULL,
  address_doc_path text,
  status text NOT NULL DEFAULT 'review',
  admin_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.kyc_submissions TO authenticated;
GRANT ALL ON public.kyc_submissions TO service_role;
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners and admins view kyc" ON public.kyc_submissions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));
CREATE POLICY "Owners submit kyc" ON public.kyc_submissions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'review' AND reviewed_by IS NULL AND admin_note IS NULL);
CREATE TRIGGER kyc_submissions_updated BEFORE UPDATE ON public.kyc_submissions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- On submit: mark profile under review (definer so it bypasses the kyc guard)
CREATE OR REPLACE FUNCTION public.kyc_after_submit() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE profiles SET kyc='review' WHERE id=NEW.user_id AND kyc <> 'approved';
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.kyc_after_submit() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER kyc_submissions_after_insert AFTER INSERT ON public.kyc_submissions FOR EACH ROW EXECUTE FUNCTION kyc_after_submit();

-- Buyers can't change their own KYC status
CREATE OR REPLACE FUNCTION public.guard_profile_kyc() RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF current_user = 'authenticated' AND NEW.kyc IS DISTINCT FROM OLD.kyc AND NOT has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'KYC status can only be changed by AgroVest';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER profiles_guard_kyc BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION guard_profile_kyc();

CREATE OR REPLACE FUNCTION public.admin_review_kyc(p_id uuid, p_decision text, p_note text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE k kyc_submissions;
BEGIN
  IF NOT has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF p_decision NOT IN ('approved','rejected','more_info') THEN RAISE EXCEPTION 'Invalid decision'; END IF;
  SELECT * INTO k FROM kyc_submissions WHERE id=p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Submission not found'; END IF;
  UPDATE kyc_submissions SET status=p_decision, admin_note=p_note, reviewed_by=auth.uid(), reviewed_at=now() WHERE id=p_id;
  UPDATE profiles SET kyc=p_decision::kyc_status WHERE id=k.user_id;
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_review_kyc(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_review_kyc(uuid,text,text) TO authenticated;

-- Payment receipts
ALTER TABLE public.pay_orders ADD COLUMN receipt_path text;
CREATE OR REPLACE FUNCTION public.order_mark_transfer(p_id text, p_receipt text DEFAULT NULL) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF p_receipt IS NOT NULL AND split_part(p_receipt,'/',1) <> auth.uid()::text THEN RAISE EXCEPTION 'Invalid receipt'; END IF;
  UPDATE pay_orders SET status='payment_notified', receipt_path=COALESCE(p_receipt, receipt_path),
    timeline=_tl(timeline, CASE WHEN p_receipt IS NULL THEN 'Buyer confirmed the bank transfer. Awaiting AgroVest verification.'
      ELSE 'Buyer confirmed the bank transfer and uploaded a receipt. Awaiting AgroVest verification.' END)
  WHERE id=p_id AND user_id=auth.uid() AND status IN ('awaiting_payment','admin_review','payment_notified');
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
END $$;
DROP FUNCTION IF EXISTS public.order_mark_transfer(text);
REVOKE EXECUTE ON FUNCTION public.order_mark_transfer(text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.order_mark_transfer(text,text) TO authenticated;

-- Storage: files live under <user_id>/...
CREATE POLICY "Own kyc uploads" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('kyc-documents','payment-receipts') AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Own or admin read private files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id IN ('kyc-documents','payment-receipts') AND ((storage.foldername(name))[1] = auth.uid()::text OR has_role(auth.uid(),'admin')));