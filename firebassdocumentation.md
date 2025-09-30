## 2. Database: Google Firestore

*   **Source**: Google Firebase
*   **Year**: 2024
*   **URL**: [https://firebase.google.com/docs/firestore](https://firebase.google.com/docs/firestore)

### Annotation:

Google Firestore was selected as the primary database for EduScheduler due to its powerful, flexible, and scalable nature, which is perfectly suited for a modern, real-time scheduling application.

Firestore is a NoSQL, document-oriented database. This means that instead of storing data in traditional rows and tables, it stores data in **documents**, which are organized into **collections**. For EduScheduler, this model is incredibly advantageous. For example, we can have collections for `users`, `schedules`, `faculty`, `subjects`, and `classrooms`, with each document in those collections representing a specific entity.

The key benefits of using Firestore for this project include:

*   **Flexible Schema**: The document-based model allows for a flexible data structure. As the requirements for EduScheduler evolve—for instance, if we need to add new properties to a faculty member or new types of constraints to a schedule—we can do so without performing complex schema migrations. This accelerates development and makes the application more adaptable.

*   **Real-Time Synchronization**: Firestore's most powerful feature is its ability to push real-time updates to connected clients. When a change is made to the schedule in the database (e.g., an administrator publishes a new timetable), the updated data is automatically and instantly streamed to all connected users (faculty, students). This ensures that everyone is always looking at the most up-to-date information without needing to manually refresh the page.

*   **Scalability and Performance**: As a managed service from Google Cloud, Firestore is designed for massive scale. It automatically handles the complexities of database sharding and replication, ensuring that EduScheduler remains fast and responsive even as the number of users and the amount of data grows. Its powerful querying capabilities allow for efficient data retrieval, which is critical for a data-intensive application like a scheduler.

*   **Offline Support**: Firestore provides robust offline data persistence for web and mobile clients. This means that if a user temporarily loses their internet connection, they can continue to view the schedule and even make changes. Once the connection is restored, the Firestore SDK automatically synchronizes the local changes with the server.

By leveraging Firestore, EduScheduler is built on a modern, serverless database foundation that provides the real-time capabilities, scalability, and development flexibility needed to deliver a robust and reliable scheduling solution.
