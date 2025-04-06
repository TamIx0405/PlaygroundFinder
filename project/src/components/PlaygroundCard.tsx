import React, { useState, useEffect } from 'react';
import { Star, MapPin, Users, Calendar, MessageSquare, Bird, Fish, Rabbit, UserPlus, UserMinus } from 'lucide-react';
import { RatingComponent } from './Rating';
import { PlaydateComponent } from './PlaydateComponent';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface PlaygroundCardProps {
  id: string;
  name: string;
  description: string;
  location: string;
  minAge: number;
  maxAge: number;
  imageUrl?: string;
}

interface Playdate {
  id: string;
  date: string;
  description: string;
  organizer: {
    username: string;
  };
  participants: {
    username: string;
    status: string;
  }[];
}

interface Rating {
  rating: number;
  comment: string;
  user: {
    username: string;
  };
}

export function PlaygroundCard({
  id,
  name,
  description,
  location,
  minAge,
  maxAge,
  imageUrl,
}: PlaygroundCardProps) {
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [ratingCount, setRatingCount] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const [showPlaydateModal, setShowPlaydateModal] = useState(false);
  const [upcomingPlaydates, setUpcomingPlaydates] = useState<Playdate[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [selectedPlaydate, setSelectedPlaydate] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [userParticipation, setUserParticipation] = useState<{ [key: string]: string }>({});
  const [showAllDescription, setShowAllDescription] = useState(false);

  useEffect(() => {
    fetchRatings();
    fetchImages();
    fetchUpcomingPlaydates();
  }, [id]);

  async function fetchRatings() {
    try {
      const { data, error } = await supabase
        .from('playground_ratings')
        .select(`
          rating,
          comment,
          profiles (
            username
          )
        `)
        .eq('playground_id', id);

      if (error) throw error;

      if (data && data.length > 0) {
        const total = data.reduce((sum, curr) => sum + curr.rating, 0);
        setAverageRating(total / data.length);
        setRatingCount(data.length);
        
        setRatings(data.map(r => ({
          rating: r.rating,
          comment: r.comment,
          user: {
            username: r.profiles.username
          }
        })));
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  }

  async function fetchImages() {
    try {
      const { data, error } = await supabase
        .from('playground_images')
        .select('image_url')
        .eq('playground_id', id);

      if (error) throw error;

      if (data) {
        setImages(data.map(img => img.image_url));
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  }

  async function fetchUpcomingPlaydates() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: playdates, error: playdatesError } = await supabase
        .from('playdates')
        .select(`
          id,
          date,
          description,
          profiles!playdates_organizer_id_fkey (
            username
          ),
          playdate_participants (
            profiles (
              username
            ),
            status
          )
        `)
        .eq('playground_id', id)
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true });

      if (playdatesError) throw playdatesError;

      if (playdates) {
        const formattedPlaydates = playdates.map(p => ({
          id: p.id,
          date: p.date,
          description: p.description,
          organizer: {
            username: p.profiles.username
          },
          participants: p.playdate_participants.map(participant => ({
            username: participant.profiles.username,
            status: participant.status
          }))
        }));

        setUpcomingPlaydates(formattedPlaydates);

        if (user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();

          if (profileError) {
            console.error('Error fetching profile:', profileError);
            return;
          }

          if (profile) {
            const participationStatus: { [key: string]: string } = {};
            for (const playdate of playdates) {
              const { data: participation } = await supabase
                .from('playdate_participants')
                .select('status')
                .eq('playdate_id', playdate.id)
                .eq('user_id', profile.id)
                .maybeSingle();

              if (participation) {
                participationStatus[playdate.id] = participation.status;
              }
            }
            setUserParticipation(participationStatus);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching playdates:', error);
    }
  }

  const handleJoinPlaydate = async (playdateId: string) => {
    try {
      setIsJoining(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to join a playdate');
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        throw new Error('Error fetching profile');
      }

      if (!profile) {
        throw new Error('Profile not found');
      }

      const currentStatus = userParticipation[playdateId];
      const newStatus = currentStatus === 'joined' ? 'cancelled' : 'joined';

      const { data: existingParticipation } = await supabase
        .from('playdate_participants')
        .select('id')
        .eq('playdate_id', playdateId)
        .eq('user_id', profile.id)
        .maybeSingle();

      let error;
      if (existingParticipation) {
        ({ error } = await supabase
          .from('playdate_participants')
          .update({ status: newStatus })
          .eq('id', existingParticipation.id));
      } else {
        ({ error } = await supabase
          .from('playdate_participants')
          .insert({
            playdate_id: playdateId,
            user_id: profile.id,
            status: newStatus
          }));
      }

      if (error) throw error;

      setUserParticipation(prev => ({
        ...prev,
        [playdateId]: newStatus
      }));

      toast.success(
        newStatus === 'joined' 
          ? 'Successfully joined the playdate!' 
          : 'Successfully left the playdate!'
      );

      await fetchUpcomingPlaydates();
    } catch (error: any) {
      toast.error(error.message || 'Error updating participation');
    } finally {
      setIsJoining(false);
      setSelectedPlaydate(null);
    }
  };

  return (
    <div className="card-playful overflow-hidden relative">
      <Bird className="animated-bird absolute -top-8 left-0" size={24} />
      <Fish className="animated-duck absolute -bottom-4 right-10" size={20} />
      <Rabbit className="animated-rabbit absolute bottom-4 left-10" size={20} />

      {(images.length > 0 || imageUrl) && (
        <div className="relative h-48 sm:h-56 overflow-hidden rounded-t-3xl">
          <img
            src={images[0] || imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      )}
      <div className="p-4 sm:p-6">
        <div className="space-y-2 sm:space-y-3">
          <h3 className="text-xl sm:text-2xl font-display font-bold text-gray-800 line-clamp-2">{name}</h3>
          
          <div className="flex flex-wrap items-center gap-2 text-gray-600">
            <div className="flex items-center gap-1">
              <MapPin size={16} className="text-primary" />
              <span className="font-body text-sm">{location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users size={16} className="text-secondary" />
              <span className="font-body text-sm">Ages {minAge}-{maxAge}</span>
            </div>
            {averageRating !== null && (
              <div className="flex items-center gap-1 ml-auto">
                <Star className="text-accent-yellow fill-accent-yellow" size={16} />
                <span className="font-semibold text-sm">{averageRating.toFixed(1)}</span>
                <span className="text-sm text-gray-500">({ratingCount})</span>
              </div>
            )}
          </div>

          <div className="relative">
            <p className={`text-gray-700 font-body text-sm sm:text-base ${!showAllDescription && 'line-clamp-3'}`}>
              {description}
            </p>
            {description.length > 150 && (
              <button
                onClick={() => setShowAllDescription(!showAllDescription)}
                className="text-primary text-sm font-medium hover:underline mt-1"
              >
                {showAllDescription ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        </div>

        {upcomingPlaydates.length > 0 && (
          <div className="mt-6">
            <h4 className="text-lg font-display font-semibold text-gray-800 mb-3">Upcoming Playdates</h4>
            <div className="space-y-3">
              {upcomingPlaydates.map((playdate) => (
                <div 
                  key={playdate.id}
                  className={`bg-background-light/50 p-3 sm:p-4 rounded-2xl transition-all duration-200 ${
                    selectedPlaydate === playdate.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedPlaydate(playdate.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2 text-primary-dark">
                      <Calendar size={16} />
                      <span className="font-body font-medium text-sm">
                        {format(new Date(playdate.date), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                    {selectedPlaydate === playdate.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoinPlaydate(playdate.id);
                        }}
                        disabled={isJoining}
                        className={`flex items-center justify-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          userParticipation[playdate.id] === 'joined'
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {userParticipation[playdate.id] === 'joined' ? (
                          <>
                            <UserMinus size={14} />
                            <span className="hidden sm:inline">Leave</span>
                          </>
                        ) : (
                          <>
                            <UserPlus size={14} />
                            <span className="hidden sm:inline">Join</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <p className="text-gray-700 font-body text-sm mt-2 line-clamp-2">{playdate.description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <p className="text-xs text-gray-500 font-body">
                      Organized by: {playdate.organizer.username}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {playdate.participants.map((participant, index) => (
                        <span
                          key={index}
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            participant.status === 'joined'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {participant.username}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => setShowPlaydateModal(true)}
            className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm"
          >
            <Calendar size={18} />
            <span className="hidden sm:inline">Schedule Playdate</span>
            <span className="sm:hidden">Schedule</span>
          </button>
        </div>

        <div className="mt-6">
          <RatingComponent playgroundId={id} onRatingUpdate={fetchRatings} />
        </div>

        {ratings.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h4 className="text-lg font-display font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MessageSquare size={18} className="text-primary" />
              Reviews
            </h4>
            <div className="space-y-4">
              {ratings.filter(r => r.comment).map((rating, index) => (
                <div key={index} className="bg-background-light/30 p-3 sm:p-4 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center">
                      {[...Array(rating.rating)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className="text-accent-yellow fill-accent-yellow"
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500 font-body">
                      by {rating.user.username}
                    </span>
                  </div>
                  <p className="text-gray-700 font-body text-sm">{rating.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showPlaydateModal && (
        <PlaydateComponent
          playgroundId={id}
          playgroundName={name}
          onClose={() => {
            setShowPlaydateModal(false);
            fetchUpcomingPlaydates();
          }}
        />
      )}
    </div>
  );
}