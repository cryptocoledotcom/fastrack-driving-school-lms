# Gemini Prompt: Coming Soon Landing Page Component

**DO NOT USE TYPESCRIPT, TAILWIND, OR LUCIDE-REACT**

---

## PROJECT CONTEXT

**Project**: Fastrack Driving School Learning Management System  
**Tech Stack**: React 19.2.1, Vite 5.4.21, CSS Modules, Plain JavaScript (`.jsx`)  
**Status**: Production-ready LMS — NOT launching full platform yet. Need interim "Coming Soon" landing page.  
**Target Deployment**: Replace current landing page (or be selectively shown) until Q1 2026 launch.

---

## COMPONENT REQUIREMENTS

### Structure & Naming
- **File**: `src/pages/LandingPage.jsx` (plain JavaScript, NOT TypeScript)
- **Styles**: `src/pages/LandingPage.module.css` (CSS Modules, NOT Tailwind)
- **Icons**: Use SVG inline or HTML5 shapes (NOT lucide-react library)
- **No External Icon Libraries**: All icons must be custom SVG or Unicode symbols

### Imports & Dependencies
- Use `import React from 'react'` (not JSX pragma)
- Import styles as CSS module: `import styles from './LandingPage.module.css'`
- NO Tailwind imports, NO lucide-react imports
- Use standard React Router for any links: `import { Link } from 'react-router-dom'`

### Component Export
```javascript
export default LandingPage;
```

---

## DESIGN & VISUAL REQUIREMENTS

### Layout & Sections
The landing page must include these sections in order:

1. **Hero Section** (full-width, eye-catching)
   - Large headline: "We're Building Something Great"
   - Subheadline: "We're working on bringing a new learning environment to you. Coming Soon."
   - Professional background with subtle gradient or geometric shapes
   - NO video (keep it lightweight)

2. **Timeline Section** (central focus)
   - Display expected launch: **Q1 2026**
   - Show a visual timeline/countdown or milestone display
   - Keep design clean and modern

3. **Value Proposition Section** (3-4 key benefits)
   - Brief description of what Fastrack LMS will offer
   - Keep text concise and benefit-focused
   - Use icons (custom SVG or HTML shapes) to represent each benefit

4. **Email Signup CTA** (prominent call-to-action)
   - Input field for email address with label: "Get Notified When We Launch"
   - Submit button text: "Notify Me"
   - Success message feedback: "Thank you! We'll notify you at launch."
   - Error handling: "Please enter a valid email address."
   - Store email (localStorage or mock submission) — do NOT require backend for MVP

5. **Contact Information Section** (footer-like)
   - Display: Email, Phone, Website/Social (or just email + phone)
   - Make it scannable and easy to find
   - Use small icons or simple text styling

### Design Aesthetic
- **Color Scheme**: Professional, modern (blues, grays, accent color — match brand if available)
- **Typography**: Clean, readable fonts (system fonts acceptable; no custom fonts required)
- **Spacing**: Generous whitespace, clear visual hierarchy
- **Effects** (subtle, not overwhelming):
  - Gentle hover effects on interactive elements
  - Optional: Smooth fade-in animations on scroll
  - Optional: Glowing accents or subtle gradients (if done tastefully)
  - NO jarring animations or excessive transitions
- **Responsive Design**: Must work on mobile, tablet, desktop
  - Mobile: Single column, touch-friendly buttons
  - Tablet: 2-column where appropriate
  - Desktop: Optimized multi-section layout

---

## TECHNICAL CONSTRAINTS

### Must Follow
- ✅ Plain JavaScript (`.jsx`), NOT TypeScript
- ✅ CSS Modules (NOT Tailwind, NOT inline styles, NOT global CSS)
- ✅ HTML5 and SVG for icons (NOT lucide-react, NOT any icon library)
- ✅ React 19 compatible
- ✅ No external animation libraries (use CSS animations/transitions or React state)
- ✅ No unneeded dependencies

### Must NOT Include
- ❌ TypeScript
- ❌ Tailwind CSS
- ❌ lucide-react or any icon library
- ❌ Three.js, Lottie, or heavy animation frameworks
- ❌ Unnecessary npm packages
- ❌ Global CSS or inline styles
- ❌ Comments in code (clean, self-documenting code only)

---

## FUNCTIONALITY REQUIREMENTS

### Email Signup
- Validate email format before submission
- Show loading state while "submitting" (mock delay 500-800ms)
- Show success message and clear input on successful submission
- Show error message for invalid email
- Store submitted emails in localStorage with timestamp
- Prevent duplicate submissions of same email within session

### Responsive Behavior
- Hamburger menu on mobile (optional, if navigation is included)
- Touch-friendly buttons and inputs (min 44px height)
- Readable text without excessive zoom
- Images/SVGs scale appropriately

### Performance
- Lightweight bundle (no bloat)
- Fast initial load (no unnecessary renders)
- Smooth transitions and animations

---

## BRAND CONTEXT (REFERENCE)

- **Company**: Fastrack Driving School
- **Offering**: Ohio-compliant driver education LMS
- **Current Feature**: E2E tested with 200+ Playwright tests
- **Mission**: Provide modern, compliant learning management for driving education
- **Contact**: 
  - Email: `info@fastrackdrive.com`
  - Phone: `(412) 974-8858`
  - Address: 45122 Oak Dr., Wellsville, Ohio 43968

---

## CODE STYLE EXPECTATIONS

### General
- Clean, readable, self-documenting code
- No comments (code should be clear)
- Consistent naming: camelCase for variables/functions, PascalCase for components
- React hooks (useState, useEffect) where state is needed
- Separate concerns: logic from UI

### Example Pattern (match this style)
```javascript
import React from 'react';
import styles from './LandingPage.module.css';

const LandingPage = () => {
  const [email, setEmail] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!email || !isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
    }, 3000);
  };

  const isValidEmail = (email) => {
    const regex = /^[^@]+@[^@]+\.[^@]+$/;
    return regex.test(email);
  };

  return (
    <div className={styles.landingPage}>
      {/* Sections here */}
    </div>
  );
};

export default LandingPage;
```

---

## DELIVERABLES

Provide **two files**:

1. **`LandingPage.jsx`** — React component with all functionality
2. **`LandingPage.module.css`** — All styling (CSS Modules)

Both must be production-ready, tested for responsiveness, and aligned with the design and constraints above.

---

## FINAL NOTES

- This is an **interim solution** (Q1 2026 target for full platform)
- Focus on **professional appearance** and **reliable functionality**
- Keep it **lightweight** and **maintainable**
- Ensure **cross-browser compatibility**
- Make it **accessible** (semantic HTML, proper contrast, keyboard navigation)
