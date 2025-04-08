import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from 'lucide-react';

const ANIMAL_AVATARS = {
  rabbit: 'https://img.freepik.com/vektoren-kostenlos/niedlich-kaninchen-mit-karotte-tuete-karikatur-vektor-symbol-illustration-tiererziehung-symbol-begriff-isolated_138676-5813.jpg?ga=GA1.1.1700699522.1744109834&w=740',
  pig: 'https://img.freepik.com/vektoren-kostenlos/niedlich-schwein-sitzen-karikatur-vektor-symbol-abbildung-tier-natur-symbol-konzept-freigestellt-premium-flat_138676-7818.jpg?ga=GA1.1.1700699522.1744109834&w=740',
  sloth: 'https://img.freepik.com/vektoren-kostenlos/niedlich-mutter-faultier-mit-baby-faultier-haengen-baum-karikatur-vektor-symbol-illustration-tierische-natur-ikone_138676-6194.jpg?ga=GA1.1.1700699522.1744109834&w=740',
  frog: 'https://img.freepik.com/vektoren-kostenlos/handgezeichnete-frosch-cartoon-illustration_23-2151345304.jpg?ga=GA1.1.1700699522.1744109834&w=740',
  axolotl: 'https://img.freepik.com/vektoren-kostenlos/nette-axolotl-karikaturillustration-tierliebeskonzept-isoliert-flacher-cartoon_138676-2290.jpg?ga=GA1.1.1700699522.1744109834&w=740',
  owl: 'https://img.freepik.com/vektoren-kostenlos/niedlich-eule-winkende-hand-karikatur-vektor-symbol-illustration-tierisches-natur-ikonen-konzept-isolierte-praemie_138676-6532.jpg?ga=GA1.1.1700699522.1744109834&w=740',
  fish: 'https://img.freepik.com/vektoren-kostenlos/handgezeichnete-cartoon-kugelfisch-illustration_23-2150540850.jpg?t=st=1744110524~exp=1744114124~hmac=b63887efe54bdb0bc9c72f7011eaad5a1021e5a99a4c31915ac028a53210d2cc&w=900'
};

interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function UserAvatar({ size = 'md', className = '' }: UserAvatarProps) {
  const [avatarType, setAvatarType] = useState<keyof typeof ANIMAL_AVATARS | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get initial user ID and avatar
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        fetchAvatar(user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const newUserId = session?.user?.id || null;
      setUserId(newUserId);
      if (newUserId) {
        fetchAvatar(newUserId);
      } else {
        setAvatarType(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    if (userId) {
      // Subscribe to profile changes for the current user
      channel = supabase.channel(`public:profiles:id=eq.${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${userId}`
          },
          () => {
            fetchAvatar(userId);
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId]);

  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  async function fetchAvatar(currentUserId: string) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', currentUserId)
        .single();

      if (profile?.avatar_url && profile.avatar_url in ANIMAL_AVATARS) {
        setAvatarType(profile.avatar_url as keyof typeof ANIMAL_AVATARS);
      } else {
        setAvatarType(null);
      }
    } catch (error) {
      console.error('Error fetching avatar:', error);
      setAvatarType(null);
    }
  }

  return (
    <div className={`${sizes[size]} rounded-full overflow-hidden bg-gray-100 flex items-center justify-center ${className} ring-2 ring-white/50`}>
      {loading ? (
        <div className="w-full h-full bg-gray-200 animate-pulse" />
      ) : avatarType ? (
        <img
          src={ANIMAL_AVATARS[avatarType]}
          alt={`${avatarType} avatar`}
          className="w-full h-full object-cover"
        />
      ) : (
        <User
          size={size === 'sm' ? 16 : size === 'md' ? 20 : 24}
          className="text-gray-400"
        />
      )}
    </div>
  );
}