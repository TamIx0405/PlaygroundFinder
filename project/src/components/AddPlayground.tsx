import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Upload, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Location {
  lat: number;
  lng: number;
}

function LocationMarker({ position, setPosition }: { 
  position: Location | null;
  setPosition: (pos: Location) => void;
}) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position} />
  );
}

export function AddPlayground({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [streetName, setStreetName] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [minAge, setMinAge] = useState(0);
  const [maxAge, setMaxAge] = useState(12);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [position, setPosition] = useState<Location | null>(null);
  const [center, setCenter] = useState<[number, number]>([51.1657, 10.4515]); // Default to center of Germany
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingAttempts, setGeocodingAttempts] = useState(0);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCenter([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {
          toast.error('Location not found!');
        }
      );
    }
  }, []);

  const validateAddressFields = () => {
    if (!streetNumber.trim()) {
      toast.error('Please enter a street number');
      return false;
    }
    if (!streetName.trim()) {
      toast.error('Please enter a street name');
      return false;
    }
    if (!city.trim()) {
      toast.error('Please enter a city');
      return false;
    }
    if (!/^\d{5}$/.test(zipCode)) {
      toast.error('Please enter a valid zip code');
      return false;
    }
    return true;
  };

  const geocodeAddress = async () => {
    if (!validateAddressFields() || isGeocoding) return;
    if (geocodingAttempts >= 3) {
      toast.error('Address not found. Please check and try again');
      return;
    }

    setIsGeocoding(true);
    try {
      const fullAddress = `${streetName.trim()} ${streetNumber.trim()}, ${city.trim()}`; 

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/geocode`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
        body: JSON.stringify({ 
          zipCode: zipCode.trim(),
          address: fullAddress
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Address not found');
      }

      const data = await response.json();
      if (!data || typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
        throw new Error('Invalid response from geocoding service');
      }

      setPosition({
        lat: data.latitude,
        lng: data.longitude,
      });
      setCenter([data.latitude, data.longitude]);
      setGeocodingAttempts(0);

      if (!data.exact_match) {
        toast.error('Location found, but the zip code might not match exactly. Please verify the address.', {
          style: {
            background: '#FEF3C7',
            color: '#92400E',
            border: '1px solid #F59E0B'
          },
          duration: 5000
        });
      }
    } catch (error: any) {
      console.error('Geocoding error:', error);
      setGeocodingAttempts(prev => prev + 1);
      
      if (error.name === 'TimeoutError') {
        toast.error('Request timeout. Please try again.');
      } else if (error.name === 'AbortError') {
        toast.error('Request was canceled. Please try again.');
      } else {
        toast.error(error.message || 'Location could not be found. Please check the address.');
      }
    } finally {
      setIsGeocoding(false);
    }
  };

  useEffect(() => {
    if (!streetNumber || !streetName || !city || !zipCode || zipCode.length !== 5) return;

    const timer = setTimeout(() => {
      setGeocodingAttempts(0);
      geocodeAddress();
    }, 1000);

    return () => clearTimeout(timer);
  }, [streetNumber, streetName, city, zipCode]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const uploadImage = async (playgroundId: string, userId: string) => {
    if (!selectedImage) return null;

    const fileExt = selectedImage.name.split('.').pop();
    const fileName = `${playgroundId}-${Math.random()}.${fileExt}`;
    const filePath = `playground-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('playground-images')
      .upload(filePath, selectedImage);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('playground-images')
      .getPublicUrl(filePath);

    await supabase.from('playground_images').insert({
      playground_id: playgroundId,
      image_url: publicUrl,
      uploaded_by: userId
    });

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAddressFields()) {
      return;
    }

    if (!position) {
      toast.error('Please wait until the location is determined');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to add a playground');
      }

      const fullAddress = `${streetName} ${streetNumber}, ${city}, ${zipCode}`;

      const { data: playground, error: playgroundError } = await supabase
        .from('playgrounds')
        .insert({
          name,
          description,
          location: fullAddress,
          min_age: minAge,
          max_age: maxAge,
          created_by: user.id,
          latitude: position.lat,
          longitude: position.lng,
          zip_code: zipCode
        })
        .select()
        .single();

      if (playgroundError) throw playgroundError;

      if (selectedImage && playground) {
        await uploadImage(playground.id, user.id);
      }

      toast.success('Playground added successfully!');
      onSuccess();
      
      setName('');
      setDescription('');
      setStreetNumber('');
      setStreetName('');
      setCity('');
      setZipCode('');
      setMinAge(0);
      setMaxAge(12);
      setSelectedImage(null);
      setImagePreview(null);
      setPosition(null);
    } catch (error: any) {
      toast.error(error.message || 'Error adding playground. Please try again.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Add a new playground</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Name of the playground"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          rows={3}
          placeholder="Describe the playground and its equipment"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Street number</label>
          <input
            type="text"
            value={streetNumber}
            onChange={(e) => setStreetNumber(e.target.value.replace(/\D/g, ''))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="1"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Street name</label>
          <input
            type="text"
            value={streetName}
            onChange={(e) => setStreetName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Main Street"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">City</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Berlin"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">ZIP code</label>
          <input
            type="text"
            value={zipCode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 5);
              setZipCode(value);
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="10115"
            pattern="[0-9]*"
            maxLength={5}
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location will be automatically determined from the address
          {isGeocoding && ' (Searching...)'}
        </label>
        <div className="h-[300px] rounded-lg overflow-hidden">
          <MapContainer
            center={center}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={position} setPosition={setPosition} />
          </MapContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Minimum age</label>
          <input
            type="number"
            value={minAge}
            onChange={(e) => setMinAge(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            min="0"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Maximum age</label>
          <input
            type="number"
            value={maxAge}
            onChange={(e) => setMaxAge(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            min="0"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Upload image</label>
        <div className="mt-1 flex items-center">
          <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
            <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:border-blue-500">
              <Upload size={20} />
              <span>Choose file</span>
            </div>
            <input
              type="file"
              className="sr-only"
              accept="image/*"
              onChange={handleImageChange}
            />
          </label>
          {selectedImage && (
            <span className="ml-3 text-sm text-gray-600">
              {selectedImage.name}
            </span>
          )}
        </div>
        {imagePreview && (
          <div className="mt-2">
            <img
              src={imagePreview}
              alt="Preview"
              className="h-32 w-auto object-cover rounded-md"
            />
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting || isGeocoding}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {isSubmitting ? 'Adding...' : isGeocoding ? 'Searching location...' : 'Add playground'}
      </button>
    </form>
  );
}