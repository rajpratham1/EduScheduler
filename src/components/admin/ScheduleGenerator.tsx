import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Building, Play, Download, Share, AlertCircle, UploadCloud } from 'lucide-react';
import { firebaseService, Classroom, Faculty, Subject, Student, Schedule } from '../../services/firebaseService';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

const ScheduleGenerator: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [selectedType, setSelectedType] = useState<'class' | 'exam'>('class');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');

  const timeSlots = [
    '09:00-10:30',
    '10:45-12:15',
    '13:15-14:45',
    '15:00-16:30',
    '16:45-18:15'
  ];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  useEffect(() => {
    if (user) {
      loadData(user.id);
    }
  }, [user]);

  const loadData = async (adminId: string) => {
    setLoading(true);
    try {
      const [classroomData, facultyData, subjectData, studentData, scheduleData] = await Promise.all([
        firebaseService.getClassrooms(adminId),
        firebaseService.getFaculty(adminId),
        firebaseService.getSubjects(adminId),
        firebaseService.getStudents(adminId),
        firebaseService.getSchedules(adminId)
      ]);
      
      setClassrooms(classroomData);
      setFaculty(facultyData);
      setSubjects(subjectData);
      setStudents(studentData);
      setSchedules(scheduleData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSchedule = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const filteredSubjects = subjects.filter(s => 
        !selectedDepartment || s.department === selectedDepartment
      );
      
      const filteredStudents = students.filter(s => 
        (!selectedDepartment || s.department === selectedDepartment) &&
        (!selectedYear || s.year.toString() === selectedYear) &&
        (!selectedSemester || s.semester.toString() === selectedSemester)
      );

      const newSchedules: Omit<Schedule, 'id' | 'createdAt'>[] = [];
      let scheduleIndex = 0;

      for (const subject of filteredSubjects) {
        const assignedFaculty = faculty.find(f => (f.subjects || []).includes(subject.name));
        if (!assignedFaculty || !assignedFaculty.id) continue;

        const suitableClassrooms = classrooms.filter(c => 
          (subject.type === 'practical' && c.type === 'lab') ||
          (subject.type === 'theory' && (c.type === 'classroom' || c.type === 'library'))
        );

        if (suitableClassrooms.length === 0) continue;

        const dayIndex = scheduleIndex % days.length;
        const timeIndex = Math.floor(scheduleIndex / days.length) % timeSlots.length;
        const classroomIndex = scheduleIndex % suitableClassrooms.length;
        const classroom = suitableClassrooms[classroomIndex];

        const newSchedule: Omit<Schedule, 'id' | 'createdAt'> = {
          type: selectedType,
          subject: subject.name, // Keep name for display, but use ID for linking
          subjectId: subject.id!,
          facultyId: assignedFaculty.id,
          classroomId: classroom.id!,
          department: subject.department,
          year: parseInt(selectedYear) || 0,
          semester: parseInt(selectedSemester) || 0,
          day: days[dayIndex],
          startTime: timeSlots[timeIndex].split('-')[0],
          endTime: timeSlots[timeIndex].split('-')[1],
          adminId: user.id,
          status: 'draft',
        };

        newSchedules.push(newSchedule);
        scheduleIndex++;
      }

      // Clear previous draft schedules before creating new ones
      const draftSchedules = schedules.filter(s => s.status === 'draft');
      for (const schedule of draftSchedules) {
        await firebaseService.deleteSchedule(schedule.id!);
      }

      // Save new draft schedules to Firebase
      for (const schedule of newSchedules) {
        await firebaseService.createSchedule(schedule);
      }

      await loadData(user.id);
      alert(`Successfully generated ${newSchedules.length} draft schedule entries!`);
    } catch (error) {
      console.error('Error generating schedule:', error);
      alert('Error generating schedule. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!user) return;
    if (window.confirm('Are you sure you want to publish this schedule? This will make it visible to all faculty.')) {
        setPublishing(true);
        try {
            await firebaseService.publishSchedules(user.id);
            await loadData(user.id);
            alert('Schedule published successfully!');
        } catch (error) {
            console.error('Error publishing schedule:', error);
            alert('Failed to publish schedule.');
        } finally {
            setPublishing(false);
        }
    }
  }

  const clearSchedules = async () => {
    if (!user) return;
    if (window.confirm('Are you sure you want to clear ALL schedules for this admin? This cannot be undone.')) {
      try {
        for (const schedule of schedules) {
          await firebaseService.deleteSchedule(schedule.id!);
        }
        await loadData(user.id);
        alert('All schedules cleared successfully!');
      } catch (error) {
        console.error('Error clearing schedules:', error);
      }
    }
  };

  const departmentsList = [...new Set(subjects.map(s => s.department))];
  const years = ['1', '2', '3', '4'];
  const semesters = ['1', '2', '3', '4', '5', '6', '7', '8'];

  const getFacultyName = (id: string) => faculty.find(f => f.id === id)?.name || 'N/A';
  const getClassroomName = (id: string) => classrooms.find(c => c.id === id)?.name || 'N/A';

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
          AI Schedule Generator
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={handlePublish}
            disabled={publishing || schedules.filter(s => s.status === 'draft').length === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            <UploadCloud className="h-4 w-4" />
            <span>{publishing ? 'Publishing...' : 'Publish Schedule'}</span>
          </button>
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Schedule Configuration
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {/* Filters... */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Departments</option>
              {departmentsList.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          {/* Other filters... */}

          <div className="flex items-end">
            <button
              onClick={generateSchedule}
              disabled={generating}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Generate Draft</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Generated Schedule */}
      {schedules.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Generated Schedule ({schedules.length} entries)
            </h3>
            <button
              onClick={clearSchedules}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Clear All
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Faculty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Classroom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Day & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {schedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{schedule.subject}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{getFacultyName(schedule.facultyId)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{getClassroomName(schedule.classroomId)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{schedule.day}, {schedule.startTime}-{schedule.endTime}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        schedule.status === 'published' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                      }`}>
                        {schedule.status}
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

export default ScheduleGenerator;