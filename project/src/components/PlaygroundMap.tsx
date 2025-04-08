import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Playground {
  id: string;
  name: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
}

function MapBounds({ playgrounds }: { playgrounds: Playground[] }) {
  const map = useMap();

  useEffect(() => {
    if (playgrounds.length > 0) {
      const bounds = L.latLngBounds(
        playgrounds.map(p => [p.latitude, p.longitude])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [playgrounds]);

  return null;
}

export function PlaygroundMap() {
  const [playgrounds, setPlaygrounds] = useState<Playground[]>([]);
  const [center, setCenter] = useState<[number, number]>([51.1657, 10.4515]); // Default to center of Germany

  useEffect(() => {
    fetchPlaygrounds();

    // Get user location silently without showing error
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          // Silently fail and keep default center
          console.log('Using default map center');
        }
      );
    }
  }, []);

  const fetchPlaygrounds = async () => {
    try {
      const { data, error } = await supabase
        .from('playgrounds')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) throw error;
      setPlaygrounds(data || []);
    } catch (error) {
      console.error('Error fetching playgrounds:', error);
      toast.error('Error loading playgrounds');
    }
  };

  return (
    <div className="card-playful p-4">
      <div className="w-full h-[300px] sm:h-[400px] rounded-lg overflow-hidden">
        <MapContainer
          center={center}
          zoom={6}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {playgrounds.map((playground) => (
            playground.latitude && playground.longitude ? (
              <Marker
                key={playground.id}
                position={[playground.latitude, playground.longitude]}
              >
                <Popup className="playground-popup">
                  <div className="p-2">
                    <h3 className="font-bold text-base mb-1">{playground.name}</h3>
                    <p className="text-sm text-gray-600 mb-1">{playground.location}</p>
                    <p className="text-sm line-clamp-2">{playground.description}</p>
                  </div>
                </Popup>
              </Marker>
            ) : null
          ))}
          <MapBounds playgrounds={playgrounds} />
        </MapContainer>
      </div>
    </div>
  );
}