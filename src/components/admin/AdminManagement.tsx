import React, { useState, useEffect } from 'react';
import { Shield, Users, Search, Eye, EyeOff, Mail, User, Trash2 } from 'lucide-react';
import { authService, AdminProfile, FacultyProfile } from '../../services/authService';
import { facultyApi } from '../../services/apiService';
import { useLanguage } from '../../contexts/LanguageContext';

const AdminManagement: React.FC = () => {
  const { t } = useLanguage();
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [faculty, setFaculty] = useState<FacultyProfile[]>([]);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isFacultyModalOpen, setIsFacultyModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [currentAdminId, setCurrentAdminId] = useState<string>('');
  const [currentSecretCode, setCurrentSecretCode] = useState<string>('');

  const [adminFormData, setAdminFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const [facultyFormData, setFacultyFormData] = useState({
    name: '',
    email: '',
    department: '',
    password: ''
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [adminsData, currentProfile] = await Promise.all([
        authService.getAllAdmins(),
        authService.getCurrentUserProfile()
      ]);
      
      setAdmins(adminsData);
      
      if (currentProfile && currentProfile.role === 'admin') {
        setCurrentAdminId(currentProfile.id!);
        setCurrentSecretCode(currentProfile.secretCode);
        const facultyData = await authService.getFacultyByAdmin(currentProfile.id!);
        setFaculty(facultyData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showMessage('error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await authService.createAdmin({
        ...adminFormData,
        createdBy: currentAdminId
      });
      if (result.success) {
        showMessage('success', `Admin created successfully! Secret Code: ${result.secretCode}`);
        setAdminFormData({ name: '', email: '', password: '' });
        setIsAdminModalOpen(false);
        await loadData();
      } else {
        showMessage('error', result.message);
      }
    } catch (error) {
      showMessage('error', 'Failed to create admin account');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await authService.createFaculty({
        ...facultyFormData,
        adminId: currentAdminId,
        secretCode: currentSecretCode
      });
      if (result.success) {
        showMessage('success', 'Faculty account created successfully!');
        setFacultyFormData({ name: '', email: '', department: '', password: '' });
        setIsFacultyModalOpen(false);
        await loadData();
      } else {
        showMessage('error', result.message);
      }
    } catch (error) {
      showMessage('error', 'Failed to create faculty account');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFaculty = async (facultyId: string) => {
    if (window.confirm('Are you sure you want to permanently delete this faculty member? This will delete their login account and cannot be undone.')) {
        try {
            await facultyApi.delete(facultyId);
            showMessage('success', 'Faculty member deleted successfully.');
            await loadData();
        } catch (error) {
            console.error('Error deleting faculty:', error);
            showMessage('error', 'Failed to delete faculty member.');
        }
    }
  };

  const filteredAdmins = admins.filter(admin =>
    admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFaculty = faculty.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          {t('admin.userManagement.title')}
        </h2>
        <div className="flex space-x-3">
          <button
            onClick={() => setIsFacultyModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Users className="h-4 w-4" />
            <span>{t('admin.userManagement.addFaculty')}</span>
          </button>
          <button
            onClick={() => setIsAdminModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Shield className="h-4 w-4" />
            <span>{t('admin.userManagement.addAdmin')}</span>
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-700'
            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder={t('admin.userManagement.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Admins Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Shield className="h-5 w-5 mr-2 text-blue-600" />
          {t('admin.userManagement.admins')} ({filteredAdmins.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAdmins.map((admin) => (
            <div key={admin.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                    <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{admin.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{admin.email}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('admin.userManagement.secretCode')}:</span>
                  <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-blue-600 dark:text-blue-400">
                    {admin.id === currentAdminId ? admin.secretCode : '**********'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('admin.userManagement.status')}:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    admin.isActive 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {admin.isActive ? t('admin.userManagement.active') : t('admin.userManagement.inactive')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Faculty Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Users className="h-5 w-5 mr-2 text-green-600" />
          {t('admin.userManagement.faculty')} ({filteredFaculty.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFaculty.map((facultyMember) => (
            <div key={facultyMember.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                    <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{facultyMember.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{facultyMember.email}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteFaculty(facultyMember.id!)}
                  className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-full transition-colors"
                  title="Delete Faculty"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('admin.userManagement.department')}:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{facultyMember.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('admin.userManagement.status')}:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    facultyMember.isActive 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {facultyMember.isActive ? t('admin.userManagement.active') : t('admin.userManagement.inactive')}
                  </span>
                </div>
                {facultyMember.needsPasswordChange && (
                  <div className="text-orange-600 dark:text-orange-400 text-xs">
                    ⚠️ {t('admin.userManagement.needsPasswordChange')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Admin Modal */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {t('admin.userManagement.addAdminTitle')}
              </h3>
              <form onSubmit={handleCreateAdmin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                  <input type="text" value={adminFormData.name} onChange={(e) => setAdminFormData({ ...adminFormData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input type="email" value={adminFormData.email} onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                  <div className="flex space-x-2">
                      <input type={showPassword ? 'text' : 'password'} value={adminFormData.password} onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })} className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" required />
                      <button type="button" onClick={() => setAdminFormData({...adminFormData, password: generatePassword()})} className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors">Generate</button>
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                  </div>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50">{saving ? 'Creating...' : 'Create Admin'}</button>
                  <button type="button" onClick={() => setIsAdminModalOpen(false)} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Faculty Modal */}
      {isFacultyModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Add New Faculty Member
              </h3>
              <form onSubmit={handleCreateFaculty} className="space-y-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                      <input type="text" value={facultyFormData.name} onChange={(e) => setFacultyFormData({ ...facultyFormData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" required />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                      <input type="email" value={facultyFormData.email} onChange={(e) => setFacultyFormData({ ...facultyFormData, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" required />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
                      <input type="text" value={facultyFormData.department} onChange={(e) => setFacultyFormData({ ...facultyFormData, department: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" required />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                      <div className="flex space-x-2">
                          <input type={showPassword ? 'text' : 'password'} value={facultyFormData.password} onChange={(e) => setFacultyFormData({ ...facultyFormData, password: e.target.value })} className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" required />
                          <button type="button" onClick={() => setFacultyFormData({...facultyFormData, password: generatePassword()})} className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors">Generate</button>
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                      </div>
                  </div>
                  <div className="flex space-x-3 pt-4">
                      <button type="submit" disabled={saving} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50">{saving ? 'Creating...' : 'Create Faculty'}</button>
                      <button type="button" onClick={() => setIsFacultyModalOpen(false)} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors">Cancel</button>
                  </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;
