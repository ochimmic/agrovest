
-- Payment orders
CREATE TABLE public.pay_orders (
  id text PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  reference text NOT NULL UNIQUE,
  rail text NOT NULL CHECK (rail IN ('crypto','ngn','usd')),
  payer_name text NOT NULL DEFAULT '',
  amount_usd numeric(14,2) NOT NULL CHECK (amount_usd > 0),
  rate numeric NOT NULL DEFAULT 1,
  token text NOT NULL,
  tx_hash text,
  network text,
  status text NOT NULL DEFAULT 'awaiting_payment' CHECK (status IN ('awaiting_payment','paid_onchain','payment_notified','admin_review','confirmed','rejected')),
  reason text,
  purpose jsonb NOT NULL,
  timeline jsonb NOT NULL DEFAULT '[]'::jsonb,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.pay_orders TO authenticated;
GRANT ALL ON public.pay_orders TO service_role;
ALTER TABLE public.pay_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners and admins view orders" ON public.pay_orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Owners create pending orders" ON public.pay_orders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'awaiting_payment' AND reviewed_by IS NULL);
CREATE TRIGGER pay_orders_updated BEFORE UPDATE ON public.pay_orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX pay_orders_user_idx ON public.pay_orders(user_id, created_at DESC);

-- AssetPay plans
CREATE TABLE public.assetpay_plans (
  id text PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  purpose jsonb NOT NULL,
  total_usd numeric(14,2) NOT NULL CHECK (total_usd > 0),
  deposit_pct numeric NOT NULL CHECK (deposit_pct >= 10 AND deposit_pct <= 90),
  months int NOT NULL CHECK (months IN (3,6,12)),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','cancelled')),
  cancel_reason text,
  refund_usd numeric(14,2),
  installments jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.assetpay_plans TO authenticated;
GRANT ALL ON public.assetpay_plans TO service_role;
ALTER TABLE public.assetpay_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners and admins view plans" ON public.assetpay_plans FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Owners create plans" ON public.assetpay_plans FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'active');
CREATE POLICY "Owners update own plans" ON public.assetpay_plans FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER assetpay_plans_updated BEFORE UPDATE ON public.assetpay_plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Guard: buyers can never mark installments paid or complete a plan themselves
CREATE OR REPLACE FUNCTION public.guard_assetpay_plan()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user <> 'authenticated' THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    IF EXISTS (SELECT 1 FROM jsonb_array_elements(NEW.installments) x WHERE (x->>'paid')::boolean) THEN
      RAISE EXCEPTION 'Installments cannot be created as paid';
    END IF;
    RETURN NEW;
  END IF;
  IF OLD.status <> 'active' THEN RAISE EXCEPTION 'Plan is closed'; END IF;
  IF NEW.status = 'completed' OR NEW.total_usd <> OLD.total_usd OR NEW.purpose <> OLD.purpose
     OR NEW.user_id <> OLD.user_id OR NEW.months <> OLD.months OR NEW.deposit_pct <> OLD.deposit_pct THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  IF (SELECT jsonb_agg(jsonb_build_array(x->'index', x->'amountUsd', COALESCE(x->'paid','false'::jsonb), x->'paidAt') ORDER BY (x->>'index')::int) FROM jsonb_array_elements(NEW.installments) x)
     IS DISTINCT FROM
     (SELECT jsonb_agg(jsonb_build_array(x->'index', x->'amountUsd', COALESCE(x->'paid','false'::jsonb), x->'paidAt') ORDER BY (x->>'index')::int) FROM jsonb_array_elements(OLD.installments) x) THEN
    RAISE EXCEPTION 'Installment payments can only be changed by AgroVest';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER assetpay_plans_guard BEFORE INSERT OR UPDATE ON public.assetpay_plans FOR EACH ROW EXECUTE FUNCTION public.guard_assetpay_plan();

-- Holdings (only created by admin confirmation)
CREATE TABLE public.holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  order_id text,
  plan_id text,
  asset_id text NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  units numeric NOT NULL,
  unit text NOT NULL,
  invested numeric(14,2) NOT NULL,
  purchased_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.holdings TO authenticated;
GRANT ALL ON public.holdings TO service_role;
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners and admins view holdings" ON public.holdings FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- Portfolio activity
CREATE TABLE public.portfolio_txs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  amount numeric(14,2) NOT NULL,
  token text NOT NULL,
  status text NOT NULL DEFAULT 'confirmed',
  hash text,
  meta text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.portfolio_txs TO authenticated;
GRANT ALL ON public.portfolio_txs TO service_role;
ALTER TABLE public.portfolio_txs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners and admins view activity" ON public.portfolio_txs FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- Helper to append a timeline entry
CREATE OR REPLACE FUNCTION public._tl(tl jsonb, msg text) RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT COALESCE(tl,'[]'::jsonb) || jsonb_build_array(jsonb_build_object('t', msg, 'at', to_char(now() AT TIME ZONE 'utc','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')))
$$;

-- Buyer: crypto sent
CREATE OR REPLACE FUNCTION public.order_mark_onchain(p_id text, p_tx_hash text, p_network text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE pay_orders SET status='admin_review', tx_hash=p_tx_hash, network=p_network,
    timeline=_tl(timeline, 'Payment sent on-chain (' || left(p_tx_hash,10) || '…). Awaiting AgroVest confirmation.')
  WHERE id=p_id AND user_id=auth.uid() AND status='awaiting_payment';
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found or already submitted'; END IF;
END $$;

-- Buyer: bank transfer done
CREATE OR REPLACE FUNCTION public.order_mark_transfer(p_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE pay_orders SET status='payment_notified',
    timeline=_tl(timeline, 'Buyer confirmed the bank transfer. Awaiting AgroVest verification.')
  WHERE id=p_id AND user_id=auth.uid() AND status IN ('awaiting_payment','admin_review');
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
END $$;

-- Admin: confirm
CREATE OR REPLACE FUNCTION public.admin_confirm_order(p_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o pay_orders; pl assetpay_plans; inst jsonb; idx int; done boolean;
BEGIN
  IF NOT has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT * INTO o FROM pay_orders WHERE id=p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF o.status IN ('confirmed','rejected') THEN RAISE EXCEPTION 'Order already settled'; END IF;

  IF o.purpose ? 'planId' AND o.purpose ? 'installment' THEN
    idx := (o.purpose->>'installment')::int;
    SELECT * INTO pl FROM assetpay_plans WHERE id = o.purpose->>'planId' FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Plan not found'; END IF;
    SELECT jsonb_agg(CASE WHEN (x->>'index')::int = idx
      THEN x || jsonb_build_object('paid', true, 'paidAt', to_char(now() AT TIME ZONE 'utc','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), 'orderId', o.id)
      ELSE x END ORDER BY (x->>'index')::int) INTO inst
    FROM jsonb_array_elements(pl.installments) x;
    done := NOT EXISTS (SELECT 1 FROM jsonb_array_elements(inst) x WHERE NOT COALESCE((x->>'paid')::boolean,false));
    UPDATE assetpay_plans SET installments=inst, status=CASE WHEN done THEN 'completed' ELSE status END WHERE id=pl.id;
    UPDATE pay_orders SET status='confirmed', reviewed_by=auth.uid(),
      timeline=_tl(timeline, 'AgroVest confirmed this AssetPay installment.') WHERE id=o.id;
    INSERT INTO portfolio_txs(user_id,type,amount,token,hash,meta)
      VALUES (o.user_id,'invest',o.amount_usd,o.token,o.tx_hash,'AssetPay · ' || (o.purpose->>'assetName'));
    IF done THEN
      INSERT INTO holdings(user_id,plan_id,asset_id,name,category,units,unit,invested)
      VALUES (o.user_id, pl.id, pl.purpose->>'assetId', pl.purpose->>'assetName', pl.purpose->>'category',
              (pl.purpose->>'qty')::numeric, pl.purpose->>'unit', pl.total_usd);
    END IF;
    RETURN;
  END IF;

  UPDATE pay_orders SET status='confirmed', reviewed_by=auth.uid(),
    timeline=_tl(timeline, 'AgroVest confirmed the payment. Holding created and documents issued.') WHERE id=o.id;
  INSERT INTO holdings(user_id,order_id,asset_id,name,category,units,unit,invested)
  VALUES (o.user_id, o.id, o.purpose->>'assetId', o.purpose->>'assetName', o.purpose->>'category',
          (o.purpose->>'qty')::numeric, o.purpose->>'unit', o.amount_usd);
  INSERT INTO portfolio_txs(user_id,type,amount,token,hash,meta)
    VALUES (o.user_id,'invest',o.amount_usd,o.token,o.tx_hash,o.purpose->>'assetName');
END $$;

-- Admin: reject
CREATE OR REPLACE FUNCTION public.admin_reject_order(p_id text, p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o pay_orders;
BEGIN
  IF NOT has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT * INTO o FROM pay_orders WHERE id=p_id FOR UPDATE;
  IF NOT FOUND OR o.status IN ('confirmed','rejected') THEN RAISE EXCEPTION 'Order not found or settled'; END IF;
  UPDATE pay_orders SET status='rejected', reason=p_reason, reviewed_by=auth.uid(),
    timeline=_tl(timeline, 'Rejected by AgroVest: ' || p_reason) WHERE id=p_id;
  IF o.purpose ? 'planId' AND o.purpose ? 'installment' THEN
    UPDATE assetpay_plans SET installments = (
      SELECT jsonb_agg(CASE WHEN (x->>'index')::int = (o.purpose->>'installment')::int THEN x - 'orderId' ELSE x END ORDER BY (x->>'index')::int)
      FROM jsonb_array_elements(installments) x)
    WHERE id = o.purpose->>'planId';
  END IF;
END $$;

-- Admin: request info
CREATE OR REPLACE FUNCTION public.admin_request_info(p_id text, p_note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE pay_orders SET status='admin_review',
    timeline=_tl(timeline, 'AgroVest requested more information: ' || p_note)
  WHERE id=p_id AND status NOT IN ('confirmed','rejected');
END $$;

REVOKE EXECUTE ON FUNCTION public.order_mark_onchain(text,text,text), public.order_mark_transfer(text),
  public.admin_confirm_order(text), public.admin_reject_order(text,text), public.admin_request_info(text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.order_mark_onchain(text,text,text), public.order_mark_transfer(text),
  public.admin_confirm_order(text), public.admin_reject_order(text,text), public.admin_request_info(text,text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_assetpay_plan() FROM PUBLIC, anon, authenticated;

-- Live updates for the admin queue and buyers
ALTER PUBLICATION supabase_realtime ADD TABLE public.pay_orders, public.assetpay_plans, public.holdings, public.portfolio_txs;
