-- Add geographic and city tracking columns to contacts table
ALTER TABLE contacts 
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8),
ADD COLUMN city TEXT,
ADD COLUMN state TEXT,
ADD COLUMN country TEXT DEFAULT 'USA';

-- Add index for geographic queries
CREATE INDEX idx_contacts_location ON contacts(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add index for analytics queries  
CREATE INDEX idx_contacts_owner_date ON contacts(card_owner_id, created_at DESC);