# EduScheduler - AI-Powered Timetable Modification System

A comprehensive educational scheduling system with AI-powered natural language modification capabilities for the SIH Hackathon 2025 (Problem ID: 25028).

## 🚀 Features

### Core Functionality
- **Multi-Admin System**: Each admin manages their own faculty group with unique secret codes
- **Faculty Management**: Complete CRUD operations with department linking
- **Student Management**: Bulk import/export with roll number generation
- **Classroom Management**: Labs, classrooms, and libraries with equipment tracking
- **AI Schedule Modification**: Natural language timetable modifications using ChatGPT

### AI-Powered Features
- **Natural Language Processing**: Modify schedules using plain English commands
- **File Upload Support**: Bulk modifications via CSV, Excel, or JSON files
- **Conflict Detection**: Automatic detection of scheduling conflicts
- **Undo/Redo System**: Up to 10 levels of modification history
- **Chat Sessions**: Persistent conversation history with resume capability

### User Experience
- **25+ Languages**: Comprehensive multi-language support
- **Dark/Light Themes**: System preference detection with smooth transitions
- **Responsive Design**: Mobile-first approach with perfect mobile compatibility
- **Accessibility**: WCAG 2.1 compliant with keyboard navigation

## 🛠 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Firebase** for authentication and database
- **Lucide React** for icons
- **React Router** for navigation

### Backend
- **Node.js** with Express
- **OpenAI GPT-4** for natural language processing
- **Firebase Admin SDK** for database operations
- **Multer** for file upload handling
- **CSV/Excel parsing** for bulk data import

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- Firebase project with Firestore enabled
- OpenAI API key

### Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Backend Setup
```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# - OPENAI_API_KEY: Your OpenAI API key
# - FIREBASE_DATABASE_URL: Your Firebase database URL

# Copy Firebase service account
cp firebase-service-account.example.json firebase-service-account.json
# Edit with your Firebase service account credentials

# Start server
npm run dev
```

## 🔧 Configuration

### Environment Variables
```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Firebase Configuration  
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com

# Server Configuration
PORT=3001
NODE_ENV=development
```

### Firebase Collections
The system automatically creates these Firestore collections:
- `admins` - Admin user profiles
- `faculty` - Faculty member information
- `students` - Student records
- `departments` - Department information
- `subjects` - Subject details
- `classrooms` - Room and facility data
- `schedules` - Generated timetables
- `chat_sessions` - AI conversation history
- `ai_interactions` - AI request/response logs
- `modification_audit` - Change tracking

## 🤖 AI Features Usage

### Natural Language Commands
```
"Move John's math class from Monday 9 AM to Tuesday 10 AM"
"Cancel all Friday afternoon classes"
"Add a new physics lab session on Wednesday at 2 PM in Lab 201"
"Swap the timing of chemistry and biology classes on Thursday"
"Find all scheduling conflicts for next week"
```

### File Upload Support
- **CSV Format**: Comma-separated schedule data
- **Excel Files**: .xlsx and .xls formats
- **JSON**: Structured schedule objects

### API Endpoints
- `POST /api/ai-schedule-modify` - Process natural language requests
- `POST /api/apply-modifications` - Apply proposed changes
- `POST /api/undo-modification` - Undo last modification
- `GET /api/chat-sessions` - Retrieve conversation history

## 🔐 Security Features

### Authentication & Authorization
- Firebase Authentication integration
- Role-based access control (Admin/Faculty)
- Secure API key management
- CSRF protection

### Input Validation
- Comprehensive input sanitization
- File type validation for uploads
- Rate limiting (10 requests/minute)
- SQL injection prevention

### Data Protection
- Audit logging for all modifications
- Rollback capabilities
- Conflict detection and prevention
- Secure file upload handling

## 📱 User Interface

### Admin Panel Features
- **Dashboard**: Overview with statistics and quick actions
- **Department Management**: Create and manage academic departments
- **Subject Management**: Course catalog with credits and duration
- **Classroom Management**: Facility management with equipment tracking
- **Faculty Management**: Complete faculty profiles with subject assignments
- **Student Management**: Individual and bulk student operations
- **AI Schedule Modifier**: Natural language timetable modifications
- **Settings**: System configuration and preferences

### Faculty Portal Features
- **Schedule View**: Personal timetable with export options
- **Feedback System**: Google Forms integration
- **Share Options**: WhatsApp and Gmail sharing

## 🌍 Multi-Language Support

Supported languages include:
- English, Hindi, Spanish, French, German
- Italian, Portuguese, Russian, Japanese, Korean
- Chinese, Arabic, Turkish, Dutch, Swedish
- Danish, Norwegian, Finnish, Polish, Czech
- Hungarian, Romanian, Bulgarian, Croatian, Slovak

## 🚀 Deployment

### Frontend Deployment (Vercel)
```bash
# Build the project
npm run build

# Deploy to Vercel
vercel --prod
```

### Backend Deployment (Render)
```bash
# Push to GitHub repository
git push origin main

# Connect repository to Render
# Set environment variables in Render dashboard
# Deploy automatically on push
```

## 📊 Performance & Monitoring

### Metrics Tracked
- API response times
- AI processing duration
- User interaction patterns
- Error rates and types
- Database query performance

### Logging
- Comprehensive error logging
- AI interaction tracking
- Modification audit trails
- User activity monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 SIH Hackathon 2025

**Problem Statement ID**: 25028 - Smart Classroom and Schedule Generator

**Team**: EduScheduler Development Team

**Key Innovation**: AI-powered natural language timetable modification system that allows non-technical administrators to manage complex scheduling using plain English commands.

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Email: rajpratham40@gmail.com
- Documentation: [docs.eduscheduler.com](https://docs.eduscheduler.com)

---

Built with ❤️ for SIH Hackathon 2025
