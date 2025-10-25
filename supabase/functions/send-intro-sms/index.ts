import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContactRequest {
  cardId: string;
  name: string;
  phone: string;
}

interface LocationData {
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
}

async function getLocationFromIP(ip: string): Promise<LocationData | null> {
  try {
    if (ip === 'unknown' || !ip) return null;
    
    // Use ipapi.co free tier (1000 requests/day)
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await response.json();
    
    if (data.error) {
      console.error('Geolocation API error:', data);
      return null;
    }
    
    return {
      city: data.city,
      state: data.region,
      country: data.country_name,
      latitude: data.latitude,
      longitude: data.longitude
    };
  } catch (error) {
    console.error('Geolocation failed:', error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { cardId, name, phone }: ContactRequest = await req.json();

    console.log('Received contact request:', { cardId, name, phone });

    // Get client IP for geolocation
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    console.log('Client IP:', clientIP);
    
    // Get location from IP
    const location = await getLocationFromIP(clientIP);
    console.log('Location data:', location);

    // Get card details
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .select('*, user_id')
      .eq('id', cardId)
      .eq('is_active', true)
      .single();

    if (cardError || !card) {
      console.error('Card not found:', cardError);
      throw new Error('Card not found');
    }

    // Get card owner's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', card.user_id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
    }

    // Save contact to database
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .insert({
        card_id: cardId,
        card_owner_id: card.user_id,
        name,
        phone,
        sent_status: 'pending',
        latitude: location?.latitude,
        longitude: location?.longitude,
        city: location?.city,
        state: location?.state,
        country: location?.country
      })
      .select()
      .single();

    if (contactError) {
      console.error('Error saving contact:', contactError);
      throw new Error('Failed to save contact');
    }

    console.log('Contact saved:', contact.id);

    // Send SMS via Vonage
    const vonageApiKey = Deno.env.get('VONAGE_API_KEY');
    const vonageApiSecret = Deno.env.get('VONAGE_API_SECRET');

    if (!vonageApiKey || !vonageApiSecret) {
      console.error('Vonage credentials not configured');
      await supabase
        .from('contacts')
        .update({ 
          sent_status: 'failed',
          error_message: 'SMS service not configured'
        })
        .eq('id', contact.id);
      
      throw new Error('SMS service not configured');
    }

    const ownerName = profile?.full_name || 'A contact';
    const message = `Hi ${card.first_name}, ${ownerName} (${name}) would like to connect! Phone: ${phone}`;

    console.log('Sending SMS to:', card.mobile_number);

    const vonageResponse = await fetch('https://rest.nexmo.com/sms/json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'CardLink',
        to: card.mobile_number?.replace(/\D/g, ''),
        text: message,
        api_key: vonageApiKey,
        api_secret: vonageApiSecret,
      }),
    });

    const vonageData = await vonageResponse.json();
    console.log('Vonage response:', vonageData);

    // Update contact with SMS status
    const smsSuccess = vonageData.messages?.[0]?.status === '0';
    
    await supabase
      .from('contacts')
      .update({
        sent_status: smsSuccess ? 'sent' : 'failed',
        sent_at: smsSuccess ? new Date().toISOString() : null,
        error_message: smsSuccess ? null : vonageData.messages?.[0]?.['error-text']
      })
      .eq('id', contact.id);

    // Log message details
    await supabase
      .from('message_logs')
      .insert({
        contact_id: contact.id,
        status: smsSuccess ? 'sent' : 'failed',
        vonage_message_id: vonageData.messages?.[0]?.['message-id'],
        api_response: vonageData
      });

    return new Response(
      JSON.stringify({ 
        success: smsSuccess,
        message: smsSuccess ? 'Introduction sent!' : 'Failed to send SMS'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-intro-sms:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
