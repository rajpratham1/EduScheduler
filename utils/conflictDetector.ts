// utils/conflictDetector.ts
import type { HydratedClassSchedule, Conflict, Subject } from '../types.ts';

export const detectConflicts = (
    schedule: HydratedClassSchedule[], 
    subjects: Subject[],
    constraintsText: string
): Conflict[] => {
    const conflicts: Conflict[] = [];
    const scheduleByTimeSlot: { [key: string]: HydratedClassSchedule[] } = {};

    schedule.forEach(entry => {
        const key = `${entry.day}-${entry.time}`;
        if (!scheduleByTimeSlot[key]) scheduleByTimeSlot[key] = [];
        scheduleByTimeSlot[key].push(entry);
    });

    // 1. Hard Conflict: Double Bookings
    for (const key in scheduleByTimeSlot) {
        const entries = scheduleByTimeSlot[key];
        if (entries.length <= 1) continue;

        const facultyUsage: { [key: string]: string[] } = {};
        const classroomUsage: { [key: string]: string[] } = {};

        entries.forEach(entry => {
            if (entry.faculty) facultyUsage[entry.faculty] = (facultyUsage[entry.faculty] || []).concat(entry.subject);
            if (entry.classroom) classroomUsage[entry.classroom] = (classroomUsage[entry.classroom] || []).concat(entry.subject);
        });

        for (const faculty in facultyUsage) {
            if (facultyUsage[faculty].length > 1) {
                conflicts.push({
                    type: 'Hard',
                    message: `${faculty} is double-booked for ${facultyUsage[faculty].join(' and ')}.`,
                    severity: 'error'
                });
            }
        }
        for (const classroom in classroomUsage) {
            if (classroomUsage[classroom].length > 1) {
                conflicts.push({
                    type: 'Hard',
                    message: `${classroom} is double-booked for ${classroomUsage[classroom].join(' and ')}.`,
                    severity: 'error'
                });
            }
        }
    }
    
    // 2. Hard Conflict: Subject Hours Mismatch
    const subjectHoursCount: { [key: string]: number } = {};
    schedule.forEach(entry => {
        subjectHoursCount[entry.subject] = (subjectHoursCount[entry.subject] || 0) + 1;
    });

    subjects.forEach(subject => {
        const scheduledHours = subjectHoursCount[subject.name] || 0;
        if (scheduledHours !== subject.weekly_hours) {
            conflicts.push({
                type: 'Hard',
                message: `${subject.name} requires ${subject.weekly_hours} hours but is scheduled for ${scheduledHours}.`,
                severity: 'error'
            });
        }
    });

    // 3. Soft Conflict: Text-based Constraint Violations (Simple Check)
    const constraintLines = constraintsText.toLowerCase().split('\n').filter(line => line.trim() !== '');

    constraintLines.forEach(line => {
        // Check for unavailability
        if (line.includes('unavailable') || line.includes('not available')) {
            const facultyMatch = /(.+?)\s+is\s+unavailable\s+on\s+(monday|tuesday|wednesday|thursday|friday)/.exec(line);
            if (facultyMatch) {
                const [, facultyName, day] = facultyMatch;
                schedule.forEach(entry => {
                    if (entry.faculty.toLowerCase().includes(facultyName.trim()) && entry.day.toLowerCase() === day.trim()) {
                        conflicts.push({
                            type: 'Soft',
                            message: `Constraint Violation: ${facultyName} may be scheduled on ${day}, but was marked as unavailable.`,
                            severity: 'warning'
                        });
                    }
                });
            }
        }
        // Check for room preference
        if (line.includes('must be in')) {
            const roomMatch = /(.+?)\s+must\s+be\s+in\s+(a\s*)?(.+)/.exec(line);
            if (roomMatch) {
                const [, subject, , room] = roomMatch;
                schedule.forEach(entry => {
                    if (entry.subject.toLowerCase().includes(subject.trim()) && !entry.classroom.toLowerCase().includes(room.trim().replace('.', ''))) {
                         conflicts.push({
                            type: 'Soft',
                            message: `Constraint Violation: ${subject} is scheduled in ${entry.classroom} but should be in a ${room}.`,
                            severity: 'warning'
                        });
                    }
                });
            }
        }
    });


    // Remove duplicates
    return conflicts.filter((c, index, self) => 
        index === self.findIndex((t) => (
            t.message === c.message
        ))
    );
};