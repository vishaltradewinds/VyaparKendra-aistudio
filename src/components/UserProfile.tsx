import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Save, Building2, CreditCard } from 'lucide-react';

export function UserProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(res.data);
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/user/profile', profile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Profile updated successfully!');
    } catch (err) {
      setMessage('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4 text-slate-500">Loading profile...</div>;
  if (!profile) return <div className="p-4 text-red-500">Failed to load profile.</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 bg-slate-50/50">
        <h2 className="text-lg font-bold text-slate-800">Profile Management</h2>
        <p className="text-sm text-slate-500">Manage your business and bank details</p>
      </div>

      <div className="p-6 space-y-8">
        {message && (
          <div className={`p-4 rounded-lg text-sm font-medium ${message.includes('success') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        {/* Business Details */}
        <div>
          <h3 className="text-md font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <Building2 size={18} className="text-indigo-500" />
            Business Registration Documents
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Business Name</label>
              <input 
                type="text" 
                name="business_name"
                value={profile.business_name || ''} 
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Enter your business name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">GST Number</label>
              <input 
                type="text" 
                name="gst_number"
                value={profile.gst_number || ''} 
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                placeholder="e.g., 22AAAAA0000A1Z5"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">PAN Number</label>
              <input 
                type="text" 
                name="pan_number"
                value={profile.pan_number || ''} 
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                placeholder="e.g., ABCDE1234F"
              />
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Bank Details */}
        <div>
          <h3 className="text-md font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <CreditCard size={18} className="text-indigo-500" />
            Bank Account Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Bank Name</label>
              <input 
                type="text" 
                name="bank_name"
                value={profile.bank_name || ''} 
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g., State Bank of India"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Account Number</label>
              <input 
                type="text" 
                name="bank_account_number"
                value={profile.bank_account_number || ''} 
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Enter account number"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">IFSC Code</label>
              <input 
                type="text" 
                name="bank_ifsc"
                value={profile.bank_ifsc || ''} 
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                placeholder="e.g., SBIN0001234"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
