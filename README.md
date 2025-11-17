# Fastrack Driving School LMS

A comprehensive Learning Management System (LMS) built with React 18+ and Firebase for driving school education.

## Features

- 🔐 **Authentication System**: Email/password and Google OAuth login
- 📚 **Course Management**: Browse, enroll, and track course progress
- 📖 **Lesson System**: Multiple lesson types (video, reading, quiz, test, practical)
- 📊 **Progress Tracking**: Real-time progress monitoring and statistics
- ⏱️ **Time Tracking**: Session and daily learning time tracking
- 🎓 **Certificates**: Generate and download course completion certificates
- 👤 **User Profiles**: Customizable user profiles with preferences
- 🎨 **Modern UI**: Responsive design with CSS Modules
- 🔔 **Notifications**: Toast notifications and modal system
- 🛡️ **Role-Based Access**: Student, Instructor, and Admin roles

## Tech Stack

- **Frontend**: React 18+, React Router v6
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Styling**: CSS Modules
- **State Management**: React Context API
- **Form Handling**: Custom hooks with validation

## Project Structure

```
fastrack-driving-school-lms/
├── public/                      # Static files
├── src/
│   ├── api/                     # Firebase service functions
│   ├── assets/                  # Images, styles, icons
│   ├── components/
│   │   ├── common/              # Reusable UI components
│   │   ├── layout/              # Layout components
│   │   └── guards/              # Route protection components
│   ├── config/                  # Firebase and environment config
│   ├── constants/               # App constants and configurations
│   ├── context/                 # React Context providers
│   ├── features/                # Feature-specific components
│   ├── hooks/                   # Custom React hooks
│   ├── pages/                   # Page components
│   ├── utils/                   # Utility functions
│   ├── App.jsx                  # Main app component
│   └── index.js                 # App entry point
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 14+ and npm
- Firebase account and project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd fastrack-driving-school-lms
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

4. Configure Firebase:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use existing one
   - Enable Authentication (Email/Password and Google)
   - Create a Firestore database
   - Copy your Firebase configuration

5. Update `.env` with your Firebase credentials:
```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

6. Start the development server:
```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

## Firebase Setup

### Firestore Collections

Create the following collections in Firestore:

1. **users**: User profiles
```javascript
{
  uid: string,
  email: string,
  displayName: string,
  role: string, // 'student', 'instructor', 'admin'
  photoURL: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

2. **courses**: Course information
```javascript
{
  title: string,
  description: string,
  category: string,
  featured: boolean,
  totalModules: number,
  totalLessons: number,
  duration: number,
  level: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

3. **modules**: Course modules
```javascript
{
  courseId: string,
  title: string,
  description: string,
  order: number,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

4. **lessons**: Individual lessons
```javascript
{
  courseId: string,
  moduleId: string,
  title: string,
  description: string,
  type: string, // 'video', 'reading', 'quiz', 'test'
  content: object,
  order: number,
  duration: number,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

5. **progress**: User progress tracking
```javascript
{
  userId: string,
  courseId: string,
  enrolled: boolean,
  completedLessons: number,
  totalLessons: number,
  overallProgress: number,
  lessonProgress: object,
  moduleProgress: object,
  enrolledAt: timestamp,
  lastAccessedAt: timestamp,
  updatedAt: timestamp
}
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Courses collection
    match /courses/{courseId} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'instructor'];
    }
    
    // Modules collection
    match /modules/{moduleId} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'instructor'];
    }
    
    // Lessons collection
    match /lessons/{lessonId} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'instructor'];
    }
    
    // Progress collection
    match /progress/{progressId} {
      allow read: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow write: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
  }
}
```

## Available Scripts

- `npm start` - Run development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

## Key Components

### Context Providers

- **AuthContext**: Manages authentication state and user data
- **CourseContext**: Handles course data and navigation
- **TimerContext**: Tracks learning time and sessions
- **ModalContext**: Global modal management

### Common Components

- **Button**: Reusable button with variants
- **Card**: Container component
- **Input/Select/Checkbox**: Form components
- **LoadingSpinner**: Loading indicators
- **ProgressBar**: Progress visualization
- **Badge**: Status badges
- **Modals**: Confirmation and notification modals

### Route Guards

- **ProtectedRoute**: Requires authentication
- **PublicRoute**: Redirects authenticated users
- **RoleBasedRoute**: Role-based access control

## Usage Examples

### Using Authentication

```javascript
import { useAuth } from './context/AuthContext';

function MyComponent() {
  const { user, login, logout } = useAuth();
  
  const handleLogin = async () => {
    try {
      await login(email, password);
    } catch (error) {
      console.error(error);
    }
  };
  
  return <div>{user ? 'Logged in' : 'Not logged in'}</div>;
}
```

### Using Course Context

```javascript
import { useCourse } from './context/CourseContext';

function CourseList() {
  const { courses, loading, fetchCourses } = useCourse();
  
  useEffect(() => {
    fetchCourses();
  }, []);
  
  return (
    <div>
      {courses.map(course => (
        <div key={course.id}>{course.title}</div>
      ))}
    </div>
  );
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@fastrackdrivingschool.com or open an issue in the repository.