import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const emailRef = useRef();
  const { resetPassword } = useAuth();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);
      await resetPassword(emailRef.current.value);
      toast.success("Password reset email sent! Check your inbox.");
    } catch (err) {
      toast.error(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Aesthetic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-secondary-container/10 rounded-full blur-[100px]"></div>
      
      {/* Main Forgot Password Container */}
      <main className="w-full max-w-md z-10">
        {/* Brand Identity */}
        <div className="flex flex-col items-center mb-10">
          <img
            src="https://teraforgedigitallab.com/images/logo.svg"
            alt="Teraforge Digital Lab"
            className="h-12 w-auto mb-3"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <h1 className="text-xl font-extrabold tracking-tighter text-on-surface font-headline">Teraforge Digital Lab</h1>
          <p className="text-xs font-medium text-on-surface-variant/70 tracking-wide uppercase mt-1">Building the next generation of tech startups</p>
        </div>

        {/* Focused Task Card */}
        <div className="bg-surface-container-lowest rounded-xl p-8 md:p-10 shadow-md border-0 ring-1 ring-outline-variant/10">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-on-surface mb-2 font-headline">Reset Password</h2>
            <p className="text-on-surface-variant text-sm leading-relaxed">Enter the email address associated with your account and we'll send you a link to reset your password.</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Input Field */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant ml-1" htmlFor="email">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-on-surface-variant/50 text-xl">mail</span>
                </div>
                <input 
                  type="email" 
                  id="email" 
                  name="email"
                  ref={emailRef} 
                  required
                  placeholder="name@company.com" 
                  className="block w-full pl-11 pr-4 py-3.5 bg-surface-container-low border-none rounded-lg text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary-container/20 focus:bg-surface-container-lowest transition-all duration-200"
                />
              </div>
            </div>

            {/* Primary Action Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary-container hover:bg-primary text-white font-bold py-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-50"
            >
              <span>{loading ? 'Sending...' : 'Send Reset Link'}</span>
              <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
          </form>

          {/* Secondary Navigation */}
          <div className="mt-8 pt-8 border-t border-surface-container text-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-fixed-dim transition-colors group">
              <span className="material-symbols-outlined text-lg">keyboard_backspace</span>
              Back to Login
            </Link>
          </div>
        </div>

        {/* Footer / Support Link */}
        <div className="mt-8 text-center">
          <p className="text-xs text-on-surface-variant/60 font-medium">
            Having trouble? <a href="#" className="text-on-surface-variant underline decoration-primary/30 underline-offset-4 hover:decoration-primary transition-all">Contact our concierge support</a>
          </p>
        </div>
      </main>

      {/* Decorative Canvas Side Elements */}
      <div className="hidden lg:block absolute top-1/2 left-20 -translate-y-1/2 space-y-12 opacity-20 pointer-events-none">
        <div className="w-16 h-16 rounded-xl bg-surface-container-highest rotate-12"></div>
        <div className="w-24 h-24 rounded-2xl bg-primary-container/10 -rotate-6 ml-8"></div>
        <div className="w-12 h-12 rounded-lg bg-secondary-container/20 rotate-45 ml-4"></div>
      </div>
      <div className="hidden lg:block absolute top-1/2 right-20 -translate-y-1/2 space-y-12 opacity-20 pointer-events-none">
        <div className="w-20 h-20 rounded-full bg-tertiary-container/10 -rotate-12"></div>
        <div className="w-14 h-14 rounded-xl bg-surface-container-high rotate-6 mr-8"></div>
        <div className="w-28 h-28 rounded-3xl bg-primary-container/5 rotate-12 mr-4"></div>
      </div>
    </div>
  );
}
