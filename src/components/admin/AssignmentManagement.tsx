import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { firebaseService } from '../../services/firebaseService';
import { Assignment, AssignmentSubmission, Faculty, Student, Subject } from '../../types/firestore';
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  Clock,
  FileText,
  Users,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  GraduationCap
} from 'lucide-react';

const AssignmentManagement: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterFaculty, setFilterFaculty] = useState('all');

  useEffect(() => {
    if (user?.uid) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (!user?.uid) return;

      const [assignmentsData, facultyData, studentsData, subjectsData] = await Promise.all([
        firebaseService.getDocuments('assignments', [
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
        ])
      ]);

      setAssignments(assignmentsData.sort((a, b) => 
        new Date(b.createdAt.seconds * 1000).getTime() - new Date(a.createdAt.seconds * 1000).getTime()
      ));
      setFaculty(facultyData);
      setStudents(studentsData);
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async (assignmentId: string) => {
    try {
      const submissionsData = await firebaseService.getDocuments('assignment_submissions', [
        { field: 'assignmentId', operator: '==', value: assignmentId },
        { field: 'adminId', operator: '==', value: user.uid }
      ]);
      setSubmissions(submissionsData);
    } catch (error) {
      console.error('Error loading submissions:', error);
    }
  };

  const handleViewSubmissions = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    await loadSubmissions(assignment.id!);
    setShowSubmissions(true);
  };

  const updateSubmissionGrade = async (submissionId: string, grade: number, feedback: string) => {
    try {
      await firebaseService.updateDocument('assignment_submissions', submissionId, {
        grade,
        feedback,
        gradedAt: new Date(),
        gradedBy: user?.uid,
        status: 'graded'
      });
      
      if (selectedAssignment) {
        await loadSubmissions(selectedAssignment.id!);
      }
    } catch (error) {
      console.error('Error updating grade:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'draft': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'closed': return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const isOverdue = (dueDate: any) => {
    if (!dueDate) return false;
    const due = new Date(dueDate.seconds * 1000);
    return due < new Date();
  };

  const getFacultyName = (facultyId: string) => {
    const facultyMember = faculty.find(f => f.id === facultyId);
    return facultyMember ? facultyMember.name : 'Unknown Faculty';
  };

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject ? subject.name : 'Unknown Subject';
  };

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.name : 'Unknown Student';
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || assignment.status === filterStatus;
    const matchesFaculty = filterFaculty === 'all' || assignment.facultyId === filterFaculty;
    return matchesSearch && matchesStatus && matchesFaculty;
  });

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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Assignment Management</h2>
          <p className="text-gray-600 dark:text-gray-400">Monitor and manage assignments across all subjects</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <select
            value={filterFaculty}
            onChange={(e) => setFilterFaculty(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Faculty</option>
            {faculty.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Assignments</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{assignments.length}</p>
            </div>
            <FileText className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Published</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {assignments.filter(a => a.status === 'published').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Overdue</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {assignments.filter(a => a.status === 'published' && isOverdue(a.dueDate)).length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Draft</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {assignments.filter(a => a.status === 'draft').length}
              </p>
            </div>
            <Edit className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {filteredAssignments.map((assignment) => (
          <div
            key={assignment.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {assignment.title}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                    {assignment.status}
                  </span>
                  {isOverdue(assignment.dueDate) && assignment.status === 'published' && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400">
                      Overdue
                    </span>
                  )}
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  {assignment.description.substring(0, 150)}
                  {assignment.description.length > 150 && '...'}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    <span>Faculty: {getFacultyName(assignment.facultyId)}</span>
                  </div>
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    <span>Subject: {getSubjectName(assignment.subjectId)}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Due: {assignment.dueDate ? new Date(assignment.dueDate.seconds * 1000).toLocaleDateString() : 'Not set'}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>Created: {new Date(assignment.createdAt.seconds * 1000).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center mt-3 space-x-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Max Points: {assignment.maxPoints}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Submissions: {assignment.submissionCount || 0}
                  </span>
                  {assignment.allowLateSubmissions && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                      Late submissions allowed
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => handleViewSubmissions(assignment)}
                  className="p-2 text-indigo-600 hover:bg-indigo-100 dark:text-indigo-400 dark:hover:bg-indigo-900/20 rounded-md transition-colors"
                  title="View Submissions"
                >
                  <Eye className="h-4 w-4" />
                </button>
                {assignment.attachments && assignment.attachments.length > 0 && (
                  <button
                    className="p-2 text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/20 rounded-md transition-colors"
                    title="Download Attachments"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredAssignments.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || filterStatus !== 'all' || filterFaculty !== 'all' 
                ? 'No assignments found matching your criteria.' 
                : 'No assignments found.'}
            </p>
          </div>
        )}
      </div>

      {/* Submissions Modal */}
      {showSubmissions && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Submissions: {selectedAssignment.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Total Submissions: {submissions.length}
                  </p>
                </div>
                <button
                  onClick={() => setShowSubmissions(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {getStudentName(submission.studentId)}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            submission.status === 'graded' 
                              ? 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400'
                              : 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400'
                          }`}>
                            {submission.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div>
                            <span className="font-medium">Submitted:</span> {new Date(submission.submittedAt.seconds * 1000).toLocaleString()}
                          </div>
                          {submission.grade !== undefined && (
                            <div>
                              <span className="font-medium">Grade:</span> {submission.grade}/{selectedAssignment.maxPoints}
                            </div>
                          )}
                          {submission.gradedAt && (
                            <div>
                              <span className="font-medium">Graded:</span> {new Date(submission.gradedAt.seconds * 1000).toLocaleString()}
                            </div>
                          )}
                        </div>

                        {submission.content && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Submission:</span> {submission.content.substring(0, 200)}
                              {submission.content.length > 200 && '...'}
                            </p>
                          </div>
                        )}

                        {submission.feedback && (
                          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                              <span className="font-medium">Feedback:</span> {submission.feedback}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {submission.attachments && submission.attachments.length > 0 && (
                          <button className="p-2 text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/20 rounded-md transition-colors">
                            <Download className="h-4 w-4" />
                          </button>
                        )}
                        <GradeSubmissionButton 
                          submission={submission}
                          maxPoints={selectedAssignment.maxPoints}
                          onGrade={updateSubmissionGrade}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {submissions.length === 0 && (
                  <div className="text-center py-8">
                    <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No submissions yet for this assignment.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Grade Submission Component
const GradeSubmissionButton: React.FC<{
  submission: AssignmentSubmission;
  maxPoints: number;
  onGrade: (submissionId: string, grade: number, feedback: string) => void;
}> = ({ submission, maxPoints, onGrade }) => {
  const [showGrading, setShowGrading] = useState(false);
  const [grade, setGrade] = useState(submission.grade || 0);
  const [feedback, setFeedback] = useState(submission.feedback || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGrade(submission.id!, grade, feedback);
    setShowGrading(false);
  };

  return (
    <>
      <button
        onClick={() => setShowGrading(true)}
        className="p-2 text-indigo-600 hover:bg-indigo-100 dark:text-indigo-400 dark:hover:bg-indigo-900/20 rounded-md transition-colors"
        title="Grade Submission"
      >
        <Edit className="h-4 w-4" />
      </button>

      {showGrading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Grade Submission
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Grade (out of {maxPoints})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={maxPoints}
                    step="0.1"
                    value={grade}
                    onChange={(e) => setGrade(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Feedback
                  </label>
                  <textarea
                    rows={3}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter feedback for the student..."
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowGrading(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Save Grade
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AssignmentManagement;