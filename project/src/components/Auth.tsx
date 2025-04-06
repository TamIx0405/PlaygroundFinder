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
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (!/^[a-zA-Z0-9]+$/.test(username)) {
          throw new Error('Username can only contain letters and numbers');
        }

        const { data: existingUser, error: checkError } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', username)
          .maybeSingle();

        if (checkError) {
          throw checkError;
        }

        if (existingUser) {
          throw new Error('Username aleready taken :(');
        }

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username
            }
          }
        });

        if (signUpError) throw signUpError;
        if (!signUpData.user) throw new Error('Error creating user');

        toast.success('Account sucessfully created! Please check your email for confirmation.');
        setMode('login');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success('You are logged in!');
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
          <h3 className="text-xl font-display font-semibold mb-1 text-black">My mission</h3>
          <p className="text-black/90 font-body text-sm">
            I have set myself the mission to create a plattform where parents can find the best playing options within thier community and create new friendships.
          </p>
        </div>
      </div>
      <div className="flex items-start gap-4 bg-white/20 backdrop-blur-sm p-4 rounded-xl">
        <Users className="mt-1 text-accent-yellow shrink-0" size={24} />
        <div>
          <h3 className="text-xl font-display font-semibold mb-1 text-black">Community driven</h3>
          <p className="text-black/90 font-body text-sm">
            Share experiences and organize playdates with other families and friends. We grow thanks to your contributions and YOUR opinion matters!
          </p>
        </div>
      </div>
      <div className="flex items-start gap-4 bg-white/20 backdrop-blur-sm p-4 rounded-xl">
        <MapPin className="mt-1 text-accent-green shrink-0" size={24} />
        <div>
          <h3 className="text-xl font-display font-semibold mb-1 text-black">Find perfect spots</h3>
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

      {/* Floating icons */}
      <Sun className="absolute top-20 right-32 text-accent-yellow w-8 h-8 animate-bounce" />
      <Star className="absolute bottom-32 left-20 text-accent-orange w-6 h-6 animate-pulse" />
    

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

        <div className="w-full max-w-md space-y-8 card-playful p-6 lg:p-8 relative">
          {/* Yellow circle decoration */}
          <div className="absolute -top-6 -left-6 w-24 h-24 bg-accent-yellow rounded-full opacity-50 animate-pulse"></div>
          
          <div className="relative z-10">
            <div className="text-center">
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-gray-800 mb-2">
                {mode === 'login' ? 'Ready to explore?' : 'register your account!'}
              </h2>
              <p className="text-gray-600 font-body">
                {mode === 'login' 
                  ? "discover new playgrounds and connect with other families"
                  : 'Create an account and let´s go on an adventure!'}
              </p>
            </div>
            
            <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="sr-only">E-Mail-adress</label>
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
                      placeholder="E-Mail-adress"
                    />
                  </div>
                </div>
                {mode === 'signup' && (
                  <div>
                    <label htmlFor="username" className="sr-only">user name</label>
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
                        placeholder="pick a user name"
                        pattern="[a-zA-Z0-9]+"
                        title="only letters and numbers allowed"
                        minLength={3}
                        maxLength={30}
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label htmlFor="password" className="sr-only">password</label>
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
              </div>

              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full btn-primary ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? 'Processing...' : mode === 'login' ? 'login' : 'register'}
                </button>

                <button
                  type="button"
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                  className="w-full btn-secondary"
                >
                  {mode === 'login'
                    ? "No account? Register"
                    : 'already have an account? login'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}