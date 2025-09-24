import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Calendar, 
  BookOpen, 
  FileText, 
  Bell, 
  MessageSquare, 
  User, 
  QrCode, 
  Upload, 
  Download, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  Settings,
  LogOut
} from 'lucide-react';
import axios from 'axios';

interface StudentProfile {
  name: string;
  email: string;
  rollNumber: string;
  department: string;
  semester: string;
  profilePictureUrl?: string;
  attendanceStats: {
    totalClasses: number;
    presentClasses: number;
    attendancePercentage: number;
  };
  assignmentStats: {
    totalSubmissions: number;
  };
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  subject: string;
  faculty: string;
  hasSubmitted: boolean;
  submissionData?: any;
  maxMarks: number;
  allowedFileTypes: string[];
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  author: { name: string; role: string };
  createdAt: Date;
  hasRead: boolean;
  pinned: boolean;
}

interface FeedbackForm {
  id: string;
  title: string;
  description: string;
  googleFormUrl?: string;
  hasResponded: boolean;
  type: 'google_form' | 'custom_form';
  questions?: any[];
}

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [feedbackForms, setFeedbackForms] = useState<FeedbackForm[]>([]);
  const [qrScanner, setQrScanner] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = await user.getIdToken();
      
      const [profileRes, assignmentsRes, announcementsRes, feedbackRes] = await Promise.all([
        axios.get('/api/student/profile', { headers: { Authorization: `Bearer ${token}` }}),
        axios.get(`/api/assignments/class/${profile?.classId || 'default'}`, { headers: { Authorization: `Bearer ${token}` }}),
        axios.get('/api/announcements/student', { headers: { Authorization: `Bearer ${token}` }}),
        axios.get('/api/feedback/forms/student', { headers: { Authorization: `Bearer ${token}` }})
      ]);

      setProfile(profileRes.data);
      setAssignments(assignmentsRes.data.map((a: any) => ({ ...a, dueDate: new Date(a.dueDate) })));
      setAnnouncements(announcementsRes.data.announcements.map((a: any) => ({ 
        ...a, 
        createdAt: new Date(a.createdAt) 
      })));
      setFeedbackForms(feedbackRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAnnouncementAsRead = async (announcementId: string) => {
    try {
      const token = await user.getIdToken();
      await axios.post(`/api/announcements/${announcementId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAnnouncements(prev => prev.map(ann => 
        ann.id === announcementId ? { ...ann, hasRead: true } : ann
      ));
    } catch (error) {
      console.error('Error marking announcement as read:', error);
    }
  };

  const submitAssignment = async (assignmentId: string, file: File, comments: string) => {
    try {
      const token = await user.getIdToken();
      const formData = new FormData();
      formData.append('submissionFile', file);
      formData.append('comments', comments);

      await axios.post(`/api/assignments/${assignmentId}/submit`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Refresh assignments
      fetchDashboardData();
    } catch (error) {
      console.error('Error submitting assignment:', error);
    }
  };

  const handleQRScan = async (qrData: string) => {
    try {
      const token = await user.getIdToken();
      await axios.post(`/api/attendance/mark/${qrData}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Attendance marked successfully!');
      setQrScanner(false);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to mark attendance');
    }
  };

  const DashboardOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Attendance</p>
            <p className="text-2xl font-bold text-green-600">
              {profile?.attendanceStats.attendancePercentage || 0}%
            </p>
          </div>
          <div className="p-3 bg-green-100 rounded-full">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {profile?.attendanceStats.presentClasses || 0} / {profile?.attendanceStats.totalClasses || 0} classes
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Assignments</p>
            <p className="text-2xl font-bold text-blue-600">
              {assignments.filter(a => a.hasSubmitted).length}
            </p>
          </div>
          <div className="p-3 bg-blue-100 rounded-full">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {assignments.length - assignments.filter(a => a.hasSubmitted).length} pending
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Announcements</p>
            <p className="text-2xl font-bold text-purple-600">
              {announcements.filter(a => !a.hasRead).length}
            </p>
          </div>
          <div className="p-3 bg-purple-100 rounded-full">
            <Bell className="w-6 h-6 text-purple-600" />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">unread notifications</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Feedback Forms</p>
            <p className="text-2xl font-bold text-orange-600">
              {feedbackForms.filter(f => !f.hasResponded).length}
            </p>
          </div>
          <div className="p-3 bg-orange-100 rounded-full">
            <MessageSquare className="w-6 h-6 text-orange-600" />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">pending responses</p>
      </div>
    </div>
  );

  const AssignmentsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Assignments</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {assignments.filter(a => a.hasSubmitted).length} / {assignments.length} completed
          </span>
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No assignments yet</h4>
          <p className="text-gray-600">Check back later for new assignments from your faculty</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {assignments.map((assignment) => (
            <AssignmentCard key={assignment.id} assignment={assignment} onSubmit={submitAssignment} />
          ))}
        </div>
      )}
    </div>
  );

  const AssignmentCard = ({ assignment, onSubmit }: { assignment: Assignment; onSubmit: any }) => {
    const [showSubmission, setShowSubmission] = useState(false);
    const [submissionFile, setSubmissionFile] = useState<File | null>(null);
    const [comments, setComments] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
          alert('File size must be less than 50MB');
          return;
        }
        setSubmissionFile(file);
      }
    };

    const handleSubmit = async () => {
      if (!submissionFile) {
        alert('Please select a file to submit');
        return;
      }

      setSubmitting(true);
      try {
        await onSubmit(assignment.id, submissionFile, comments);
        setShowSubmission(false);
        setSubmissionFile(null);
        setComments('');
        alert('Assignment submitted successfully!');
      } catch (error) {
        alert('Failed to submit assignment');
      } finally {
        setSubmitting(false);
      }
    };

    const isOverdue = new Date() > assignment.dueDate;

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">{assignment.title}</h4>
            <p className="text-gray-600 mb-3">{assignment.description}</p>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span className="flex items-center"><BookOpen className="w-4 h-4 mr-1" />{assignment.subject}</span>
              <span className="flex items-center"><User className="w-4 h-4 mr-1" />{assignment.faculty}</span>
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                Due: {assignment.dueDate.toLocaleDateString()}
              </span>
              <span>Max Marks: {assignment.maxMarks}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {assignment.hasSubmitted ? (
              <div className="flex items-center text-green-600">
                <CheckCircle className="w-5 h-5 mr-1" />
                <span className="text-sm font-medium">Submitted</span>
              </div>
            ) : isOverdue ? (
              <div className="flex items-center text-red-600">
                <AlertCircle className="w-5 h-5 mr-1" />
                <span className="text-sm font-medium">Overdue</span>
              </div>
            ) : (
              <button
                onClick={() => setShowSubmission(!showSubmission)}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                Submit Assignment
              </button>
            )}
          </div>
        </div>

        {assignment.hasSubmitted && assignment.submissionData && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h5 className="font-medium text-green-900 mb-2">Your Submission</h5>
            <p className="text-sm text-green-700">
              Submitted on: {new Date(assignment.submissionData.submittedAt).toLocaleString()}
            </p>
            {assignment.submissionData.grade !== null && (
              <p className="text-sm text-green-700">
                Grade: {assignment.submissionData.grade} / {assignment.maxMarks}
              </p>
            )}
            {assignment.submissionData.feedback && (
              <p className="text-sm text-green-700 mt-2">
                Feedback: {assignment.submissionData.feedback}
              </p>
            )}
          </div>
        )}

        {showSubmission && !assignment.hasSubmitted && !isOverdue && (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h5 className="font-medium text-gray-900 mb-3">Submit Assignment</h5>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload File ({assignment.allowedFileTypes.join(', ')})
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept={assignment.allowedFileTypes.map(type => `.${type}`).join(',')}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Comments (Optional)</label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add any comments about your submission..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowSubmission(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!submissionFile || submitting}
                  className={`px-4 py-2 text-white text-sm rounded-lg transition-colors ${
                    submissionFile && !submitting
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  {submitting ? 'Submitting...' : 'Submit Assignment'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const AnnouncementsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Announcements</h3>
        <span className="text-sm text-gray-500">
          {announcements.filter(a => !a.hasRead).length} unread
        </span>
      </div>

      {announcements.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No announcements yet</h4>
          <p className="text-gray-600">Check back later for updates from faculty and admin</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <AnnouncementCard 
              key={announcement.id} 
              announcement={announcement} 
              onMarkRead={markAnnouncementAsRead}
            />
          ))}
        </div>
      )}
    </div>
  );

  const AnnouncementCard = ({ announcement, onMarkRead }: { announcement: Announcement; onMarkRead: any }) => {
    const priorityColors = {
      low: 'bg-gray-100 text-gray-700',
      normal: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      urgent: 'bg-red-100 text-red-700'
    };

    return (
      <div className={`bg-white rounded-lg shadow-sm border p-4 ${!announcement.hasRead ? 'border-l-4 border-l-blue-500' : 'border-gray-200'}`}>
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-2">
            {announcement.pinned && (
              <div className="p-1 bg-yellow-100 rounded">
                <svg className="w-3 h-3 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                  <path fillRule="evenodd" d="M3 8a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[announcement.priority]}`}>
              {announcement.priority.toUpperCase()}
            </span>
          </div>
          {!announcement.hasRead && (
            <button
              onClick={() => onMarkRead(announcement.id)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Mark as read
            </button>
          )}
        </div>
        
        <h4 className="text-lg font-semibold text-gray-900 mb-2">{announcement.title}</h4>
        <p className="text-gray-600 mb-3">{announcement.content}</p>
        
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>By {announcement.author.name} ({announcement.author.role})</span>
          <span>{announcement.createdAt.toLocaleDateString()}</span>
        </div>
      </div>
    );
  };

  const AttendanceTab = () => {
    const [showQRScanner, setShowQRScanner] = useState(false);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Attendance</h3>
          <button
            onClick={() => setShowQRScanner(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <QrCode className="w-4 h-4" />
            <span>Scan QR Code</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Attendance Overview</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {profile?.attendanceStats.attendancePercentage || 0}%
              </div>
              <div className="text-sm text-gray-600">Overall Attendance</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {profile?.attendanceStats.presentClasses || 0}
              </div>
              <div className="text-sm text-gray-600">Classes Attended</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-gray-600 mb-2">
                {profile?.attendanceStats.totalClasses || 0}
              </div>
              <div className="text-sm text-gray-600">Total Classes</div>
            </div>
          </div>
        </div>

        {showQRScanner && (
          <QRScannerModal onClose={() => setShowQRScanner(false)} onScan={handleQRScan} />
        )}
      </div>
    );
  };

  const QRScannerModal = ({ onClose, onScan }: { onClose: () => void; onScan: (data: string) => void }) => {
    const [manualCode, setManualCode] = useState('');

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Scan QR Code for Attendance</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ×
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">QR Scanner would appear here</p>
              <p className="text-xs text-gray-500 mt-2">
                In a real implementation, integrate with react-qr-scanner or similar
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or enter QR code manually:
              </label>
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter QR code"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => manualCode && onScan(manualCode)}
                disabled={!manualCode}
                className={`px-4 py-2 text-white rounded-lg ${
                  manualCode 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Mark Attendance
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'assignments', name: 'Assignments', icon: FileText },
    { id: 'announcements', name: 'Announcements', icon: Bell },
    { id: 'attendance', name: 'Attendance', icon: CheckCircle },
    { id: 'feedback', name: 'Feedback', icon: MessageSquare },
    { id: 'profile', name: 'Profile', icon: User }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Student Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome back, {profile?.name || 'Student'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{profile?.rollNumber}</p>
                <p className="text-xs text-gray-600">{profile?.department}</p>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-indigo-100 text-indigo-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.name}</span>
                {tab.id === 'announcements' && announcements.filter(a => !a.hasRead).length > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-0">
                    {announcements.filter(a => !a.hasRead).length}
                  </span>
                )}
                {tab.id === 'assignments' && assignments.filter(a => !a.hasSubmitted && new Date() <= a.dueDate).length > 0 && (
                  <span className="ml-auto bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-0">
                    {assignments.filter(a => !a.hasSubmitted && new Date() <= a.dueDate).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'dashboard' && (
              <div>
                <DashboardOverview />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Assignments</h3>
                    {assignments.slice(0, 3).map((assignment) => (
                      <div key={assignment.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                        <div>
                          <h4 className="font-medium text-gray-900">{assignment.title}</h4>
                          <p className="text-sm text-gray-600">{assignment.subject}</p>
                        </div>
                        <div className="text-right">
                          {assignment.hasSubmitted ? (
                            <span className="text-green-600 text-sm">✓ Submitted</span>
                          ) : (
                            <span className="text-orange-600 text-sm">Due {assignment.dueDate.toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Announcements</h3>
                    {announcements.slice(0, 3).map((announcement) => (
                      <div key={announcement.id} className="py-3 border-b border-gray-100 last:border-0">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900">{announcement.title}</h4>
                          {!announcement.hasRead && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{announcement.content}</p>
                        <p className="text-xs text-gray-500 mt-1">{announcement.createdAt.toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'assignments' && <AssignmentsTab />}
            {activeTab === 'announcements' && <AnnouncementsTab />}
            {activeTab === 'attendance' && <AttendanceTab />}
            
            {activeTab === 'feedback' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Feedback Forms</h3>
                {feedbackForms.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No feedback forms</h4>
                    <p className="text-gray-600">Check back later for feedback forms from admin</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {feedbackForms.map((form) => (
                      <div key={form.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">{form.title}</h4>
                            <p className="text-gray-600">{form.description}</p>
                          </div>
                          {!form.hasResponded && (
                            <button 
                              onClick={() => form.googleFormUrl ? window.open(form.googleFormUrl, '_blank') : null}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Fill Form
                            </button>
                          )}
                        </div>
                        {form.hasResponded && (
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <span className="text-green-700 font-medium">✓ Response submitted</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Student Profile</h3>
                {profile && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-6">
                      <div className="w-20 h-20 bg-gray-100 rounded-full overflow-hidden">
                        {profile.profilePictureUrl ? (
                          <img src={profile.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold text-gray-900">{profile.name}</h4>
                        <p className="text-gray-600">{profile.rollNumber}</p>
                        <p className="text-sm text-gray-500">{profile.department} - Semester {profile.semester}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-medium text-gray-900 mb-3">Contact Information</h5>
                        <div className="space-y-2">
                          <p className="text-sm"><span className="font-medium">Email:</span> {profile.email}</p>
                        </div>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900 mb-3">Academic Performance</h5>
                        <div className="space-y-2">
                          <p className="text-sm"><span className="font-medium">Attendance:</span> {profile.attendanceStats.attendancePercentage}%</p>
                          <p className="text-sm"><span className="font-medium">Assignments Submitted:</span> {profile.assignmentStats.totalSubmissions}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;