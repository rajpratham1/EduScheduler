const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { OpenAI } = require('openai');
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const ExcelJS = require('exceljs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Log environment variables
console.log('Environment variables:', {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  CORS_ORIGIN: process.env.CORS_ORIGIN
});

// Initialize Firebase Admin
const { initializeFirebase } = require('./config/firebase');
const adminApp = initializeFirebase();
const db = adminApp.firestore();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const facultyRoutes = require('./routes/faculty');
const departmentRoutes = require('./routes/department');
const subjectRoutes = require('./routes/subject');
const classroomRoutes = require('./routes/classroom');
const scheduleRoutes = require('./routes/schedule');
const studentRoutes = require('./routes/student');
const attendanceRoutes = require('./routes/attendance');
const assignmentRoutes = require('./routes/assignments');
const feedbackRoutes = require('./routes/feedback');
const announcementRoutes = require('./routes/announcements');
const adminCodesRoutes = require('./routes/adminCodes');

app.use('/api/admin', adminRoutes);
app.use('/api/admin-codes', adminCodesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/department', departmentRoutes);
app.use('/api/subject', subjectRoutes);
app.use('/api/classroom', classroomRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/announcements', announcementRoutes);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/json'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV, Excel, and JSON files are allowed.'));
    }
  }
});

// Rate limiting middleware
const rateLimit = {};
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;

const rateLimitMiddleware = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!rateLimit[clientIP]) {
    rateLimit[clientIP] = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
  } else if (now > rateLimit[clientIP].resetTime) {
    rateLimit[clientIP] = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
  } else if (rateLimit[clientIP].count >= RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
  } else {
    rateLimit[clientIP].count++;
  }
  
  next();
};

// Input validation and sanitization
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/[<>]/g, '');
};

// Parse uploaded file content
const parseFileContent = async (filePath, mimetype) => {
  try {
    if (mimetype === 'text/csv') {
      const results = [];
      return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', () => resolve(results))
          .on('error', reject);
      });
    } else if (mimetype.includes('sheet') || mimetype.includes('excel')) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const worksheet = workbook.getWorksheet(1);
      const results = [];
      
      // Get headers from first row
      const headers = worksheet.getRow(1).values.slice(1); // Remove the first empty cell
      
      // Read all rows except header
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          rowData[headers[colNumber - 1]] = cell.value;
        });
        results.push(rowData);
      });
      return results;
    } else if (mimetype === 'application/json') {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    }
    throw new Error('Unsupported file type');
  } catch (error) {
    throw new Error(`Failed to parse file: ${error.message}`);
  }
};

// Get current schedule data from Firebase
const getCurrentScheduleData = async () => {
  try {
    const [schedules, faculty, classrooms, students] = await Promise.all([
      db.collection('schedules').get(),
      db.collection('faculty').get(),
      db.collection('classrooms').get(),
      db.collection('students').get()
    ]);

    return {
      schedules: schedules.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      faculty: faculty.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      classrooms: classrooms.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      students: students.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    };
  } catch (error) {
    throw new Error(`Failed to fetch schedule data: ${error.message}`);
  }
};

// Create system prompt for ChatGPT
const createSystemPrompt = (scheduleData, fileContent = null) => {
  let prompt = `You are an AI assistant specialized in educational timetable management. You help administrators modify class schedules, exam timetables, and room assignments using natural language commands.

Current Schedule Data:
- Total Schedules: ${scheduleData.schedules.length}
- Faculty Members: ${scheduleData.faculty.length}
- Classrooms: ${scheduleData.classrooms.length}
- Students: ${scheduleData.students.length}

Available Faculty: ${scheduleData.faculty.map(f => f.name).join(', ')}
Available Classrooms: ${scheduleData.classrooms.map(c => c.name).join(', ')}

Current Schedules:
${scheduleData.schedules.map(s => 
  `- ${s.subject} with ${s.faculty} in ${s.classroom} on ${s.day} at ${s.startTime}-${s.endTime}`
).join('\n')}

When processing requests:
1. Analyze the natural language command carefully
2. Identify what changes need to be made
3. Check for conflicts (room double-booking, faculty conflicts, etc.)
4. Provide a clear response with proposed modifications
5. Format your response as JSON with the following structure:

{
  "response": "Human-readable explanation of what will be done",
  "modifications": [
    {
      "id": "unique-id",
      "type": "move|cancel|add|update",
      "description": "Clear description of the change",
      "originalData": {...},
      "newData": {...},
      "affected": ["list of affected entities"]
    }
  ],
  "conflicts": ["list of any conflicts found"],
  "warnings": ["list of warnings or considerations"]
}

Always prioritize data integrity and avoid scheduling conflicts.`;

  if (fileContent) {
    prompt += `\n\nUploaded File Data:\n${JSON.stringify(fileContent, null, 2)}`;
  }

  return prompt;
};

// Main AI modification endpoint
app.post('/api/ai-schedule-modify', rateLimitMiddleware, upload.single('file'), async (req, res) => {
  try {
    const message = sanitizeInput(req.body.message);
    const sessionId = req.body.sessionId;
    
    if (!message && !req.file) {
      return res.status(400).json({ error: 'Message or file is required' });
    }

    // Get current schedule data
    const scheduleData = await getCurrentScheduleData();
    
    // Parse uploaded file if present
    let fileContent = null;
    if (req.file) {
      fileContent = await parseFileContent(req.file.path, req.file.mimetype);
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
    }

    // Create system prompt
    const systemPrompt = createSystemPrompt(scheduleData, fileContent);

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message || "Please analyze the uploaded file and suggest schedule modifications." }
      ],
      max_tokens: 2000,
      temperature: 0.3
    });

    const aiResponse = completion.choices[0].message.content;
    
    // Try to parse JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (parseError) {
      // If not JSON, create a structured response
      parsedResponse = {
        response: aiResponse,
        modifications: [],
        conflicts: [],
        warnings: []
      };
    }

    // Log the interaction
    await db.collection('ai_interactions').add({
      sessionId: sessionId || 'anonymous',
      userMessage: message,
      aiResponse: parsedResponse,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      hasFile: !!req.file,
      fileName: req.file?.originalname || null
    });

    res.json(parsedResponse);

  } catch (error) {
    console.error('AI modification error:', error);
    
    // Log error
    await db.collection('error_logs').add({
      type: 'ai_modification',
      error: error.message,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      request: {
        message: req.body.message,
        hasFile: !!req.file
      }
    });

    res.status(500).json({ 
      error: 'Failed to process AI request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Apply modifications endpoint
app.post('/api/apply-modifications', rateLimitMiddleware, async (req, res) => {
  const batch = db.batch();
  
  try {
    const { modifications } = req.body;
    
    if (!Array.isArray(modifications)) {
      return res.status(400).json({ error: 'Modifications must be an array' });
    }

    for (const modification of modifications) {
      const { type, originalData, newData } = modification;
      
      switch (type) {
        case 'move':
        case 'update':
          if (originalData && originalData.id) {
            const docRef = db.collection('schedules').doc(originalData.id);
            batch.update(docRef, {
              ...newData,
              lastModified: admin.firestore.FieldValue.serverTimestamp(),
              modifiedBy: 'ai-assistant'
            });
          }
          break;
          
        case 'add':
          const newDocRef = db.collection('schedules').doc();
          batch.set(newDocRef, {
            ...newData,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: 'ai-assistant'
          });
          break;
          
        case 'cancel':
          if (originalData && originalData.id) {
            const docRef = db.collection('schedules').doc(originalData.id);
            batch.update(docRef, {
              status: 'cancelled',
              cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
              cancelledBy: 'ai-assistant'
            });
          }
          break;
      }
    }

    // Create audit log entry
    const auditRef = db.collection('modification_audit').doc();
    batch.set(auditRef, {
      modifications: modifications,
      appliedAt: admin.firestore.FieldValue.serverTimestamp(),
      appliedBy: 'ai-assistant',
      type: 'ai_modification'
    });

    await batch.commit();
    
    res.json({ success: true, message: 'Modifications applied successfully' });

  } catch (error) {
    console.error('Apply modifications error:', error);
    res.status(500).json({ error: 'Failed to apply modifications' });
  }
});

// Undo modification endpoint
app.post('/api/undo-modification', rateLimitMiddleware, async (req, res) => {
  try {
    const { modification } = req.body;
    const { type, originalData, newData } = modification;
    
    const batch = db.batch();
    
    switch (type) {
      case 'move':
      case 'update':
        if (originalData && originalData.id) {
          const docRef = db.collection('schedules').doc(originalData.id);
          batch.update(docRef, {
            ...originalData,
            lastModified: admin.firestore.FieldValue.serverTimestamp(),
            modifiedBy: 'ai-assistant-undo'
          });
        }
        break;
        
      case 'add':
        if (newData && newData.id) {
          const docRef = db.collection('schedules').doc(newData.id);
          batch.delete(docRef);
        }
        break;
        
      case 'cancel':
        if (originalData && originalData.id) {
          const docRef = db.collection('schedules').doc(originalData.id);
          batch.update(docRef, {
            status: 'active',
            cancelledAt: admin.firestore.FieldValue.delete(),
            cancelledBy: admin.firestore.FieldValue.delete(),
            lastModified: admin.firestore.FieldValue.serverTimestamp(),
            modifiedBy: 'ai-assistant-undo'
          });
        }
        break;
    }

    await batch.commit();
    res.json({ success: true, message: 'Modification undone successfully' });

  } catch (error) {
    console.error('Undo modification error:', error);
    res.status(500).json({ error: 'Failed to undo modification' });
  }
});

// Chat sessions management
app.get('/api/chat-sessions', async (req, res) => {
  try {
    const sessionsSnapshot = await db.collection('chat_sessions')
      .orderBy('lastModified', 'desc')
      .limit(50)
      .get();
    
    const sessions = sessionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      lastModified: doc.data().lastModified?.toDate()
    }));
    
    res.json(sessions);
  } catch (error) {
    console.error('Get chat sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch chat sessions' });
  }
});

app.put('/api/chat-sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sessionData = req.body;
    
    await db.collection('chat_sessions').doc(id).set({
      ...sessionData,
      lastModified: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Update chat session error:', error);
    res.status(500).json({ error: 'Failed to update chat session' });
  }
});

app.delete('/api/chat-sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('chat_sessions').doc(id).delete();
    res.json({ success: true });
  } catch (error) {
    console.error('Delete chat session error:', error);
    res.status(500).json({ error: 'Failed to delete chat session' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
});

// Basic error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

module.exports = app;