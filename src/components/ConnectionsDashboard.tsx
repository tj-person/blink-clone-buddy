import { useEffect, useState } from 'react';
import ConnectionsMap from './ConnectionsMap';
import ConnectionStats from './ConnectionStats';
import { getConnectionMetrics, getContactsWithLocation } from '@/lib/connectionAnalytics';
import type { User } from '@supabase/supabase-js';

interface ConnectionsDashboardProps {
  user: User;
  className?: string;
}

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

const ConnectionsDashboard = ({ user, className = '' }: ConnectionsDashboardProps) => {
  const [metrics, setMetrics] = useState<ConnectionMetrics>({
    total: 0,
    thisMonth: 0,
    topCity: null,
    recentContact: null
  });
  const [contacts, setContacts] = useState<ContactWithLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [metricsData, contactsData] = await Promise.all([
          getConnectionMetrics(user.id),
          getContactsWithLocation(user.id)
        ]);
        
        setMetrics(metricsData);
        setContacts(contactsData);
      } catch (error) {
        console.error('Error loading connections data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user.id]);

  // Don't show dashboard if no contacts exist yet
  if (!loading && metrics.total === 0) {
    return null;
  }

  return (
    <section className={`connections-dashboard ${className}`}>
      <header className="mb-6">
        <h2 className="gradient-text mb-2">Connections Dashboard</h2>
        <p className="text-muted-foreground">
          See where you've connected and how your network is growing
        </p>
      </header>

      <ConnectionStats metrics={metrics} loading={loading} />

      {contacts.length > 0 && (
        <div className="map-card mt-6">
          <ConnectionsMap contacts={contacts} />
        </div>
      )}

      {!loading && contacts.length === 0 && metrics.total > 0 && (
        <div className="mt-6 p-8 bg-card rounded-2xl border border-border text-center">
          <p className="text-muted-foreground">
            You have {metrics.total} connection{metrics.total !== 1 ? 's' : ''}, but location data is not yet available.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            New connections will automatically appear on the map.
          </p>
        </div>
      )}
    </section>
  );
};

export default ConnectionsDashboard;
