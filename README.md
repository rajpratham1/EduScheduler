# University Timetable Management System (EduScheduler)

EduScheduler is an intelligent, full-stack web application designed to automate and optimize the complex process of creating and managing university schedules. It leverages the power of the Google Gemini AI to generate conflict-free, balanced timetables based on a rich set of user-defined data and constraints.

The application provides a multi-user environment with distinct roles for Administrators, Faculty, and Students, each with a tailored dashboard and feature set.

---

## ✨ Key Features

- **AI-Powered Timetable Generation**: Utilizes the Gemini AI to automatically generate optimal weekly schedules from complex inputs.
- **Role-Based Access Control**: Secure login system for Administrators, Faculty, and Students.
- **Comprehensive Data Management**: A powerful dashboard for administrators to perform full CRUD operations on core university data, complete with live search and filtering.
- **Interactive Drag-and-Drop Editing**: Administrators can manually adjust the AI-generated schedule by dragging and dropping classes.
- **Real-time Conflict Detection**: Instantly analyzes the schedule after every change and reports on hard and soft conflicts.
- **Professional Draft & Publish Workflow**: Administrators work on a `draft` schedule, which can be edited and saved without affecting the live timetable until it is explicitly `published`.
- **AI-Powered Assistance & Analysis**: Includes a Faculty Replacement Finder and a Student Workload Analysis tool.
- **Live Schedule Previews**: Administrators can instantly preview the timetable from any user's perspective.
- **Dark Mode & Mobile Responsive**: A beautiful, fully-featured dark theme and a responsive design that works perfectly on any device.
- **Calendar Integration**: All users can export any class to their personal calendar (Google Calendar, Outlook, etc.).

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS
- **AI Model**: Google Gemini (`gemini-2.5-flash`) via `@google/genai` SDK
- **Drag & Drop**: A local shim of `react-beautiful-dnd` to avoid version conflicts with React 19.
- **Build Tool**: Vite
- **Backend (Simulation)**: A mock API service layer using a `db.json` file and browser `localStorage` for persistence.
- **Backend (Blueprint)**: Includes a detailed `XANO_SETUP.md` guide for building a production-ready backend.

---

## 🚀 Local Development & Deployment

The AI Studio preview environment is unreliable. The definitive way to run this application is on your local machine and then deploy it to a live web server like Render.

### Step 1: Set Up Locally

1.  **Save All Code**: Create a new folder on your computer (e.g., `eduscheduler-app`) and save all the final code files from this project into it, maintaining the correct file structure (e.g., `components/FacultyManager.tsx`).
2.  **Open Terminal**: Open your terminal or command prompt inside that new folder.
3.  **Create `.env` file**:
    -   Create a file named `.env` in your project root. **This file should not be committed to GitHub.**
    -   Add your Gemini API key to this file:
      ```
      VITE_API_KEY=YOUR_GEMINI_API_KEY_HERE
      ```
4.  **Install Dependencies & Run**:
    -   In your terminal, run the command: `npm install`
    -   After it finishes, run the command: `npm run dev`
    -   Your terminal will show a local URL (like `http://localhost:5173`). Open this URL in your browser to see and test your application!

### Step 2: Deploy to the Web with GitHub and Render

1.  **Create a GitHub Repository**:
    -   Go to [GitHub](https://github.com) and create a new repository.
    -   Follow the instructions to push your local project folder to this new repository. Ensure your `.env` file is listed in a `.gitignore` file so it does not get uploaded.
2.  **Create a Render Account**:
    -   Go to [Render.com](https://render.com) and sign up for a free account.
3.  **Deploy a New Static Site**:
    -   On your Render dashboard, click "New +" and select "Static Site".
    -   Connect your GitHub account and select the repository you just created.
    -   Configure the deployment settings. **These are the exact values you need**:
        -   **Build Command**: `npm install && npm run build`
        -   **Publish Directory**: `dist`
4.  **Add Environment Variable**:
    -   Before deploying, go to the **"Environment"** tab for your new Render service.
    -   Click "Add Environment Variable".
    -   **Key**: `VITE_API_KEY`
    -   **Value**: Paste your actual Gemini API key here.
5.  **Deploy!**:
    -   Click "Create Static Site". Render will automatically pull your code from GitHub, build the project, and deploy it to a live, public URL.

You will now have a professional, live version of your application that you can share with anyone. This is the definitive way to move forward.
