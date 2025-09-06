import { GoogleGenAI, Type } from "@google/genai";
import type { Subject, Faculty, Classroom, Student, HydratedClassSchedule } from '../types.ts';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    throw new Error("API_KEY is not defined in environment variables");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateTimetable = async (
    subjects: Subject[],
    faculty: Faculty[],
    classrooms: Classroom[],
    days: string[],
    timeSlots: string[],
    constraints: string
): Promise<any> => {
    const prompt = `
        You are an expert university scheduler. Your task is to generate a conflict-free weekly class schedule.

        Available Days: ${days.join(', ')}.
        Available Time Slots: ${timeSlots.join(', ')}.

        Here are the subjects to schedule, including their required weekly hours:
        ${subjects.map(s => `- ${s.name}: ${s.weekly_hours} hours`).join('\n')}

        Here is the available faculty:
        ${faculty.map(f => `- ${f.name} (ID: ${f.id})`).join('\n')}

        Here are the available classrooms:
        ${classrooms.map(c => `- ${c.name} (ID: ${c.id}, Type: ${c.type}, Capacity: ${c.capacity})`).join('\n')}

        You MUST adhere to the following hard constraints:
        1.  Each subject must be scheduled for its exact required number of weekly hours. For example, a 3-hour subject needs exactly 3 one-hour slots.
        2.  A faculty member can only teach one class at a time.
        3.  A classroom can only host one class at a time.
        4.  Assign faculty to subjects logically (though you don't have explicit department data for faculty, use your best judgment).

        Consider these soft constraints and user preferences:
        ${constraints || "No specific constraints provided."}

        Generate the complete schedule in the specified JSON format. Ensure every required class hour is placed.
    `;
    
    const responseSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                day: { type: Type.STRING, description: 'Day of the week', enum: days },
                time: { type: Type.STRING, description: 'Time slot', enum: timeSlots },
                subject_id: { type: Type.STRING, description: 'ID of the subject' },
                faculty_id: { type: Type.STRING, description: 'ID of the faculty member' },
                classroom_id: { type: Type.STRING, description: 'ID of the classroom' },
            },
            required: ["day", "time", "subject_id", "faculty_id", "classroom_id"]
        }
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.5,
                thinkingConfig: { thinkingBudget: 0 },
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error generating timetable:", error);
        throw new Error("Failed to generate timetable from AI. Please check the console for details.");
    }
};


// FIX: Changed student type to Pick<Student, 'name'> as only the name is used, resolving type conflict with User object.
export const analyzeStudentWorkload = async (student: Pick<Student, 'name'>, schedule: HydratedClassSchedule[]): Promise<string> => {
    const scheduleSummary = schedule.map(s => `${s.day} ${s.time}: ${s.subject}`).join('\n');
    const prompt = `
        You are an academic advisor AI. Analyze the following student's weekly class schedule and provide a brief, encouraging analysis of their workload.

        Student Name: ${student.name}
        Schedule:
        ${scheduleSummary}

        Your analysis should:
        - Identify any days that are particularly busy or packed.
        - Point out potential challenges (e.g., back-to-back classes, large gaps).
        - Offer a positive and encouraging tone.
        - Keep the analysis concise, around 3-4 sentences.
        - Do not use markdown formatting.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error analyzing workload:", error);
        return "Could not analyze workload due to an error.";
    }
};
