import React from 'react';
import { Star, MapPin, Users } from 'lucide-react';

interface PlaygroundCardProps {
  name: string;
  description: string;
  location: string;
  minAge: number;
  maxAge: number;
  rating: number;
  imageUrl?: string;
}

export function PlaygroundCard({
  name,
  description,
  location,
  minAge,
  maxAge,
  rating,
  imageUrl,
}: PlaygroundCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {imageUrl && (
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4">
        <h3 className="text-xl font-semibold mb-2">{name}</h3>
        <div className="flex items-center gap-2 text-gray-600 mb-2">
          <MapPin size={16} />
          <span>{location}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600 mb-3">
          <Users size={16} />
          <span>Ages {minAge}-{maxAge}</span>
          <div className="flex items-center ml-auto">
            <Star className="text-yellow-400" size={16} />
            <span className="ml-1">{rating.toFixed(1)}</span>
          </div>
        </div>
        <p className="text-gray-700 text-sm">{description}</p>
      </div>
    </div>
  );
}