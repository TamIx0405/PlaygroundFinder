import { useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface PlaydateComponentProps {
  playgroundId: string;
  playgroundName: string;
  onClose: () => void;
}

export function PlaydateComponent({ playgroundId, playgroundName, onClose }: PlaydateComponentProps) {
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSchedule = async () => {
    if (!date || !description) {
      toast.error('Please fill out all fields');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User must be logged in.');

      const { error } = await supabase.from('playdates').insert([
        {
          date,
          description,
          playground_id: playgroundId,
          organizer_id: user.id,
        },
      ]);

      if (error) throw error;

      toast.success('Playdate scheduled successfully!');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Error scheduling playdate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-semibold mb-4">Schedule Playdate at {playgroundName}</h2>
        <input
          type="datetime-local"
          className="w-full p-2 border rounded-md mb-2"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <textarea
          className="w-full p-2 border rounded-md mb-2"
          placeholder="Playdate details..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button
          onClick={handleSchedule}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Scheduling...' : 'Schedule Playdate'}
        </button>
        <button
          onClick={onClose}
          className="w-full mt-2 text-gray-600 hover:underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
