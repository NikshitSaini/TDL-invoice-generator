import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { updateConfig } from '../../services/configService';
import { useConfig } from '../../contexts/ConfigContext';

export default function ConfigEditModal({ section, onClose }) {
  const { config, refreshConfig } = useConfig();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  
  // Local state for all possible fields initialized from global config
  const [formData, setFormData] = useState({
    companyName: config?.companyName || '',
    logoUrl: config?.logoUrl || '',
    website: config?.website || '',
    phone: config?.phone || '',
    address: config?.address || '',
    gstin: config?.gstin || '',
    bankDetails: config?.bankDetails || '',
    qrCodeUrl: config?.qrCodeUrl || ''
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      return toast.error("Super Admin Password is required.");
    }

    try {
      setLoading(true);
      // Filter formData to only update the fields belonging to this section
      let dataToUpdate = {};
      if (section === 'company') {
        dataToUpdate = {
          companyName: formData.companyName,
          logoUrl: formData.logoUrl,
          website: formData.website,
          phone: formData.phone,
          address: formData.address
        };
      } else if (section === 'tax') {
        dataToUpdate = { gstin: formData.gstin };
      } else if (section === 'bank') {
        dataToUpdate = {
          bankDetails: formData.bankDetails,
          qrCodeUrl: formData.qrCodeUrl
        };
      }

      await updateConfig(dataToUpdate, password);
      
      toast.success("Configuration updated successfully!");
      await refreshConfig();
      if (onClose) onClose();
    } catch (err) {
      toast.error(err.message || "Failed to update configuration.");
    } finally {
      setLoading(false);
    }
  };

  const renderSectionFields = () => {
    if (section === 'company') {
      return (
        <>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-on-surface-variant">Company Name</label>
            <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="w-full px-4 py-3 bg-surface-container-low rounded-lg focus:ring-2 focus:ring-primary border-none" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-on-surface-variant">Logo URL</label>
            <input type="url" name="logoUrl" value={formData.logoUrl} onChange={handleChange} className="w-full px-4 py-3 bg-surface-container-low rounded-lg focus:ring-2 focus:ring-primary border-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface-variant">Website</label>
              <input type="url" name="website" value={formData.website} onChange={handleChange} className="w-full px-4 py-3 bg-surface-container-low rounded-lg focus:ring-2 focus:ring-primary border-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface-variant">Phone (Public)</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 bg-surface-container-low rounded-lg focus:ring-2 focus:ring-primary border-none" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-on-surface-variant">Registered Address</label>
            <textarea name="address" rows="2" value={formData.address} onChange={handleChange} className="w-full px-4 py-3 bg-surface-container-low rounded-lg focus:ring-2 focus:ring-primary border-none resize-none"></textarea>
          </div>
        </>
      );
    } else if (section === 'tax') {
      return (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-on-surface-variant">GSTIN Number</label>
          <input type="text" name="gstin" value={formData.gstin} onChange={handleChange} className="w-full px-4 py-3 bg-surface-container-low rounded-lg focus:ring-2 focus:ring-primary border-none uppercase" />
        </div>
      );
    } else if (section === 'bank') {
      return (
        <>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-on-surface-variant">Bank Details (Account, IFSC, etc.)</label>
            <textarea name="bankDetails" rows="4" value={formData.bankDetails} onChange={handleChange} className="w-full px-4 py-3 bg-surface-container-low rounded-lg focus:ring-2 focus:ring-primary border-none resize-none" placeholder="Bank Name:&#10;Account No:&#10;IFSC:"></textarea>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-on-surface-variant">Payment QR Code URL</label>
            <input type="url" name="qrCodeUrl" value={formData.qrCodeUrl} onChange={handleChange} className="w-full px-4 py-3 bg-surface-container-low rounded-lg focus:ring-2 focus:ring-primary border-none" />
          </div>
        </>
      );
    }
  };

  const getSectionTitle = () => {
    switch(section) {
      case 'company': return 'Edit Company Profile';
      case 'tax': return 'Edit Tax & Compliance';
      case 'bank': return 'Edit Bank Details';
      default: return 'Edit Settings';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/10 backdrop-blur-sm overflow-y-auto p-4 md:p-8">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-xl shadow-md overflow-hidden animate-in fade-in zoom-in duration-300">
        
        <div className="px-8 py-6 border-b border-surface-container flex justify-between items-center">
          <h3 className="text-2xl font-bold font-headline">{getSectionTitle()}</h3>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              {renderSectionFields()}
            </div>
            
            <div className="space-y-4 pt-4 border-t border-surface-container">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-on-surface-variant font-label" htmlFor="admin_password">Super Admin Password</label>
                <div className="relative group">
                  <input 
                    type="password" 
                    id="admin_password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Security Key"
                    className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3.5 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all placeholder:text-outline-variant font-body"
                  />
                  <span className="material-symbols-outlined absolute right-4 top-3.5 text-outline-variant group-focus-within:text-primary">lock</span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row-reverse gap-3 pt-4">
                <button type="submit" disabled={loading} className="w-full py-3.5 bg-primary text-white font-headline font-bold rounded-lg hover:bg-primary-container transition-colors shadow-sm active:scale-95 duration-200 flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
                  Save Variables
                </button>
                <button type="button" onClick={onClose} className="w-full py-3.5 bg-transparent border-2 border-outline-variant text-on-surface-variant font-headline font-bold rounded-lg hover:bg-surface-container-low transition-colors active:scale-95 duration-200">
                  Discard
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
