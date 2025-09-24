const { body, validationResult } = require('express-validator');

// Input sanitization
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/[<>]/g, '');
};

// Validation rules for AI modification requests
const validateModificationRequest = [
  body('message')
    .optional()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters')
    .customSanitizer(sanitizeInput),
  
  body('sessionId')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Session ID too long')
    .customSanitizer(sanitizeInput)
];

// Validation rules for applying modifications
const validateApplyModifications = [
  body('modifications')
    .isArray({ min: 1 })
    .withMessage('Modifications must be a non-empty array'),
  
  body('modifications.*.type')
    .isIn(['move', 'cancel', 'add', 'update'])
    .withMessage('Invalid modification type'),
  
  body('modifications.*.description')
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1 and 500 characters')
];

// Check validation results
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Schedule data validation
const validateScheduleData = (scheduleData) => {
  const required = ['subject', 'faculty', 'classroom', 'day', 'startTime', 'endTime'];
  const missing = required.filter(field => !scheduleData[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }

  // Validate time format (HH:MM)
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(scheduleData.startTime) || !timeRegex.test(scheduleData.endTime)) {
    throw new Error('Invalid time format. Use HH:MM format.');
  }

  // Validate day
  const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  if (!validDays.includes(scheduleData.day)) {
    throw new Error('Invalid day. Must be a valid day of the week.');
  }

  return true;
};

// Conflict detection
const detectConflicts = (newSchedule, existingSchedules) => {
  const conflicts = [];

  for (const existing of existingSchedules) {
    // Skip if same schedule
    if (existing.id === newSchedule.id) continue;

    // Check if same day
    if (existing.day !== newSchedule.day) continue;

    // Check time overlap
    const newStart = timeToMinutes(newSchedule.startTime);
    const newEnd = timeToMinutes(newSchedule.endTime);
    const existingStart = timeToMinutes(existing.startTime);
    const existingEnd = timeToMinutes(existing.endTime);

    const hasTimeOverlap = (newStart < existingEnd && newEnd > existingStart);

    if (hasTimeOverlap) {
      // Faculty conflict
      if (existing.faculty === newSchedule.faculty) {
        conflicts.push({
          type: 'faculty_conflict',
          message: `Faculty ${existing.faculty} is already scheduled at this time`,
          conflictingSchedule: existing
        });
      }

      // Room conflict
      if (existing.classroom === newSchedule.classroom) {
        conflicts.push({
          type: 'room_conflict',
          message: `Classroom ${existing.classroom} is already booked at this time`,
          conflictingSchedule: existing
        });
      }
    }
  }

  return conflicts;
};

// Helper function to convert time to minutes
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

module.exports = {
  sanitizeInput,
  validateModificationRequest,
  validateApplyModifications,
  checkValidation,
  validateScheduleData,
  detectConflicts
};