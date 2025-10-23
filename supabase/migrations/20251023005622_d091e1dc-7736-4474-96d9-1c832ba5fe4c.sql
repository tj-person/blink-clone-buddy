-- Create storage buckets for profile photos and company logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('profile-photos', 'profile-photos', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
  ('company-logos', 'company-logos', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for profile-photos bucket
CREATE POLICY "Anyone can view profile photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

CREATE POLICY "Authenticated users can upload profile photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-photos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own profile photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for company-logos bucket
CREATE POLICY "Anyone can view company logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-logos');

CREATE POLICY "Authenticated users can upload company logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'company-logos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own company logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'company-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own company logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'company-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create cards table
CREATE TABLE public.cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Personal Information
  first_name text NOT NULL,
  last_name text NOT NULL,
  job_title text,
  
  -- Company Information
  company_name text,
  work_address text,
  
  -- Contact Information
  mobile_number text,
  company_number text,
  
  -- Media
  profile_photo_url text,
  company_logo_url text,
  
  -- Card Settings
  card_name text NOT NULL,
  is_active boolean DEFAULT true,
  theme_color text DEFAULT '#4F46E5',
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT unique_user_card_name UNIQUE(user_id, card_name)
);

-- Enable RLS on cards table
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cards table
CREATE POLICY "Users can view their own cards"
ON public.cards FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Public can view active cards"
ON public.cards FOR SELECT
USING (is_active = true);

CREATE POLICY "Users can insert their own cards"
ON public.cards FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cards"
ON public.cards FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cards"
ON public.cards FOR DELETE
USING (auth.uid() = user_id);

-- Create card_analytics table
CREATE TABLE public.card_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL UNIQUE,
  view_count integer DEFAULT 0,
  last_viewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on card_analytics table
ALTER TABLE public.card_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for card_analytics
CREATE POLICY "Users can view analytics for their own cards"
ON public.card_analytics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.cards
    WHERE cards.id = card_analytics.card_id
    AND cards.user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can update analytics for public cards"
ON public.card_analytics FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.cards
    WHERE cards.id = card_analytics.card_id
    AND cards.is_active = true
  )
);

CREATE POLICY "System can insert analytics"
ON public.card_analytics FOR INSERT
WITH CHECK (true);

-- Trigger to update updated_at on cards
CREATE TRIGGER update_cards_updated_at
BEFORE UPDATE ON public.cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to initialize analytics when card is created
CREATE OR REPLACE FUNCTION public.initialize_card_analytics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.card_analytics (card_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- Trigger to initialize analytics
CREATE TRIGGER on_card_created
AFTER INSERT ON public.cards
FOR EACH ROW
EXECUTE FUNCTION public.initialize_card_analytics();