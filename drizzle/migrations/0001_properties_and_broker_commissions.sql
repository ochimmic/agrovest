CREATE TABLE public.properties (
  id text PRIMARY KEY DEFAULT ('h-' || substr(md5(random()::text), 1, 8)),
  title text NOT NULL,
  location text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'House',
  market_price_ngn numeric NOT NULL CHECK (market_price_ngn > 0),
  title_doc text NOT NULL DEFAULT 'Under review',
  verified boolean NOT NULL DEFAULT false,
  inspection_date text NOT NULL DEFAULT 'Pending',
  survey_ok boolean NOT NULL DEFAULT false,
  structural_ok boolean NOT NULL DEFAULT false,
  title_search_ok boolean NOT NULL DEFAULT false,
  description text NOT NULL DEFAULT '',
  disclaimer text NOT NULL DEFAULT '',
  image_path text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','sold')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.properties TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;
GRANT ALL ON public.properties TO service_role;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views listed houses" ON public.properties FOR SELECT TO anon, authenticated
  USING (status IN ('active','sold') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins insert houses" ON public.properties FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update houses" ON public.properties FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete houses" ON public.properties FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER properties_updated BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Anyone reads property images" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'property-images');
CREATE POLICY "Admins upload property images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'property-images' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update property images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'property-images' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete property images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'property-images' AND public.has_role(auth.uid(),'admin'));

-- Broker commissions: credited automatically when AgroVest confirms a referred investor's payment.
CREATE TABLE public.broker_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id uuid NOT NULL,
  investor_id uuid NOT NULL,
  order_id text NOT NULL UNIQUE,
  asset_name text NOT NULL DEFAULT '',
  kind text NOT NULL,
  pct numeric NOT NULL,
  base_usd numeric NOT NULL,
  amount_usd numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.broker_commissions TO authenticated;
GRANT ALL ON public.broker_commissions TO service_role;
ALTER TABLE public.broker_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Brokers and admins view commissions" ON public.broker_commissions FOR SELECT TO authenticated
  USING (auth.uid() = broker_id OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.credit_broker_commission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE b uuid; k text; p numeric;
BEGIN
  IF NEW.status <> 'confirmed' OR OLD.status = 'confirmed' THEN RETURN NEW; END IF;
  SELECT referred_by INTO b FROM profiles WHERE id = NEW.user_id;
  IF b IS NULL OR NOT has_role(b,'broker') THEN RETURN NEW; END IF;
  IF COALESCE(NEW.purpose->>'category','') = 'property' THEN k := 'property'; p := 2; ELSE k := 'farmvest'; p := 5; END IF;
  INSERT INTO broker_commissions(broker_id, investor_id, order_id, asset_name, kind, pct, base_usd, amount_usd)
  VALUES (b, NEW.user_id, NEW.id, COALESCE(NEW.purpose->>'assetName',''), k, p, NEW.amount_usd, round(NEW.amount_usd * p / 100, 2))
  ON CONFLICT (order_id) DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER pay_orders_credit_broker AFTER UPDATE OF status ON public.pay_orders FOR EACH ROW EXECUTE FUNCTION public.credit_broker_commission();

-- Payout tickets
ALTER TABLE public.payout_requests ADD COLUMN reference text NOT NULL DEFAULT ('PO-' || lpad((floor(random()*1000000))::int::text, 6, '0'));
ALTER TABLE public.payout_requests ADD COLUMN fee_usd numeric NOT NULL DEFAULT 0;
ALTER TABLE public.payout_requests ADD COLUMN net_usd numeric;

CREATE OR REPLACE FUNCTION public.my_commission_balance()
RETURNS TABLE(earned numeric, withdrawn numeric, pending numeric, available numeric, plots numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  WITH e AS (SELECT COALESCE(sum(amount_usd),0) v FROM broker_commissions WHERE broker_id = auth.uid()),
       w AS (SELECT COALESCE(sum(amount_usd) FILTER (WHERE status='paid'),0) paid,
                    COALESCE(sum(amount_usd) FILTER (WHERE status='pending'),0) pend
             FROM payout_requests WHERE user_id = auth.uid()),
       pl AS (SELECT COALESCE(sum(CASE h.unit WHEN 'acre' THEN h.units*6 WHEN 'hectare' THEN h.units*15 WHEN 'plot' THEN h.units ELSE 0 END),0) v
              FROM holdings h JOIN profiles pr ON pr.id = h.user_id WHERE pr.referred_by = auth.uid())
  SELECT e.v, w.paid, w.pend, e.v - w.paid - w.pend, pl.v FROM e, w, pl
$$;

-- Server-side checks on payout requests: balance, fee and net amount.
CREATE OR REPLACE FUNCTION public.guard_payout_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE avail numeric; pl numeric; free boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT COALESCE(sum(amount_usd),0) INTO avail FROM broker_commissions WHERE broker_id = NEW.user_id;
    avail := avail - (SELECT COALESCE(sum(amount_usd),0) FROM payout_requests WHERE user_id = NEW.user_id AND status IN ('pending','paid'));
    IF NEW.amount_usd <= 0 OR NEW.amount_usd > avail THEN RAISE EXCEPTION 'Amount exceeds your available commission'; END IF;
    SELECT COALESCE(sum(CASE h.unit WHEN 'acre' THEN h.units*6 WHEN 'hectare' THEN h.units*15 WHEN 'plot' THEN h.units ELSE 0 END),0) INTO pl
      FROM holdings h JOIN profiles pr ON pr.id = h.user_id WHERE pr.referred_by = NEW.user_id;
    -- Free once a tier milestone is reached (11.5 plots, 69 plots, 352.5 plots) or Platinum (360+ plots); else 20% emergency fee.
    free := pl >= 360 OR pl IN (11.5, 69, 352.5) OR (pl >= 11.5 AND pl < 12) OR (pl >= 69 AND pl < 72) OR (pl >= 352.5 AND pl < 360);
    NEW.fee_usd := CASE WHEN free THEN 0 ELSE round(NEW.amount_usd * 0.20, 2) END;
    NEW.net_usd := NEW.amount_usd - NEW.fee_usd;
    NEW.reference := 'PO-' || lpad((floor(random()*1000000))::int::text, 6, '0');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER payout_requests_guard BEFORE INSERT ON public.payout_requests FOR EACH ROW EXECUTE FUNCTION public.guard_payout_request();