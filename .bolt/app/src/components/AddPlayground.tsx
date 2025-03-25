import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Upload } from 'lucide-react';

export function AddPlayground() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [minAge, setMinAge] = useState(0);
  const [maxAge, setMaxAge] = useState(12);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to add a playground');
      }

      const { data: playground, error: playgroundError } = await supabase
        .from('playgrounds')
        .insert({
          name,
          description,
          location,
          min_age: minAge,
          max_age: maxAge,
          created_by: user.id
        })
        .select()
        .single();

      if (playgroundError) throw playgroundError;

      if (selectedImage && playground) {
        await uploadImage(playground.id, user.id);
      }

      toast.success('Playground added successfully!');
      setName('');
      setDescription('');
      setLocation('');
      setMinAge(0);
      setMaxAge(12);
      setSelectedImage(null);
      setImagePreview(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to add playground');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Add New Playground</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Location</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Upload Image</label>
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
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {isSubmitting ? 'Adding...' : 'Add Playground'}
      </button>
    </form>
  );
}