# Fastrack Driving School LMS - Setup Guide

## Complete Setup Instructions

### 1. Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (version 14 or higher)
- **npm** (comes with Node.js)
- A **Firebase account** (free tier is sufficient)

### 2. Firebase Setup

#### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: "fastrack-driving-school-lms"
4. Follow the setup wizard (you can disable Google Analytics if not needed)

#### Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable **Email/Password** authentication
3. (Optional) Enable **Google** authentication for social login

#### Step 3: Create Firestore Database

1. Go to **Firestore Database** → **Create database**
2. Start in **test mode** (we'll add security rules later)
3. Choose a location closest to your users

#### Step 4: Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click the web icon (</>) to add a web app
4. Register app with nickname: "Fastrack LMS Web"
5. Copy the Firebase configuration object

### 3. Project Installation

#### Step 1: Install Dependencies

```bash
npm install
```

#### Step 2: Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Open `.env` and add your Firebase credentials:
```env
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### 4. Firestore Database Structure

#### Create Collections

You need to create the following collections in Firestore:

1. **users** - User profiles
2. **courses** - Course information
3. **modules** - Course modules
4. **lessons** - Individual lessons
5. **progress** - User progress tracking
6. **certificates** - User certificates

#### Sample Data

Add sample course data to test the application:

**courses** collection:
```json
{
  "title": "Beginner's Driving Course",
  "description": "Perfect for first-time drivers",
  "category": "beginner",
  "featured": true,
  "totalModules": 5,
  "totalLessons": 20,
  "duration": 40,
  "level": "beginner",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 5. Firestore Security Rules

Update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the document
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);
    }
    
    // Courses collection - public read, admin write
    match /courses/{courseId} {
      allow read: if true;
      allow write: if isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'instructor'];
    }
    
    // Modules collection - public read, admin write
    match /modules/{moduleId} {
      allow read: if true;
      allow write: if isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'instructor'];
    }
    
    // Lessons collection - public read, admin write
    match /lessons/{lessonId} {
      allow read: if true;
      allow write: if isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'instructor'];
    }
    
    // Progress collection - users can only access their own progress
    match /progress/{progressId} {
      allow read: if isAuthenticated() && 
        resource.data.userId == request.auth.uid;
      allow write: if isAuthenticated() && 
        request.resource.data.userId == request.auth.uid;
    }
    
    // Certificates collection - users can only access their own certificates
    match /certificates/{certificateId} {
      allow read: if isAuthenticated() && 
        resource.data.userId == request.auth.uid;
      allow write: if isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'instructor'];
    }
  }
}
```

### 6. Running the Application

#### Development Mode

```bash
npm start
```

The application will open at [http://localhost:3000](http://localhost:3000)

#### Production Build

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

### 7. Testing the Application

#### Create a Test Account

1. Navigate to [http://localhost:3000/register](http://localhost:3000/register)
2. Fill in the registration form
3. Submit to create your account
4. You'll be automatically logged in and redirected to the dashboard

#### Test Features

- Browse courses on the home page
- Enroll in a course
- View your dashboard
- Track your progress
- Update your profile

### 8. Deployment

#### Deploy to Firebase Hosting

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase in your project:
```bash
firebase init
```

Select:
- Hosting
- Use existing project
- Public directory: `build`
- Single-page app: Yes
- Automatic builds: No

4. Build and deploy:
```bash
npm run build
firebase deploy
```

#### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

Follow the prompts to complete deployment.

### 9. Troubleshooting

#### Common Issues

**Issue: Firebase configuration error**
- Solution: Double-check your `.env` file has correct Firebase credentials

**Issue: Authentication not working**
- Solution: Ensure Email/Password authentication is enabled in Firebase Console

**Issue: Firestore permission denied**
- Solution: Check your Firestore security rules are properly configured

**Issue: Module not found errors**
- Solution: Delete `node_modules` and `package-lock.json`, then run `npm install` again

### 10. Next Steps

After successful setup:

1. **Add Course Content**: Create courses, modules, and lessons in Firestore
2. **Customize Styling**: Modify CSS modules to match your brand
3. **Add Features**: Extend functionality based on your requirements
4. **Set Up Analytics**: Integrate Google Analytics or Firebase Analytics
5. **Configure Email**: Set up email templates in Firebase for password resets

### 11. Support

For issues or questions:
- Check the README.md file
- Review Firebase documentation
- Open an issue in the repository

## Congratulations! 🎉

Your Fastrack Driving School LMS is now set up and ready to use!