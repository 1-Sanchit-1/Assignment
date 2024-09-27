# Real-Time Notification System

This project implements a real-time notification system using Node.js for the backend and React for the frontend. It allows users to send and receive notifications in real-time, with support for both specific user targeting and broadcasting to all users.

## Features

- Real-time notifications using Socket.IO
- User-specific notifications
- Broadcast notifications to all users
- Mark notifications as read
- Implement JWT-based authentication . `(/server/controllers/authController.js)`

## Tech Stack

- Backend: Node.js, Express.js, Socket.IO
- Frontend: React, Socket.IO-client, Axios
- Database: MongoDB

## Usage

1. Open the application in your web browser.
2. Enter a User ID in the input field.
3. To send a specific notification:
   - Enter a message and click "Send Notification".
4. To broadcast a notification to all users:
   - Check the "Broadcast to all users" checkbox.
   - Enter a message and click "Send Notification".
5. Notifications will appear in real-time for the intended recipients.
6. Click "Mark as Read" to change a notification's status.

## API Endpoints

- `POST /api/notifications/send`: Send a notification
- `GET /api/notifications/:userId`: Fetch notifications for a specific user
- `POST /api/notifications/read`: Mark notifications as read

## Future Improvements

- Implement user authentication
- Add persistent storage using a database like MongoDB
- Enhance UI/UX with more interactive features
