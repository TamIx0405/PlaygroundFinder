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

  useEffect(() => {
    fetchParticipants();
  }, []);

  async function fetchParticipants() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('playdate_participants')
        .select(`
          status,
          profiles (
            username
          )
        `)
        .eq('playdate_id', playgroundId);

      if (error) throw error;

      if (data) {
        setParticipants(data.map(p => ({
          username: p.profiles.username,
          status: p.status
        })));

        const userParticipant = data.find(p => p.profiles.id === user.id);
        if (userParticipant) {
          setUserParticipation(userParticipant.status);
        }
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
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

      // Automatically join as organizer
      const { error: participantError } = await supabase
        .from('playdate_participants')
        .insert({
          playdate_id: playdate.id,
          user_id: user.id,
          status: 'joined'
        });

      if (participantError) throw participantError;

      toast.success('Playdate created successfully!');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create playdate');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleParticipation = async (status: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to join playdates');
      }

      if (userParticipation) {
        // Update existing participation
        const { error } = await supabase
          .from('playdate_participants')
          .update({ status })
          .eq('playdate_id', playgroundId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Create new participation
        const { error } = await supabase
          .from('playdate_participants')
          .insert({
            playdate_id: playgroundId,
            user_id: user.id,
            status
          });

        if (error) throw error;
      }

      setUserParticipation(status);
      toast.success(`Successfully ${status} the playdate!`);
      fetchParticipants();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update participation');
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

          {participants.length > 0 && (
            <div>
              <h3 className="text-lg font-display font-semibold mb-3 flex items-center gap-2">
                <Users size={20} className="text-primary" />
                Participants
              </h3>
              <div className="space-y-2">
                {participants.map((participant, index) => (
                  <div key={index} className="flex items-center gap-2 text-gray-700">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span className="font-body">{participant.username}</span>
                    <span className="text-sm text-gray-500">({participant.status})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {userParticipation ? (
              <button
                type="button"
                onClick={() => handleParticipation('cancelled')}
                className="btn-secondary flex-1 flex items-center justify-center gap-2"
              >
                <UserMinus size={20} />
                Leave Playdate
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleParticipation('joined')}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <UserPlus size={20} />
                Join Playdate
              </button>
            )}
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
      </div>
    </div>
  );
}