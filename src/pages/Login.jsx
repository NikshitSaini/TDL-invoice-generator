import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { checkUserProfileExists } from '../services/userService';
import toast from 'react-hot-toast';

export default function Login() {
  const emailRef = useRef();
  const passwordRef = useRef();
  const { login, signInWithGoogle, currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  // Guard: if user is already logged in, redirect them away from login page
  React.useEffect(() => {
    if (currentUser) {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

  async function redirectAfterLogin(user) {
    try {
      const isProfileSetup = await checkUserProfileExists(user.uid);
      navigate(isProfileSetup ? '/dashboard' : '/dashboard?onboarding=true', { replace: true });
    } catch (err) {
      navigate('/dashboard', { replace: true });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setLoading(true);
      const result = await login(emailRef.current.value, passwordRef.current.value);
      toast.success("Successfully logged in!");
      await redirectAfterLogin(result.user);
    } catch (err) {
      toast.error(err.message || 'Failed to sign in');
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    try {
      setLoading(true);
      const result = await signInWithGoogle();
      toast.success("Successfully logged in with Google!");
      await redirectAfterLogin(result.user);
    } catch (err) {
      toast.error(err.message || 'Failed to sign in securely');
      setLoading(false);
    }
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-container/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-secondary-container/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-[440px] flex flex-col gap-8 z-10">
        {/* Header / Logo Section */}
        <div className="flex flex-col items-center text-center gap-4">
          <img
            src="https://teraforgedigitallab.com/images/logo.svg"
            alt="Teraforge Digital Lab"
            className="h-14 w-auto"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-on-surface font-headline">Teraforge Digital Lab</h1>
            <p className="text-on-surface-variant font-medium text-sm">Building the next generation of tech startups</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-surface-container-lowest rounded-xl shadow-md p-8 md:p-10 border border-outline-variant/10">
          <div className="flex flex-col gap-6">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-on-surface font-headline">Welcome back</h2>
              <p className="text-sm text-on-surface-variant">Enter your credentials to access your account</p>
            </div>
            
            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              {/* Email Input */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface-variant ml-1" htmlFor="email">Email address</label>
                <input 
                  type="email" 
                  id="email" 
                  ref={emailRef}
                  placeholder="name@company.com" 
                  required
                  className="w-full px-4 py-3 bg-surface-container-low rounded-lg outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/20 border border-transparent focus:border-primary transition-all text-on-surface placeholder:text-outline" 
                />
              </div>

              {/* Password Input */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-sm font-semibold text-on-surface-variant" htmlFor="password">Password</label>
                  <Link to="/forgot-password" className="text-xs font-bold text-primary hover:text-primary-container transition-colors">Forgot password?</Link>
                </div>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    id="password" 
                    ref={passwordRef}
                    placeholder="••••••••" 
                    required
                    className="w-full px-4 py-3 bg-surface-container-low rounded-lg outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/20 border border-transparent focus:border-primary transition-all text-on-surface placeholder:text-outline" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3.5 bg-primary-container text-white font-bold rounded-lg shadow-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-outline-variant opacity-30"></div>
              <span className="flex-shrink mx-4 text-xs font-bold text-outline uppercase tracking-widest">or</span>
              <div className="flex-grow border-t border-outline-variant opacity-30"></div>
            </div>

            {/* Social Login */}
            <button 
              type="button" 
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3 px-4 bg-surface-container-lowest border border-outline-variant focus:border-outline-variant/80 rounded-lg flex items-center justify-center gap-3 text-on-surface font-semibold hover:bg-surface-container-low transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              </svg>
              Continue with Google
            </button>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-center text-on-surface-variant text-sm">
          Don't have an account? 
          <Link to="/signup" className="text-primary font-bold hover:underline underline-offset-4 ml-1">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
