# Project Report: EduScheduler

---

## Cover Page

**Project Title:** EduScheduler - Automated Timetable Generator

**Team:**
- **Team Leader:** Pratham Kumar
- **Frontend:** Harshwardhan, Aryan Uppadhay
- **Backend:** Pratham Kumar, Harshwardhan
- **Database:** Pratham Kumar, Aryan Uppadhay
- **Deployment & GitHub:** Pallavi Kumari, Sukhvinder Yadav
- **Integration:** Kunal Gupta, Harshwardhan, Sukhvinder Yadav
- **Testing:** Kunal Gupta, Pratham Kumar
- **Security:** Harshwardhan, Pratham Kumar, Pallavi Kumari
- **Documentation & Video:** Sukhvinder Yadav, Pallavi Kumari

---

## 1. Abstract/Summary

EduScheduler is a modern, web-based application designed to streamline and automate the process of creating and managing academic timetables. This project aims to solve the complexities and time-consuming nature of manual scheduling in educational institutions. By leveraging a powerful backend and an intuitive user interface, EduScheduler provides a comprehensive solution for administrators, faculty, and students. The system features role-based access control, AI-powered schedule generation, and real-time updates, ensuring an efficient and error-free scheduling process.

| Resource                  | Link                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Source Code**           | [github.com/rajpratham1/EduScheduler](https://github.com/rajpratham1/EduScheduler)                                       |
| **Live Website**          | [edu-scheduler.onrender.com](https://edu-scheduler.onrender.com/)                                                        |
| **Technical Documentation**| [FINAL_WEBSITE_DOCUMENTATION.md](https://github.com/rajpratham1/EduScheduler/blob/main/FINAL_WEBSITE_DOCUMENTATION.md)     |
| **Team Work**             | [TEAM.md](https://github.com/rajpratham1/EduScheduler/blob/main/TEAM.md)                                                 |
| **README.md**             | [README.md](https://github.com/rajpratham1/EduScheduler/blob/main/README.md)                                             |
| **Video Manual**          | [youtu.be/pIfqMxFVMKQ](https://youtu.be/pIfqMxFVMKQ?si=4ingAhxArAkTXxvZ)                                                  |
| **Presentation (PPT)**    | [youtu.be/pIfqMxFVMKQ](https://youtu.be/pIfqMxFVMKQ?si=4ingAhxArAkTXxvZ)                                                  |

---

## 2. Objective

The primary objectives of the EduScheduler project are:
- To develop a centralized platform for managing academic schedules.
- To automate the generation of complex timetables, considering various constraints like faculty availability, classroom capacity, and subject requirements.
- To provide distinct dashboards for administrators, faculty, and students with role-specific functionalities.
- To reduce the manual effort and time required for timetable creation and management.
- To minimize scheduling conflicts and errors.
- To offer a user-friendly and accessible interface for all users.
- To ensure the system is scalable, secure, and maintainable.

---

## 3. System Requirements / Tech Stack

### Functional Requirements:
- **User Roles:** Admin, Faculty, Student.
- **Admin:** Manage departments, classrooms, subjects, faculty, and students. Generate and modify schedules. Post announcements.
- **Faculty:** View their assigned schedule, manage assignments, and take attendance.
- **Student:** View their class schedule and receive announcements.
- **Authentication:** Secure login and registration for all user roles.

### Non-Functional Requirements:
- **Performance:** The system should be fast and responsive.
- **Scalability:** Capable of handling a growing number of users and data.
- **Security:** Protection against common web vulnerabilities.
- **Usability:** Intuitive and easy-to-navigate user interface.

### Tech Stack:
- **Frontend:**
  - React.js with TypeScript
  - Vite for build tooling
  - Tailwind CSS for styling
  - Context API for state management
- **Backend:**
  - Node.js with Express.js
  - Firebase (Authentication, Firestore, Functions)
- **Database:**
  - Google Firestore (NoSQL)
- **Deployment:**
  - Render (for the live website)
  - Firebase Hosting (potentially for frontend)

---

## 4. System Architecture and Design

EduScheduler is built on a modern client-server architecture.

- **Client (Frontend):** A single-page application (SPA) built with React. It is responsible for the user interface and user experience. It communicates with the backend via a RESTful API. The UI is designed to be responsive and work on various devices.

- **Server (Backend):** A Node.js and Express.js application that exposes a REST API. It handles all business logic, including user authentication, data validation, and communication with the database. It also contains the AI-powered logic for schedule generation.

- **Database:** Google Firestore, a flexible and scalable NoSQL database, is used to store all application data, including user information, schedules, and academic records.

- **Authentication:** Firebase Authentication is used for secure user management and sign-in.



### Data Flow
1.  The user interacts with the React frontend in their browser.
2.  When a user performs an action (e.g., logs in, requests data), the React application makes an API call to the backend using `axios`.
3.  The Express backend receives the request. A middleware function first verifies the user's authentication token (if required for the route).
4.  The corresponding route handler processes the request, calling a service function to perform the business logic.
5.  The service function interacts with the Firestore database to create, read, update, or delete data.
6.  The backend sends a JSON response back to the frontend.
7.  The frontend updates its state based on the response, and the UI re-renders to display the new information to the user.

---

## 5. Implementation

The implementation is divided into two main parts: the frontend and the backend.

### Frontend Implementation:
- **Component-Based Structure:** The UI is built using reusable React components, organized by feature and user role.
  - **`pages`:** Contains the top-level components for each dashboard (`AdminDashboard.tsx`, `FacultyDashboard.tsx`, `StudentDashboard.tsx`).
  - **`components/admin`:** A rich set of components for the admin panel, including `AdminManagement`, `ClassroomManagement`, `FacultyManagement`, `StudentManagement`, `ScheduleGenerator`, and `AIScheduleModifier`.
  - **`components/auth`:** Components for handling user authentication, such as `AdminLogin`, `FacultyLogin`, `StudentLogin`, and `StudentSignup`.
  - **`components/common`:** Reusable components like `LoadingSpinner` and `ErrorBoundary` used throughout the application.
- **Routing:** `react-router-dom` is used to handle client-side routing, providing a seamless single-page application experience.
- **State Management:** React's Context API (`AuthContext.tsx`) is used to manage global authentication state, making user information accessible to all components.
- **Styling:** Tailwind CSS provides a utility-first framework for creating a consistent and responsive design system directly in the markup.
- **API Communication:** A centralized `apiService.ts` encapsulates `axios` calls, simplifying how the frontend interacts with the backend REST API.

### Backend Implementation:
- **RESTful API:** The backend exposes a comprehensive REST API for all application functionalities.
- **Modular Structure:** The backend code is organized into:
  - **`routes`:** Defines the API endpoints. Each file corresponds to a specific resource (e.g., `announcements.js`, `classroom.js`, `schedule.js`).
  - **`middleware`:** Contains middleware functions, notably `auth.js` for JWT verification and route protection.
  - **`services`:** Includes business logic, such as `authService.js`, to keep the route handlers clean and focused.
  - **`config`:** Manages configuration, such as the Firebase admin SDK initialization.
- **API Endpoints:** The API includes endpoints for full CRUD (Create, Read, Update, Delete) operations on all major resources:
  - `POST /api/auth/login`
  - `GET /api/announcements`
  - `POST /api/admin/schedules`
  - `GET /api/faculty/:id/schedule`
  - ...and many more, covering every feature of the application.
- **Firebase Integration:** The `firebase-admin` SDK is used for backend authentication and direct, secure access to the Firestore database.

---

## 6. Results and Output

The project has successfully resulted in a fully functional and deployed web application with the following key features:

- **Live Website:** The application is deployed and accessible at [edu-scheduler.onrender.com](https://edu-scheduler.onrender.com/).

- **Admin Dashboard:** A comprehensive control panel allowing administrators to:
  - Manage all academic entities: Departments, Classrooms, Subjects, Faculty, and Students.
  - Approve new student registrations.
  - Generate entire semester schedules with a single click using a constraint-based algorithm.
  - Manually or automatically adjust schedules with the AI Schedule Modifier.
  - Post and manage announcements for different user groups.
  - View feedback and system reports.

- **Faculty Dashboard:** A personalized portal for teachers to:
  - View their weekly teaching schedule.
  - Manage and grade assignments.
  - Record student attendance.

- **Student Dashboard:** A simple and effective interface for students to:
  - View their personal class schedule.
  - Receive important announcements from the administration.

- **User Interface:** The application boasts a clean, modern, and fully responsive UI, ensuring a great user experience on desktops, tablets, and mobile phones.

---

## 7. Conclusion

EduScheduler successfully meets its core objectives of automating and simplifying the academic scheduling process. The project demonstrates the effective use of modern web technologies—React, Node.js, and Firebase—to solve a complex, real-world problem. The modular architecture and clean code make the application maintainable and scalable. The clear separation of concerns between the frontend and backend allows for independent development and testing. The final product is a robust and user-friendly application that can significantly benefit educational institutions by saving time, reducing errors, and improving communication.

---

## 8. Future Scope

While the current version of EduScheduler is a complete product, there are several areas for future improvement and expansion:

- **Mobile Application:** Developing native mobile apps for Android and iOS to provide a better experience for students and faculty on the go.
- **Advanced AI:** Enhancing the AI scheduling algorithm to handle more complex constraints (e.g., faculty preferences, student electives) and provide more optimization options.
- **Integration with other Systems:** Integrating with other educational software like Learning Management Systems (LMS) and Student Information Systems (SIS).
- **Notifications:** Implementing real-time notifications (e.g., via email or push notifications) for schedule changes, announcements, and reminders.
- **Reporting and Analytics:** Adding a module for generating detailed reports and analytics on attendance, resource utilization, and faculty workload.
- **Multi-Language Support:** Adding support for multiple languages to make the application accessible to a wider audience.
