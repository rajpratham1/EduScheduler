// utils/scheduleUtils.ts
import type { ClassSchedule, HydratedClassSchedule, Subject, Faculty, Classroom } from '../types.ts';

export const hydrateSchedule = (
    schedule: ClassSchedule[],
    subjects: Subject[],
    faculty: Faculty[],
    classrooms: Classroom[]
): HydratedClassSchedule[] => {
    const subjectsMap = new Map(subjects.map(s => [s.id, s.name]));
    const facultyMap = new Map(faculty.map(f => [f.id, f.name]));
    const classroomsMap = new Map(classrooms.map(c => [c.id, c.name]));

    return schedule.map((entry, index) => ({
        ...entry,
        // FIX: The `ClassSchedule` type does not have an `id`. Use index for a unique key.
        instance_id: `class-${index}-${entry.subject_id}-${entry.faculty_id}`, // More robust unique ID for dnd
        subject: subjectsMap.get(entry.subject_id) || 'Unknown Subject',
        faculty: facultyMap.get(entry.faculty_id) || 'Unknown Faculty',
        classroom: classroomsMap.get(entry.classroom_id) || 'Unknown Classroom',
    }));
};

export const dehydrateSchedule = (schedule: HydratedClassSchedule[]): Omit<ClassSchedule, 'id'>[] => {
    // This function strips the hydrated names, leaving only the essential data for saving.
    // FIX: The `HydratedClassSchedule` type does not have an `id`. Removed from destructuring.
    return schedule.map(({ subject, faculty, classroom, instance_id, ...rest }) => rest);
};

export const getUniqueTimeSlots = (schedule: ClassSchedule[]): string[] => {
    // In a real app, time slots would be managed centrally.
    // For now, we derive them from the full schedule to ensure consistency.
    if (!schedule || schedule.length === 0) {
        return ['9-10', '10-11', '11-12', '1-2', '2-3', '3-4'];
    }
    const uniqueTimeSlots = [...new Set(schedule.map(item => item.time))];
    // A simple sort for time strings like "9-10", "10-11"
    uniqueTimeSlots.sort((a, b) => {
        const aStart = parseInt(a.split('-')[0]);
        const bStart = parseInt(b.split('-')[0]);
        return aStart - bStart;
    });
    return uniqueTimeSlots;
}
