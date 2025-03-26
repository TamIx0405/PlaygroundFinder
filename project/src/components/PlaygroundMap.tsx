import React, { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Playground {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
}

export function PlaygroundMap() {
  const [playgrounds, setPlaygrounds] = useState<Playground[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          fetchNearbyPlaygrounds(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          fetchAllPlaygrounds();
        }
      );
    } else {
      fetchAllPlaygrounds();
    }
  }, []);

  async function fetchNearbyPlaygrounds(lat: number, lng: number) {
    try {
      const { data, error } = await supabase
        .rpc('get_nearby_playgrounds', {
          user_lat: lat,
          user_lng: lng,
          radius_km: 10
        });

      if (error) throw error;
      setPlaygrounds(data || []);
    } catch (error) {
      console.error('Error fetching nearby playgrounds:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAllPlaygrounds() {
    try {
      const { data, error } = await supabase
        .from('playgrounds')
        .select('id, name, location, latitude, longitude');

      if (error) throw error;
      setPlaygrounds(data || []);
    } catch (error) {
      console.error('Error fetching playgrounds:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="card-playful p-6">
      <h2 className="text-2xl font-display font-bold text-gray-800 mb-4">Nearby Playgrounds</h2>
      <div className="h-[400px] rounded-2xl overflow-hidden">
        {/* Map implementation would go here - using a map library of your choice */}
        <div className="bg-background-light h-full relative">
          {playgrounds.map((playground) => (
            <div
              key={playground.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${playground.longitude}%`,
                top: `${playground.latitude}%`
              }}
            >
              <MapPin className="text-primary w-6 h-6" />
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow-playful whitespace-nowrap">
                <span className="font-body text-sm">{playground.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}