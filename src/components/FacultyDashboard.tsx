import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Calendar, 
  QrCode, 
  FileText, 
  Bell, 
  BarChart3, 
  Users, 
  LogOut, 
  User,
  BookOpen,
  Clock,
  CheckCircle,
  Upload,
  Download,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  AlertCircle,
  TrendingUp,
  Award,
  MessageSquare
} from 'lucide-react';
import axios from 'axios';

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  maxMarks: number;
  submissionsCount: number;
  className: string;
  subject: string;
  status: 'active' | 'inactive';
  createdAt: Date;
}

interface QRCode {
  id: string;
  classId: string;
  subjectId: string;
  date: string;
  startTime: string;
  endTime: string;
  expiresAt: Date;
  studentsPresent: string[];
  isActive: boolean;
}

interface AttendanceReport {
  studentName: string;
  rollNumber: string;
  status: 'present' | 'absent';
  markedAt?: Date;
}

interface Analytics {
  totalClasses: number;
  totalStudents: number;
  averageAttendance: number;
  assignmentStats: {
    total: number;
    pending: number;
    submitted: number;
  };
}

const FacultyDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  // QR Code generation state
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [qrForm, setQrForm] = useState({
    classId: '',
    subjectId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    duration: 300 // 5 minutes default
  });

  // Assignment creation state
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    classId: '',
    subjectId: '',
    dueDate: '',
    maxMarks: 100,
    instructions: '',
    allowedFileTypes: 'pdf,doc,docx,ppt,pptx'
  });

  // Announcement state
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    priority: 'normal',
    targetAudience: 'students',
    expiryDate: ''
  });

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = await user.getIdToken();
      
      const [assignmentsRes, announcementsRes] = await Promise.all([
        axios.get('/api/assignments/faculty', { headers: { Authorization: `Bearer ${token}` }}),
        axios.get('/api/announcements/faculty', { headers: { Authorization: `Bearer ${token}` }})
      ]);

      setAssignments(assignmentsRes.data.map((a: any) => ({
        ...a,
        dueDate: new Date(a.dueDate),
        createdAt: new Date(a.createdAt)
      })));
      setAnnouncements(announcementsRes.data.announcements.map((a: any) => ({
        ...a,
        createdAt: new Date(a.createdAt)
      })));

      // Mock analytics - in real app, this would come from API
      setAnalytics({
        totalClasses: 45,
        totalStudents: 120,
        averageAttendance: 87,
        assignmentStats: {
          total: assignmentsRes.data.length,
          pending: assignmentsRes.data.filter((a: any) => new Date(a.dueDate) > new Date()).length,
          submitted: assignmentsRes.data.reduce((sum: number, a: any) => sum + a.submissionsCount, 0)
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async () => {
    try {
      const token = await user.getIdToken();
      const response = await axios.post('/api/attendance/generate-qr', qrForm, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('QR Code generated successfully!');
      setShowQRGenerator(false);
      setQrForm({
        classId: '',
        subjectId: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '',
        endTime: '',
        duration: 300
      });
      
      // Refresh QR codes list
      // fetchQRCodes();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to generate QR code');
    }
  };

  const createAssignment = async () => {
    try {
      const token = await user.getIdToken();
      await axios.post('/api/assignments', assignmentForm, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Assignment created successfully!');
      setShowAssignmentForm(false);
      setAssignmentForm({
        title: '',
        description: '',
        classId: '',
        subjectId: '',
        dueDate: '',
        maxMarks: 100,
        instructions: '',
        allowedFileTypes: 'pdf,doc,docx,ppt,pptx'
      });
      fetchDashboardData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create assignment');
    }
  };

  const createAnnouncement = async () => {
    try {
      const token = await user.getIdToken();
      await axios.post('/api/announcements', announcementForm, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Announcement posted successfully!');
      setShowAnnouncementForm(false);
      setAnnouncementForm({
        title: '',
        content: '',
        priority: 'normal',
        targetAudience: 'students',
        expiryDate: ''
      });
      fetchDashboardData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create announcement');
    }
  };

  const DashboardOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Classes</p>
              <p className="text-2xl font-bold text-blue-600">{analytics?.totalClasses || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-green-600">{analytics?.totalStudents || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Attendance</p>
              <p className="text-2xl font-bold text-purple-600">{analytics?.averageAttendance || 0}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Assignments</p>
              <p className="text-2xl font-bold text-orange-600">{analytics?.assignmentStats.total || 0}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <FileText className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setShowQRGenerator(true)}
            className="flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <QrCode className="w-8 h-8 text-blue-600" />
            <div className="text-left">
              <h4 className="font-medium text-gray-900">Generate QR Code</h4>
              <p className="text-sm text-gray-600">For attendance marking</p>
            </div>
          </button>

          <button
            onClick={() => setShowAssignmentForm(true)}
            className="flex items-center space-x-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
          >
            <FileText className="w-8 h-8 text-green-600" />
            <div className="text-left">
              <h4 className="font-medium text-gray-900">Create Assignment</h4>
              <p className="text-sm text-gray-600">Upload new assignment</p>
            </div>
          </button>

          <button
            onClick={() => setShowAnnouncementForm(true)}
            className="flex items-center space-x-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
          >
            <Bell className="w-8 h-8 text-purple-600" />
            <div className="text-left">
              <h4 className="font-medium text-gray-900">Post Announcement</h4>
              <p className="text-sm text-gray-600">Notify students</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Assignments</h3>
          {assignments.slice(0, 3).map((assignment) => (
            <div key={assignment.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
              <div>
                <h4 className="font-medium text-gray-900">{assignment.title}</h4>
                <p className="text-sm text-gray-600">{assignment.subject}</p>
              </div>
              <div className="text-right">
                <span className="text-sm text-blue-600">{assignment.submissionsCount} submissions</span>
                <p className="text-xs text-gray-500">Due {assignment.dueDate.toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Announcements</h3>
          {announcements.slice(0, 3).map((announcement) => (
            <div key={announcement.id} className="py-3 border-b border-gray-100 last:border-0">
              <h4 className="font-medium text-gray-900">{announcement.title}</h4>
              <p className="text-sm text-gray-600 line-clamp-2">{announcement.content}</p>
              <p className="text-xs text-gray-500 mt-1">{announcement.createdAt.toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'attendance', name: 'Attendance', icon: CheckCircle },
    { id: 'assignments', name: 'Assignments', icon: FileText },
    { id: 'announcements', name: 'Announcements', icon: Bell },
    { id: 'analytics', name: 'Analytics', icon: TrendingUp }
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
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Faculty Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome back, {user?.name || 'Faculty'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Faculty Member</p>
                <p className="text-xs text-gray-600">Teaching Department</p>
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
                    ? 'bg-green-100 text-green-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'dashboard' && <DashboardOverview />}
            
            {activeTab === 'attendance' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Attendance Management</h2>
                  <button
                    onClick={() => setShowQRGenerator(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Generate QR Code</span>
                  </button>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600 mb-2">87%</div>
                      <div className="text-sm text-gray-600">Average Attendance</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-3xl font-bold text-green-600 mb-2">45</div>
                      <div className="text-sm text-gray-600">Total Classes</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-3xl font-bold text-purple-600 mb-2">120</div>
                      <div className="text-sm text-gray-600">Students Enrolled</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'assignments' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Assignment Management</h2>
                  <button
                    onClick={() => setShowAssignmentForm(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Assignment</span>
                  </button>
                </div>
                
                <div className="grid gap-6">
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                          <p className="text-gray-600">{assignment.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>Subject: {assignment.subject}</span>
                            <span>Class: {assignment.className}</span>
                            <span>Due: {assignment.dueDate.toLocaleDateString()}</span>
                            <span>Max Marks: {assignment.maxMarks}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                            {assignment.submissionsCount} submissions
                          </span>
                          <button className="p-2 text-gray-500 hover:text-gray-700">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-500 hover:text-gray-700">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'announcements' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Announcements</h2>
                  <button
                    onClick={() => setShowAnnouncementForm(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Announcement</span>
                  </button>
                </div>
                
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div key={announcement.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{announcement.title}</h3>
                          <p className="text-gray-600 mb-3">{announcement.content}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className={`px-2 py-1 rounded text-xs ${
                              announcement.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                              announcement.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {announcement.priority.toUpperCase()}
                            </span>
                            <span>{announcement.createdAt.toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Performance Analytics</h2>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Performance Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                      <Award className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-blue-600">92%</div>
                      <div className="text-sm text-gray-600">Assignment Completion</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                      <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-600">8.5/10</div>
                      <div className="text-sm text-gray-600">Average Grade</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                      <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-purple-600">87%</div>
                      <div className="text-sm text-gray-600">Class Participation</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg">
                      <CheckCircle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-orange-600">95%</div>
                      <div className="text-sm text-gray-600">Attendance Rate</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Generator Modal */}
      {showQRGenerator && (
        <QRGeneratorModal
          onClose={() => setShowQRGenerator(false)}
          onGenerate={generateQRCode}
          formData={qrForm}
          setFormData={setQrForm}
        />
      )}

      {/* Assignment Form Modal */}
      {showAssignmentForm && (
        <AssignmentFormModal
          onClose={() => setShowAssignmentForm(false)}
          onCreate={createAssignment}
          formData={assignmentForm}
          setFormData={setAssignmentForm}
        />
      )}

      {/* Announcement Form Modal */}
      {showAnnouncementForm && (
        <AnnouncementFormModal
          onClose={() => setShowAnnouncementForm(false)}
          onCreate={createAnnouncement}
          formData={announcementForm}
          setFormData={setAnnouncementForm}
        />
      )}
    </div>
  );
};

// QR Generator Modal Component
const QRGeneratorModal = ({ onClose, onGenerate, formData, setFormData }: any) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg max-w-md w-full p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Generate QR Code for Attendance</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          ×
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Class ID</label>
          <input
            type="text"
            value={formData.classId}
            onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter class ID"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject ID</label>
          <input
            type="text"
            value={formData.subjectId}
            onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter subject ID"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
            <input
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
            <input
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Duration (seconds)</label>
          <select
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={300}>5 minutes</option>
            <option value={600}>10 minutes</option>
            <option value={900}>15 minutes</option>
            <option value={1800}>30 minutes</option>
          </select>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onGenerate}
          disabled={!formData.classId || !formData.subjectId || !formData.startTime || !formData.endTime}
          className={`px-4 py-2 text-white rounded-lg transition-colors ${
            formData.classId && formData.subjectId && formData.startTime && formData.endTime
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          Generate QR Code
        </button>
      </div>
    </div>
  </div>
);

// Assignment Form Modal Component
const AssignmentFormModal = ({ onClose, onCreate, formData, setFormData }: any) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Create New Assignment</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Assignment title"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Assignment description"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class ID *</label>
            <input
              type="text"
              value={formData.classId}
              onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Class ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject ID *</label>
            <input
              type="text"
              value={formData.subjectId}
              onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Subject ID"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Marks</label>
            <input
              type="number"
              value={formData.maxMarks}
              onChange={(e) => setFormData({ ...formData, maxMarks: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 mt-6">
        <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
          Cancel
        </button>
        <button
          onClick={onCreate}
          disabled={!formData.title || !formData.description || !formData.classId || !formData.subjectId || !formData.dueDate}
          className={`px-4 py-2 text-white rounded-lg transition-colors ${
            formData.title && formData.description && formData.classId && formData.subjectId && formData.dueDate
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          Create Assignment
        </button>
      </div>
    </div>
  </div>
);

// Announcement Form Modal Component
const AnnouncementFormModal = ({ onClose, onCreate, formData, setFormData }: any) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg max-w-xl w-full p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Post New Announcement</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Announcement title"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Announcement content"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
            <select
              value={formData.targetAudience}
              onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="students">Students</option>
              <option value="faculty">Faculty</option>
              <option value="all">All</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 mt-6">
        <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
          Cancel
        </button>
        <button
          onClick={onCreate}
          disabled={!formData.title || !formData.content}
          className={`px-4 py-2 text-white rounded-lg transition-colors ${
            formData.title && formData.content
              ? 'bg-purple-600 hover:bg-purple-700'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          Post Announcement
        </button>
      </div>
    </div>
  </div>
);

export default FacultyDashboard;
