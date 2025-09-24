import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { firebaseService } from '../../services/firebaseService';
import { FeedbackForm, FeedbackResponse, Faculty, Student, Subject, Department } from '../../types/firestore';
import {
  Plus,
  Edit,
  Trash2,
  MessageSquare,
  Star,
  Calendar,
  Users,
  BarChart3,
  Search,
  Filter,
  Eye,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

interface FeedbackStats {
  totalForms: number;
  totalResponses: number;
  averageRating: number;
  responseRate: number;
  formStats: FormStats[];
  subjectStats: SubjectFeedbackStats[];
  facultyStats: FacultyFeedbackStats[];
}

interface FormStats {
  formId: string;
  formTitle: string;
  totalResponses: number;
  averageRating: number;
  responseRate: number;
  status: string;
}

interface SubjectFeedbackStats {
  subjectId: string;
  subjectName: string;
  totalResponses: number;
  averageRating: number;
  facultyName: string;
}

interface FacultyFeedbackStats {
  facultyId: string;
  facultyName: string;
  totalResponses: number;
  averageRating: number;
  subjectCount: number;
  department: string;
}

const FeedbackManagement: React.FC = () => {
  const { user } = useAuth();
  const [feedbackForms, setFeedbackForms] = useState<FeedbackForm[]>([]);
  const [feedbackResponses, setFeedbackResponses] = useState<FeedbackResponse[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [editingForm, setEditingForm] = useState<FeedbackForm | null>(null);
  const [selectedForm, setSelectedForm] = useState<FeedbackForm | null>(null);
  const [selectedFormResponses, setSelectedFormResponses] = useState<FeedbackResponse[]>([]);
  
  const [activeView, setActiveView] = useState<'overview' | 'forms' | 'responses' | 'analytics'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'faculty_evaluation' as 'faculty_evaluation' | 'course_evaluation' | 'general_feedback',
    targetAudience: 'students' as 'students' | 'faculty' | 'all',
    subjectId: '',
    facultyId: '',
    questions: [] as Array<{
      id: string;
      question: string;
      type: 'rating' | 'text' | 'multiple_choice';
      required: boolean;
      options?: string[];
    }>,
    isAnonymous: true,
    startDate: '',
    endDate: '',
    status: 'draft' as 'draft' | 'active' | 'closed'
  });

  const [newQuestion, setNewQuestion] = useState({
    question: '',
    type: 'rating' as 'rating' | 'text' | 'multiple_choice',
    required: true,
    options: [] as string[]
  });

  useEffect(() => {
    if (user?.uid) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    if (feedbackForms.length > 0 || feedbackResponses.length > 0) {
      generateStats();
    }
  }, [feedbackForms, feedbackResponses, faculty, subjects, students, departments]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (!user?.uid) return;

      const [formsData, responsesData, facultyData, studentsData, subjectsData, departmentsData] = await Promise.all([
        firebaseService.getDocuments('feedback_forms', [
          { field: 'adminId', operator: '==', value: user.uid }
        ]),
        firebaseService.getDocuments('feedback_responses', [
          { field: 'adminId', operator: '==', value: user.uid }
        ]),
        firebaseService.getDocuments('faculty', [
          { field: 'adminId', operator: '==', value: user.uid }
        ]),
        firebaseService.getDocuments('students', [
          { field: 'adminId', operator: '==', value: user.uid }
        ]),
        firebaseService.getDocuments('subjects', [
          { field: 'adminId', operator: '==', value: user.uid }
        ]),
        firebaseService.getDocuments('departments', [
          { field: 'adminId', operator: '==', value: user.uid }
        ])
      ]);

      setFeedbackForms(formsData.sort((a, b) => 
        new Date(b.createdAt.seconds * 1000).getTime() - new Date(a.createdAt.seconds * 1000).getTime()
      ));
      setFeedbackResponses(responsesData);
      setFaculty(facultyData);
      setStudents(studentsData);
      setSubjects(subjectsData);
      setDepartments(departmentsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateStats = () => {
    if (feedbackForms.length === 0) {
      setStats({
        totalForms: 0,
        totalResponses: 0,
        averageRating: 0,
        responseRate: 0,
        formStats: [],
        subjectStats: [],
        facultyStats: []
      });
      return;
    }

    // Calculate form stats
    const formStats: FormStats[] = feedbackForms.map(form => {
      const responses = feedbackResponses.filter(r => r.formId === form.id);
      const ratings = responses.flatMap(r => 
        r.responses.filter(resp => typeof resp.answer === 'number').map(resp => resp.answer as number)
      );
      const averageRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
      
      // Calculate response rate (assuming target audience size)
      let targetSize = 0;
      if (form.targetAudience === 'students') targetSize = students.length;
      else if (form.targetAudience === 'faculty') targetSize = faculty.length;
      else targetSize = students.length + faculty.length;
      
      const responseRate = targetSize > 0 ? (responses.length / targetSize) * 100 : 0;

      return {
        formId: form.id!,
        formTitle: form.title,
        totalResponses: responses.length,
        averageRating,
        responseRate,
        status: form.status
      };
    });

    // Calculate subject stats
    const subjectStatsMap = new Map<string, SubjectFeedbackStats>();
    feedbackForms.filter(f => f.subjectId).forEach(form => {
      const subject = subjects.find(s => s.id === form.subjectId);
      const facultyMember = faculty.find(f => f.id === form.facultyId);
      
      if (!subject) return;

      const responses = feedbackResponses.filter(r => r.formId === form.id);
      const ratings = responses.flatMap(r => 
        r.responses.filter(resp => typeof resp.answer === 'number').map(resp => resp.answer as number)
      );
      const averageRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

      const key = form.subjectId!;
      if (!subjectStatsMap.has(key)) {
        subjectStatsMap.set(key, {
          subjectId: key,
          subjectName: subject.name,
          totalResponses: 0,
          averageRating: 0,
          facultyName: facultyMember?.name || 'Unknown'
        });
      }

      const stat = subjectStatsMap.get(key)!;
      stat.totalResponses += responses.length;
      stat.averageRating = ((stat.averageRating + averageRating) / 2);
    });

    // Calculate faculty stats
    const facultyStatsMap = new Map<string, FacultyFeedbackStats>();
    feedbackForms.filter(f => f.facultyId).forEach(form => {
      const facultyMember = faculty.find(f => f.id === form.facultyId);
      if (!facultyMember) return;

      const responses = feedbackResponses.filter(r => r.formId === form.id);
      const ratings = responses.flatMap(r => 
        r.responses.filter(resp => typeof resp.answer === 'number').map(resp => resp.answer as number)
      );
      const averageRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

      const key = form.facultyId!;
      if (!facultyStatsMap.has(key)) {
        const department = departments.find(d => d.id === facultyMember.departmentId)?.name || 'Unknown';
        facultyStatsMap.set(key, {
          facultyId: key,
          facultyName: facultyMember.name,
          totalResponses: 0,
          averageRating: 0,
          subjectCount: 0,
          department
        });
      }

      const stat = facultyStatsMap.get(key)!;
      stat.totalResponses += responses.length;
      stat.subjectCount++;
      stat.averageRating = ((stat.averageRating + averageRating) / 2);
    });

    // Calculate overall stats
    const totalRatings = feedbackResponses.flatMap(r => 
      r.responses.filter(resp => typeof resp.answer === 'number').map(resp => resp.answer as number)
    );
    const overallAverageRating = totalRatings.length > 0 ? totalRatings.reduce((a, b) => a + b, 0) / totalRatings.length : 0;
    const overallResponseRate = formStats.length > 0 ? formStats.reduce((a, b) => a + b.responseRate, 0) / formStats.length : 0;

    setStats({
      totalForms: feedbackForms.length,
      totalResponses: feedbackResponses.length,
      averageRating: overallAverageRating,
      responseRate: overallResponseRate,
      formStats: formStats.sort((a, b) => b.totalResponses - a.totalResponses),
      subjectStats: Array.from(subjectStatsMap.values()).sort((a, b) => b.averageRating - a.averageRating),
      facultyStats: Array.from(facultyStatsMap.values()).sort((a, b) => b.averageRating - a.averageRating)
    });
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!user?.uid) return;

      const formDataToSave = {
        ...formData,
        adminId: user.uid,
        questions: formData.questions,
        startDate: formData.startDate ? new Date(formData.startDate) : new Date(),
        endDate: formData.endDate ? new Date(formData.endDate) : null,
        responseCount: 0
      };

      if (editingForm) {
        await firebaseService.updateDocument('feedback_forms', editingForm.id!, formDataToSave);
      } else {
        await firebaseService.addDocument('feedback_forms', formDataToSave);
      }

      await loadData();
      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving feedback form:', error);
    }
  };

  const handleEditForm = (form: FeedbackForm) => {
    setEditingForm(form);
    setFormData({
      title: form.title,
      description: form.description,
      type: form.type,
      targetAudience: form.targetAudience,
      subjectId: form.subjectId || '',
      facultyId: form.facultyId || '',
      questions: form.questions || [],
      isAnonymous: form.isAnonymous,
      startDate: form.startDate ? new Date(form.startDate.seconds * 1000).toISOString().slice(0, 16) : '',
      endDate: form.endDate ? new Date(form.endDate.seconds * 1000).toISOString().slice(0, 16) : '',
      status: form.status
    });
    setShowModal(true);
  };

  const handleDeleteForm = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feedback form? All responses will also be deleted.')) return;

    try {
      // Delete responses first
      const responses = feedbackResponses.filter(r => r.formId === id);
      await Promise.all(responses.map(r => firebaseService.deleteDocument('feedback_responses', r.id!)));
      
      // Then delete the form
      await firebaseService.deleteDocument('feedback_forms', id);
      await loadData();
    } catch (error) {
      console.error('Error deleting feedback form:', error);
    }
  };

  const handleViewResponses = async (form: FeedbackForm) => {
    setSelectedForm(form);
    const responses = feedbackResponses.filter(r => r.formId === form.id);
    setSelectedFormResponses(responses);
    setShowResponseModal(true);
  };

  const addQuestion = () => {
    if (!newQuestion.question.trim()) return;

    const question = {
      id: Date.now().toString(),
      question: newQuestion.question,
      type: newQuestion.type,
      required: newQuestion.required,
      options: newQuestion.type === 'multiple_choice' ? newQuestion.options.filter(opt => opt.trim()) : undefined
    };

    setFormData({
      ...formData,
      questions: [...formData.questions, question]
    });

    setNewQuestion({
      question: '',
      type: 'rating',
      required: true,
      options: []
    });
  };

  const removeQuestion = (questionId: string) => {
    setFormData({
      ...formData,
      questions: formData.questions.filter(q => q.id !== questionId)
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'faculty_evaluation',
      targetAudience: 'students',
      subjectId: '',
      facultyId: '',
      questions: [],
      isAnonymous: true,
      startDate: '',
      endDate: '',
      status: 'draft'
    });
    setEditingForm(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'draft': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'closed': return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getRatingStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Star key={i} className="h-4 w-4 text-yellow-400 fill-current opacity-50" />);
      } else {
        stars.push(<Star key={i} className="h-4 w-4 text-gray-300" />);
      }
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Feedback Management</h2>
          <p className="text-gray-600 dark:text-gray-400">Create and manage feedback forms and analyze responses</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <Download className="h-4 w-4" />
            <span>Export Data</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>New Feedback Form</span>
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Forms</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalForms}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Responses</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalResponses}</p>
              </div>
              <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Rating</p>
                <div className="flex items-center space-x-2">
                  <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                    {stats.averageRating.toFixed(1)}
                  </p>
                  <div className="flex">
                    {getRatingStars(stats.averageRating)}
                  </div>
                </div>
              </div>
              <Star className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Response Rate</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.responseRate.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
      )}

      {/* View Selector */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'overview', label: 'Overview', icon: BarChart3 },
            { key: 'forms', label: 'Feedback Forms', icon: MessageSquare },
            { key: 'responses', label: 'Responses', icon: Users },
            { key: 'analytics', label: 'Analytics', icon: TrendingUp }
          ].map((view) => {
            const Icon = view.icon;
            return (
              <button
                key={view.key}
                onClick={() => setActiveView(view.key as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  activeView === view.key
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{view.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback Forms View */}
      {activeView === 'forms' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search forms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="closed">Closed</option>
              </select>

              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Forms List */}
          <div className="space-y-4">
            {feedbackForms
              .filter(form => {
                const matchesSearch = form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    form.description.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesStatus = filterStatus === 'all' || form.status === filterStatus;
                const matchesSubject = filterSubject === 'all' || form.subjectId === filterSubject;
                return matchesSearch && matchesStatus && matchesSubject;
              })
              .map((form) => {
                const formStat = stats?.formStats.find(s => s.formId === form.id);
                return (
                  <div
                    key={form.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {form.title}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(form.status)}`}>
                            {form.status}
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
                            {form.type.replace('_', ' ')}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-300 mb-3">
                          {form.description}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            <span>Target: {form.targetAudience}</span>
                          </div>
                          <div className="flex items-center">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            <span>Responses: {formStat?.totalResponses || 0}</span>
                          </div>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 mr-1" />
                            <span>Rating: {formStat?.averageRating.toFixed(1) || 'N/A'}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>Created: {new Date(form.createdAt.seconds * 1000).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center mt-3 space-x-4">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Questions: {form.questions?.length || 0}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Response Rate: {formStat?.responseRate.toFixed(1) || '0'}%
                          </span>
                          {form.isAnonymous && (
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                              Anonymous
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleViewResponses(form)}
                          className="p-2 text-indigo-600 hover:bg-indigo-100 dark:text-indigo-400 dark:hover:bg-indigo-900/20 rounded-md transition-colors"
                          title="View Responses"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditForm(form)}
                          className="p-2 text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/20 rounded-md transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteForm(form.id!)}
                          className="p-2 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/20 rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

            {feedbackForms.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  No feedback forms yet. Create your first feedback form!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analytics View */}
      {activeView === 'analytics' && stats && (
        <div className="space-y-6">
          {/* Faculty Performance */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Faculty Performance</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Faculty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Responses
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Average Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Subjects
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {stats.facultyStats.map((facultyStat) => (
                    <tr key={facultyStat.facultyId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {facultyStat.facultyName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {facultyStat.department}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {facultyStat.totalResponses}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {facultyStat.averageRating.toFixed(1)}
                          </span>
                          <div className="flex">
                            {getRatingStars(facultyStat.averageRating)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {facultyStat.subjectCount}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Subject Performance */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Subject Performance</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Faculty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Responses
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Average Rating
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {stats.subjectStats.map((subjectStat) => (
                    <tr key={subjectStat.subjectId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {subjectStat.subjectName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {subjectStat.facultyName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {subjectStat.totalResponses}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {subjectStat.averageRating.toFixed(1)}
                          </span>
                          <div className="flex">
                            {getRatingStars(subjectStat.averageRating)}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {editingForm ? 'Edit Feedback Form' : 'Create New Feedback Form'}
              </h3>

              <form onSubmit={handleSubmitForm} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Enter form title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="faculty_evaluation">Faculty Evaluation</option>
                      <option value="course_evaluation">Course Evaluation</option>
                      <option value="general_feedback">General Feedback</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter form description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Target Audience
                    </label>
                    <select
                      value={formData.targetAudience}
                      onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="students">Students</option>
                      <option value="faculty">Faculty</option>
                      <option value="all">All</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Subject (Optional)
                    </label>
                    <select
                      value={formData.subjectId}
                      onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(subject => (
                        <option key={subject.id} value={subject.id}>{subject.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Faculty (Optional)
                    </label>
                    <select
                      value={formData.facultyId}
                      onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select Faculty</option>
                      {faculty.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Date
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      End Date (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isAnonymous"
                    checked={formData.isAnonymous}
                    onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isAnonymous" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Anonymous responses
                  </label>
                </div>

                {/* Questions Section */}
                <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white">Questions</h4>
                  </div>

                  {/* Existing Questions */}
                  <div className="space-y-3 mb-4">
                    {formData.questions.map((question, index) => (
                      <div key={question.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {index + 1}. {question.question}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Type: {question.type} {question.required && '(Required)'}
                            </p>
                            {question.options && question.options.length > 0 && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Options: {question.options.join(', ')}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeQuestion(question.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add New Question */}
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      <div>
                        <input
                          type="text"
                          placeholder="Question text"
                          value={newQuestion.question}
                          onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-600 dark:text-white text-sm"
                        />
                      </div>
                      <div>
                        <select
                          value={newQuestion.type}
                          onChange={(e) => setNewQuestion({ ...newQuestion, type: e.target.value as any })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-600 dark:text-white text-sm"
                        >
                          <option value="rating">Rating (1-5)</option>
                          <option value="text">Text</option>
                          <option value="multiple_choice">Multiple Choice</option>
                        </select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <label className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            checked={newQuestion.required}
                            onChange={(e) => setNewQuestion({ ...newQuestion, required: e.target.checked })}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-2"
                          />
                          Required
                        </label>
                        <button
                          type="button"
                          onClick={addQuestion}
                          className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {newQuestion.type === 'multiple_choice' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Options (one per line):
                        </label>
                        <textarea
                          rows={3}
                          value={newQuestion.options.join('\n')}
                          onChange={(e) => setNewQuestion({ ...newQuestion, options: e.target.value.split('\n') })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-600 dark:text-white text-sm"
                          placeholder="Option 1&#10;Option 2&#10;Option 3"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    {editingForm ? 'Update' : 'Create'} Form
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Response Details Modal */}
      {showResponseModal && selectedForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Responses: {selectedForm.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Total Responses: {selectedFormResponses.length}
                  </p>
                </div>
                <button
                  onClick={() => setShowResponseModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {selectedFormResponses.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No responses yet for this form.</p>
                  </div>
                ) : (
                  selectedFormResponses.map((response) => (
                    <div
                      key={response.id}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {selectedForm.isAnonymous ? 'Anonymous' : 
                              students.find(s => s.id === response.studentId)?.name || 'Unknown Student'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Submitted: {new Date(response.submittedAt.seconds * 1000).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {response.responses.map((resp, index) => {
                          const question = selectedForm.questions?.find(q => q.id === resp.questionId);
                          return (
                            <div key={index} className="border-l-4 border-indigo-200 dark:border-indigo-700 pl-4">
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                                {question?.question || `Question ${index + 1}`}
                              </p>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {question?.type === 'rating' && typeof resp.answer === 'number' ? (
                                  <div className="flex items-center space-x-2">
                                    <span>{resp.answer}/5</span>
                                    <div className="flex">
                                      {getRatingStars(resp.answer)}
                                    </div>
                                  </div>
                                ) : (
                                  <p>{resp.answer?.toString()}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackManagement;