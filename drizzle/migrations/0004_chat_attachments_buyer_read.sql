CREATE POLICY "Buyers read chat attachments on own orders" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'payment-receipts' AND EXISTS (
  SELECT 1 FROM public.order_messages m JOIN public.pay_orders o ON o.id = m.order_id
  WHERE m.attachment_path = storage.objects.name AND o.user_id = auth.uid()));