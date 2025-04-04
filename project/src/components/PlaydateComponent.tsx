import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, X, UserPlus, UserMinus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface PlaydateProps {
  playgroundId: string;
  playgroundName: string;
  onClose: () => void;
}

interface Participant {
  id: string;
  username: string;
  status: string;
}

export function PlaydateComponent({ playgroundId, playgroundName, onClose }: PlaydateProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [userParticipation, setUserParticipation] = useState<string | null>(null);
  const [playdateId, setPlaydateId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (playdateId) {
      fetchParticipants();
    }
  }, [playdateId]);

  async function fetchParticipants() {
    if (!playdateId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('playdate_participants')
        .select(`
          id,
          status,
          profiles (
            username
          )
        `)
        .eq('playdate_id', playdateId);

      if (error) throw error;

      if (data) {
        const formattedParticipants = data.map(p => ({
          id: p.id,
          username: p.profiles.username,
          status: p.status
        }));
        setParticipants(formattedParticipants);

        const { data: userParticipantData, error: userParticipantError } = await supabase
          .from('playdate_participants')
          .select('status')
          .eq('playdate_id', playdateId)
          .eq('user_id', user.id)
          .single();

        if (!userParticipantError && userParticipantData) {
          setUserParticipation(userParticipantData.status);
        } else {
          setUserParticipation(null);
        }
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
      toast.error('Failed to load participants');
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to create a playdate');
      }

      const dateTime = new Date(`${date}T${time}`);

      const { data: playdate, error: playdateError } = await supabase
        .from('playdates')
        .insert({
          playground_id: playgroundId,
          organizer_id: user.id,
          date: dateTime.toISOString(),
          description
        })
        .select()
        .single();

      if (playdateError) throw playdateError;

      setPlaydateId(playdate.id);

      const { error: participantError } = await supabase
        .from('playdate_participants')
        .insert({
          playdate_id: playdate.id,
          user_id: user.id,
          status: 'joined'
        });

      if (participantError) throw participantError;

      toast.success('Playdate created successfully!');
      setUserParticipation('joined');
      fetchParticipants();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create playdate');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleParticipation = async (status: string) => {
    if (!playdateId || isUpdating) return;

    try {
      setIsUpdating(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to join playdates');
      }

      if (status === userParticipation) {
        toast.error(`You are already ${status === 'joined' ? 'participating in' : 'not participating in'} this playdate`);
        return;
      }

      const { data: existingParticipation } = await supabase
        .from('playdate_participants')
        .select('id')
        .eq('playdate_id', playdateId)
        .eq('user_id', user.id)
        .maybeSingle();

      let error;
      if (existingParticipation) {
        ({ error } = await supabase
          .from('playdate_participants')
          .update({ status })
          .eq('id', existingParticipation.id));
      } else {
        ({ error } = await supabase
          .from('playdate_participants')
          .insert({
            playdate_id: playdateId,
            user_id: user.id,
            status
          }));
      }

      if (error) throw error;

      setUserParticipation(status);
      toast.success(`Successfully ${status === 'joined' ? 'joined' : 'left'} the playdate!`);
      await fetchParticipants();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update participation');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 card-playful">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-display font-bold text-gray-800">Schedule a Playdate</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {!playdateId ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Playground</label>
              <p className="text-lg font-display font-semibold text-primary">{playgroundName}</p>
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" size={20} />
                <input
                  type="date"
                  id="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="input-playful pl-12"
                />
              </div>
            </div>

            <div>
              <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" size={20} />
                <input
                  type="time"
                  id="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="input-playful pl-12"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="input-playful"
                placeholder="Add any details about the playdate..."
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <Calendar size={20} />
              {isSubmitting ? 'Creating...' : 'Schedule Playdate'}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-display font-semibold mb-3 flex items-center gap-2">
                <Users size={20} className="text-primary" />
                Participants ({participants.length})
              </h3>
              <div className="space-y-2">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span className="font-body">{participant.username}</span>
                    <span className="text-sm text-gray-500 ml-auto">{participant.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              {userParticipation === 'joined' ? (
                <button
                  onClick={() => handleParticipation('cancelled')}
                  disabled={isUpdating}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2"
                >
                  <UserMinus size={20} />
                  {isUpdating ? 'Updating...' : 'Leave Playdate'}
                </button>
              ) : (
                <button
                  onClick={() => handleParticipation('joined')}
                  disabled={isUpdating}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <UserPlus size={20} />
                  {isUpdating ? 'Updating...' : 'Join Playdate'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}