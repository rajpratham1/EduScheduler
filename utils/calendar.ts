import type { HydratedClassSchedule } from '../types.ts';

// Simple function to get the date of the next instance of a given weekday
const getNextDayOfWeek = (dayName: string, daysOfWeek: string[]): Date => {
    const today = new Date();
    const dayIndex = daysOfWeek.map(d => d.toLowerCase()).indexOf(dayName.toLowerCase());
    if (dayIndex === -1) return today; // Fallback

    const todayDayIndex = (today.getDay() + 6) % 7; // Monday is 0
    let dayDifference = dayIndex - todayDayIndex;
    if (dayDifference < 0) {
        dayDifference += 7;
    }

    const nextDate = new Date();
    nextDate.setDate(today.getDate() + dayDifference);
    return nextDate;
};

export const getIcs = (classInfo: HydratedClassSchedule, daysOfWeek: string[]): string => {
    const date = getNextDayOfWeek(classInfo.day, daysOfWeek);
    const [startHour] = classInfo.time.split('-').map(Number);
    
    // Adjust for PM hours if necessary (simple assumption for "1-2" etc.)
    const adjustedStartHour = startHour < 9 ? startHour + 12 : startHour;
    const endHour = adjustedStartHour + 1;
    
    date.setHours(adjustedStartHour, 0, 0, 0);
    const startDate = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    date.setHours(endHour, 0, 0, 0);
    const endDate = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const event = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        `UID:${classInfo.instance_id}@eduscheduler.com`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'}`,
        `DTSTART:${startDate}`,
        `DTEND:${endDate}`,
        `SUMMARY:${classInfo.subject}`,
        `DESCRIPTION:Faculty: ${classInfo.faculty}\\nClassroom: ${classInfo.classroom}`,
        `LOCATION:${classInfo.classroom}`,
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\n');

    return `data:text/calendar;charset=utf-8,${encodeURIComponent(event)}`;
}