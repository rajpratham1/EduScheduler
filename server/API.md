# EduScheduler API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
All API routes (except signup and password reset) require authentication via Firebase Authentication. Include the ID token in the Authorization header:
```
Authorization: Bearer <firebase_id_token>
```

## Admin Routes

### Create Admin
```
POST /admin
Content-Type: application/json
Authorization: Bearer <token>

{
  "email": "admin@gmail.com",
  "password": "password123",
  "name": "Admin Name"
}

Response:
{
  "message": "Admin created successfully",
  "uid": "user_id",
  "secretCode": "ADMIN123"
}
```

### Get All Admins
```
GET /admin
Authorization: Bearer <token>

Response:
[
  {
    "id": "admin_id",
    "name": "Admin Name",
    "email": "admin@gmail.com",
    "role": "admin",
    "isActive": true,
    "secretCode": "ADMIN123"
  }
]
```

## Faculty Routes

### Create Faculty Member
```
POST /faculty
Content-Type: application/json
Authorization: Bearer <token>

{
  "email": "faculty@gmail.com",
  "password": "password123",
  "name": "Faculty Name",
  "department": "Computer Science",
  "adminId": "admin_id",
  "secretCode": "ADMIN123"
}

Response:
{
  "message": "Faculty member created successfully",
  "uid": "user_id"
}
```

### Get All Faculty Members
```
GET /faculty
Authorization: Bearer <token>

Response:
[
  {
    "id": "faculty_id",
    "name": "Faculty Name",
    "email": "faculty@gmail.com",
    "department": "Computer Science",
    "role": "faculty",
    "isActive": true
  }
]
```

## Schedule Routes

### Generate Schedule
```
POST /schedule/generate
Content-Type: application/json
Authorization: Bearer <token>

{
  "department": "Computer Science",
  "semester": 5,
  "preferences": {
    "startTime": "09:00",
    "endTime": "17:00",
    "daysOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  }
}

Response:
{
  "message": "Schedule generated successfully",
  "schedule": {
    "id": "schedule_id",
    "classes": [
      {
        "subject": "Data Structures",
        "faculty": "faculty_id",
        "classroom": "room_id",
        "day": "Monday",
        "startTime": "09:00",
        "endTime": "10:00"
      }
    ]
  }
}
```

### Modify Schedule
```
POST /schedule/modify
Content-Type: application/json
Authorization: Bearer <token>

{
  "scheduleId": "schedule_id",
  "modification": "Move Data Structures class to Room 101",
  "force": false
}

Response:
{
  "message": "Schedule modified successfully",
  "modifications": [
    {
      "type": "move",
      "description": "Moved Data Structures class to Room 101",
      "originalData": {...},
      "newData": {...}
    }
  ]
}
```

## Error Responses
```
400 Bad Request
{
  "error": "Validation error",
  "details": ["Error details"]
}

401 Unauthorized
{
  "error": "Authentication required"
}

403 Forbidden
{
  "error": "Insufficient permissions"
}

404 Not Found
{
  "error": "Resource not found"
}

500 Internal Server Error
{
  "error": "Internal server error"
}
```

## Rate Limiting
API requests are limited to 10 requests per minute per IP address.

## File Upload
- Maximum file size: 10MB
- Supported formats: CSV, Excel (.xlsx)
- Upload directory: /uploads

## Environment Variables
Create a `.env` file with:
```
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
FIREBASE_DATABASE_URL=your_firebase_url
OPENAI_API_KEY=your_openai_api_key
```

## Development Setup
1. Install dependencies:
```
npm install
```

2. Start development server:
```
npm run dev
```

3. Run tests:
```
npm test
```