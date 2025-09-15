# EduScheduler: AI-Powered Timetable Scheduler for Higher Education Institutions

## 🚀 Project Introduction

Welcome to EduScheduler, an innovative, AI-powered timetable scheduling platform designed to revolutionize how higher education institutions manage their academic schedules. Built to address the complex challenges of manual scheduling, EduScheduler leverages artificial intelligence to optimize classroom utilization, balance faculty workload, and enhance the overall learning experience for students. This project was developed as a solution for the SIH 25028 problem statement by the Government of Jharkhand, aligning with the National Education Policy (NEP) 2020's vision for modern educational practices.

### The Challenge: Manual Scheduling in Higher Education

Higher education institutions frequently grapple with inefficient class scheduling due to:
*   **Limited Infrastructure:** Optimizing the use of available classrooms and labs.
*   **Faculty Constraints:** Managing diverse faculty availability, specializations, and workload limits.
*   **Elective Courses:** Integrating a wide array of elective options for students.
*   **Overlapping Departmental Requirements:** Coordinating schedules across multiple departments.

Manual timetable preparation often leads to frequent clashes, underutilized resources, uneven workload distribution, and dissatisfaction among both students and faculty.

### Why AI-Based Scheduling?

The increasing complexity introduced by NEP 2020 necessitates a smarter approach. EduScheduler aims to:
*   **Maximize Resource Usage:** Ensure optimal utilization of classrooms and labs.
*   **Minimize Overload:** Prevent faculty and student overload by distributing workload fairly.
*   **Achieve Learning Outcomes:** Facilitate a conducive learning environment.
*   **Handle Complexity:** Efficiently manage multi-department and multi-shift scenarios.

### Expected Outcomes

EduScheduler is expected to deliver:
*   **Optimized Classrooms & Labs:** Efficient use of physical resources.
*   **Fair Workload Distribution:** Equitable allocation of teaching hours for faculty.
*   **Better Resource Utilization:** Maximized use of all available academic assets.
*   **Enhanced User Satisfaction:** Improved experience for students and faculty through conflict-free, personalized schedules.

## ✨ Features

EduScheduler is a web-based platform with role-based access, offering distinct functionalities for Administrators, Faculty, and Students.

### 🔑 Authentication

*   **Google Login:** All users authenticate via Google.
*   **Admin Login:** Fixed credentials (from environment variables) for initial setup.
    *   Gmail: `rajpratham40@gmail.com`
    *   Password: `Pratham@5665`
*   **Student Registration:** Students register with their Google account and must enter an Admin ID during their first login. Access is granted only after Admin approval.
*   **Faculty Registration:** Faculty accounts are created and managed exclusively by the Admin, who provides a unique Faculty ID.

### 🛠️ Admin Panel (Full Control)

The Admin panel is the central hub for managing the entire scheduling ecosystem.

*   **AI-Powered Timetable Generation:**
    *   Utilizes the Gemini API to create optimized timetables.
    *   **Parameters:** Configurable inputs including classrooms, labs, subjects, faculty availability, student batches, maximum classes per day, leave requests, fixed slots, and elective courses.
    *   **Multiple Options:** Presents several optimized timetable options.
    *   **Manual Adjustments & Approval:** Allows for manual modifications and a robust approval workflow.
    *   **Conflict Resolution:** Suggests rearrangements to resolve scheduling conflicts.
*   **User Management:**
    *   **Students:** Add, remove, and approve student accounts.
    *   **Faculty:** Add and remove faculty members, assigning unique Faculty IDs.
    *   **Admins:** Add additional administrators and assign unique IDs.
*   **Student Assignment by Course:**
    *   Assign students to specific courses, subjects, and batches.
    *   Automatically generates a unique student ID (e.g., 1-100) per course/batch.
*   **Classroom & Faculty Assignment:**
    *   Assign classrooms and faculty to specific student batches using intuitive dropdowns (Course → Batch → Classroom, Faculty → Subject).
*   **Automatic Seating Arrangement:**
    *   Generates and visually displays seating arrangements (grid/table format) for assigned classrooms.
    *   Students can view their assigned seat numbers in their respective panels.
*   **Feedback Management:**
    *   View and export student and faculty feedback reports.
    *   **Google Forms Integration:** Admins can embed a Google Form link for feedback collection, which is accessible to students and faculty. The link can be updated anytime.
*   **Profile Management:** Admins can edit their profile, upload avatars, and update personal details.
*   **Dashboard:**
    *   Animated charts visualizing faculty load, classroom utilization, and student satisfaction.
    *   Statistics on timetable generation success rates.
*   **Download Timetable & Seating Plan:**
    *   Admins can download generated timetables and seating plans as PDF/Excel.
    *   Individual schedules are automatically distributed to students and faculty in their panels.

### 👩‍🏫 Faculty Panel

Designed to provide faculty members with essential tools and information.

*   **Personal Timetable:** View their individual teaching schedule.
*   **Assigned Subjects & Classrooms:** Clearly see all assigned subjects and the classrooms they will be teaching in.
*   **Student Seating Arrangements:** Access seating plans for their classes.
*   **Feedback Submission:** Submit feedback regarding workload, class clashes, or other issues.
    *   **Google Forms Integration:** Access the Google Form link provided by the Admin for feedback.
*   **Profile Management:** Edit profile details and upload an avatar.
*   **Dashboard:** View teaching load statistics and upcoming classes.

### 🎓 Student Panel

Provides students with personalized academic information and feedback mechanisms.

*   **Personalized Timetable:** View their auto-generated, color-coded timetable (downloadable).
*   **Course & Batch Information:** See their assigned course and batch details.
*   **Classroom & Seat Number:** View their assigned classroom and individual seat number.
*   **Feedback Submission:** Submit feedback about classes, timetable clashes, labs, etc.
    *   **Google Forms Integration:** Access the Google Form link provided by the Admin for feedback.
*   **Profile Management:** Edit profile details and upload an avatar.
*   **Dashboard:** Quick access to their timetable, exam schedules, and important notices.

## 🎨 UI/UX & Animations

EduScheduler prioritizes a modern, interactive, and visually appealing user experience.

*   **Modern Design:** Utilizes React and Tailwind CSS (or Next.js if needed) for a responsive, mobile-friendly, and professional look.
*   **Dynamic Backgrounds:** Animated backgrounds (particles, gradients, moving shapes) on the landing page.
*   **Smooth Transitions:** Animations, transitions, and modern effects applied to fonts, backgrounds, and UI components.
*   **Interactive Elements:** Hover effects, gradient buttons, and glassmorphism cards.
*   **Animated Data Visualization:** Animated charts in dashboards for better data comprehension.
*   **Loading Animations:** Engaging loading animations during timetable generation and data fetching.
*   **Dark/Light Mode:** Seamless toggle between dark and light themes with smooth transitions.
*   **Animated Avatars/Icons:** AI-generated or animated avatars/icons for user profiles.
*   **Interactive Feedback Forms:** Emoji sliders and rating stars for engaging feedback submission.

## 💻 Tech Stack

*   **Frontend:** React, Tailwind CSS, Vite
*   **Backend:** FastAPI (Python)
*   **Database:** Firebase (Firestore for data storage, Authentication for user management)
*   **AI Integration:** Google Gemini API for timetable optimization
*   **Deployment:** Render / GitHub Pages (for frontend)

## ⚙️ Getting Started

To set up and run EduScheduler locally, follow these steps:

### Prerequisites

*   Node.js (LTS version)
*   Python 3.9+
*   Firebase Project (with Firestore, Authentication, and Storage enabled)
*   Google Cloud Project (for Gemini API access)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd EduScheduler
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create a .env file based on .env.example and fill in your credentials
# Example .env content:
# ADMIN_EMAIL="rajpratham40@gmail.com"
# JWT_SECRET="your_jwt_secret_key"
# ALGORITHM="HS256"
# ACCESS_TOKEN_EXPIRE_MINUTES=30
# FIREBASE_PRIVATE_KEY_PATH="./firebase_private_key.pem" # Path to your Firebase Admin SDK private key

# Ensure you have your Firebase Admin SDK private key file (e.g., firebase_private_key.pem)
# in the backend directory.

uvicorn app.main:app --reload
```

### 3. Frontend Setup

```bash
cd frontend
npm install

# Create a .env file based on your Firebase project configuration
# Example .env content:
# VITE_API_BASE_URL="http://localhost:8000" # Or your deployed backend URL
# VITE_FIREBASE_API_KEY="YOUR_FIREBASE_API_KEY"
# VITE_FIREBASE_AUTH_DOMAIN="YOUR_FIREBASE_AUTH_DOMAIN"
# VITE_FIREBASE_PROJECT_ID="YOUR_FIREBASE_PROJECT_ID"
# VITE_FIREBASE_STORAGE_BUCKET="YOUR_FIREBASE_STORAGE_BUCKET"
# VITE_FIREBASE_MESSAGING_SENDER_ID="YOUR_FIREBASE_MESSAGING_SENDER_ID"
# VITE_FIREBASE_APP_ID="YOUR_FIREBASE_APP_ID"
# VITE_FIREBASE_MEASUREMENT_ID="YOUR_FIREBASE_MEASUREMENT_ID"

npm run dev
```

### 4. Access the Application

Open your browser and navigate to `http://localhost:5173` (or the port indicated by `npm run dev`).

## 🚀 Deployment

*   **Frontend:** Can be deployed to platforms like GitHub Pages, Netlify, Vercel, or Render.
*   **Backend:** Can be deployed to cloud platforms such as Render, Heroku, AWS, or Google Cloud Run.

## 🤝 Contributing

We welcome contributions to EduScheduler! Please feel free to fork the repository, create pull requests, or open issues for bugs and feature requests.

## 📄 License

This project is licensed under the MIT License.