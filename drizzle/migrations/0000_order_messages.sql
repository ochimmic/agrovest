CREATE TABLE public.order_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL REFERENCES public.pay_orders(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL DEFAULT auth.uid(),
  from_admin boolean NOT NULL DEFAULT false,
  body text NOT NULL DEFAULT '',
  attachment_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_messages_order_idx ON public.order_messages(order_id, created_at);
GRANT SELECT, INSERT ON public.order_messages TO authenticated;
GRANT ALL ON public.order_messages TO service_role;
ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Order owner and admins read chat" ON public.order_messages FOR SELECT TO authenticated
USING (has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM pay_orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
CREATE POLICY "Order owner and admins post chat" ON public.order_messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND length(body) <= 2000
  AND (
    (from_admin AND has_role(auth.uid(),'admin'))
    OR (NOT from_admin AND EXISTS (SELECT 1 FROM pay_orders o WHERE o.id = order_id AND o.user_id = auth.uid())
        AND (attachment_path IS NULL OR split_part(attachment_path,'/',1) = auth.uid()::text))
  )
);
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_messages;