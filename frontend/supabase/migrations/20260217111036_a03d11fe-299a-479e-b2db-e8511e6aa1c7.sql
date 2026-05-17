
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-media', 'campaign-media', true);

CREATE POLICY "Authenticated users can upload campaign media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'campaign-media' AND auth.role() = 'authenticated');

CREATE POLICY "Public can view campaign media"
ON storage.objects FOR SELECT
USING (bucket_id = 'campaign-media');

CREATE POLICY "Authenticated users can update their media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'campaign-media' AND auth.uid() = owner);

CREATE POLICY "Authenticated users can delete their media"
ON storage.objects FOR DELETE
USING (bucket_id = 'campaign-media' AND auth.uid() = owner);
