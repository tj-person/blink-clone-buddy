-- Create contacts table for Smart Intro feature
CREATE TABLE public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
  card_owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Contact Information
  name text NOT NULL,
  phone text NOT NULL, -- E.164 format: +1XXXXXXXXXX
  
  -- Message Status
  sent_status text NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  error_message text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  sent_at timestamptz,
  
  -- Prevent duplicates from same card
  UNIQUE(card_id, phone)
);

-- Create message_logs table for tracking API responses
CREATE TABLE public.message_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  
  -- API Response Data
  vonage_message_id text,
  status text NOT NULL,
  api_response jsonb,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX contacts_card_owner_id_idx ON public.contacts(card_owner_id);
CREATE INDEX contacts_sent_status_idx ON public.contacts(sent_status);
CREATE INDEX message_logs_contact_id_idx ON public.message_logs(contact_id);

-- Enable RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contacts table
CREATE POLICY "Card owners can view their contacts"
ON public.contacts FOR SELECT
USING (card_owner_id = auth.uid());

CREATE POLICY "Public can submit contact info"
ON public.contacts FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update contact status"
ON public.contacts FOR UPDATE
USING (true);

-- RLS Policies for message_logs table
CREATE POLICY "Card owners can view message logs"
ON public.message_logs FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.contacts 
  WHERE contacts.id = message_logs.contact_id 
  AND contacts.card_owner_id = auth.uid()
));

CREATE POLICY "System can insert message logs"
ON public.message_logs FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update message logs"
ON public.message_logs FOR UPDATE
USING (true);