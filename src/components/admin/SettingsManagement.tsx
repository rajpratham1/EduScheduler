import React, { useState, useEffect } from 'react';
import { Save, Clock, Calendar, Link } from 'lucide-react';
import { firebaseService, Settings } from '../../services/firebaseService';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

const SettingsManagement: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    classDuration: 90,
    breakDuration: 15,
    lunchBreakStart: '12:15',
    lunchBreakEnd: '13:15',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    holidays: [] as string[],
    feedbackFormUrl: ''
  });

  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    if (user) {
      loadSettings(user.id);
    }
  }, [user]);

  const loadSettings = async (adminId: string) => {
    setLoading(true);
    try {
      const currentSettings = await firebaseService.getSettings(adminId);
      if (currentSettings) {
        setSettingsId(currentSettings.id!);
        setFormData({
          classDuration: currentSettings.classDuration || 90,
          breakDuration: currentSettings.breakDuration || 15,
          lunchBreakStart: currentSettings.lunchBreakStart || '12:15',
          lunchBreakEnd: currentSettings.lunchBreakEnd || '13:15',
          workingDays: currentSettings.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          holidays: (currentSettings.holidays || []).map(h => new Date(h).toISOString().split('T')[0]),
          feedbackFormUrl: currentSettings.feedbackFormUrl || ''
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('You must be logged in to save settings.');
      return;
    }
    setSaving(true);
    
    try {
      const settingsData = {
        ...formData,
        adminId: user.id, // Ensure adminId is always included
        holidays: formData.holidays.map(h => new Date(h)),
      };

      if (settingsId) {
        await firebaseService.updateSettings(settingsId, settingsData);
      } else {
        await firebaseService.createSettings(settingsData);
      }

      await loadSettings(user.id);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleWorkingDay = (day: string) => {
    const newWorkingDays = formData.workingDays.includes(day)
      ? formData.workingDays.filter(d => d !== day)
      : [...formData.workingDays, day];
    
    setFormData({ ...formData, workingDays: newWorkingDays });
  };

  // ... (rest of the component remains the same)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          System Settings
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Time Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Time Configuration
            </h3>
          </div>
          {/* ... form inputs ... */}
        </div>

        {/* Working Days */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Working Days
            </h3>
          </div>
          {/* ... form inputs ... */}
        </div>

        {/* Holidays */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          {/* ... form inputs ... */}
        </div>

        {/* Feedback Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Link className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Faculty Feedback Form
            </h3>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Google Form URL
            </label>
            <input
              type="url"
              value={formData.feedbackFormUrl}
              onChange={(e) => setFormData({ ...formData, feedbackFormUrl: e.target.value })}
              placeholder="https://forms.google.com/..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              This URL will be shown in the faculty dashboard for feedback submission.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsManagement;
