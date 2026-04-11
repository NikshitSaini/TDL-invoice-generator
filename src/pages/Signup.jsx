import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { checkUserProfileExists } from '../services/userService';
import toast from 'react-hot-toast';

export default function Signup() {
  const emailRef = useRef();
  const passwordRef = useRef();
  const confirmPasswordRef = useRef();
  const { signup, verifyEmail, signInWithGoogle, currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    async function handleAutoRedirect() {
      if (currentUser) {
        try {
          const isProfileSetup = await checkUserProfileExists(currentUser.uid);
          if (!isProfileSetup) {
            navigate('/dashboard?onboarding=true', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        } catch (err) {
          console.error("Profile check failed, proceeding to dashboard:", err);
          navigate('/dashboard', { replace: true });
        }
      }
    }
    handleAutoRedirect();
  }, [currentUser, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (passwordRef.current.value !== confirmPasswordRef.current.value) {
      return toast.error("Passwords do not match");
    }

    try {
      setLoading(true);
      await signup(emailRef.current.value, passwordRef.current.value);
      
      // Send verification email
      await verifyEmail();
      toast.success("Account created! Verification email sent.");
      
      // Navigation handled by the useEffect watching currentUser

    } catch (err) {
      toast.error(err.message || "Failed to create an account");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    try {
      setLoading(true);
      await signInWithGoogle();
      
      toast.success("Successfully logged in with Google!");
      // Navigation handled by the useEffect watching currentUser
    } catch (err) {
      toast.error(err.message || 'Failed to sign in securely');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-container/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary-container/5 blur-[120px] pointer-events-none"></div>

      <main className="w-full max-w-[480px] z-10">
        {/* Brand Identity */}
        <div className="flex flex-col items-center mb-10">
          <img
            src="https://teraforgedigitallab.com/images/logo.svg"
            alt="Teraforge Digital Lab"
            className="h-14 w-auto mb-3"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <h1 className="text-2xl font-extrabold tracking-tighter text-on-surface mb-1 font-headline">Teraforge Digital Lab</h1>
          <p className="text-on-surface-variant font-medium tracking-tight text-sm">Building the next generation of tech startups</p>
        </div>

        {/* Auth Card */}
        <section className="bg-surface-container-lowest p-8 md:p-10 rounded-xl shadow-md border border-outline-variant/10">
          <header className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight mb-2 font-headline">Create your account</h2>
            <p className="text-on-surface-variant text-sm">Join the digital workspace for modern professionals.</p>
          </header>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface-variant px-1" htmlFor="email">Email address</label>
              <div className="relative">
                <input 
                  type="email" 
                  id="email" 
                  ref={emailRef}
                  required
                  className="w-full px-4 py-3.5 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary-container/20 focus:bg-surface-container-lowest transition-all placeholder:text-outline text-on-surface font-medium" 
                  placeholder="name@company.com" 
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface-variant px-1" htmlFor="password">Password</label>
              <div className="relative">
                <input 
                  type="password" 
                  id="password" 
                  ref={passwordRef}
                  required
                  className="w-full px-4 py-3.5 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary-container/20 focus:bg-surface-container-lowest transition-all placeholder:text-outline text-on-surface font-medium" 
                  placeholder="••••••••" 
                />
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface-variant px-1" htmlFor="confirm-password">Confirm Password</label>
              <div className="relative">
                <input 
                  type="password" 
                  id="confirm-password" 
                  ref={confirmPasswordRef}
                  required
                  className="w-full px-4 py-3.5 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary-container/20 focus:bg-surface-container-lowest transition-all placeholder:text-outline text-on-surface font-medium" 
                  placeholder="••••••••" 
                />
              </div>
            </div>

            {/* Primary Action */}
            <div className="pt-4">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-primary-container text-white font-bold rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-px active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Sign Up'}
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant/30"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
              <span className="bg-surface-container-lowest px-4 text-outline">Or continue with</span>
            </div>
          </div>

          {/* Social Action */}
          <button 
            type="button" 
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3.5 bg-surface-container-low hover:bg-surface-container-high text-on-surface font-semibold rounded-lg transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
            </svg>
            Google
          </button>

          {/* Footer Link */}
          <footer className="mt-8 text-center">
            <p className="text-sm text-on-surface-variant">
              Already have an account? 
              <Link to="/login" className="text-primary-container font-bold hover:underline underline-offset-4 ml-1">Login</Link>
            </p>
          </footer>
        </section>

        {/* Terms & Privacy */}
        <p className="mt-8 text-center text-xs text-outline leading-relaxed max-w-[320px] mx-auto">
            By creating an account, you agree to our 
            <a href="#" className="underline hover:text-on-surface-variant transition-colors pl-1 pr-1">Terms of Service</a> and 
            <a href="#" className="underline hover:text-on-surface-variant transition-colors pl-1">Privacy Policy</a>.
        </p>
      </main>

      {/* Side Graphics for Premium Feel */}
      <div className="hidden xl:block absolute right-16 top-1/2 -translate-y-1/2 w-80 space-y-4 pointer-events-none opacity-40">
        <div className="h-32 bg-surface-container-low rounded-xl shadow-sm flex items-center px-6 gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary-container">verified_user</span>
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-2 w-24 bg-outline-variant/40 rounded-full"></div>
            <div className="h-2 w-32 bg-outline-variant/20 rounded-full"></div>
          </div>
        </div>
        <div className="h-32 translate-x-8 bg-surface-container-low rounded-xl shadow-sm flex items-center px-6 gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary-container/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-secondary">security</span>
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-2 w-20 bg-outline-variant/40 rounded-full"></div>
            <div className="h-2 w-28 bg-outline-variant/20 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
