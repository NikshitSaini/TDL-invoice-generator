import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createUserProfile } from '../services/userService';
import toast from 'react-hot-toast';

export default function OnboardingModal({ onClose }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const firstNameRef = useRef();
  const lastNameRef = useRef();
  const mobileRef = useRef();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setLoading(true);
      await createUserProfile(currentUser.uid, {
        firstName: firstNameRef.current.value,
        lastName: lastNameRef.current.value,
        mobile: mobileRef.current.value,
        email: currentUser.email,
      });

      toast.success("Profile created successfully!");
      if (onClose) onClose();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message || "Failed to create profile");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/10 backdrop-blur-sm p-4">
      {/* Modal Card */}
      <div className="bg-surface-container-lowest w-full max-w-xl rounded-xl shadow-md overflow-hidden flex flex-col relative border border-outline-variant/10">
        
        {/* Decorative Gradient Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-primary-container to-primary"></div>
        
        <div className="p-10 md:p-12 space-y-10">
          {/* Header */}
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-container/10 rounded-lg">
              <span className="material-symbols-outlined text-primary text-3xl" style={{fontVariationSettings: "'FILL' 1"}}>person_add</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold font-headline tracking-tight text-on-surface leading-tight">Welcome to Teraforge! <br/>Tell us about yourself</h2>
              <p className="text-on-surface-variant font-body leading-relaxed">Let's set up your profile to personalize your invoicing experience. This information will be used for your official communications.</p>
            </div>
          </div>

          {/* Onboarding Form */}
          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-on-surface-variant font-label ml-1">First Name</label>
                <input 
                  type="text" 
                  ref={firstNameRef}
                  required
                  placeholder="e.g. Julian" 
                  className="w-full bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all placeholder:text-outline-variant"
                />
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-on-surface-variant font-label ml-1">Last Name</label>
                <input 
                  type="text" 
                  ref={lastNameRef}
                  required
                  placeholder="e.g. Thorne" 
                  className="w-full bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all placeholder:text-outline-variant"
                />
              </div>
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-on-surface-variant font-label ml-1">Email Address</label>
                <span className="text-[10px] bg-surface-container-high px-2 py-0.5 rounded-full text-outline font-bold uppercase tracking-widest">Locked</span>
              </div>
              <div className="relative">
                <input 
                  type="email" 
                  readOnly 
                  value={currentUser?.email || ''}
                  className="w-full bg-surface-container-high border-none rounded-lg p-4 text-outline font-medium cursor-not-allowed"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <span className="material-symbols-outlined text-outline/50 text-xl">lock</span>
                </div>
              </div>
            </div>

            {/* Mobile Number */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface-variant font-label ml-1">Mobile Number</label>
              <div className="flex space-x-3">
                <div className="w-24 bg-surface-container-low rounded-lg p-4 flex items-center justify-center space-x-1 cursor-default">
                  <span className="text-sm font-medium text-on-surface">+1</span>
                  <span className="material-symbols-outlined text-sm text-outline">expand_more</span>
                </div>
                <input 
                  type="tel" 
                  ref={mobileRef}
                  required
                  placeholder="(555) 000-0000" 
                  className="flex-1 bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all placeholder:text-outline-variant"
                />
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-4">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-5 bg-gradient-to-r from-primary-container to-primary text-white rounded-lg font-headline font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-px transition-all flex items-center justify-center space-x-3 disabled:opacity-50"
              >
                <span>{loading ? 'Saving...' : 'Save & Continue'}</span>
                <span className="material-symbols-outlined text-2xl">arrow_forward</span>
              </button>
            </div>
          </form>

          {/* Status Progress */}
          <div className="flex items-center justify-center space-x-8 pt-4">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>
              <span className="text-xs font-bold text-on-surface font-label">Profile</span>
            </div>
            <div className="flex items-center space-x-2 opacity-30">
              <div className="w-2.5 h-2.5 bg-outline rounded-full"></div>
              <span className="text-xs font-medium text-outline font-label">Company</span>
            </div>
            <div className="flex items-center space-x-2 opacity-30">
              <div className="w-2.5 h-2.5 bg-outline rounded-full"></div>
              <span className="text-xs font-medium text-outline font-label">Taxes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
