import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';

export function DeleteUsers() {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteUsers = async () => {
    if (!confirm('Are you sure you want to delete ALL users? This action cannot be undone!')) {
      return;
    }

    try {
      setIsDeleting(true);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete users');
      }

      toast.success(data.message);
      
      // Log detailed results
      console.log('Deletion results:', data.results);
      
      // Redirect to login after successful deletion
      await supabase.auth.signOut();
      window.location.reload();
      
    } catch (error: any) {
      console.error('Error deleting users:', error);
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDeleteUsers}
      disabled={isDeleting}
      className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
    >
      <Trash2 size={18} />
      {isDeleting ? 'Deleting...' : 'Delete All Users'}
    </button>
  );
}