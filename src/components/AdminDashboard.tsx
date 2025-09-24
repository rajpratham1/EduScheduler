import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { apiService } from '../services/apiService';
import ClassroomManagement from './admin/ClassroomManagement';
import FacultyManagement from './admin/FacultyManagement';
import StudentManagement from './admin/StudentManagement';
import StudentApprovals from './admin/StudentApprovals';
import DepartmentManagement from './admin/DepartmentManagement';
import SubjectManagement from './admin/SubjectManagement';
import ScheduleGenerator from './admin/ScheduleGenerator';
import SettingsManagement from './admin/SettingsManagement';
import AdminManagement from './admin/AdminManagement';
import AIScheduleModifier from './admin/AIScheduleModifier';
import AnnouncementManagement from './admin/AnnouncementManagement';
import AssignmentManagement from './admin/AssignmentManagement';
import AttendanceReports from './admin/AttendanceReports';
import FeedbackManagement from './admin/FeedbackManagement';
import AdminCodes from './AdminCodes';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  Settings, 
  LogOut, 
  Sun, 
  Moon, 
  Globe,
  Plus,
  Building,
  GraduationCap,
  Clock,
  Building2,
  Zap,
  Shield,
  MessageSquare,
  Key
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { isDarkMode, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({ faculty: 0, students: 0, classrooms: 0, schedules: 0, departments: 0, subjects: 0, activeStudents: 0, pendingApprovals: 0 });
  const [adminProfile, setAdminProfile] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (user && (user.role === 'admin' || user.profile?.role === 'admin')) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const token = await user.getIdToken();
      const response = await apiService.get('/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setStats(response.data.stats);
      setAdminProfile(response.data.profile);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const tabs = [
    { id: 'overview', icon: Calendar, label: t('admin.overview') },
    { id: 'student-approvals', icon: Shield, label: 'Student Approvals' },
    { id: 'departments', icon: Building2, label: 'Departments' },
    { id: 'subjects', icon: BookOpen, label: 'Subjects' },
    { id: 'classrooms', icon: Building, label: t('admin.classrooms') },
    { id: 'faculty', icon: Users, label: t('admin.faculty') },
    { id: 'students', icon: GraduationCap, label: t('admin.students') },
    { id: 'attendance', icon: Clock, label: 'Attendance Reports' },
    { id: 'assignments', icon: BookOpen, label: 'Assignment Management' },
    { id: 'feedback', icon: MessageSquare, label: 'Feedback Management' },
    { id: 'announcements', icon: MessageSquare, label: 'Announcements' },
    { id: 'schedules', icon: Zap, label: 'AI Schedule Generator' },
    { id: 'ai-modifier', icon: MessageSquare, label: 'AI Timetable Modifier' },
    { id: 'admins', icon: Shield, label: 'Admin & Faculty Management' },
    { id: 'settings', icon: Settings, label: t('admin.settings') },
  ];

  const handleLogout = () => {
    logout();
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('admin.dashboard')}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* ... other header buttons ... */}
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                <span>Welcome, {user?.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>{t('admin.logout')}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white dark:bg-gray-800 shadow-sm min-h-screen border-r border-gray-200 dark:border-gray-700">
          <div className="p-4">
            <ul className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 shadow-md'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                {t('admin.overview')}
              </h2>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Faculty</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{loadingStats ? '...' : stats.faculty}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Students</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{loadingStats ? '...' : stats.students}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Active: {stats.activeStudents}</p>
                    </div>
                    <GraduationCap className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Departments</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{loadingStats ? '...' : stats.departments}</p>
                    </div>
                    <Building2 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Subjects</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{loadingStats ? '...' : stats.subjects}</p>
                    </div>
                    <BookOpen className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Classrooms</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{loadingStats ? '...' : stats.classrooms}</p>
                    </div>
                    <Building className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Schedules</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{loadingStats ? '...' : stats.schedules}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-teal-600 dark:text-teal-400" />
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Approvals</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{loadingStats ? '...' : stats.pendingApprovals}</p>
                    </div>
                    <Shield className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </div>
                  {stats.pendingApprovals > 0 && (
                    <div className="absolute top-2 right-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">
                        Action Required
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Institution</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white truncate">{adminProfile?.institutionName || 'Not Set'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Admin: {adminProfile?.name}</p>
                    </div>
                    <Key className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </div>

              {/* Quick Actions & Other sections can remain as they are */}
            </div>
          )}

          {activeTab === 'student-approvals' && <StudentApprovals />}
          {activeTab === 'departments' && <DepartmentManagement />}
          {activeTab === 'subjects' && <SubjectManagement />}
          {activeTab === 'classrooms' && <ClassroomManagement />}
          {activeTab === 'faculty' && <FacultyManagement />}
          {activeTab === 'students' && <StudentManagement />}
          {activeTab === 'attendance' && <AttendanceReports />}
          {activeTab === 'assignments' && <AssignmentManagement />}
          {activeTab === 'feedback' && <FeedbackManagement />}
          {activeTab === 'announcements' && <AnnouncementManagement />}
          {activeTab === 'schedules' && <ScheduleGenerator />}
          {activeTab === 'ai-modifier' && <AIScheduleModifier />}
          {activeTab === 'admins' && <AdminManagement />}
          {activeTab === 'settings' && <SettingsManagement />}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
