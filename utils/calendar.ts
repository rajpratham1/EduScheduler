// Fix: Use a relative path for the local type import.
// FIX: Replace `ScheduleEntry` with `HydratedClassSchedule` as `ScheduleEntry` is not an exported type.
import type { HydratedClassSchedule } from '../types';
import { DAYS_OF_WEEK } from '../constants';

// Helper to format a date into YYYYMMDDTHHMMSSZ format for iCalendar
const toICSDate = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

// Helper to get the date of the next occurrence of a given day of the week
const getNextDayOfWeek = (dayOfWeek: string, hour: number, minute: number): Date => {
    const dayIndex = DAYS_OF_WEEK.findIndex(d => d.toLowerCase() === dayOfWeek.toLowerCase());
    if (dayIndex === -1) throw new Error("Invalid day of the week");

    const now = new Date();
    const resultDate = new Date(now.getTime());

    // Set time first
    resultDate.setHours(hour, minute, 0, 0);

    // Find the next correct day
    const currentDay = now.getDay(); // Sunday = 0, Monday = 1...
    // Adjust dayIndex to match getDay() (Monday=0 in our array, but 1 in getDay())
    const targetDay = (dayIndex + 1) % 7; 
    
    let diff = targetDay - currentDay;
    if (diff <= 0 && now.getHours() > hour) {
      diff += 7;
    } else if (diff < 0) {
      diff += 7;
    }


    resultDate.setDate(now.getDate() + diff);
    
    return resultDate;
}

export const generateICSFile = (entry: HydratedClassSchedule) => {
    if (!entry.subject || !entry.faculty || !entry.classroom) return;

    try {
        // Parse time string like "9-10" or "10:30-11:30"
        const timeParts = entry.time.split(/[-]/);
        const [startHour, startMinute] = timeParts[0].split(':').map(Number);
        const [endHour, endMinute] = timeParts[1].split(':').map(Number);

        const startDate = getNextDayOfWeek(entry.day, startHour, startMinute || 0);
        const endDate = getNextDayOfWeek(entry.day, endHour, endMinute || 0);

        const uid = `${startDate.getTime()}-${entry.subject.replace(/\s/g, '')}@aicalendar.com`;
        const stamp = toICSDate(new Date());

        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//AI Timetable Generator//EN',
            'BEGIN:VEVENT',
            `UID:${uid}`,
            `DTSTAMP:${stamp}`,
            `DTSTART:${toICSDate(startDate)}`,
            `DTEND:${toICSDate(endDate)}`,
            `SUMMARY:${entry.subject}`,
            `LOCATION:${entry.classroom}`,
            `DESCRIPTION:Taught by: ${entry.faculty}`,
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\n');

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${entry.subject}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error("Failed to generate ICS file:", error);
        alert("Sorry, there was an error creating the calendar event file.");
    }
};
