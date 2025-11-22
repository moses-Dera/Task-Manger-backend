# 🚀 TaskFlow Backend API

<div align="center">
  <h3>Enterprise-grade Task Management Backend</h3>
  <p>Built with Node.js, Express, MongoDB & Professional Email Integration</p>
  
  ![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
  ![Express](https://img.shields.io/badge/Express-4.18+-blue.svg)
  ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)
  ![JWT](https://img.shields.io/badge/Auth-JWT-orange.svg)
</div>

---

## 📋 Table of Contents

- [🎯 Overview](#-overview)
- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🚀 Quick Start](#-quick-start)
- [🔧 Configuration](#-configuration)
- [📚 API Documentation](#-api-documentation)
- [🔐 Authentication](#-authentication)
- [📧 Email System](#-email-system)
- [📁 File Structure](#-file-structure)
- [🧪 Testing](#-testing)
- [🚢 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)

---

## 🎯 Overview

TaskFlow Backend is a comprehensive REST API built for modern task management applications. It provides enterprise-level features including role-based authentication, real-time messaging, file management, and professional email communications.

### 🎪 Live Demo
- **Frontend**: [https://b2-b-task-manager.vercel.app](https://b2-b-task-manager.vercel.app)
- **API Base URL**: `http://localhost:5000/api` (local development)

---

## ✨ Features

### 🔐 **Authentication & Security**
- JWT-based authentication with 24h expiry
- Role-based access control (Admin, Manager, Employee)
- Secure password hashing with bcrypt
- Password reset with time-limited tokens
- Input validation and sanitization

### 👥 **User Management**
- User registration and profile management
- Role-based permissions
- Team performance analytics
- Employee statistics and scoring

### 📋 **Task Management**
- Complete CRUD operations for tasks
- Task status tracking (pending, in-progress, completed, overdue)
- Priority levels (low, medium, high)
- Due date management
- File attachments (up to 10MB)
- Advanced filtering and querying

### 💬 **Communication**
- Real-time messaging system
- User-to-user chat functionality
- Notification system with read/unread status
- Professional email templates

### 📧 **Email Integration**
- Welcome emails for new users
- Password reset emails with secure tokens
- Confirmation emails for security actions
- Professional HTML templates with responsive design

### 📊 **Analytics & Reporting**
- Team performance metrics
- Task completion rates
- Employee productivity scores
- Dashboard analytics data

---

## 🏗️ Architecture

### **MVC Pattern Implementation**
```
├── controllers/     # Business logic layer
├── models/         # Database schemas & validation
├── routes/         # API endpoints & middleware
├── middleware/     # Authentication & validation
├── utils/          # Helper functions & services
└── uploads/        # File storage directory
```

### **Technology Stack**
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18+
- **Database**: MongoDB Atlas
- **ODM**: Mongoose 7.5+
- **Authentication**: JWT + bcrypt
- **Email**: Nodemailer with Gmail SMTP
- **File Upload**: Multer
- **Validation**: Express-validator

---

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ installed
- MongoDB Atlas account (or local MongoDB)
- Gmail account for email services

### **Installation**

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Task-Manger-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Verify installation**
   ```bash
   curl http://localhost:5000/api/auth/me
   # Should return authentication required message
   ```

---

## 🔧 Configuration

### **Environment Variables**

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/taskflow

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-characters

# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com

# Frontend URL (for email links)
FRONTEND_URL=https://your-frontend-domain.com
```

### **Gmail Setup for Email Services**

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use this password in `EMAIL_PASS`

### **MongoDB Atlas Setup**

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Add database user with read/write permissions
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get connection string and add to `MONGODB_URI`

---

## 📚 API Documentation

### **Base URL**
```
Local: http://localhost:5000/api
Production: https://your-api-domain.com/api
```

### **Authentication Endpoints**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/signup` | Register new user | ❌ |
| POST | `/auth/login` | User login | ❌ |
| GET | `/auth/me` | Get current user | ✅ |
| POST | `/auth/forgot-password` | Request password reset | ❌ |
| POST | `/auth/reset-password` | Reset password with token | ❌ |

### **User Management**

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/users/profile` | Get user profile | ✅ | All |
| PUT | `/users/profile` | Update profile | ✅ | All |

### **Task Management**

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/tasks` | Get tasks (with filters) | ✅ | All |
| POST | `/tasks` | Create new task | ✅ | Admin, Manager |
| GET | `/tasks/:id` | Get single task | ✅ | All |
| PUT | `/tasks/:id` | Update task | ✅ | All |
| POST | `/tasks/:id/files` | Upload file to task | ✅ | All |
| GET | `/tasks/:id/files` | Get task files | ✅ | All |

### **Team Management**

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/team/employees` | Get employee list | ✅ | Admin, Manager |
| GET | `/team/performance` | Get team metrics | ✅ | Admin, Manager |
| POST | `/team/assign-task` | Assign task to employee | ✅ | Admin, Manager |

### **Communication**

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/chat/messages` | Get messages | ✅ | All |
| POST | `/chat/messages` | Send message | ✅ | All |
| GET | `/notifications` | Get notifications | ✅ | All |
| PUT | `/notifications/:id/read` | Mark as read | ✅ | All |
| POST | `/notifications` | Create notification | ✅ | Admin |

### **Request/Response Examples**

#### **User Registration**
```bash
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@company.com",
  "password": "securePassword123",
  "role": "employee"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "John Doe",
    "email": "john@company.com",
    "role": "employee"
  }
}
```

#### **Create Task**
```bash
POST /api/tasks
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "title": "Complete Q4 Report",
  "description": "Analyze sales data and prepare quarterly report",
  "assigned_to": "64f8a1b2c3d4e5f6a7b8c9d0",
  "priority": "high",
  "due_date": "2024-01-15T23:59:59.000Z"
}
```

#### **Query Tasks**
```bash
GET /api/tasks?status=pending&tab=today
Authorization: Bearer <jwt-token>
```

---

## 🔐 Authentication

### **JWT Token Structure**
```javascript
{
  "userId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "email": "user@company.com",
  "role": "employee",
  "iat": 1640995200,
  "exp": 1641081600
}
```

### **Role-Based Access Control**

| Role | Permissions |
|------|-------------|
| **Admin** | Full access to all endpoints and data |
| **Manager** | Team management, task assignment, employee analytics |
| **Employee** | Own tasks, profile management, messaging |

### **Using Authentication**

1. **Login to get token**:
   ```bash
   POST /api/auth/login
   {
     "email": "user@company.com",
     "password": "password123"
   }
   ```

2. **Include token in requests**:
   ```bash
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

## 📧 Email System

### **Email Templates**

The system includes three professional email templates:

1. **Welcome Email** 🎉
   - Sent automatically on user registration
   - Includes account details and getting started guide
   - Professional branding with TaskFlow theme

2. **Password Reset Email** 🔐
   - Secure token-based password reset
   - 1-hour expiration for security
   - Clear call-to-action with fallback link

3. **Reset Confirmation Email** ✅
   - Confirms successful password change
   - Security tips and warnings
   - Professional security team branding

### **Email Features**
- Responsive HTML design
- Professional branding
- Security-focused messaging
- Mobile-friendly layouts
- Fallback text versions

### **Email Configuration**

Supported email providers:
- **Gmail** (recommended)
- **Outlook/Hotmail**
- **Custom SMTP servers**

---

## 📁 File Structure

```
Task-Manger-backend/
├── 📁 controllers/           # Business logic
│   ├── authController.js     # Authentication logic
│   ├── taskController.js     # Task management
│   ├── userController.js     # User operations
│   ├── teamController.js     # Team management
│   ├── chatController.js     # Messaging system
│   └── notificationController.js # Notifications
├── 📁 models/               # Database schemas
│   ├── User.js              # User model
│   ├── Task.js              # Task model
│   ├── Message.js           # Chat messages
│   ├── Notification.js      # Notifications
│   └── TaskFile.js          # File attachments
├── 📁 routes/               # API endpoints
│   ├── auth.js              # Auth routes
│   ├── users.js             # User routes
│   ├── tasks.js             # Task routes
│   ├── team.js              # Team routes
│   ├── chat.js              # Chat routes
│   └── notifications.js     # Notification routes
├── 📁 middleware/           # Custom middleware
│   └── auth.js              # JWT authentication
├── 📁 utils/                # Helper functions
│   └── emailService.js      # Email templates
├── 📁 uploads/              # File storage
├── 📄 server.js             # Application entry point
├── 📄 package.json          # Dependencies
├── 📄 .env                  # Environment variables
├── 📄 .gitignore           # Git ignore rules
└── 📄 README.md            # This file
```

---

## 🧪 Testing

### **Manual Testing with cURL**

1. **Test server health**:
   ```bash
   curl http://localhost:5000/api/auth/me
   ```

2. **Register a user**:
   ```bash
   curl -X POST http://localhost:5000/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
   ```

3. **Login**:
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   ```

### **Testing Checklist**

- [ ] User registration and login
- [ ] JWT token validation
- [ ] Password reset flow
- [ ] Task CRUD operations
- [ ] File upload functionality
- [ ] Role-based access control
- [ ] Email sending (check spam folder)
- [ ] Database connections

---

## 🚢 Deployment

### **Production Environment Variables**

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=super-secure-production-secret-min-32-chars
FRONTEND_URL=https://your-production-domain.com
```

### **Deployment Platforms**

#### **Heroku**
```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set JWT_SECRET=your-jwt-secret

# Deploy
git push heroku main
```

#### **Railway**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

#### **DigitalOcean App Platform**
1. Connect your GitHub repository
2. Configure environment variables
3. Deploy with automatic builds

### **Production Checklist**

- [ ] Environment variables configured
- [ ] MongoDB Atlas IP whitelist updated
- [ ] JWT secret is secure (32+ characters)
- [ ] Email credentials are valid
- [ ] CORS configured for frontend domain
- [ ] File upload limits appropriate
- [ ] Error logging configured
- [ ] Health check endpoint working

---

## 🤝 Contributing

### **Development Setup**

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and test thoroughly
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Create Pull Request

### **Code Style**

- Use ES6+ features
- Follow MVC architecture
- Add JSDoc comments for functions
- Use meaningful variable names
- Handle errors gracefully
- Validate all inputs

### **Commit Convention**

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation updates
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions
- `chore:` Maintenance tasks

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Email**: support@taskflow.com
- **Documentation**: [API Docs](https://your-api-docs.com)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Built with ❤️ for modern task management</p>
  <p><strong>TaskFlow Backend API v1.0.0</strong></p>
</div>