import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Contact {
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

interface ConnectionsMapProps {
  contacts: Contact[];
}

const ConnectionsMap = ({ contacts }: ConnectionsMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoidHBlcnNvbjI3IiwiYSI6ImNtaDR6c3djaDAyaXoyam9hZTk3MDBubmwifQ.9WVAxdb_pfs_hMoDaZBAHg';
    if (!token) {
      console.error('Mapbox access token not configured');
      return;
    }

    mapboxgl.accessToken = token;

    // Initialize map with dark theme
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-98.5795, 39.8283], // Center of USA
      zoom: 3,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current || !mapLoaded || contacts.length === 0) return;

    // Prepare GeoJSON data for heatmap
    const geojsonData = {
      type: 'FeatureCollection',
      features: contacts
        .filter(contact => contact.latitude && contact.longitude)
        .map(contact => ({
          type: 'Feature',
          properties: {
            name: contact.name,
            phone: contact.phone,
            city: contact.city,
            state: contact.state,
            card_name: contact.card_name,
            created_at: contact.created_at
          },
          geometry: {
            type: 'Point',
            coordinates: [contact.longitude, contact.latitude]
          }
        }))
    };

    // Add or update heatmap source and layer
    if (!map.current.getSource('contacts-heat')) {
      map.current.addSource('contacts-heat', {
        type: 'geojson',
        data: geojsonData as any
      });

      map.current.addLayer({
        id: 'contacts-heatmap',
        type: 'heatmap',
        source: 'contacts-heat',
        paint: {
          // Increase weight as diameter increases
          'heatmap-weight': 1,
          // Increase intensity as zoom level increases
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 1,
            9, 3
          ],
          // Color ramp for heatmap - uses theme colors
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(79, 70, 229, 0)',
            0.2, 'rgb(79, 70, 229)',
            0.4, 'rgb(139, 92, 246)',
            0.6, 'rgb(168, 85, 247)',
            0.8, 'rgb(192, 132, 252)',
            1, 'rgb(243, 115, 99)'
          ],
          // Adjust radius by zoom level
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 15,
            9, 40
          ],
          // Transition from heatmap to circle layer by zoom level
          'heatmap-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            7, 0.8,
            9, 0.4
          ]
        }
      });
    } else {
      // Update existing source
      const source = map.current.getSource('contacts-heat') as mapboxgl.GeoJSONSource;
      source.setData(geojsonData as any);
    }

    // Clear existing markers
    const markers = document.querySelectorAll('.mapboxgl-marker');
    markers.forEach(marker => marker.remove());

    // Add markers for each contact
    const bounds = new mapboxgl.LngLatBounds();

    contacts.forEach((contact) => {
      if (!contact.latitude || !contact.longitude) return;

      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'connection-marker';
      el.style.width = '30px';
      el.style.height = '30px';
      el.style.backgroundColor = '#F37363';
      el.style.borderRadius = '50%';
      el.style.border = '3px solid rgba(243, 115, 99, 0.3)';
      el.style.cursor = 'pointer';
      el.style.transition = 'all 0.3s ease';
      el.style.boxShadow = '0 2px 8px rgba(243, 115, 99, 0.4)';

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.15)';
        el.style.boxShadow = '0 4px 12px rgba(243, 115, 99, 0.6)';
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
        el.style.boxShadow = '0 2px 8px rgba(243, 115, 99, 0.4)';
      });

      // Create popup
      const popupContent = `
        <div style="color:#E8E8E8;font-family:Inter,sans-serif;min-width:180px;">
          <strong style="color:#FFF;font-size:16px;">${contact.name}</strong><br/>
          ${contact.card_name ? `<span style="color:#9A9A9A;font-size:14px;">${contact.card_name}</span><br/>` : ''}
          ${contact.city && contact.state ? `<span style="color:#A97FFF;font-size:13px;">${contact.city}, ${contact.state}</span><br/>` : ''}
          <small style="color:#9A9A9A;font-size:12px;">Connected: ${new Date(contact.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</small><br/>
          <span style="color:#F37363;font-size:12px;">${contact.phone}</span>
        </div>
      `;

      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        className: 'connection-popup'
      }).setHTML(popupContent);

      // Add marker to map
      new mapboxgl.Marker(el)
        .setLngLat([contact.longitude, contact.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      bounds.extend([contact.longitude, contact.latitude]);
    });

    // Fit map to show all markers
    if (contacts.length > 0) {
      map.current.fitBounds(bounds, {
        padding: 60,
        maxZoom: 12
      });
    }
  }, [contacts, mapLoaded]);


  return (
    <div ref={mapContainer} className="w-full h-[520px] md:h-[520px] rounded-2xl" />
  );
};

export default ConnectionsMap;
