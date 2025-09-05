# Xano Backend Setup Guide for EduScheduler

This document provides a step-by-step guide to setting up the necessary database tables and API endpoints in a no-code platform like Xano to support the EduScheduler application.

## 1. Database Tables

Create the following tables in your Xano database.

### Table: `users`
Stores login information and roles for all users.

| Field Name  | Type                | Description                                       |
|-------------|---------------------|---------------------------------------------------|
| `id`        | Integer (Auto-inc)  | Primary Key                                       |
| `created_at`| Timestamp           | Automatic timestamp of creation                   |
| `name`      | Text                | User's full name (e.g., "Mr. Smith", "Alice Johnson") |
| `email`     | Text (Email)        | User's unique email address for login            |
| `password`  | Text (Password)     | Hashed password for authentication                |
| `role`      | Text                | User's role: 'admin', 'faculty', or 'student'     |

### Table: `departments`
Stores academic departments.

| Field Name  | Type                | Description                     |
|-------------|---------------------|---------------------------------|
| `id`        | Integer (Auto-inc)  | Primary Key                     |
| `created_at`| Timestamp           | Automatic timestamp             |
| `name`      | Text                | Name of the department (e.g., "Science & Math") |

### Table: `faculty`
Stores faculty member information.

| Field Name      | Type                | Description                                      |
|-----------------|---------------------|--------------------------------------------------|
| `id`            | Integer (Auto-inc)  | Primary Key                                      |
| `created_at`    | Timestamp           | Automatic timestamp                              |
| `name`          | Text                | Faculty member's name                            |
| `email`         | Text (Email)        | Faculty member's email                           |
| `department_id` | Integer (Table Ref) | Links to `departments.id`                        |

### Table: `students`
Stores student information.

| Field Name      | Type                | Description                                      |
|-----------------|---------------------|--------------------------------------------------|
| `id`            | Integer (Auto-inc)  | Primary Key                                      |
| `created_at`    | Timestamp           | Automatic timestamp                              |
| `name`          | Text                | Student's name                                   |
| `email`         | Text (Email)        | Student's email                                  |
| `department_id` | Integer (Table Ref) | Links to `departments.id`                        |

### Table: `subjects`
Stores all available subjects/courses.

| Field Name      | Type                | Description                                      |
|-----------------|---------------------|--------------------------------------------------|
| `id`            | Integer (Auto-inc)  | Primary Key                                      |
| `created_at`    | Timestamp           | Automatic timestamp                              |
| `name`          | Text                | Name of the subject (e.g., "Calculus I")         |
| `weekly_hours`  | Integer             | Number of 1-hour classes required per week       |
| `department_id` | Integer (Table Ref) | Links to `departments.id`                        |

### Table: `classrooms`
Stores all available rooms and facilities.

| Field Name  | Type                | Description                                    |
|-------------|---------------------|------------------------------------------------|
| `id`        | Integer (Auto-inc)  | Primary Key                                    |
| `created_at`| Timestamp           | Automatic timestamp                            |
| `name`      | Text                | Room name/number (e.g., "Room 101", "Science Lab") |
| `type`      | Text                | Type of room (e.g., "Standard", "Lab", "Special") |
| `capacity`  | Integer             | Seating capacity of the room                   |

### Table: `course_enrollments`
Links students to the subjects they are taking.

| Field Name    | Type                | Description                 |
|---------------|---------------------|-----------------------------|
| `id`          | Integer (Auto-inc)  | Primary Key                 |
| `created_at`  | Timestamp           | Automatic timestamp         |
| `student_id`  | Integer (Table Ref) | Links to `students.id`      |
| `subject_id`  | Integer (Table Ref) | Links to `subjects.id`      |

### Table: `draft_class_schedule`
Stores the administrator's working draft of the timetable.

| Field Name      | Type                | Description                                   |
|-----------------|---------------------|-----------------------------------------------|
| `id`            | Integer (Auto-inc)  | Primary Key                                   |
| `created_at`    | Timestamp           | Automatic timestamp                           |
| `day`           | Text                | Day of the week (e.g., "Monday")              |
| `time`          | Text                | Time slot (e.g., "9-10")                      |
| `subject_id`    | Integer (Table Ref) | Links to `subjects.id`                        |
| `faculty_id`    | Integer (Table Ref) | Links to `faculty.id`                         |
| `classroom_id`  | Integer (Table Ref) | Links to `classrooms.id`                      |

### Table: `published_class_schedule`
Stores the official, live timetable visible to faculty and students. Has the exact same structure as `draft_class_schedule`.

---

## 2. API Endpoints

Create an API group for your application. Authentication should be required for all endpoints except `/auth/login`.

### Authentication

*   **`POST /auth/login`**
    *   **Inputs:** `email`, `password`
    *   **Logic:**
        1.  Find user in `users` table by email.
        2.  If user exists, use Xano's password comparison function.
        3.  If password matches, create an authentication token.
        4.  Return the token and the user object (excluding the password).
    *   **Auth Required:** No

### Data Management (Full CRUD)
Create standard CRUD endpoints for `departments`, `faculty`, `students`, `subjects`, and `classrooms`. Example for `faculty`:

*   **`GET /faculty`**: Returns a list of all records from the `faculty` table.
*   **`POST /faculty`**: Creates a new record in the `faculty` table.
*   **`DELETE /faculty/{faculty_id}`**: Deletes a record from the `faculty` table by its ID.

### Scheduling

*   **`GET /schedule/draft`**
    *   **Logic:** Returns all records from the `draft_class_schedule` table.
    *   **Auth Required:** Yes (Admin role only)

*   **`POST /schedule/draft`**
    *   **Inputs:** An array of schedule objects `[ { day, time, subject_id, ... } ]`.
    *   **Logic:**
        1.  Delete all existing records in `draft_class_schedule`.
        2.  Loop through the input array and add each object as a new record.
    *   **Auth Required:** Yes (Admin role only)

*   **`GET /schedule/published`**
    *   **Logic:** Returns all records from the `published_class_schedule` table.
    *   **Auth Required:** Yes (All roles)

*   **`POST /schedule/publish`**
    *   **Logic:**
        1.  Delete all existing records in `published_class_schedule`.
        2.  Get all records from `draft_class_schedule`.
        3.  Add all draft records to the `published_class_schedule` table.
    *   **Auth Required:** Yes (Admin role only)

### User-Specific Data

*   **`GET /enrollments`**
    *   **Inputs:** `student_id` (from auth token or query parameter)
    *   **Logic:** Returns all records from `course_enrollments` where `student_id` matches the input.
    *   **Auth Required:** Yes (Student role or Admin)

*   **`GET /faculty/available`**
    *   **Inputs:** `subject_id`, `day`, `time`
    *   **Logic:**
        1.  Find the `department_id` for the given `subject_id` from the `subjects` table.
        2.  Get all `faculty` members who belong to that `department_id`.
        3.  Get all `faculty_id`s from the `draft_class_schedule` who are busy at the specified `day` and `time`.
        4.  Return the list of faculty from step 2, excluding those who are busy from step 3.
    *   **Auth Required:** Yes (Admin role only)

---

## Data Integrity Notes

When building a relational database like this in Xano, it's crucial to consider data integrity, especially when deleting records. For example, what should happen if you delete a `department` that still has `faculty` members assigned to it?

### Handling Deletions of Related Records

When one record is linked to another (e.g., a `class_schedule` entry is linked to a `faculty` ID), you need to define a rule for what happens when the "parent" record is deleted.

1.  **Cascading Deletes:**
    *   **What it is:** If you delete a parent record, all child records that reference it are also automatically deleted.
    *   **Example:** If you set up a cascading delete from `departments` to `faculty`, deleting the "Science" department would automatically delete Mr. Smith and Ms. Jones from the `faculty` table.
    *   **Use Case:** This can be useful but is also **very dangerous** as it can lead to unintentional mass data loss. It's best used for records that truly cannot exist without their parent, like `course_enrollments` when a `student` is deleted.

2.  **Restricted Deletes (Safer Default):**
    *   **What it is:** The system prevents you from deleting a parent record if any child records are still referencing it.
    *   **Example:** You try to delete the "Science" department, but the API returns an error because Mr. Smith still belongs to that department. You would need to re-assign or delete Mr. Smith first.
    *   **Recommendation for EduScheduler:** This is the **recommended approach for most relationships** in this application. It forces the administrator to make conscious decisions and prevents accidental data loss. For example:
        *   You shouldn't be able to delete a `faculty` member if they are part of the `published_class_schedule`.
        *   You shouldn't be able to delete a `subject` if students are enrolled in it (`course_enrollments`).

3.  **Nullification (Set to Null):**
    *   **What it is:** If you delete a parent record, the reference ID in the child record is set to `null`.
    *   **Example:** If you delete Mr. Smith, any `class_schedule` entry that had his `faculty_id` would now have `faculty_id: null`.
    *   **Use Case:** This can be useful to preserve records while indicating that a piece of data is missing. For this app, it could be used to show that a class needs a new teacher assigned, but a restricted delete is often clearer and safer.

### Implementation in Xano

*   When setting up your table relationships in Xano, you will find options for deletion rules (`on_delete`).
*   For critical entities like `departments`, `faculty`, `students`, `subjects`, and `classrooms`, it is highly recommended to use **restricted deletes** by default.
*   Your API logic for the `DELETE` endpoints should first check for existing relationships before proceeding with the deletion, returning a helpful error message to the admin if the deletion is blocked.
