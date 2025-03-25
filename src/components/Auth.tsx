import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Mail, Lock, Heart, Users, MapPin } from 'lucide-react';

export function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Account created successfully! You can now log in.');
        setMode('login');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Logged in successfully!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* About Us Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-600 text-white p-12 flex-col justify-center">
        <h2 className="text-4xl font-bold mb-8">Welcome to Playground Finder</h2>
        <div className="space-y-8">
          <div className="flex items-start gap-4">
            <Heart className="mt-1" size={24} />
            <div>
              <h3 className="text-xl font-semibold mb-2">Our Mission</h3>
              <p className="text-blue-100">
                We're dedicated to helping families discover safe and enjoyable playgrounds in their community, making it easier for children to stay active and make new friends.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Users className="mt-1" size={24} />
            <div>
              <h3 className="text-xl font-semibold mb-2">Community-Driven</h3>
              <p className="text-blue-100">
                Our platform is built by parents for parents. Share experiences, rate playgrounds, and organize playdates with other families in your area.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <MapPin className="mt-1" size={24} />
            <div>
              <h3 className="text-xl font-semibold mb-2">Find Perfect Spots</h3>
              <p className="text-blue-100">
                Discover age-appropriate playgrounds with detailed information about facilities, safety features, and real parent reviews.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label htmlFor="email" className="sr-only">Email address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none rounded-md relative block w-full pl-10 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Email address"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none rounded-md relative block w-full pl-10 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Password"
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : mode === 'login' ? 'Sign in' : 'Sign up'}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                {mode === 'login'
                  ? "Don't have an account? Sign up"
                  : 'Already have an account? Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
