# Web-Based Faculty Consultation and Scheduling System

A full-stack MERN application designed to streamline the process of scheduling and managing face-to-face consultations between students and faculty members. This system eliminates the inefficiencies of manual scheduling, paper logbooks, and fragmented communication.

## Key Features

*   **Role-Based Access Control (RBAC):** Three distinct user roles (Student, Faculty, Admin) with dedicated dashboards and permissions.
*   **Real-Time Notifications:** Instant alerts via Socket.IO for booking confirmations, cancellations, and emergency schedule changes.
*   **Calendar-Based Booking:** Students can browse an interactive calendar and book available time slots.
*   **Strict Scheduling Rules:** Consultations are limited to 8:00 AM to 5:00 PM (or your configured hours), with a maximum of 5 slots per hour.
*   **Emergency Cancellation:** Faculty can cancel an entire schedule block, automatically notifying all affected students and updating their appointment statuses.
*   **Secure Authentication:** JWT-based authentication with bcrypt password hashing.

## Technology Stack

**Frontend:**
*   React.js (Vite)
*   Tailwind CSS (Modern Business UI)
*   Axios
*   Socket.IO Client
*   React Router DOM

**Backend:**
*   Node.js & Express.js
*   MongoDB & Mongoose
*   JSON Web Tokens (JWT) & bcryptjs
*   Socket.IO
