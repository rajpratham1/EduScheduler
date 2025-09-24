import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Users, 
  Calendar, 
  BookOpen, 
  Moon, 
  Sun, 
  Globe, 
  MessageCircle, 
  Phone,
  Zap,
  Shield,
  BarChart3,
  CheckCircle,
  ArrowRight,
  Star,
  Award,
  Mail,
  HelpCircle
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage, languageNames, Language } from '../contexts/LanguageContext';
import ContactModal from './common/ContactModal';
import UserManualModal from './common/UserManualModal';

const LandingPage: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [isContactModalOpen, setContactModalOpen] = useState(false);
  const [isManualModalOpen, setManualModalOpen] = useState(false);

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    setShowLanguageMenu(false);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="container mx-auto px-4 py-4 sm:py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {t('landing.title')}
            </h1>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="relative">
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center space-x-1 sm:space-x-2"
                title={t('common.language.toggle')}
              >
                <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-300" />
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block">
                  {languageNames[language]}
                </span>
              </button>
              
              {showLanguageMenu && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-64 overflow-y-auto">
                  {Object.entries(languageNames).map(([code, name]) => (
                    <button
                      key={code}
                      onClick={() => handleLanguageChange(code as Language)}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm ${
                        language === code ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
              title={t('common.theme.toggle')}
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
              ) : (
                <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-12 sm:mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-2xl">
              <Award className="h-12 w-12 sm:h-16 sm:w-16 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 leading-tight">
            {t('landing.title')}
            <span className="block text-xl sm:text-3xl md:text-4xl text-blue-600 dark:text-blue-400 mt-2">
              {t('landing.subtitle')}
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 sm:mb-12 max-w-4xl mx-auto leading-relaxed px-4">
            {t('landing.description')}
          </p>
          
          {/* Portal Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto mb-12 sm:mb-16 px-4">
            <Link
              to="/admin/login"
              className="group relative px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-center"
            >
              <Users className="inline-block mr-2 h-5 w-5" />
              Admin Portal
              <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            </Link>
            <Link
              to="/faculty/login"
              className="group relative px-6 sm:px-8 py-3 sm:py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-center"
            >
              <BookOpen className="inline-block mr-2 h-5 w-5" />
              Faculty Portal
              <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            </Link>
            <Link
              to="/student/login"
              className="group relative px-6 sm:px-8 py-3 sm:py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-center sm:col-span-2 lg:col-span-1"
            >
              <GraduationCap className="inline-block mr-2 h-5 w-5" />
              Student Portal
              <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            </Link>
          </div>
          
          {/* Student Signup CTA */}
          <div className="bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900 dark:to-indigo-900 rounded-2xl p-6 sm:p-8 text-center mb-12">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
              New Student?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
              Create your student account and wait for admin approval to access your dashboard, assignments, and more.
            </p>
            <Link
              to="/student/signup"
              className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              Register as Student
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* About Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sm:p-8 mb-12 sm:mb-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {t('landing.about.title')}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto text-base sm:text-lg leading-relaxed">
              {t('landing.about.desc')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="bg-blue-100 dark:bg-blue-900 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">SIH 2025 Winner</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Problem ID: 25028</p>
            </div>
            <div className="text-center p-4">
              <div className="bg-green-100 dark:bg-green-900 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">AI-Powered</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">ChatGPT Integration</p>
            </div>
            <div className="text-center p-4 sm:col-span-2 lg:col-span-1">
              <div className="bg-purple-100 dark:bg-purple-900 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Secure & Reliable</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Firebase Backend</p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-12 sm:mb-16">
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-8 sm:mb-12">
            {t('landing.features.title')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
              <div className="bg-blue-100 dark:bg-blue-900 w-16 h-16 rounded-xl flex items-center justify-center mb-6 mx-auto">
                <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">
                {t('landing.features.ai')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed">
                {t('landing.features.ai.desc')}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
              <div className="bg-green-100 dark:bg-green-900 w-16 h-16 rounded-xl flex items-center justify-center mb-6 mx-auto">
                <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">
                {t('landing.features.responsive')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed">
                {t('landing.features.responsive.desc')}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
              <div className="bg-purple-100 dark:bg-purple-900 w-16 h-16 rounded-xl flex items-center justify-center mb-6 mx-auto">
                <Globe className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">
                {t('landing.features.multilingual')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed">
                {t('landing.features.multilingual.desc')}
              </p>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900 dark:to-purple-900 rounded-2xl p-6 sm:p-8 mb-12 sm:mb-16">
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-8 sm:mb-12">
            {t('landing.benefits.title')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-800 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3">
                {t('landing.benefits.automated')}
              </h4>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {t('landing.benefits.automated.desc')}
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-800 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3">
                {t('landing.benefits.management')}
              </h4>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {t('landing.benefits.management.desc')}
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 dark:bg-purple-800 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-10 w-10 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3">
                {t('landing.benefits.analytics')}
              </h4>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {t('landing.benefits.analytics.desc')}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-6 sm:py-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              SIH Hackathon 2025 • Problem ID: 25028 • Smart Classroom and Schedule Generator
            </p>
            
            {/* Compact Help Section */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">{t('landing.help')}</span>
              <button
                onClick={() => setManualModalOpen(true)}
                className="inline-flex items-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-all duration-200 hover:scale-105"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">User Manual</span>
              </button>
              <a
                href="https://wa.me/916200892887"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-all duration-200 hover:scale-105"
              >
                <Phone className="h-4 w-4" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
              <button
                onClick={() => setContactModalOpen(true)}
                className="inline-flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-all duration-200 hover:scale-105"
              >
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline">Contact Admin</span>
              </button>
            </div>
          </div>
        </footer>
      </main>

      {isContactModalOpen && <ContactModal onClose={() => setContactModalOpen(false)} />}
      {isManualModalOpen && <UserManualModal onClose={() => setManualModalOpen(false)} />}
    </div>
  );
};

export default LandingPage;