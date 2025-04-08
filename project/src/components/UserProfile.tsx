import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Trash2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const ANIMAL_AVATARS = {
  rabbit: {
    name: 'rabbit',
    url: 'https://img.freepik.com/vektoren-kostenlos/niedlich-kaninchen-mit-karotte-tuete-karikatur-vektor-symbol-illustration-tiererziehung-symbol-begriff-isolated_138676-5813.jpg?ga=GA1.1.1700699522.1744109834&w=740'
  },
  pig: {
    name: 'pig',
    url: 'https://img.freepik.com/vektoren-kostenlos/niedlich-schwein-sitzen-karikatur-vektor-symbol-abbildung-tier-natur-symbol-konzept-freigestellt-premium-flat_138676-7818.jpg?ga=GA1.1.1700699522.1744109834&w=740'
  },
  sloth: {
    name: 'sloth',
    url: 'https://img.freepik.com/vektoren-kostenlos/niedlich-mutter-faultier-mit-baby-faultier-haengen-baum-karikatur-vektor-symbol-illustration-tierische-natur-ikone_138676-6194.jpg?ga=GA1.1.1700699522.1744109834&w=740'
  },
  frog: {
    name: 'Frog',
    url: 'https://img.freepik.com/vektoren-kostenlos/handgezeichnete-frosch-cartoon-illustration_23-2151345304.jpg?ga=GA1.1.1700699522.1744109834&w=740'
  },
  axolotl: {
    name: 'Axolotl',
    url: 'https://img.freepik.com/vektoren-kostenlos/nette-axolotl-karikaturillustration-tierliebeskonzept-isoliert-flacher-cartoon_138676-2290.jpg?ga=GA1.1.1700699522.1744109834&w=740'
  },
  owl: {
    name: 'owl',
    url: 'https://img.freepik.com/vektoren-kostenlos/niedlich-eule-winkende-hand-karikatur-vektor-symbol-illustration-tierisches-natur-ikonen-konzept-isolierte-praemie_138676-6532.jpg?ga=GA1.1.1700699522.1744109834&w=740'
  },
  fish: {
    name: 'fish',
    url: 'https://img.freepik.com/vektoren-kostenlos/handgezeichnete-cartoon-kugelfisch-illustration_23-2150540850.jpg?t=st=1744110524~exp=1744114124~hmac=b63887efe54bdb0bc9c72f7011eaad5a1021e5a99a4c31915ac028a53210d2cc&w=900'
  }
};

interface Profile {
  avatar_url?: string;
}

export function UserProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setSelectedAvatar(data?.avatar_url || null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleAvatarSelect = async (avatarName: string) => {
    try {
      setUpdating(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: avatarName,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setSelectedAvatar(avatarName);
      setProfile(prev => prev ? { ...prev, avatar_url: avatarName } : { avatar_url: avatarName });
      toast.success('Avatar updated successfully');
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error(error.message || 'Failed to update avatar');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone!')) {
      return;
    }

    try {
      setUpdating(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/force-delete-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete account');
      }

      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => window.location.href = '/'}
          className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
        >
          <ArrowLeft size={24} />
          <span className="font-medium">Back to Map</span>
        </button>
        <h2 className="text-2xl font-display font-bold flex items-center gap-2">
          <User className="text-primary" />
          Profile Settings
        </h2>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Choose Your Avatar Animal
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Object.entries(ANIMAL_AVATARS).map(([key, { name, url }]) => (
              <button
                key={key}
                onClick={() => handleAvatarSelect(key)}
                disabled={updating}
                className={`group relative aspect-square rounded-2xl overflow-hidden transition-all duration-200 ${
                  selectedAvatar === key
                    ? 'ring-4 ring-primary ring-offset-2 scale-105'
                    : 'hover:ring-2 hover:ring-primary/50 hover:ring-offset-1 hover:scale-102'
                }`}
              >
                <img
                  src={url}
                  alt={name}
                  className="w-full h-full object-cover"
                />
                <div className={`absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-2 transition-opacity ${
                  selectedAvatar === key ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}>
                  <span className="text-xs text-white font-medium">{name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={updating}
            className="btn-secondary bg-red-600 hover:bg-red-700 flex items-center gap-2"
          >
            <Trash2 size={18} />
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}