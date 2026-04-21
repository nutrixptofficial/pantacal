-- Enable RLS on reviews if not already
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert reviews
DROP POLICY IF EXISTS "Anyone can insert reviews" ON public.reviews;
CREATE POLICY "Anyone can insert reviews"
ON public.reviews
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow anyone to read visible reviews
DROP POLICY IF EXISTS "Anyone can read visible reviews" ON public.reviews;
CREATE POLICY "Anyone can read visible reviews"
ON public.reviews
FOR SELECT
TO anon, authenticated
USING (visible = true);

-- Admins can do everything on reviews
DROP POLICY IF EXISTS "Admins full access to reviews" ON public.reviews;
CREATE POLICY "Admins full access to reviews"
ON public.reviews
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'))