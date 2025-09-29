-- Create certifications table
CREATE TABLE public.certifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  certification_id TEXT NOT NULL UNIQUE,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;

-- Allow public read access for verification
CREATE POLICY "Anyone can verify certifications"
ON public.certifications
FOR SELECT
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_certifications_certification_id ON public.certifications(certification_id);