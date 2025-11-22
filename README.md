# Task Manager Backend API

## Setup

1. Install dependencies:
```bash
npm install
```

2. Install MongoDB locally or use MongoDB Atlas

3. Update `.env` file with your MongoDB URI and JWT secret

4. Start the server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Tasks
- `GET /api/tasks` - Get tasks (with query params)
- `POST /api/tasks` - Create task
- `GET /api/tasks/:id` - Get single task
- `PUT /api/tasks/:id` - Update task
- `POST /api/tasks/:id/files` - Upload file
- `GET /api/tasks/:id/files` - Get task files

### Team (Manager/Admin only)
- `GET /api/team/employees` - Get employees
- `GET /api/team/performance` - Get team performance
- `POST /api/team/assign-task` - Assign task

### Chat
- `GET /api/chat/messages` - Get messages
- `POST /api/chat/messages` - Send message

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `POST /api/notifications` - Create notification (Admin only)

## Default Users
Create users with roles: 'admin', 'manager', 'employee'

## File Uploads
Files are stored in `/uploads` directory with size limit of 10MB.

## Email Features
- Welcome email on user registration
- Password reset email with secure token
- Password reset confirmation email

### Email Setup
1. Update `.env` with your email credentials:
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=your_email@gmail.com
```

2. For Gmail, use App Password instead of regular password