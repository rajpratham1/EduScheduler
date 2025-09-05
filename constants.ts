// Populated constants file with default values and arrays for use across the application.
export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const DEFAULT_INPUTS = {
  subjects: 'Math (4 hours), Science (4 hours), History (3 hours), English (4 hours), Physical Education (2 hours), Art (2 hours), Computer Science (3 hours)',
  faculty: 'Mr. Smith (Math), Ms. Jones (Science), Mrs. Davis (History), Mr. Brown (English), Coach Miller (PE), Ms. Wilson (Art), Mr. Garcia (Computer Science)',
  classrooms: 'Room 101, Room 102, Room 103, Science Lab, Gym, Art Studio, Computer Lab',
  timeSlots: '9-10, 10-11, 11-12, 1-2, 2-3, 3-4',
  constraints: `
- Science classes must be in the Science Lab.
- Physical Education must be in the Gym.
- Art classes must be in the Art Studio.
- Computer Science must be in the Computer Lab.
- Mr. Smith is unavailable on Fridays.
- Ms. Jones prefers teaching in the morning.
- No back-to-back Math classes for students.
- Try to schedule a break for students around noon.
  `.trim(),
  electiveGroups: `
- Group A: Art, Computer Science
  `.trim(),
};
