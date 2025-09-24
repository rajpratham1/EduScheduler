import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'hi' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'ja' | 'ko' | 'zh' | 'ar' | 'tr' | 'nl' | 'sv' | 'da' | 'no' | 'fi' | 'pl' | 'cs' | 'hu' | 'ro' | 'bg' | 'hr' | 'sk';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Landing Page
    'landing.title': 'EduScheduler',
    'landing.subtitle': 'Smart Classroom and Schedule Generator',
    'landing.description': 'AI-powered scheduling solution for educational institutions. Generate conflict-free timetables, manage exam schedules, and optimize seating arrangements with advanced algorithms.',
    'landing.admin': 'Admin Portal',
    'landing.faculty': 'Faculty Portal',
    'landing.features.title': 'Key Features',
    'landing.features.ai': 'AI-Powered Scheduling',
    'landing.features.ai.desc': 'Advanced algorithms for conflict-free scheduling with Google OR-Tools integration',
    'landing.features.responsive': 'Responsive Design',
    'landing.features.responsive.desc': 'Works perfectly on all devices - desktop, tablet, and mobile',
    'landing.features.multilingual': 'Multi-language Support',
    'landing.features.multilingual.desc': 'Support for 25+ languages with real-time switching',
    'landing.about.title': 'About EduScheduler',
    'landing.about.desc': 'EduScheduler is a comprehensive educational management system designed for modern institutions. Built for SIH Hackathon 2025, it combines artificial intelligence with intuitive design to solve complex scheduling challenges.',
    'landing.benefits.title': 'Why Choose EduScheduler?',
    'landing.benefits.automated': 'Automated Scheduling',
    'landing.benefits.automated.desc': 'Generate optimal timetables automatically with conflict detection',
    'landing.benefits.management': 'Complete Management',
    'landing.benefits.management.desc': 'Manage faculty, students, classrooms, and resources in one place',
    'landing.benefits.analytics': 'Smart Analytics',
    'landing.benefits.analytics.desc': 'Get insights and reports to optimize resource utilization',
    'landing.help': 'Need Help?',
    
    // Authentication
    'auth.email': 'Email ID',
    'auth.password': 'Password',
    'auth.secretCode': 'Admin Secret Code',
    'auth.login': 'Login',
    'auth.admin.title': 'Admin Login',
    'auth.faculty.title': 'Faculty Login',
    'auth.back': 'Back to Home',
    'auth.enterSecretCode': 'Enter Admin Secret Code to join specific admin group',
    'auth.forgotPassword': 'Forgot Password?',
    
    // Admin Dashboard
    'admin.dashboard': 'Admin Dashboard',
    'admin.overview': 'Overview',
    'admin.classrooms': 'Classrooms',
    'admin.faculty': 'Faculty',
    'admin.students': 'Students',
    'admin.schedules': 'Schedules',
    'admin.settings': 'Settings',
    'admin.admins': 'Admin Management',
    'admin.logout': 'Logout',
    'admin.addFaculty': 'Add Faculty',
    'admin.addAdmin': 'Add Admin',

    // User Management
    'admin.userManagement.title': 'Admin & Faculty Management',
    'admin.userManagement.addFaculty': 'Add Faculty',
    'admin.userManagement.addAdmin': 'Add Admin',
    'admin.userManagement.searchPlaceholder': 'Search admins and faculty...',
    'admin.userManagement.admins': 'Administrators',
    'admin.userManagement.faculty': 'Faculty Members',
    'admin.userManagement.secretCode': 'Secret Code',
    'admin.userManagement.status': 'Status',
    'admin.userManagement.department': 'Department',
    'admin.userManagement.active': 'Active',
    'admin.userManagement.inactive': 'Inactive',
    'admin.userManagement.needsPasswordChange': 'Needs password change',
    'admin.userManagement.addAdminTitle': 'Add New Administrator',
    'admin.userManagement.addFacultyTitle': 'Add New Faculty Member',
    'admin.userManagement.fullName': 'Full Name',
    'admin.userManagement.gmailAddress': 'Gmail Address',
    'admin.userManagement.gmailOnly': 'Only Gmail addresses are allowed',
    'admin.userManagement.initialPassword': 'Initial Password',
    'admin.userManagement.temporaryPassword': 'Temporary Password',
    'admin.userManagement.generate': 'Generate',
    'admin.userManagement.creating': 'Creating...', 
    'admin.userManagement.createAdmin': 'Create Admin',
    'admin.userManagement.createFaculty': 'Create Faculty',
    
    // Faculty Dashboard
    'faculty.dashboard': 'Faculty Dashboard',
    'faculty.schedule': 'My Schedule',
    'faculty.feedback': 'Submit Feedback',
    'faculty.share': 'Share Schedule',
    
    // Common
    'common.theme.toggle': 'Toggle Theme',
    'common.language.toggle': 'Toggle Language',
    'common.download.pdf': 'Download PDF',
    'common.download.excel': 'Download Excel',
    'common.share.whatsapp': 'Share on WhatsApp',
    'common.share.gmail': 'Share on Gmail',
    'common.loading': 'Loading...', 
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.add': 'Add',
    'common.create': 'Create',
    'common.update': 'Update',
    'common.search': 'Search',
    'common.name': 'Name',
    'common.email': 'Email',
    'common.phone': 'Phone',
    'common.department': 'Department',
    'common.success': 'Success',
    'common.error': 'Error',
  },
  hi: {
    // Landing Page
    'landing.title': 'एडुस्केड्यूलर',
    'landing.subtitle': 'स्मार्ट क्लासरूम और शेड्यूल जेनरेटर',
    'landing.description': 'शैक्षिक संस्थानों के लिए AI-संचालित शेड्यूलिंग समाधान। संघर्ष-मुक्त टाइमटेबल बनाएं, परीक्षा शेड्यूल का प्रबंधन करें।',
    'landing.admin': 'एडमिन पोर्टल',
    'landing.faculty': 'फैकल्टी पोर्टल',
    'landing.features.title': 'मुख्य विशेषताएं',
    'landing.features.ai': 'AI-संचालित शेड्यूलिंग',
    'landing.features.ai.desc': 'संघर्ष-मुक्त शेड्यूलिंग के लिए उन्नत एल्गोरिदम',
    'landing.features.responsive': 'रेस्पॉन्सिव डिज़ाइन',
    'landing.features.responsive.desc': 'सभी उपकरणों पर बेहतर काम करता है',
    'landing.features.multilingual': 'बहुभाषी सहायता',
    'landing.features.multilingual.desc': '25+ भाषाओं का समर्थन',
    'landing.about.title': 'एडुस्केड्यूलर के बारे में',
    'landing.about.desc': 'एडुस्केड्यूलर आधुनिक संस्थानों के लिए एक व्यापक शैक्षिक प्रबंधन प्रणाली है।',
    'landing.benefits.title': 'एडुस्केड्यूलर क्यों चुनें?',
    'landing.benefits.automated': 'स्वचालित शेड्यूलिंग',
    'landing.benefits.automated.desc': 'संघर्ष का पता लगाने के साथ इष्टतम टाइमटेबल बनाएं',
    'landing.benefits.management': 'पूर्ण प्रबंधन',
    'landing.benefits.management.desc': 'एक स्थान पर फैकल्टी, छात्र, कक्षाओं का प्रबंधन करें',
    'landing.benefits.analytics': 'स्मार्ट एनालिटिक्स',
    'landing.benefits.analytics.desc': 'संसाधन उपयोग को अनुकूलित करने के लिए अंतर्दृष्टि प्राप्त करें',
    'landing.help': 'सहायता चाहिए?',
    
    // Authentication
    'auth.email': 'ईमेल आईडी',
    'auth.password': 'पासवर्ड',
    'auth.secretCode': 'एडमिन गुप्त कोड',
    'auth.login': 'लॉगिन',
    'auth.admin.title': 'एडमिन लॉगिन',
    'auth.faculty.title': 'फैकल्टी लॉगिन',
    'auth.back': 'होम पर वापस',
    'auth.enterSecretCode': 'विशिष्ट एडमिन समूह में शामिल होने के लिए एडमिन गुप्त कोड दर्ज करें',
    'auth.forgotPassword': 'पासवर्ड भूल गए?',
    
    // Admin Dashboard
    'admin.dashboard': 'एडमिन डैशबोर्ड',
    'admin.overview': 'अवलोकन',
    'admin.classrooms': 'क्लासरूम',
    'admin.faculty': 'फैकल्टी',
    'admin.students': 'छात्र',
    'admin.schedules': 'शेड्यूल',
    'admin.settings': 'सेटिंग्स',
    'admin.admins': 'एडमिन प्रबंधन',
    'admin.logout': 'लॉगआउट',
    'admin.addFaculty': 'फैकल्टी जोड़ें',
    'admin.addAdmin': 'एडमिन जोड़ें',

    // User Management
    'admin.userManagement.title': 'एडमिन और फैकल्टी प्रबंधन',
    'admin.userManagement.addFaculty': 'फैकल्टी जोड़ें',
    'admin.userManagement.addAdmin': 'एडमिन जोड़ें',
    'admin.userManagement.searchPlaceholder': 'एडमिन और फैकल्टी खोजें...', 
    'admin.userManagement.admins': 'एडमिनिस्ट्रेटर्स',
    'admin.userManagement.faculty': 'फैकल्टी सदस्य',
    'admin.userManagement.secretCode': 'गुप्त कोड',
    'admin.userManagement.status': 'स्थिति',
    'admin.userManagement.department': 'विभाग',
    'admin.userManagement.active': 'सक्रिय',
    'admin.userManagement.inactive': 'निष्क्रिय',
    'admin.userManagement.needsPasswordChange': 'पासवर्ड बदलने की आवश्यकता है',
    'admin.userManagement.addAdminTitle': 'नया एडमिनिस्ट्रेटर जोड़ें',
    'admin.userManagement.addFacultyTitle': 'नया फैकल्टी सदस्य जोड़ें',
    'admin.userManagement.fullName': 'पूरा नाम',
    'admin.userManagement.gmailAddress': 'जीमेल पता',
    'admin.userManagement.gmailOnly': 'केवल जीमेल पते स्वीकार किए जाते हैं',
    'admin.userManagement.initialPassword': 'प्रारंभिक पासवर्ड',
    'admin.userManagement.temporaryPassword': 'अस्थायी पासवर्ड',
    'admin.userManagement.generate': 'जनरेट करें',
    'admin.userManagement.creating': 'बनाया जा रहा है...', 
    'admin.userManagement.createAdmin': 'एडमिन बनाएं',
    'admin.userManagement.createFaculty': 'फैकल्टी बनाएं',
    
    // Faculty Dashboard
    'faculty.dashboard': 'फैकल्टी डैशबोर्ड',
    'faculty.schedule': 'मेरा शेड्यूल',
    'faculty.feedback': 'फीडबैक दें',
    'faculty.share': 'शेड्यूल साझा करें',
    
    // Common
    'common.theme.toggle': 'थीम बदलें',
    'common.language.toggle': 'भाषा बदलें',
    'common.download.pdf': 'PDF डाउनलोड करें',
    'common.download.excel': 'Excel डाउनलोड करें',
    'common.share.whatsapp': 'व्हाट्सएप पर साझा करें',
    'common.share.gmail': 'Gmail पर साझा करें',
    'common.loading': 'लोड हो रहा है...', 
    'common.save': 'सेव करें',
    'common.cancel': 'रद्द करें',
    'common.edit': 'संपादित करें',
    'common.delete': 'हटाएं',
    'common.add': 'जोड़ें',
    'common.create': 'बनाएं',
    'common.update': 'अपडेट करें',
    'common.search': 'खोजें',
    'common.name': 'नाम',
    'common.email': 'ईमेल',
    'common.phone': 'फोन',
    'common.department': 'विभाग',
    'common.success': 'सफलता',
    'common.error': 'त्रुटि',
  },
  es: {
    'landing.title': 'EduScheduler',
    'landing.subtitle': 'Generador Inteligente de Aulas y Horarios',
    'landing.description': 'Solución de programación impulsada por IA para instituciones educativas.',
    'landing.admin': 'Portal de Administrador',
    'landing.faculty': 'Portal de Profesores',
    'landing.features.ai': 'Programación con IA',
    'landing.features.ai.desc': 'Algoritmos avanzados para programación sin conflictos',
    'landing.features.responsive': 'Diseño Responsivo',
    'landing.features.responsive.desc': 'Funciona perfectamente en todos los dispositivos',
    'landing.features.multilingual': 'Soporte Multiidioma',
    'landing.features.multilingual.desc': 'Soporte para más de 25 idiomas',
    'landing.about.title': 'Acerca de EduScheduler',
    'landing.about.desc': 'EduScheduler es un sistema integral de gestión educativa.',
    'landing.benefits.title': '¿Por qué elegir EduScheduler?',
    'landing.benefits.automated': 'Programación Automatizada',
    'landing.benefits.automated.desc': 'Genere horarios óptimos automáticamente',
    'landing.benefits.management': 'Gestión Completa',
    'landing.benefits.management.desc': 'Gestione profesores, estudiantes y aulas',
    'landing.benefits.analytics': 'Análisis Inteligente',
    'landing.benefits.analytics.desc': 'Obtenga información para optimizar recursos',
    'landing.help': '¿Necesita ayuda?',
    'auth.email': 'Correo Electrónico',
    'auth.password': 'Contraseña',
    'auth.secretCode': 'Código Secreto del Administrador',
    'auth.login': 'Iniciar Sesión',
    'auth.forgotPassword': '¿Olvidó su contraseña?',
    'admin.dashboard': 'Panel de Administrador',
    'faculty.dashboard': 'Panel de Profesores',
    'common.loading': 'Cargando...', 
  },
  fr: {
    'landing.title': 'EduScheduler',
    'landing.subtitle': 'Générateur Intelligent de Salles de Classe et d\'Horaires',
    'landing.admin': 'Portail Administrateur',
    'landing.faculty': 'Portail Professeurs',
    'landing.features.ai': 'Planificación IA',
    'landing.features.ai.desc': 'Algorithmes avancés pour une planification sans conflit',
    'landing.features.responsive': 'Design Réactif',
    'landing.features.responsive.desc': 'Fonctionne parfaitement sur tous les appareils',
    'landing.features.multilingual': 'Support Multilingue',
    'landing.features.multilingual.desc': 'Support pour plus de 25 langues',
    'landing.about.title': 'À propos d\'EduScheduler',
    'landing.about.desc': 'EduScheduler est un système complet de gestion éducative.',
    'landing.benefits.title': 'Pourquoi choisir EduScheduler?',
    'landing.benefits.automated': 'Planification Automatisée',
    'landing.benefits.automated.desc': 'Générez automatiquement des horaires optimaux',
    'landing.benefits.management': 'Gestion Complète',
    'landing.benefits.management.desc': 'Gérez les professeurs, étudiants et salles',
    'landing.benefits.analytics': 'Analyses Intelligentes',
    'landing.benefits.analytics.desc': 'Obtenez des informations pour optimiser les ressources',
    'landing.help': 'Besoin d\'aide?',
    'auth.email': 'Adresse E-mail',
    'auth.password': 'Mot de Passe',
    'auth.secretCode': 'Code Secret Administrateur',
    'auth.login': 'Se Connecter',
    'auth.forgotPassword': 'Mot de passe oublié ?',
    'admin.dashboard': 'Tableau de Bord Administrateur',
    'faculty.dashboard': 'Tableau de Bord Professeurs',
    'common.loading': 'Chargement...', 
  },
  de: {
    'landing.title': 'EduScheduler',
    'landing.subtitle': 'Intelligenter Klassenzimmer- und Stundenplan-Generator',
    'landing.admin': 'Administrator-Portal',
    'landing.faculty': 'Dozenten-Portal',
    'landing.features.ai': 'KI-Planung',
    'landing.features.ai.desc': 'Erweiterte Algorithmen für konfliktfreie Planung',
    'landing.features.responsive': 'Responsives Design',
    'landing.features.responsive.desc': 'Funktioniert perfekt auf allen Geräten',
    'landing.features.multilingual': 'Mehrsprachige Unterstützung',
    'landing.features.multilingual.desc': 'Unterstützung für über 25 Sprachen',
    'landing.about.title': 'Über EduScheduler',
    'landing.about.desc': 'EduScheduler ist ein umfassendes Bildungsmanagementsystem.',
    'landing.benefits.title': 'Warum EduScheduler wählen?',
    'landing.benefits.automated': 'Automatisierte Planung',
    'landing.benefits.automated.desc': 'Generieren Sie automatisch optimale Stundenpläne',
    'landing.benefits.management': 'Vollständige Verwaltung',
    'landing.benefits.management.desc': 'Verwalten Sie Dozenten, Studenten und Räume',
    'landing.benefits.analytics': 'Intelligente Analysen',
    'landing.benefits.analytics.desc': 'Erhalten Sie Einblicke zur Ressourcenoptimierung',
    'landing.help': 'Hilfe benötigt?',
    'auth.email': 'E-Mail-Adresse',
    'auth.password': 'Passwort',
    'auth.secretCode': 'Administrator-Geheimcode',
    'auth.login': 'Anmelden',
    'auth.forgotPassword': 'Passwort vergessen?',
    'admin.dashboard': 'Administrator-Dashboard',
    'faculty.dashboard': 'Dozenten-Dashboard',
    'common.loading': 'Laden...', 
  },
  // Add more languages with basic translations
  it: {
    'landing.title': 'EduScheduler',
    'landing.subtitle': 'Generatore Intelligente di Aule e Orari',
    'landing.admin': 'Portale Amministratore',
    'landing.faculty': 'Portale Docenti',
    'landing.help': 'Serve aiuto?',
    'auth.login': 'Accedi',
    'auth.forgotPassword': 'Password dimenticata?',
    'common.loading': 'Caricamento...' 
  },
  pt: {
    'landing.title': 'EduScheduler',
    'landing.subtitle': 'Gerador Inteligente de Salas e Horários',
    'landing.admin': 'Portal do Administrador',
    'landing.faculty': 'Portal do Professor',
    'landing.help': 'Precisa de ajuda?',
    'auth.login': 'Entrar',
    'auth.forgotPassword': 'Esqueceu a senha?',
    'common.loading': 'Carregando...' 
  },
  ru: {
    'landing.title': 'EduScheduler',
    'landing.subtitle': 'Умный генератор классов и расписаний',
    'landing.admin': 'Портал администратора',
    'landing.faculty': 'Портал преподавателя',
    'landing.help': 'Нужна помощь?',
    'auth.login': 'Войти',
    'auth.forgotPassword': 'Забыли пароль?',
    'common.loading': 'Загрузка...' 
  },
  ja: {
    'landing.title': 'EduScheduler',
    'landing.subtitle': 'スマート教室・スケジュールジェネレーター',
    'landing.admin': '管理者ポータル',
    'landing.faculty': '教員ポータル',
    'landing.help': 'ヘルプが必要ですか？',
    'auth.login': 'ログイン',
    'auth.forgotPassword': 'パスワードをお忘れですか？',
    'common.loading': '読み込み中...' 
  },
  ko: {
    'landing.title': 'EduScheduler',
    'landing.subtitle': '스마트 교실 및 일정 생성기',
    'landing.admin': '관리자 포털',
    'landing.faculty': '교수 포털',
    'landing.help': '도움이 필요하신가요?',
    'auth.login': '로그인',
    'auth.forgotPassword': '비밀번호를 잊으셨나요?',
    'common.loading': '로딩 중...' 
  },
  zh: {
    'landing.title': 'EduScheduler',
    'landing.subtitle': '智能教室和时间表生成器',
    'landing.admin': '管理员门户',
    'landing.faculty': '教师门户',
    'landing.help': '需要帮助吗？',
    'auth.login': '登录',
    'auth.forgotPassword': '忘记密码？',
    'common.loading': '加载中...' 
  },
  ar: {
    'landing.title': 'EduScheduler',
    'landing.subtitle': 'مولد الفصول الدراسية والجداول الذكي',
    'landing.admin': 'بوابة المدير',
    'landing.faculty': 'بوابة أعضاء هيئة التدريس',
    'landing.help': 'تحتاج مساعدة؟',
    'auth.login': 'تسجيل الدخول',
    'auth.forgotPassword': 'نسيت كلمة المرور؟',
    'common.loading': 'جاري التحميل...' 
  },
  tr: {
    'landing.title': 'EduScheduler',
    'landing.subtitle': 'Akıllı Sınıf ve Zaman Çizelgesi Oluşturucu',
    'landing.admin': 'Yönetici Portalı',
    'landing.faculty': 'Öğretim Üyesi Portalı',
    'landing.help': 'Yardıma mı ihtiyacınız var?',
    'auth.login': 'Giriş Yap',
    'auth.forgotPassword': 'Şifremi Unuttum',
    'common.loading': 'Yükleniyor...' 
  },
  nl: {
    'landing.title': 'EduScheduler',
    'landing.subtitle': 'Slimme Klaslokaal en Rooster Generator',
    'landing.admin': 'Beheerder Portaal',
    'landing.faculty': 'Docenten Portaal',
    'landing.help': 'Hulp nodig?',
    'auth.login': 'Inloggen', 
    'common.loading': 'Laden...' 
  },
  sv: {
    'landing.title': 'EduScheduler',
    'landing.subtitle': 'Smart Klassrum och Schema Generator',
    'landing.admin': 'Administratör Portal',
    'landing.faculty': 'Fakultets Portal',
    'landing.help': 'Behöver du hjälp?',
    'auth.login': 'Logga in', 
    'common.loading': 'Laddar...' 
  },
  da: {
    'landing.title': 'EduScheduler',
    'landing.subtitle': 'Smart Klasseværelse og Skema Generator',
    'landing.admin': 'Administrator Portal',
    'landing.faculty': 'Fakultets Portal',
    'landing.help': 'Brug for hjælp?',
    'auth.login': 'Log ind', 
    'common.loading': 'Indlæser...' 
  },
  no: {
    'landing.title': 'EduScheduler',
    'landing.subtitle': 'Smart Klasserom og Timeplan Generator',
    'landing.admin': 'Administrator Portal',
    'landing.faculty': 'Fakultets Portal',
    'landing.help': 'Trenger du hjelp?',
    'auth.login': 'Logg inn', 
    'common.loading': 'Laster...' 
  },
  fi: {
    'landing.title': 'EduScheduler',
    'landing.subtitle': 'Älykäs Luokkahuone ja Aikataulu Generaattori',
    'landing.admin': 'Ylläpitäjä Portaali',
    'landing.faculty': 'Tiedekunta Portaali',
    'landing.help': 'Tarvitsetko apua?',
    'auth.login': 'Kirjaudu', 
    'common.loading': 'Ladataan...' 
  },
  pl: {
    'landing.title': 'EduScheduler',
    'landing.subtitle': 'Inteligentny Generator Sal i Planów',
    'landing.admin': 'Portal Administratora',
    'landing.faculty': 'Portal Wydziału',
    'landing.help': 'Potrzebujesz pomocy?',
    'auth.login': 'Zaloguj', 
    'common.loading': 'Ładowanie...' 
  },
  cs: {
    'landing.title': 'EduScheduler',
    'landing.subtitle': 'Inteligentní Generátor Tříd a Rozvrhů',
    'landing.admin': 'Administrátorský Portál',
    'landing.faculty': 'Fakultní Portál',
    'landing.help': 'Potřebujete pomoc?',
    'auth.login': 'Přihlásit', 
    'common.loading': 'Načítání...' 
  },
  hu: {
    'landing.title': 'EduScheduler',
    'landing.subtitle': 'Intelligens Osztályterem és Órarend Generátor',
    'landing.admin': 'Adminisztrátor Portál',
    'landing.faculty': 'Kar Portál',
    'landing.help': 'Segítségre van szüksége?',
    'auth.login': 'Bejelentkezés', 
    'common.loading': 'Betöltés...' 
  },
  ro: {
    'landing.title': 'EduScheduler',
    'landing.subtitle': 'Generator Inteligent de Săli și Orar',
    'landing.admin': 'Portal Administrator',
    'landing.faculty': 'Portal Facultate',
    'landing.help': 'Aveți nevoie de ajutor?',
    'auth.login': 'Conectare', 
    'common.loading': 'Se încarcă...' 
  },
  bg: {
    'landing.title': 'EduScheduler',
    'landing.subtitle': 'Интелигентен Генератор на Класни Стаи и Разписания',
    'landing.admin': 'Администраторски Портал',
    'landing.faculty': 'Факултетски Портал',
    'landing.help': 'Нуждаете се от помощ?',
    'auth.login': 'Вход', 
    'common.loading': 'Зареждане...' 
  },
  hr: {
    'landing.title': 'EduScheduler',
    'landing.subtitle': 'Pametni Generator Učionica i Rasporeda',
    'landing.admin': 'Administratorski Portal',
    'landing.faculty': 'Fakultetski Portal',
    'landing.help': 'Trebate pomoć?',
    'auth.login': 'Prijava', 
    'common.loading': 'Učitavanje...' 
  },
  sk: {
    'landing.title': 'EduScheduler',
    'landing.subtitle': 'Inteligentný Generátor Tried a Rozvrhu',
    'landing.admin': 'Administrátorský Portál',
    'landing.faculty': 'Fakultný Portál',
    'landing.help': 'Potrebujete pomoc?',
    'auth.login': 'Prihlásiť', 
    'common.loading': 'Načítava...' 
  },
};

export const languageNames = {
  en: 'English',
  hi: 'हिंदी',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  ru: 'Русский',
  ja: '日本語',
  ko: '한국어',
  zh: '中文',
  ar: 'العربية',
  tr: 'Türkçe',
  nl: 'Nederlands',
  sv: 'Svenska',
  da: 'Dansk',
  no: 'Norsk',
  fi: 'Suomi',
  pl: 'Polski',
  cs: 'Čeština',
  hu: 'Magyar',
  ro: 'Română',
  bg: 'Български',
  hr: 'Hrvatski',
  sk: 'Slovenčina',
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const storedLang = localStorage.getItem('appLanguage');
      if (storedLang && translations[storedLang as Language]) {
        return storedLang as Language;
      }
    } catch (error) {
      console.error("Failed to read language from localStorage", error);
    }
    return 'en'; // Default to English
  });

  const setLanguage = (lang: Language) => {
    try {
      localStorage.setItem('appLanguage', lang);
      setLanguageState(lang);
    } catch (error) {
      console.error("Failed to save language to localStorage", error);
    }
  };

  const t = (key: string): string => {
    const translation = translations[language]?.[key as keyof typeof translations[typeof language]];
    return translation || translations.en[key as keyof typeof translations.en] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
