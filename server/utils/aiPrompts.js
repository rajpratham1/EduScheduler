// AI prompt templates for different types of schedule modifications

const createBaseSystemPrompt = (scheduleData) => {
  return `You are an AI assistant specialized in educational timetable management. You help administrators modify class schedules, exam timetables, and room assignments using natural language commands.

IMPORTANT: Always respond with valid JSON in the exact format specified below.

Current Schedule Data:
- Total Schedules: ${scheduleData.schedules.length}
- Faculty Members: ${scheduleData.faculty.length}
- Classrooms: ${scheduleData.classrooms.length}
- Students: ${scheduleData.students.length}

Available Faculty: ${scheduleData.faculty.map(f => `${f.name} (ID: ${f.id})`).join(', ')}
Available Classrooms: ${scheduleData.classrooms.map(c => `${c.name} (Capacity: ${c.capacity}, Type: ${c.type})`).join(', ')}

Current Active Schedules:
${scheduleData.schedules.filter(s => s.status !== 'cancelled').map(s => 
  `- ${s.subject} with ${s.faculty} in ${s.classroom} on ${s.day} at ${s.startTime}-${s.endTime} (ID: ${s.id})`
).join('\n')}

RESPONSE FORMAT:
You must respond with a JSON object in this exact format:
{
  "response": "Human-readable explanation of what will be done",
  "modifications": [
    {
      "id": "unique-modification-id",
      "type": "move|cancel|add|update",
      "description": "Clear description of the change",
      "originalData": {original schedule object or null for new items},
      "newData": {new schedule object or null for deletions},
      "affected": ["list of affected entities like faculty names, room names, etc."]
    }
  ],
  "conflicts": ["list of any scheduling conflicts found"],
  "warnings": ["list of warnings or considerations"]
}

MODIFICATION TYPES:
- "move": Change time, day, or room of existing schedule
- "cancel": Cancel/delete existing schedule
- "add": Create new schedule entry
- "update": Modify details of existing schedule (faculty, subject, etc.)

CONFLICT DETECTION:
Always check for:
1. Faculty double-booking (same faculty, same time, same day)
2. Room double-booking (same room, same time, same day)
3. Student group conflicts (if applicable)

SAFETY RULES:
1. Never create modifications that would cause conflicts
2. Always preserve data integrity
3. Provide clear warnings for potentially disruptive changes
4. Suggest alternatives when conflicts are detected`;
};

const createFileAnalysisPrompt = (fileContent, fileType) => {
  return `
UPLOADED FILE ANALYSIS:
File Type: ${fileType}
File Content: ${JSON.stringify(fileContent, null, 2)}

Please analyze this uploaded file and suggest appropriate schedule modifications based on the data provided. Consider:
1. What type of schedule data is in the file
2. How it should be integrated with the current schedule
3. Any conflicts or issues that might arise
4. Recommended actions to take

If the file contains schedule data, propose modifications to add, update, or replace existing schedules as appropriate.`;
};

const createConflictResolutionPrompt = (conflicts) => {
  return `
CONFLICT RESOLUTION NEEDED:
The following conflicts have been detected:
${conflicts.map(c => `- ${c.type}: ${c.message}`).join('\n')}

Please suggest alternative solutions that would avoid these conflicts. Consider:
1. Alternative time slots
2. Different rooms
3. Faculty substitutions
4. Schedule rearrangements

Provide specific recommendations in your response.`;
};

const createBulkModificationPrompt = (modifications) => {
  return `
BULK MODIFICATION REQUEST:
The user is requesting multiple changes:
${modifications.map((m, i) => `${i + 1}. ${m}`).join('\n')}

Please process these requests in order and check for any conflicts between them. If conflicts arise, suggest an optimal sequence or alternative approach.`;
};

// Common schedule modification patterns
const schedulePatterns = {
  timeChange: /(?:move|change|shift|reschedule)\s+(.+?)\s+(?:from|to)\s+(.+?)(?:\s+to\s+(.+?))?/i,
  cancellation: /(?:cancel|delete|remove)\s+(.+)/i,
  addition: /(?:add|create|schedule)\s+(.+?)\s+(?:on|at|in)\s+(.+)/i,
  facultyChange: /(?:assign|change)\s+(.+?)\s+(?:to|for)\s+(.+)/i,
  roomChange: /(?:move|change)\s+(.+?)\s+(?:to|from)\s+(?:room|classroom)\s+(.+)/i,
  dayChange: /(?:move|change)\s+(.+?)\s+(?:to|from)\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i
};

// Extract entities from natural language
const extractEntities = (message, scheduleData) => {
  const entities = {
    faculty: [],
    classrooms: [],
    subjects: [],
    times: [],
    days: []
  };

  // Extract faculty names
  scheduleData.faculty.forEach(f => {
    if (message.toLowerCase().includes(f.name.toLowerCase())) {
      entities.faculty.push(f);
    }
  });

  // Extract classroom names
  scheduleData.classrooms.forEach(c => {
    if (message.toLowerCase().includes(c.name.toLowerCase())) {
      entities.classrooms.push(c);
    }
  });

  // Extract subjects
  scheduleData.schedules.forEach(s => {
    if (message.toLowerCase().includes(s.subject.toLowerCase())) {
      entities.subjects.push(s.subject);
    }
  });

  // Extract times (HH:MM format)
  const timeRegex = /\b([0-1]?[0-9]|2[0-3]):([0-5][0-9])\b/g;
  const timeMatches = message.match(timeRegex);
  if (timeMatches) {
    entities.times = timeMatches;
  }

  // Extract days
  const dayRegex = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi;
  const dayMatches = message.match(dayRegex);
  if (dayMatches) {
    entities.days = dayMatches.map(d => d.charAt(0).toUpperCase() + d.slice(1).toLowerCase());
  }

  return entities;
};

module.exports = {
  createBaseSystemPrompt,
  createFileAnalysisPrompt,
  createConflictResolutionPrompt,
  createBulkModificationPrompt,
  schedulePatterns,
  extractEntities
};