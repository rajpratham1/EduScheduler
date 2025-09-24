<div align="center">
  <img src="public/logo.svg" alt="EduScheduler Logo" width="120" height="120">
  <h1><b>EduScheduler</b></h1>
  <p><b>AI-Powered Timetable Modification System</b></p>
  <p>A comprehensive educational scheduling system with AI-powered natural language modification capabilities, built for the SIH Hackathon 2025 (Problem ID: 25028).</p>
</div>

<br>

### 🛠️ Tech Stack

<div align="center">
  <img src="https://img.shields.io/badge/react-%2320232A.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" alt="React">
  <img src="https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB" alt="Express.js">
  <img src="https://img.shields.io/badge/firebase-%23039BE5.svg?style=for-the-badge&logo=firebase&logoColor=white" alt="Firebase">
  <img src="https://img.shields.io/badge/openai-%23343541.svg?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI">
</div>

---

## 🚀 Key Features

- **🤖 AI Schedule Modification**: Use plain English commands to modify class schedules, exam timetables, and room assignments.
- **👥 Multi-Role System**: Dedicated portals and features for Admins, Faculty, and Students.
- **🌐 Multilingual Support**: Full internationalization supporting over 25 languages.
- **🎨 Dual Themes**: Seamless switching between light and dark modes.
- **📱 Responsive Design**: A great user experience on any device, from mobile phones to desktops.
- **🔒 Secure Authentication**: Role-based access control to protect sensitive data and features.
- **📊 Data Management**: Easy-to-use interfaces for managing all institutional data (students, faculty, classrooms, etc.).

## 📦 Getting Started

### Prerequisites
- Node.js v18+
- An active Firebase project with Firestore enabled
- An OpenAI API key

### Local Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/rajpratham1/EduScheduler.git
    cd EduScheduler
    ```

2.  **Setup the Backend:**
    ```bash
    # Navigate to the server directory
    cd server

    # Install dependencies
    npm install

    # Set up environment variables
    cp .env.example .env
    # Add your OpenAI key and Firebase URL to the .env file

    # Set up Firebase credentials
    # Create a firebase-service-account.json file in the /server directory with your credentials

    # Start the backend server
    npm start
    ```

3.  **Setup the Frontend:**
    ```bash
    # From the root directory, install dependencies
    npm install

    # Set up environment variables
    # Create a .env file in the root directory and add your Firebase client keys:
    # VITE_FIREBASE_API_KEY=...
    # VITE_FIREBASE_AUTH_DOMAIN=...
    # (and so on for all required VITE_FIREBASE_ keys)

    # Start the frontend development server
    npm run dev
    ```

## 🚀 Deployment

This project is configured for a dual-service deployment on **Render**.

-   **Backend Service (Web Service):**
    -   **Root Directory:** `server`
    -   **Build Command:** `npm install`
    -   **Start Command:** `node index.js`
    -   **Environment:** Set `NODE_ENV` to `production` and configure all other secrets (API keys, Firebase credentials as a Secret File).

-   **Frontend Service (Static Site):**
    -   **Root Directory:** (root of the repo)
    -   **Build Command:** `npm install && npm run build`
    -   **Publish Directory:** `dist`
    -   **Environment:** Set `VITE_API_URL` to the URL of your deployed backend service.

## 🏆 SIH Hackathon 2025

-   **Problem ID**: `25028` - Smart Classroom and Schedule Generator
-   **Key Innovation**: An AI-powered system that allows non-technical administrators to manage complex scheduling using plain English commands, significantly reducing administrative overhead.

## 📞 Project Admin & Contact

Need an admin account or have questions? Contact the project administrator:

-   **WhatsApp:** [https://wa.me/916200892887](https://wa.me/916200892887)
-   **Contact Form:** [https://formspree.io/f/xnnvyarw](https://formspree.io/f/xnnvyarw)

---

*Built with ❤️ for the Smart India Hackathon.*