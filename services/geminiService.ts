// services/geminiService.ts
import { GoogleGenAI, Type } from "@google/genai";
import type { Subject, Faculty, Classroom, ClassSchedule, Student, HydratedClassSchedule } from '../types';
import { DAYS_OF_WEEK } from '../constants';

const apiKey = import.meta.env.VITE_API_KEY;

if (!apiKey) {
  alert("VITE_API_KEY environment variable is not set. Please follow the setup instructions in README.md.");
  throw new Error("VITE_API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: apiKey as string });

interface GenerationParams {
    subjects: Subject[];
    faculty: Faculty[];
    classrooms: Classroom[];
    timeSlots: string;
    constraints: string;
}

const buildPrompt = (params: GenerationParams): string => {
    const { subjects, faculty, classrooms, timeSlots, constraints } = params;

    const subjectsList = subjects.map(s => `- ${s.name} (ID: ${s.id}, ${s.weekly_hours} hours/week, Department ID: ${s.department_id})`).join('\n');
    const facultyList = faculty.map(f => `- ${f.name} (ID: ${f.id}, Department ID: ${f.department_id})`).join('\n');
    const classroomsList = classrooms.map(c => `- ${c.name} (ID: ${c.id}, Type: ${c.type}, Capacity: ${c.capacity})`).join('\n');

    return `
You are an expert university timetable scheduler. Your task is to generate an optimal weekly class schedule based on the provided data and constraints. The output must be a valid JSON array of schedule entries.

**Goal:** Schedule all subjects for their required weekly hours, respecting all hard and soft constraints.

**Input Data:**

*   **Days of the Week:** ${DAYS_OF_WEEK.join(', ')}
*   **Available Time Slots per Day:** ${timeSlots}

*   **Subjects to Schedule (with required weekly hours):**
${subjectsList}

*   **Available Faculty (each belongs to a department):**
${facultyList}

*   **Available Classrooms:**
${classroomsList}

**Rules and Constraints:**
${constraints}

**Additional Implicit Rules:**
1.  A faculty member can only teach one class at a time.
2.  A classroom can only host one class at a time.
3.  Assign faculty to subjects from the same department. For example, a faculty from the 'Science' department (department_id: 2) should teach 'Science' subjects (department_id: 2).
4.  The total number of scheduled slots for each subject must exactly match its required weekly hours.
5.  Each scheduled class lasts for one time slot. For a subject requiring 4 hours, you must create 4 separate entries in the schedule.

**Output Format:**
Please generate a JSON array of schedule objects. Each object must conform to the provided JSON schema, containing 'day', 'time', 'subject_id', 'faculty_id', and 'classroom_id'. Do not include any other text or explanations outside of the JSON array.
`.trim();
};

const scheduleSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            day: {
                type: Type.STRING,
                description: 'Day of the week (e.g., "Monday"). Must be one of the specified days.',
                enum: DAYS_OF_WEEK,
            },
            time: {
                type: Type.STRING,
                description: 'Time slot for the class (e.g., "9-10"). Must be one of the specified time slots.',
            },
            subject_id: {
                type: Type.NUMBER,
                description: 'The ID of the subject being taught.',
            },
            faculty_id: {
                type: Type.NUMBER,
                description: 'The ID of the faculty member teaching the class.',
            },
            classroom_id: {
                type: Type.NUMBER,
                description: 'The ID of the classroom where the class is held.',
            },
        },
        required: ["day", "time", "subject_id", "faculty_id", "classroom_id"]
    }
};


export const generateTimetable = async (params: GenerationParams): Promise<Omit<ClassSchedule, 'id'>[]> => {
    const prompt = buildPrompt(params);

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: scheduleSchema,
                temperature: 0.2,
            },
        });

        const jsonText = response.text.trim();
        const cleanedJsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        const schedule = JSON.parse(cleanedJsonText);
        
        if (!Array.isArray(schedule)) {
            throw new Error("Gemini did not return a valid JSON array.");
        }

        return schedule as Omit<ClassSchedule, 'id'>[];

    } catch (error) {
        console.error("Error generating timetable with Gemini:", error);
        if (error instanceof Error && error.message.includes('JSON')) {
             throw new Error("The AI model returned an invalid schedule format. Please try again.");
        }
        throw new Error("Failed to communicate with the AI scheduling service. Please check your connection and API key.");
    }
};

export const analyzeStudentWorkload = async (student: Student, schedule: HydratedClassSchedule[]): Promise<string> => {
    const scheduleText = schedule.map(s => `- ${s.day} ${s.time}: ${s.subject} with ${s.faculty} in ${s.classroom}`).join('\n');

    const prompt = `
You are an expert academic advisor AI. Your task is to analyze a student's weekly class schedule and provide a brief, qualitative analysis of their academic workload.

**Student Information:**
- Name: ${student.name}

**Student's Schedule:**
${scheduleText.length > 0 ? scheduleText : "This student has no classes scheduled."}

**Analysis Task:**
Based on the schedule, provide a 2-3 sentence analysis. Focus on potential stress points or positive aspects. Consider the following:
- Are there many difficult core subjects scheduled back-to-back on the same day?
- Are there sufficient breaks, or are days very fragmented (e.g., one class early in the morning and one late in the afternoon)?
- Is the overall distribution of classes balanced throughout the week?

Provide a concise, helpful summary. Do not just list the classes.
    `.trim();

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 0.5,
            }
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error analyzing workload with Gemini:", error);
        return "Could not analyze the student's workload at this time.";
    }
};
