import { supabase } from '@/integrations/supabase/client';

interface ConnectionMetrics {
  total: number;
  thisMonth: number;
  topCity: string | null;
  topCityCount?: number;
  recentContact: {
    name: string;
    date: string;
  } | null;
}

interface ContactWithLocation {
  id: string;
  name: string;
  phone: string;
  city?: string;
  state?: string;
  latitude: number;
  longitude: number;
  created_at: string;
  card_name?: string;
}

export async function getConnectionMetrics(userId: string): Promise<ConnectionMetrics> {
  try {
    // Get total connections count
    const { count: totalCount } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('card_owner_id', userId);

    // Get connections from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: monthCount } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('card_owner_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Get all cities to find most common
    const { data: cityData } = await supabase
      .from('contacts')
      .select('city')
      .eq('card_owner_id', userId)
      .not('city', 'is', null);

    let topCity = null;
    let topCityCount = 0;

    if (cityData && cityData.length > 0) {
      const cityCounts: Record<string, number> = {};
      cityData.forEach((contact: { city: string }) => {
        if (contact.city) {
          cityCounts[contact.city] = (cityCounts[contact.city] || 0) + 1;
        }
      });

      const topCityEntry = Object.entries(cityCounts).sort((a, b) => b[1] - a[1])[0];
      if (topCityEntry) {
        topCity = topCityEntry[0];
        topCityCount = topCityEntry[1];
      }
    }

    // Get most recent contact
    const { data: recentData } = await supabase
      .from('contacts')
      .select('name, created_at')
      .eq('card_owner_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return {
      total: totalCount || 0,
      thisMonth: monthCount || 0,
      topCity,
      topCityCount,
      recentContact: recentData ? {
        name: recentData.name,
        date: recentData.created_at
      } : null
    };
  } catch (error) {
    console.error('Error fetching connection metrics:', error);
    return {
      total: 0,
      thisMonth: 0,
      topCity: null,
      recentContact: null
    };
  }
}

export async function getContactsWithLocation(userId: string): Promise<ContactWithLocation[]> {
  try {
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select(`
        id,
        name,
        phone,
        city,
        state,
        latitude,
        longitude,
        created_at,
        cards!inner(card_name)
      `)
      .eq('card_owner_id', userId)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (contacts || []).map((contact: any) => ({
      id: contact.id,
      name: contact.name,
      phone: contact.phone,
      city: contact.city,
      state: contact.state,
      latitude: contact.latitude,
      longitude: contact.longitude,
      created_at: contact.created_at,
      card_name: contact.cards?.card_name
    }));
  } catch (error) {
    console.error('Error fetching contacts with location:', error);
    return [];
  }
}
