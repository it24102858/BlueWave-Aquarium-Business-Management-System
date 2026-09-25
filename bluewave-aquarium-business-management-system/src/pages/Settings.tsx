import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Lock,
  Database,
  Download,
  Upload,
  RefreshCw,
  ShieldCheck,
  HardDrive,
  Save,
  Check,
  AlertTriangle,
  Server,
  Activity,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { ConfirmModal } from '../components/ConfirmModal';

interface SettingsProps {
  onRefreshAll?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onRefreshAll }) => {
  const { user, updateUser, currency } = useAuth();
  const { success, error, info } = useToast();

  // Profile states
  const [name, setName] = useState(user?.name || 'Ruditha Yukthika');
  const [businessName, setBusinessName] = useState(user?.businessName || 'BlueWave Aquarium');
  const [currencySymbol, setCurrencySymbol] = useState(user?.currencySymbol || 'LKR');
  const [email, setEmail] = useState(user?.email || 'admin@bluewave.com');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // MongoDB status
  const [mongoStatus, setMongoStatus] = useState<any>(null);
  const [isLoadingMongo, setIsLoadingMongo] = useState(false);
  const [isSyncingMongo, setIsSyncingMongo] = useState(false);

  // Reset modal
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const fetchMongoStatus = async () => {
    try {
      setIsLoadingMongo(true);
      const data = await api.getMongoStatus();
      setMongoStatus(data);
    } catch (err: any) {
      console.error('Failed to get mongo status:', err);
    } finally {
      setIsLoadingMongo(false);
    }
  };

  useEffect(() => {
    fetchMongoStatus();
  }, []);

  const handleSyncMongo = async () => {
    try {
      setIsSyncingMongo(true);
      const res = await api.syncMongoDB();
      if (res.success) {
        success('Successfully synchronized all collections to MongoDB Atlas!');
        setMongoStatus(res.status);
      } else {
        error(res.message || 'MongoDB sync error');
      }
    } catch (err: any) {
      error(err.message || 'Failed to sync with MongoDB Atlas');
    } finally {
      setIsSyncingMongo(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingProfile(true);
      const res = await api.updateProfile({
        name,
        businessName,
        currencySymbol,
        email,
      });
      updateUser(res.user);
      success('Business profile updated successfully!');
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      error(err.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      error('New password and confirmation do not match');
      return;
    }

    try {
      setIsChangingPassword(true);
      await api.changePassword(currentPassword, newPassword);
      success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      error(err.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDownloadBackup = () => {
    window.location.href = api.exportBackupUrl();
    info('Downloading BlueWave database backup JSON...');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        await api.importBackup(json);
        success('Database backup imported and restored successfully!');
        if (onRefreshAll) onRefreshAll();
      } catch (err: any) {
        error(err.message || 'Failed to restore database from file');
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  const handleResetData = async () => {
    try {
      await api.clearAllRecords();
      success('All inventory and transaction records have been cleared. Clean state ready in MongoDB Atlas!');
      setShowResetConfirm(false);
      fetchMongoStatus();
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      error(err.message || 'Failed to clear database');
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-[#12304A]">System Settings & Administration</h2>
        <p className="text-xs text-slate-500">
          Personal business credentials, currency formatting, database status, and backup archives
        </p>
      </div>

      {/* Profile & Business Details */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-sky-50 text-[#0077B6]">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-[#12304A]">Business Profile</h3>
            <p className="text-xs text-slate-500">Owner identity and business configuration</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Owner Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Business Store Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Admin Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Currency Code / Symbol</label>
              <input
                type="text"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                placeholder="e.g. LKR, Rs., $, €"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
              />
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="text-[11px] text-slate-400">Quick presets:</span>
                {[
                  { label: 'LKR (Sri Lanka)', code: 'LKR' },
                  { label: 'Rs. (Rupees)', code: 'Rs.' },
                  { label: '$ (USD)', code: '$' },
                  { label: '€ (EUR)', code: '€' },
                  { label: '£ (GBP)', code: '£' },
                ].map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setCurrencySymbol(item.code)}
                    className={`text-[11px] px-2 py-0.5 rounded-lg border font-semibold transition-colors cursor-pointer ${
                      currencySymbol.trim() === item.code
                        ? 'bg-sky-100 border-[#0077B6] text-[#0077B6] font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="px-5 py-2.5 bg-[#0077B6] hover:bg-[#023E8A] text-white text-xs md:text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-[#12304A]">Security & Password</h3>
            <p className="text-xs text-slate-500">Update your personal account credentials</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="px-5 py-2.5 bg-[#12304A] hover:bg-slate-800 text-white text-xs md:text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isChangingPassword ? 'Updating...' : 'Update Password'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* MongoDB Atlas Database & Storage Operations */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-[#12304A]">MongoDB Atlas Cloud Database</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                  mongoStatus?.connected
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${mongoStatus?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  {mongoStatus?.connected ? 'Connected' : 'Offline Storage'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Primary cloud database on MongoDB Atlas with local resilience
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchMongoStatus}
              disabled={isLoadingMongo}
              className="p-2 text-slate-500 hover:text-[#0077B6] hover:bg-sky-50 rounded-xl transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1 border border-slate-200"
              title="Refresh MongoDB Status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMongo ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              type="button"
              onClick={handleSyncMongo}
              disabled={isSyncingMongo}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors cursor-pointer text-xs font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Server className="w-3.5 h-3.5" />
              <span>{isSyncingMongo ? 'Syncing...' : 'Sync to MongoDB Atlas'}</span>
            </button>
          </div>
        </div>

        {/* MongoDB Cluster & Storage Details */}
        <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Server className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-0.5">
                <p className="font-bold text-emerald-950">
                  Cluster: <span className="font-mono text-emerald-700">Cluster0 (cluster0.0pzrfi8.mongodb.net)</span>
                </p>
                <p className="text-emerald-800">
                  Target Database: <span className="font-bold font-mono text-emerald-900">{mongoStatus?.dbName || 'bluewave_aquarium'}</span>
                </p>
                {mongoStatus?.lastSync && (
                  <p className="text-[11px] text-emerald-600">
                    Last synchronized: {new Date(mongoStatus.lastSync).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Collection Document Counts */}
          <div className="pt-2 border-t border-emerald-100/80">
            <p className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider mb-2">
              Active MongoDB Collections
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { label: 'Fish Varieties', count: mongoStatus?.collectionCounts?.fishVarieties ?? 0 },
                { label: 'Fish Food', count: mongoStatus?.collectionCounts?.fishFoodProducts ?? 0 },
                { label: 'Accessories', count: mongoStatus?.collectionCounts?.aquariumAccessories ?? 0 },
                { label: 'Sales Records', count: mongoStatus?.collectionCounts?.sales ?? 0 },
                { label: 'Purchases', count: mongoStatus?.collectionCounts?.purchases ?? 0 },
                { label: 'Expenses', count: mongoStatus?.collectionCounts?.expenses ?? 0 },
                { label: 'Other Income', count: mongoStatus?.collectionCounts?.additionalIncome ?? 0 },
                { label: 'Price History', count: mongoStatus?.collectionCounts?.priceHistory ?? 0 },
                { label: 'Adjustments', count: mongoStatus?.collectionCounts?.inventoryAdjustments ?? 0 },
                { label: 'Users', count: mongoStatus?.collectionCounts?.users ?? 1 },
              ].map((col) => (
                <div key={col.label} className="bg-white/80 border border-emerald-200/60 rounded-xl p-2 text-center">
                  <span className="text-[10px] text-emerald-800 block truncate">{col.label}</span>
                  <span className="text-sm font-black text-emerald-950">{col.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Download Backup */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3">
            <div>
              <h4 className="font-bold text-sm text-[#12304A]">Export Database Backup</h4>
              <p className="text-xs text-slate-500 mt-1">
                Download an exact JSON snapshot of all inventory, sales, and financial records.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="w-full py-2.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-[#0077B6] font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Backup JSON</span>
            </button>
          </div>

          {/* Restore Backup */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3">
            <div>
              <h4 className="font-bold text-sm text-[#12304A]">Restore from File</h4>
              <p className="text-xs text-slate-500 mt-1">
                Import and restore a previously exported JSON backup file into MongoDB.
              </p>
            </div>
            <label className="w-full py-2.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-center">
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>Select File to Restore</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Clear All Records / Fresh Start */}
          <div className="p-4 rounded-2xl border border-rose-100 bg-rose-50/30 flex flex-col justify-between space-y-3">
            <div>
              <h4 className="font-bold text-sm text-rose-900">Clear Records (Fresh Start)</h4>
              <p className="text-xs text-rose-700 mt-1">
                Wipe all inventory, sales, purchases, and expenses to start completely fresh without demo data.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="w-full py-2.5 px-3 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Clear Records (Fresh Start)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title="Clear All Business Records (Fresh Start)?"
        message="This will remove all inventory items, sales records, purchase receipts, and expenses from MongoDB Atlas and local disk storage so you have a completely clean store database. Your administrator account credentials will remain preserved."
        confirmText="Yes, Clear All Records"
        isDestructive={true}
        onConfirm={handleResetData}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};
