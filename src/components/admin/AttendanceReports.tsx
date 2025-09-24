import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { firebaseService } from '../../services/firebaseService';
import { Attendance, Student, Faculty, Subject, Department } from '../../types/firestore';
import {
  Calendar,
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  Download,
  Search,
  Filter,
  BarChart3,
  UserCheck,
  UserX,
  AlertTriangle
} from 'lucide-react';

interface AttendanceStats {
  totalClasses: number;
  totalAttendance: number;
  averageAttendance: number;
  studentStats: StudentAttendanceStats[];
  facultyStats: FacultyAttendanceStats[];
  subjectStats: SubjectAttendanceStats[];
  departmentStats: DepartmentAttendanceStats[];
  dateWiseStats: DateWiseStats[];
}

interface StudentAttendanceStats {
  studentId: string;
  studentName: string;
  totalClasses: number;
  attendedClasses: number;
  attendancePercentage: number;
  department: string;
}

interface FacultyAttendanceStats {
  facultyId: string;
  facultyName: string;
  totalClasses: number;
  studentsPresent: number;
  averageAttendance: number;
  department: string;
}

interface SubjectAttendanceStats {
  subjectId: string;
  subjectName: string;
  totalClasses: number;
  averageAttendance: number;
  departmentId: string;
}

interface DepartmentAttendanceStats {
  departmentId: string;
  departmentName: string;
  totalClasses: number;
  averageAttendance: number;
  studentCount: number;
}

interface DateWiseStats {
  date: string;
  totalClasses: number;
  averageAttendance: number;
}

const AttendanceReports: React.FC = () => {
  const { user } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    department: 'all',
    subject: 'all',
    faculty: 'all',
    student: 'all'
  });
  
  const [activeView, setActiveView] = useState<'overview' | 'students' | 'faculty' | 'subjects' | 'departments'>('overview');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.uid) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    if (attendanceRecords.length > 0 && students.length > 0 && faculty.length > 0) {
      generateStats();
    }
  }, [attendanceRecords, students, faculty, subjects, departments, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (!user?.uid) return;

      const [attendanceData, studentsData, facultyData, subjectsData, departmentsData] = await Promise.all([
        firebaseService.getDocuments('attendance', [
          { field: 'adminId', operator: '==', value: user.uid }
        ]),
        firebaseService.getDocuments('students', [
          { field: 'adminId', operator: '==', value: user.uid }
        ]),
        firebaseService.getDocuments('faculty', [
          { field: 'adminId', operator: '==', value: user.uid }
        ]),
        firebaseService.getDocuments('subjects', [
          { field: 'adminId', operator: '==', value: user.uid }
        ]),
        firebaseService.getDocuments('departments', [
          { field: 'adminId', operator: '==', value: user.uid }
        ])
      ]);

      setAttendanceRecords(attendanceData);
      setStudents(studentsData);
      setFaculty(facultyData);
      setSubjects(subjectsData);
      setDepartments(departmentsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateStats = () => {
    const filteredRecords = applyFilters(attendanceRecords);
    
    if (filteredRecords.length === 0) {
      setStats({
        totalClasses: 0,
        totalAttendance: 0,
        averageAttendance: 0,
        studentStats: [],
        facultyStats: [],
        subjectStats: [],
        departmentStats: [],
        dateWiseStats: []
      });
      return;
    }

    // Calculate student stats
    const studentStatsMap = new Map<string, StudentAttendanceStats>();
    filteredRecords.forEach(record => {
      record.students.forEach(studentRecord => {
        const student = students.find(s => s.id === studentRecord.studentId);
        if (!student) return;

        const key = studentRecord.studentId;
        if (!studentStatsMap.has(key)) {
          const department = departments.find(d => d.id === student.departmentId)?.name || 'Unknown';
          studentStatsMap.set(key, {
            studentId: studentRecord.studentId,
            studentName: student.name,
            totalClasses: 0,
            attendedClasses: 0,
            attendancePercentage: 0,
            department
          });
        }

        const stat = studentStatsMap.get(key)!;
        stat.totalClasses++;
        if (studentRecord.status === 'present') {
          stat.attendedClasses++;
        }
        stat.attendancePercentage = (stat.attendedClasses / stat.totalClasses) * 100;
      });
    });

    // Calculate faculty stats
    const facultyStatsMap = new Map<string, FacultyAttendanceStats>();
    filteredRecords.forEach(record => {
      const facultyMember = faculty.find(f => f.id === record.facultyId);
      if (!facultyMember) return;

      const key = record.facultyId;
      if (!facultyStatsMap.has(key)) {
        const department = departments.find(d => d.id === facultyMember.departmentId)?.name || 'Unknown';
        facultyStatsMap.set(key, {
          facultyId: record.facultyId,
          facultyName: facultyMember.name,
          totalClasses: 0,
          studentsPresent: 0,
          averageAttendance: 0,
          department
        });
      }

      const stat = facultyStatsMap.get(key)!;
      stat.totalClasses++;
      
      const presentCount = record.students.filter(s => s.status === 'present').length;
      stat.studentsPresent += presentCount;
      stat.averageAttendance = record.students.length > 0 
        ? (stat.studentsPresent / (stat.totalClasses * record.students.length)) * 100 
        : 0;
    });

    // Calculate subject stats
    const subjectStatsMap = new Map<string, SubjectAttendanceStats>();
    filteredRecords.forEach(record => {
      const subject = subjects.find(s => s.id === record.subjectId);
      if (!subject) return;

      const key = record.subjectId;
      if (!subjectStatsMap.has(key)) {
        subjectStatsMap.set(key, {
          subjectId: record.subjectId,
          subjectName: subject.name,
          totalClasses: 0,
          averageAttendance: 0,
          departmentId: subject.departmentId
        });
      }

      const stat = subjectStatsMap.get(key)!;
      stat.totalClasses++;
      
      const presentCount = record.students.filter(s => s.status === 'present').length;
      const totalStudents = record.students.length;
      const classAttendance = totalStudents > 0 ? (presentCount / totalStudents) * 100 : 0;
      
      stat.averageAttendance = ((stat.averageAttendance * (stat.totalClasses - 1)) + classAttendance) / stat.totalClasses;
    });

    // Calculate department stats
    const departmentStatsMap = new Map<string, DepartmentAttendanceStats>();
    departments.forEach(dept => {
      const deptSubjects = subjects.filter(s => s.departmentId === dept.id);
      const deptStudents = students.filter(s => s.departmentId === dept.id);
      
      const deptRecords = filteredRecords.filter(record => 
        deptSubjects.some(s => s.id === record.subjectId)
      );

      if (deptRecords.length === 0) return;

      let totalPresent = 0;
      let totalPossible = 0;

      deptRecords.forEach(record => {
        const presentCount = record.students.filter(s => s.status === 'present').length;
        totalPresent += presentCount;
        totalPossible += record.students.length;
      });

      departmentStatsMap.set(dept.id!, {
        departmentId: dept.id!,
        departmentName: dept.name,
        totalClasses: deptRecords.length,
        averageAttendance: totalPossible > 0 ? (totalPresent / totalPossible) * 100 : 0,
        studentCount: deptStudents.length
      });
    });

    // Calculate date-wise stats
    const dateStatsMap = new Map<string, DateWiseStats>();
    filteredRecords.forEach(record => {
      const date = new Date(record.date.seconds * 1000).toDateString();
      
      if (!dateStatsMap.has(date)) {
        dateStatsMap.set(date, {
          date,
          totalClasses: 0,
          averageAttendance: 0
        });
      }

      const stat = dateStatsMap.get(date)!;
      stat.totalClasses++;
      
      const presentCount = record.students.filter(s => s.status === 'present').length;
      const totalStudents = record.students.length;
      const classAttendance = totalStudents > 0 ? (presentCount / totalStudents) * 100 : 0;
      
      stat.averageAttendance = ((stat.averageAttendance * (stat.totalClasses - 1)) + classAttendance) / stat.totalClasses;
    });

    // Calculate overall stats
    const totalAttendanceRecords = filteredRecords.reduce((sum, record) => 
      sum + record.students.filter(s => s.status === 'present').length, 0
    );
    const totalPossibleAttendance = filteredRecords.reduce((sum, record) => 
      sum + record.students.length, 0
    );

    setStats({
      totalClasses: filteredRecords.length,
      totalAttendance: totalAttendanceRecords,
      averageAttendance: totalPossibleAttendance > 0 ? (totalAttendanceRecords / totalPossibleAttendance) * 100 : 0,
      studentStats: Array.from(studentStatsMap.values()).sort((a, b) => b.attendancePercentage - a.attendancePercentage),
      facultyStats: Array.from(facultyStatsMap.values()).sort((a, b) => b.averageAttendance - a.averageAttendance),
      subjectStats: Array.from(subjectStatsMap.values()).sort((a, b) => b.averageAttendance - a.averageAttendance),
      departmentStats: Array.from(departmentStatsMap.values()).sort((a, b) => b.averageAttendance - a.averageAttendance),
      dateWiseStats: Array.from(dateStatsMap.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    });
  };

  const applyFilters = (records: Attendance[]) => {
    return records.filter(record => {
      const recordDate = new Date(record.date.seconds * 1000);
      
      // Date filters
      if (filters.startDate && recordDate < new Date(filters.startDate)) return false;
      if (filters.endDate && recordDate > new Date(filters.endDate)) return false;
      
      // Department filter
      if (filters.department !== 'all') {
        const subject = subjects.find(s => s.id === record.subjectId);
        if (!subject || subject.departmentId !== filters.department) return false;
      }
      
      // Subject filter
      if (filters.subject !== 'all' && record.subjectId !== filters.subject) return false;
      
      // Faculty filter
      if (filters.faculty !== 'all' && record.facultyId !== filters.faculty) return false;
      
      return true;
    });
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 75) return 'text-green-600 dark:text-green-400';
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getAttendanceBadgeColor = (percentage: number) => {
    if (percentage >= 75) return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">No attendance data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance Reports</h2>
          <p className="text-gray-600 dark:text-gray-400">Comprehensive attendance analytics and insights</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
          <Download className="h-4 w-4" />
          <span>Export Report</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
            <select
              value={filters.subject}
              onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Faculty</label>
            <select
              value={filters.faculty}
              onChange={(e) => setFilters({ ...filters, faculty: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Faculty</option>
              {faculty.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({
                startDate: '',
                endDate: '',
                department: 'all',
                subject: 'all',
                faculty: 'all',
                student: 'all'
              })}
              className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Classes</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalClasses}</p>
            </div>
            <Calendar className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Attendance</p>
              <p className={`text-3xl font-bold ${getAttendanceColor(stats.averageAttendance)}`}>
                {stats.averageAttendance.toFixed(1)}%
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Students Tracked</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.studentStats.length}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Low Attendance</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                {stats.studentStats.filter(s => s.attendancePercentage < 75).length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
        </div>
      </div>

      {/* View Selector */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'overview', label: 'Overview', icon: BarChart3 },
            { key: 'students', label: 'Students', icon: Users },
            { key: 'faculty', label: 'Faculty', icon: UserCheck },
            { key: 'subjects', label: 'Subjects', icon: Clock },
            { key: 'departments', label: 'Departments', icon: TrendingUp }
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

      {/* Content based on active view */}
      {activeView === 'students' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Student Attendance</h3>
            <div className="mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Classes Attended
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total Classes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Attendance %
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {stats.studentStats
                  .filter(student => 
                    student.studentName.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .slice(0, 100) // Limit for performance
                  .map((student) => (
                  <tr key={student.studentId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {student.studentName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {student.department}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {student.attendedClasses}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {student.totalClasses}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAttendanceBadgeColor(student.attendancePercentage)}`}>
                        {student.attendancePercentage.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeView === 'faculty' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Faculty Attendance Records</h3>
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
                    Classes Conducted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Average Attendance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {stats.facultyStats.map((facultyMember) => (
                  <tr key={facultyMember.facultyId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {facultyMember.facultyName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {facultyMember.department}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {facultyMember.totalClasses}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAttendanceBadgeColor(facultyMember.averageAttendance)}`}>
                        {facultyMember.averageAttendance.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeView === 'subjects' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Subject-wise Attendance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total Classes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Average Attendance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {stats.subjectStats.map((subject) => (
                  <tr key={subject.subjectId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {subject.subjectName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {subject.totalClasses}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAttendanceBadgeColor(subject.averageAttendance)}`}>
                        {subject.averageAttendance.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeView === 'departments' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Department-wise Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total Classes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Student Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Average Attendance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {stats.departmentStats.map((department) => (
                  <tr key={department.departmentId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {department.departmentName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {department.totalClasses}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {department.studentCount}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAttendanceBadgeColor(department.averageAttendance)}`}>
                        {department.averageAttendance.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceReports;