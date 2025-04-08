import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Mail, Lock, Heart, Users, MapPin, Sun, Star, User } from 'lucide-react';
import { Logo } from './Logo';

export function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        
        if (error) throw error;
        
        setResetSent(true);
        toast.success('Password reset instructions have been sent to your email');
        return;
      }

      if (mode === 'signup') {
        if (!/^[a-zA-Z0-9]+$/.test(username)) {
          throw new Error('Username can only contain letters and numbers');
        }

        const { data: existingUser, error: checkError } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', username)
          .maybeSingle();

        if (checkError) throw checkError;
        if (existingUser) throw new Error('Username already taken');

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username },
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });

        if (signUpError) throw signUpError;
        if (!signUpData.user) throw new Error('Error creating user');

        toast.success('Please check your email to confirm your account');
        setMode('login');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Successfully logged in!');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error(error.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const AboutUsContent = () => (
    <div className="space-y-6">
      <div className="flex items-start gap-4 bg-white/20 backdrop-blur-sm p-4 rounded-xl">
        <Heart className="mt-1 text-secondary-light shrink-0" size={24} />
        <div>
          <h3 className="text-xl font-display font-semibold mb-1 text-black">Our Mission</h3>
          <p className="text-black/90 font-body text-sm">
            We create a platform where parents can find the best playing spots in their community and build new friendships.
          </p>
        </div>
      </div>
      <div className="flex items-start gap-4 bg-white/20 backdrop-blur-sm p-4 rounded-xl">
        <Users className="mt-1 text-accent-yellow shrink-0" size={24} />
        <div>
          <h3 className="text-xl font-display font-semibold mb-1 text-black">Community Driven</h3>
          <p className="text-black/90 font-body text-sm">
            Share experiences and organize playdates with other families and friends. We grow thanks to your contributions and your opinion matters!
          </p>
        </div>
      </div>
      <div className="flex items-start gap-4 bg-white/20 backdrop-blur-sm p-4 rounded-xl">
        <MapPin className="mt-1 text-accent-green shrink-0" size={24} />
        <div>
          <h3 className="text-xl font-display font-semibold mb-1 text-black">Find Perfect Spots</h3>
          <p className="text-black/90 font-body text-sm">
            Discover age-appropriate playgrounds with detailed information and parent reviews.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-b from-background-light to-background relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute bottom-20 right-20 w-32 h-32 bg-accent-purple rounded-full opacity-30 animate-pulse delay-300"></div>
      <div className="absolute top-1/3 right-10 w-16 h-16 bg-accent-green rounded-full opacity-40 animate-pulse delay-700"></div>

      {/* About Us Section - Desktop */}
      <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-center relative z-10">
        <Logo size="xl" className="mb-12" />
        <AboutUsContent />
      </div>

      {/* Auth Form Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-8">
        {/* About Us Section - Mobile */}
        <div className="lg:hidden w-full max-w-md mb-8">
          <Logo size="xl" className="mx-auto mb-6" />
          <AboutUsContent />
        </div>

        <div className="w-full max-w-md space-y-8 card-playful p-6 lg:p-8">
          <div className="text-center">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-gray-800 mb-2">
              {mode === 'login' ? 'Welcome Back!' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
            </h2>
            <p className="text-gray-600 font-body">
              {mode === 'login' 
                ? "Discover playgrounds and connect with families"
                : mode === 'signup'
                ? 'Join our community and start your adventure'
                : 'Enter your email to receive reset instructions'}
            </p>
          </div>

          {mode === 'reset' && resetSent ? (
            <div className="text-center">
              <p className="text-green-600 font-body mb-4">
                Check your email for password reset instructions
              </p>
              <button
                onClick={() => {
                  setMode('login');
                  setResetSent(false);
                }}
                className="text-primary hover:underline"
              >
                Return to login
              </button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
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
                        onChange={(e) => setUsername(e.target.value.trim())}
                        className="input-playful pl-12"
                        placeholder="Choose a username"
                        pattern="[a-zA-Z0-9]+"
                        title="Only letters and numbers allowed"
                        minLength={3}
                        maxLength={30}
                      />
                    </div>
                  </div>
                )}

                {mode !== 'reset' && (
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
                        minLength={6}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full btn-primary ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isLoading 
                    ? 'Processing...' 
                    : mode === 'login' 
                    ? 'Sign In' 
                    : mode === 'signup'
                    ? 'Create Account'
                    : 'Send Reset Instructions'}
                </button>

                <div className="space-y-2">
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('reset')}
                      className="w-full text-primary hover:underline text-sm"
                    >
                      Forgot your password?
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === 'login' ? 'signup' : 'login');
                      setResetSent(false);
                    }}
                    className="w-full btn-secondary"
                  >
                    {mode === 'login'
                      ? "Don't have an account? Sign up"
                      : mode === 'signup'
                      ? 'Already have an account? Sign in'
                      : 'Back to login'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}