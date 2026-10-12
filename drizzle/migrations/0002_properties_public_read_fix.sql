DROP POLICY "Anyone views listed houses" ON public.properties;
CREATE POLICY "Anyone views listed houses" ON public.properties FOR SELECT TO anon USING (status IN ('active','sold'));
CREATE POLICY "Signed-in view listed houses" ON public.properties FOR SELECT TO authenticated USING (status IN ('active','sold') OR public.has_role(auth.uid(),'admin'));
DROP POLICY "Anyone reads property images" ON storage.objects;
CREATE POLICY "Anyone reads property images" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'property-images');