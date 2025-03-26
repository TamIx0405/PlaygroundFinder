import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Mail, Lock, Heart, Users, MapPin, Sun, Star, Cloud, User } from 'lucide-react';

export function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        // Check if username is available
        const { data: existingUser, error: checkError } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', username)
          .maybeSingle();

        if (checkError) {
          throw checkError;
        }

        if (existingUser) {
          throw new Error('Username already taken');
        }

        // Sign up the user
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username
            }
          }
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
      console.error('Auth error:', error);
      toast.error(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-b from-background-light to-background relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-40 left-15 w-20 h-20 bg-accent-yellow rounded-full opacity-60 animate-pulse"></div>
      <div className="absolute bottom-30 right-20 w-32 h-32 bg-accent-purple rounded-full opacity-40 animate-pulse delay-300"></div>
      <div className="absolute top-1/3 right-10 w-16 h-16 bg-accent-green rounded-full opacity-40 animate-pulse delay-700"></div>
      
      {/* Floating icons */}
      <Sun className="absolute top-20 right-9 text-accent-yellow w-8 h-8 animate-bounce" />
      <Star className="absolute bottom-32 left-20 text-accent-orange w-6 h-6 animate-pulse" />
      <Cloud className="absolute top-30 left-40 text-primary-light w-10 h-10 animate-pulse delay-500" />

      {/* About Us Section */}
      <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-center relative z-10">
        <h2 className="text-5xl font-display font-bold text-black mb-8 leading-tight">
          Welcome to<br /> HopSpot!
        </h2>
        <div className="space-y-8">
          <div className="flex items-start gap-6 bg-white/10 backdrop-blur-sm p-6 rounded-2xl">
            <Heart className="mt-1 text-secondary-light" size={50} />
            <div>
              <h3 className="text-2xl font-display font-semibold mb-2 text-black">My Mission</h3>
              <p className="text-black/90 font-body">
                I have set myself the mission to create a plattform where parents can find the best playing options within thier community.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-6 bg-white/10 backdrop-blur-sm p-6 rounded-2xl">
            <Users className="mt-1 text-accent-yellow" size={45} />
            <div>
              <h3 className="text-2xl font-display font-semibold mb-2 text-black">Community-Driven</h3>
              <p className="text-black/90 font-body">
                Share experiences and organize playdates with other families and friends. Your opinion matters! 
              </p>
            </div>
          </div>
          <div className="flex items-start gap-6 bg-white/10 backdrop-blur-sm p-6 rounded-2xl">
            <MapPin className="mt-1 text-accent-green" size={45} />
            <div>
              <h3 className="text-2xl font-display font-semibold mb-2 text-dark-blue">Find Perfect Spots</h3>
              <p className="text-black/90 font-body">
                Discover age-appropriate playgrounds with detailed information and parent reviews.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-8 card-playful p-8">
          <div className="text-center">
            <h2 className="text-4xl font-display font-bold text-gray-800 mb-2">
              {mode === 'login' ? 'Hey there!' : 'Join Us!'}
            </h2>
            <p className="text-gray-600 font-body">
              {mode === 'login' 
                ? "Let us find some amazing playgrounds"
                : 'Create an account to get started'}
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="sr-only">Email address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-playful pl-12"
                    placeholder="Email address"
                  />
                </div>
              </div>
              {mode === 'signup' && (
                <div>
                  <label htmlFor="username" className="sr-only">Username</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="input-playful pl-12"
                      placeholder="username"
                      pattern="[a-zA-Z0-9]+"
                      title="Only letters and numbers allowed!"
                    />
                  </div>
                </div>
              )}
              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-playful pl-12"
                    placeholder="Password"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full btn-primary ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Processing...' : mode === 'login' ? 'Sign in' : 'Sign up'}
              </button>

              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="w-full btn-secondary"
              >
                {mode === 'login'
                  ? "Don't have an account? Sign up"
                  : 'Already have an account? Log in!'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}