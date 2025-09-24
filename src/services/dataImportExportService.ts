import {
  Student,
  Faculty,
  Subject,
  Classroom,
  Department,
  Schedule,
  ApiResponse,
} from '../types/models';
import comprehensiveFirebaseService from './comprehensiveFirebaseService';

interface ImportResult {
  successful: number;
  failed: number;
  errors: string[];
  warnings: string[];
  data?: any[];
}

interface ExportOptions {
  format: 'csv' | 'json' | 'xlsx';
  includeHeaders: boolean;
  dateFormat: 'ISO' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
  delimiter?: string; // For CSV
}

class DataImportExportService {
  // CSV Parser utility
  private parseCSV(csvContent: string, delimiter: string = ','): string[][] {
    const lines = csvContent.split('\n');
    const result: string[][] = [];

    let currentLine = '';
    let inQuotes = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      currentLine += line;

      for (let j = 0; j < line.length; j++) {
        if (line[j] === '"') {
          inQuotes = !inQuotes;
        }
      }

      if (!inQuotes) {
        if (currentLine.trim()) {
          const row = this.parseCSVRow(currentLine, delimiter);
          result.push(row);
        }
        currentLine = '';
      } else {
        currentLine += '\n';
      }
    }

    return result;
  }

  private parseCSVRow(row: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  // CSV Generator utility
  private generateCSV(data: any[], headers: string[], options: ExportOptions): string {
    const delimiter = options.delimiter || ',';
    const lines: string[] = [];

    if (options.includeHeaders) {
      lines.push(headers.join(delimiter));
    }

    data.forEach(item => {
      const row = headers.map(header => {
        let value = this.getNestedValue(item, header);
        
        // Format dates
        if (value instanceof Date) {
          value = this.formatDate(value, options.dateFormat);
        }

        // Handle arrays
        if (Array.isArray(value)) {
          value = value.join('; ');
        }

        // Handle objects
        if (typeof value === 'object' && value !== null) {
          value = JSON.stringify(value);
        }

        // Escape quotes and wrap in quotes if necessary
        const stringValue = String(value || '');
        if (stringValue.includes(delimiter) || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });

      lines.push(row.join(delimiter));
    });

    return lines.join('\n');
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private formatDate(date: Date, format: string): string {
    switch (format) {
      case 'DD/MM/YYYY':
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      case 'MM/DD/YYYY':
        return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
      default:
        return date.toISOString().split('T')[0];
    }
  }

  // Student Import/Export
  async importStudents(
    adminId: string,
    csvContent: string,
    options: { skipFirstRow?: boolean; delimiter?: string } = {}
  ): Promise<ApiResponse<ImportResult>> {
    try {
      const delimiter = options.delimiter || ',';
      const rows = this.parseCSV(csvContent, delimiter);
      
      if (rows.length === 0) {
        return { success: false, error: 'No data found in CSV' };
      }

      const startIndex = options.skipFirstRow ? 1 : 0;
      const dataRows = rows.slice(startIndex);

      if (dataRows.length === 0) {
        return { success: false, error: 'No data rows found' };
      }

      // Expected CSV format: Name, Roll Number, Email, Department, Semester, Contact Number, Date of Birth, Address, Parent Name, Parent Contact Number
      const requiredColumns = 10;
      const errors: string[] = [];
      const warnings: string[] = [];
      const validStudents: Omit<Student, 'id' | 'uid'>[] = [];

      dataRows.forEach((row, index) => {
        const rowNumber = startIndex + index + 1;

        if (row.length < requiredColumns) {
          errors.push(`Row ${rowNumber}: Missing required columns (expected ${requiredColumns}, got ${row.length})`);
          return;
        }

        const [name, rollNumber, email, department, semester, contactNumber, dateOfBirth, address, parentName, parentContactNumber] = row;

        // Validation
        if (!name.trim()) {
          errors.push(`Row ${rowNumber}: Name is required`);
          return;
        }

        if (!rollNumber.trim()) {
          errors.push(`Row ${rowNumber}: Roll number is required`);
          return;
        }

        if (!email.trim() || !this.isValidEmail(email.trim())) {
          errors.push(`Row ${rowNumber}: Valid email is required`);
          return;
        }

        if (!department.trim()) {
          errors.push(`Row ${rowNumber}: Department is required`);
          return;
        }

        const semesterNum = parseInt(semester);
        if (isNaN(semesterNum) || semesterNum < 1 || semesterNum > 10) {
          errors.push(`Row ${rowNumber}: Valid semester (1-10) is required`);
          return;
        }

        if (!contactNumber.trim()) {
          warnings.push(`Row ${rowNumber}: Contact number is empty`);
        }

        // Parse date of birth
        let parsedDate: Date | undefined;
        if (dateOfBirth.trim()) {
          parsedDate = new Date(dateOfBirth.trim());
          if (isNaN(parsedDate.getTime())) {
            warnings.push(`Row ${rowNumber}: Invalid date format for date of birth`);
            parsedDate = new Date();
          }
        } else {
          parsedDate = new Date();
        }

        const studentData: Omit<Student, 'id' | 'uid'> = {
          name: name.trim(),
          rollNumber: rollNumber.trim(),
          email: email.trim().toLowerCase(),
          department: department.trim(),
          semester: semesterNum,
          contactNumber: contactNumber.trim(),
          dateOfBirth: parsedDate,
          address: address.trim(),
          parentName: parentName.trim(),
          parentContactNumber: parentContactNumber.trim(),
          admissionDate: new Date(),
          status: 'approved',
          academicYear: '2024-25',
          emergencyContact: {
            name: parentName.trim(),
            relationship: 'Parent',
            contactNumber: parentContactNumber.trim(),
          },
          currentSubjects: [],
          attendance: {
            totalClasses: 0,
            attendedClasses: 0,
            percentage: 0,
          },
          adminId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        validStudents.push(studentData);
      });

      if (validStudents.length === 0) {
        return {
          success: false,
          error: 'No valid student records found',
          data: { successful: 0, failed: dataRows.length, errors, warnings },
        };
      }

      // Bulk create students
      const bulkResult = await comprehensiveFirebaseService.bulkCreateStudents(validStudents);
      
      if (!bulkResult.success) {
        return { success: false, error: bulkResult.error };
      }

      const result: ImportResult = {
        successful: bulkResult.data!.successful,
        failed: bulkResult.data!.failed + errors.length,
        errors: [...errors, ...bulkResult.data!.errors],
        warnings,
      };

      return {
        success: true,
        data: result,
        message: `Import completed: ${result.successful} successful, ${result.failed} failed`,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async exportStudents(
    adminId: string,
    options: ExportOptions = { format: 'csv', includeHeaders: true, dateFormat: 'DD/MM/YYYY' }
  ): Promise<ApiResponse<string | Blob>> {
    try {
      const studentsResult = await comprehensiveFirebaseService.getStudents(adminId);
      if (!studentsResult.success) {
        return { success: false, error: 'Failed to fetch students' };
      }

      const students = studentsResult.data.data;

      if (options.format === 'json') {
        const jsonData = JSON.stringify(students, null, 2);
        return { success: true, data: jsonData };
      }

      if (options.format === 'csv') {
        const headers = [
          'name',
          'rollNumber',
          'email',
          'department',
          'semester',
          'contactNumber',
          'dateOfBirth',
          'address',
          'parentName',
          'parentContactNumber',
          'status',
          'academicYear',
          'admissionDate',
        ];

        const csvContent = this.generateCSV(students, headers, options);
        return { success: true, data: csvContent };
      }

      return { success: false, error: 'Unsupported export format' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Faculty Import/Export
  async importFaculty(
    adminId: string,
    csvContent: string,
    options: { skipFirstRow?: boolean; delimiter?: string } = {}
  ): Promise<ApiResponse<ImportResult>> {
    try {
      const delimiter = options.delimiter || ',';
      const rows = this.parseCSV(csvContent, delimiter);
      
      if (rows.length === 0) {
        return { success: false, error: 'No data found in CSV' };
      }

      const startIndex = options.skipFirstRow ? 1 : 0;
      const dataRows = rows.slice(startIndex);

      // Expected CSV format: Name, Email, Department, Designation, Employee ID, Qualification, Experience, Contact Number, Subjects (semicolon separated)
      const requiredColumns = 9;
      const errors: string[] = [];
      const warnings: string[] = [];
      const validFaculty: Omit<Faculty, 'id' | 'uid'>[] = [];

      dataRows.forEach((row, index) => {
        const rowNumber = startIndex + index + 1;

        if (row.length < requiredColumns) {
          errors.push(`Row ${rowNumber}: Missing required columns (expected ${requiredColumns}, got ${row.length})`);
          return;
        }

        const [name, email, department, designation, employeeId, qualification, experienceStr, contactNumber, subjectsStr] = row;

        // Validation
        if (!name.trim()) {
          errors.push(`Row ${rowNumber}: Name is required`);
          return;
        }

        if (!email.trim() || !this.isValidEmail(email.trim())) {
          errors.push(`Row ${rowNumber}: Valid email is required`);
          return;
        }

        if (!department.trim()) {
          errors.push(`Row ${rowNumber}: Department is required`);
          return;
        }

        if (!employeeId.trim()) {
          errors.push(`Row ${rowNumber}: Employee ID is required`);
          return;
        }

        const experience = parseInt(experienceStr);
        if (isNaN(experience) || experience < 0) {
          errors.push(`Row ${rowNumber}: Valid experience (0 or more) is required`);
          return;
        }

        // Parse subjects
        const subjects = subjectsStr ? subjectsStr.split(';').map(s => s.trim()).filter(s => s) : [];

        const facultyData: Omit<Faculty, 'id' | 'uid'> = {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          department: department.trim(),
          subjects,
          designation: designation.trim(),
          contactNumber: contactNumber.trim(),
          joiningDate: new Date(),
          qualification: qualification.trim(),
          experience,
          isActive: true,
          employeeId: employeeId.trim(),
          status: 'active',
          workingHours: {
            start: '09:00',
            end: '17:00',
            workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          },
          preferences: {
            preferredTimeSlots: [],
            maxHoursPerDay: 6,
            maxHoursPerWeek: 30,
          },
          adminId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        validFaculty.push(facultyData);
      });

      let successful = 0;
      const finalErrors: string[] = [...errors];

      // Create faculty members one by one (since we don't have bulk create for faculty)
      for (let i = 0; i < validFaculty.length; i++) {
        const faculty = validFaculty[i];
        const createResult = await comprehensiveFirebaseService.createFaculty(faculty);
        
        if (createResult.success) {
          successful++;
        } else {
          finalErrors.push(`Faculty ${faculty.name}: ${createResult.error}`);
        }
      }

      const result: ImportResult = {
        successful,
        failed: dataRows.length - successful,
        errors: finalErrors,
        warnings,
      };

      return {
        success: true,
        data: result,
        message: `Import completed: ${result.successful} successful, ${result.failed} failed`,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async exportFaculty(
    adminId: string,
    options: ExportOptions = { format: 'csv', includeHeaders: true, dateFormat: 'DD/MM/YYYY' }
  ): Promise<ApiResponse<string | Blob>> {
    try {
      const facultyResult = await comprehensiveFirebaseService.getFaculty(adminId);
      if (!facultyResult.success) {
        return { success: false, error: 'Failed to fetch faculty' };
      }

      const faculty = facultyResult.data.data;

      if (options.format === 'json') {
        const jsonData = JSON.stringify(faculty, null, 2);
        return { success: true, data: jsonData };
      }

      if (options.format === 'csv') {
        const headers = [
          'name',
          'email',
          'department',
          'designation',
          'employeeId',
          'qualification',
          'experience',
          'contactNumber',
          'subjects',
          'status',
          'joiningDate',
        ];

        const csvContent = this.generateCSV(faculty, headers, options);
        return { success: true, data: csvContent };
      }

      return { success: false, error: 'Unsupported export format' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Subject Import/Export
  async importSubjects(
    adminId: string,
    csvContent: string,
    options: { skipFirstRow?: boolean; delimiter?: string } = {}
  ): Promise<ApiResponse<ImportResult>> {
    try {
      const delimiter = options.delimiter || ',';
      const rows = this.parseCSV(csvContent, delimiter);
      
      if (rows.length === 0) {
        return { success: false, error: 'No data found in CSV' };
      }

      const startIndex = options.skipFirstRow ? 1 : 0;
      const dataRows = rows.slice(startIndex);

      // Expected CSV format: Name, Code, Department, Semester, Credits, Hours Per Week, Type, Requires Lab, Prerequisites, Description
      const requiredColumns = 10;
      const errors: string[] = [];
      const warnings: string[] = [];
      const validSubjects: Omit<Subject, 'id'>[] = [];

      dataRows.forEach((row, index) => {
        const rowNumber = startIndex + index + 1;

        if (row.length < requiredColumns) {
          errors.push(`Row ${rowNumber}: Missing required columns (expected ${requiredColumns}, got ${row.length})`);
          return;
        }

        const [name, code, department, semesterStr, creditsStr, hoursStr, type, requiresLabStr, prerequisitesStr, description] = row;

        // Validation
        if (!name.trim()) {
          errors.push(`Row ${rowNumber}: Name is required`);
          return;
        }

        if (!code.trim()) {
          errors.push(`Row ${rowNumber}: Code is required`);
          return;
        }

        if (!department.trim()) {
          errors.push(`Row ${rowNumber}: Department is required`);
          return;
        }

        const semester = parseInt(semesterStr);
        if (isNaN(semester) || semester < 1 || semester > 10) {
          errors.push(`Row ${rowNumber}: Valid semester (1-10) is required`);
          return;
        }

        const credits = parseInt(creditsStr);
        if (isNaN(credits) || credits < 1) {
          errors.push(`Row ${rowNumber}: Valid credits (1 or more) is required`);
          return;
        }

        const hoursPerWeek = parseInt(hoursStr);
        if (isNaN(hoursPerWeek) || hoursPerWeek < 1) {
          errors.push(`Row ${rowNumber}: Valid hours per week (1 or more) is required`);
          return;
        }

        if (type !== 'theory' && type !== 'practical') {
          errors.push(`Row ${rowNumber}: Type must be 'theory' or 'practical'`);
          return;
        }

        const requiresLab = requiresLabStr.toLowerCase() === 'true' || requiresLabStr.toLowerCase() === 'yes';
        const prerequisites = prerequisitesStr ? prerequisitesStr.split(';').map(p => p.trim()).filter(p => p) : [];

        const subjectData: Omit<Subject, 'id'> = {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          department: department.trim(),
          semester,
          credits,
          description: description.trim(),
          hoursPerWeek,
          requiresLab,
          prerequisites,
          type: type as 'theory' | 'practical',
          duration: 60, // Default duration
          adminId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        validSubjects.push(subjectData);
      });

      let successful = 0;
      const finalErrors: string[] = [...errors];

      // Create subjects one by one
      for (let i = 0; i < validSubjects.length; i++) {
        const subject = validSubjects[i];
        const createResult = await comprehensiveFirebaseService.createSubject(subject);
        
        if (createResult.success) {
          successful++;
        } else {
          finalErrors.push(`Subject ${subject.name}: ${createResult.error}`);
        }
      }

      const result: ImportResult = {
        successful,
        failed: dataRows.length - successful,
        errors: finalErrors,
        warnings,
      };

      return {
        success: true,
        data: result,
        message: `Import completed: ${result.successful} successful, ${result.failed} failed`,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async exportSubjects(
    adminId: string,
    options: ExportOptions = { format: 'csv', includeHeaders: true, dateFormat: 'DD/MM/YYYY' }
  ): Promise<ApiResponse<string | Blob>> {
    try {
      const subjectsResult = await comprehensiveFirebaseService.getSubjects(adminId);
      if (!subjectsResult.success) {
        return { success: false, error: 'Failed to fetch subjects' };
      }

      const subjects = subjectsResult.data;

      if (options.format === 'json') {
        const jsonData = JSON.stringify(subjects, null, 2);
        return { success: true, data: jsonData };
      }

      if (options.format === 'csv') {
        const headers = [
          'name',
          'code',
          'department',
          'semester',
          'credits',
          'hoursPerWeek',
          'type',
          'requiresLab',
          'prerequisites',
          'description',
        ];

        const csvContent = this.generateCSV(subjects, headers, options);
        return { success: true, data: csvContent };
      }

      return { success: false, error: 'Unsupported export format' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Classroom Import/Export
  async importClassrooms(
    adminId: string,
    csvContent: string,
    options: { skipFirstRow?: boolean; delimiter?: string } = {}
  ): Promise<ApiResponse<ImportResult>> {
    try {
      const delimiter = options.delimiter || ',';
      const rows = this.parseCSV(csvContent, delimiter);
      
      if (rows.length === 0) {
        return { success: false, error: 'No data found in CSV' };
      }

      const startIndex = options.skipFirstRow ? 1 : 0;
      const dataRows = rows.slice(startIndex);

      // Expected CSV format: Name, Building, Floor, Room Number, Capacity, Type, Is Lab, Department, Facilities
      const requiredColumns = 9;
      const errors: string[] = [];
      const warnings: string[] = [];
      const validClassrooms: Omit<Classroom, 'id'>[] = [];

      dataRows.forEach((row, index) => {
        const rowNumber = startIndex + index + 1;

        if (row.length < requiredColumns) {
          errors.push(`Row ${rowNumber}: Missing required columns (expected ${requiredColumns}, got ${row.length})`);
          return;
        }

        const [name, building, floorStr, roomNumber, capacityStr, type, isLabStr, department, facilitiesStr] = row;

        // Validation
        if (!name.trim()) {
          errors.push(`Row ${rowNumber}: Name is required`);
          return;
        }

        if (!building.trim()) {
          errors.push(`Row ${rowNumber}: Building is required`);
          return;
        }

        const floor = parseInt(floorStr);
        if (isNaN(floor) || floor < 0) {
          errors.push(`Row ${rowNumber}: Valid floor number (0 or more) is required`);
          return;
        }

        if (!roomNumber.trim()) {
          errors.push(`Row ${rowNumber}: Room number is required`);
          return;
        }

        const capacity = parseInt(capacityStr);
        if (isNaN(capacity) || capacity < 1) {
          errors.push(`Row ${rowNumber}: Valid capacity (1 or more) is required`);
          return;
        }

        if (!type.trim()) {
          errors.push(`Row ${rowNumber}: Type is required`);
          return;
        }

        if (!department.trim()) {
          errors.push(`Row ${rowNumber}: Department is required`);
          return;
        }

        const isLab = isLabStr.toLowerCase() === 'true' || isLabStr.toLowerCase() === 'yes';
        const facilities = facilitiesStr ? facilitiesStr.split(';').map(f => f.trim()).filter(f => f) : [];

        const classroomData: Omit<Classroom, 'id'> = {
          name: name.trim(),
          building: building.trim(),
          floor,
          roomNumber: roomNumber.trim(),
          capacity,
          type: type.trim(),
          facilities,
          isLab,
          department: department.trim(),
          adminId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        validClassrooms.push(classroomData);
      });

      let successful = 0;
      const finalErrors: string[] = [...errors];

      // Create classrooms one by one
      for (let i = 0; i < validClassrooms.length; i++) {
        const classroom = validClassrooms[i];
        const createResult = await comprehensiveFirebaseService.createClassroom(classroom);
        
        if (createResult.success) {
          successful++;
        } else {
          finalErrors.push(`Classroom ${classroom.name}: ${createResult.error}`);
        }
      }

      const result: ImportResult = {
        successful,
        failed: dataRows.length - successful,
        errors: finalErrors,
        warnings,
      };

      return {
        success: true,
        data: result,
        message: `Import completed: ${result.successful} successful, ${result.failed} failed`,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async exportClassrooms(
    adminId: string,
    options: ExportOptions = { format: 'csv', includeHeaders: true, dateFormat: 'DD/MM/YYYY' }
  ): Promise<ApiResponse<string | Blob>> {
    try {
      const classroomsResult = await comprehensiveFirebaseService.getClassrooms(adminId);
      if (!classroomsResult.success) {
        return { success: false, error: 'Failed to fetch classrooms' };
      }

      const classrooms = classroomsResult.data;

      if (options.format === 'json') {
        const jsonData = JSON.stringify(classrooms, null, 2);
        return { success: true, data: jsonData };
      }

      if (options.format === 'csv') {
        const headers = [
          'name',
          'building',
          'floor',
          'roomNumber',
          'capacity',
          'type',
          'isLab',
          'department',
          'facilities',
        ];

        const csvContent = this.generateCSV(classrooms, headers, options);
        return { success: true, data: csvContent };
      }

      return { success: false, error: 'Unsupported export format' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Generate import templates
  async generateImportTemplate(
    type: 'students' | 'faculty' | 'subjects' | 'classrooms',
    format: 'csv' | 'xlsx' = 'csv'
  ): Promise<ApiResponse<string | Blob>> {
    try {
      let headers: string[] = [];
      let sampleData: any[] = [];

      switch (type) {
        case 'students':
          headers = ['Name', 'Roll Number', 'Email', 'Department', 'Semester', 'Contact Number', 'Date of Birth', 'Address', 'Parent Name', 'Parent Contact Number'];
          sampleData = [{
            'Name': 'John Doe',
            'Roll Number': '2024001',
            'Email': 'john.doe@example.com',
            'Department': 'Computer Science',
            'Semester': '1',
            'Contact Number': '+1234567890',
            'Date of Birth': '2000-01-01',
            'Address': '123 Main St, City',
            'Parent Name': 'Jane Doe',
            'Parent Contact Number': '+1234567891',
          }];
          break;

        case 'faculty':
          headers = ['Name', 'Email', 'Department', 'Designation', 'Employee ID', 'Qualification', 'Experience', 'Contact Number', 'Subjects'];
          sampleData = [{
            'Name': 'Dr. Smith',
            'Email': 'dr.smith@example.com',
            'Department': 'Computer Science',
            'Designation': 'Professor',
            'Employee ID': 'EMP001',
            'Qualification': 'PhD Computer Science',
            'Experience': '10',
            'Contact Number': '+1234567890',
            'Subjects': 'Data Structures; Algorithms; Programming',
          }];
          break;

        case 'subjects':
          headers = ['Name', 'Code', 'Department', 'Semester', 'Credits', 'Hours Per Week', 'Type', 'Requires Lab', 'Prerequisites', 'Description'];
          sampleData = [{
            'Name': 'Data Structures',
            'Code': 'CS201',
            'Department': 'Computer Science',
            'Semester': '3',
            'Credits': '4',
            'Hours Per Week': '4',
            'Type': 'theory',
            'Requires Lab': 'true',
            'Prerequisites': 'CS101; Programming Fundamentals',
            'Description': 'Introduction to data structures and algorithms',
          }];
          break;

        case 'classrooms':
          headers = ['Name', 'Building', 'Floor', 'Room Number', 'Capacity', 'Type', 'Is Lab', 'Department', 'Facilities'];
          sampleData = [{
            'Name': 'Computer Lab 1',
            'Building': 'Main Building',
            'Floor': '1',
            'Room Number': '101',
            'Capacity': '40',
            'Type': 'laboratory',
            'Is Lab': 'true',
            'Department': 'Computer Science',
            'Facilities': 'Projector; Air Conditioning; Computers',
          }];
          break;
      }

      if (format === 'csv') {
        const options: ExportOptions = {
          format: 'csv',
          includeHeaders: true,
          dateFormat: 'DD/MM/YYYY',
        };
        
        const csvContent = this.generateCSV(sampleData, headers, options);
        return { success: true, data: csvContent };
      }

      return { success: false, error: 'Unsupported format' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Validation utilities
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // File processing utilities
  async processUploadedFile(file: File): Promise<ApiResponse<string>> {
    try {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        return { success: false, error: 'Only CSV files are supported' };
      }

      const content = await this.readFileAsText(file);
      return { success: true, data: content };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  // Download utilities
  downloadFile(content: string, filename: string, mimeType: string = 'text/csv'): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
}

export const dataImportExportService = new DataImportExportService();
export default dataImportExportService;