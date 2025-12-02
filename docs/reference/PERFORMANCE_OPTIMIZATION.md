# Performance Optimization Guide

## Performance Strategy

Comprehensive guide to optimizing and monitoring Fastrack LMS performance.

---

## Performance Targets

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Page Load Time | < 3s | _____ | _____ |
| API Response Time | < 1s | _____ | _____ |
| Database Query | < 500ms | _____ | _____ |
| Function Cold Start | < 5s | _____ | _____ |
| Bundle Size | < 500KB | _____ | _____ |
| First Contentful Paint | < 2s | _____ | _____ |
| Largest Contentful Paint | < 3s | _____ | _____ |
| Cumulative Layout Shift | < 0.1 | _____ | _____ |

---

## Frontend Optimization

### Bundle Size Optimization

**Analyze Bundle**:
```bash
npm install -g webpack-bundle-analyzer
npm run build -- --analyze
```

**Optimization Techniques**:

1. **Code Splitting**
```javascript
// Lazy load heavy components
const AnalyticsDashboard = React.lazy(
  () => import('./pages/Analytics/Dashboard')
);

// Wrap in Suspense
<Suspense fallback={<LoadingSpinner />}>
  <AnalyticsDashboard />
</Suspense>
```

2. **Remove Unused Dependencies**
```bash
# Find unused packages
npm prune
npm dedupe

# Check for duplicate packages
npm ls
```

3. **Minify & Optimize**
```bash
# Production build automatically optimizes
npm run build

# Check output size
ls -lh build/static/js/
```

### React Performance

**Prevent Unnecessary Re-renders**:
```javascript
// Use React.memo for pure components
export const CourseCard = React.memo(({ course }) => {
  return <div>{course.title}</div>;
});

// Use useMemo for expensive calculations
const sortedCourses = useMemo(
  () => courses.sort((a, b) => a.title.localeCompare(b.title)),
  [courses]
);

// Use useCallback to memoize functions
const handleEnroll = useCallback(
  (courseId) => enrollCourse(courseId),
  []
);
```

### Image Optimization

```javascript
// Use responsive images
<picture>
  <source srcSet="image-small.webp" media="(max-width: 640px)" />
  <source srcSet="image-large.webp" media="(min-width: 641px)" />
  <img src="image-fallback.jpg" alt="description" />
</picture>

// Use lazy loading
<img loading="lazy" src="course-image.jpg" alt="course" />

// Compress images before upload
// PNG: 70-85% quality
// JPEG: 75-85% quality
```

### Caching Strategy

```javascript
// Browser cache
<link rel="preconnect" href="https://firebaseapp.com" />
<link rel="dns-prefetch" href="https://api.stripe.com" />

// Service Worker caching (if configured)
// Cache static assets
// Cache API responses with TTL

// Local storage for user preferences
storageService.set('userPreferences', prefs, { ttl: 7 * 24 * 3600 });
```

---

## Backend Optimization

### Cloud Functions Performance

**Memory Configuration**:
```bash
# Set function memory in firebase.json
{
  "functions": {
    "memory": 512MB,        # Default 256MB, increase if needed
    "timeoutSeconds": 540   # Max 540 seconds
  }
}
```

**Optimization**:
```javascript
// Reuse connections
const stripe = require('stripe')(apiKey); // Keep global

// Batch operations
const batch = db.batch();
batch.set(doc1, data1);
batch.set(doc2, data2);
await batch.commit();

// Add timeouts to prevent long waits
const timeout = (ms) => new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Timeout')), ms)
);

const result = await Promise.race([
  expensiveOperation(),
  timeout(5000)
]);
```

### Firestore Optimization

**Query Optimization**:
```javascript
// ❌ Bad: Fetch all then filter
const allUsers = await db.collection('users').get();
const admins = allUsers.docs.filter(d => d.data().role === 'admin');

// ✅ Good: Filter in query
const admins = await db.collection('users')
  .where('role', '==', 'admin')
  .get();

// ❌ Bad: Multiple queries
const user = await db.collection('users').doc(userId).get();
const enrollments = await db.collection('enrollments')
  .where('userId', '==', userId)
  .get();

// ✅ Good: Query with composite index
const enrollments = await db.collection('enrollments')
  .where('userId', '==', userId)
  .orderBy('enrolledAt', 'desc')
  .get();
```

**Index Usage**:
```bash
# Create composite indexes in Firebase Console
# Firestore → Indexes → Create Index

# Examples:
# users: email (ascending)
# courses: status (ascending), publishedAt (descending)
# enrollments: userId + courseId (composite)
```

**Pagination**:
```javascript
// Load data in pages, not all at once
const PAGE_SIZE = 20;

const firstPage = await db.collection('courses')
  .orderBy('createdAt', 'desc')
  .limit(PAGE_SIZE)
  .get();

// Get last doc for pagination
const lastDoc = firstPage.docs[firstPage.docs.length - 1];

// Get next page
const nextPage = await db.collection('courses')
  .orderBy('createdAt', 'desc')
  .startAfter(lastDoc)
  .limit(PAGE_SIZE)
  .get();
```

---

## Database Performance

### Query Monitoring

**Monitor Slow Queries**:
```bash
# Firebase Console → Firestore → Stats
# Review reads/writes/deletes

# Monitor indexes
# Firestore → Indexes → Monitor usage
```

### Scaling Indicators

| Indicator | Action | Current |
|-----------|--------|---------|
| Reads > 100K/day | Implement caching | _____ |
| Writes > 50K/day | Batch operations | _____ |
| Query > 1s | Add indexes | _____ |
| Hot documents | Distribute data | _____ |

---

## Network Performance

### API Response Times

**Monitor**:
```bash
# Check in DevTools Network tab
# Target: < 1s response time

# Monitor in Firebase Console
# Functions → Monitoring
```

**Optimization**:
```javascript
// Compress responses
app.use(compression()); // If using Express

// Return only needed data
// ❌ return await db.collection('users').get(); // All fields
// ✅ return await db.collection('users').select('id', 'name').get();

// Cache API responses
const cachedResult = await storageService.get('key');
if (cachedResult) return cachedResult;

const result = await fetchData();
await storageService.set('key', result, { ttl: 3600 });
return result;
```

### Compression

```bash
# Gzip compression automatically enabled in Firebase Hosting
# Verify: Response Headers → Content-Encoding: gzip
```

---

## Monitoring & Profiling

### Chrome DevTools Performance

1. **Open DevTools** → Performance tab
2. **Record** page load
3. **Analyze**:
   - Long tasks (> 50ms)
   - Layout thrashing
   - Unnecessary repaints
   - JavaScript blocking

### Lighthouse Audit

```bash
# Run Lighthouse in Chrome DevTools
# Right-click → Inspect → Lighthouse → Analyze page load

# Target scores:
# Performance: > 90
# Accessibility: > 90
# Best Practices: > 90
# SEO: > 90
```

### Performance Monitoring

```javascript
// Measure component render time
const startTime = performance.now();
render(<Component />);
const renderTime = performance.now() - startTime;

if (renderTime > 100) {
  console.warn(`Slow component render: ${renderTime}ms`);
}

// Track Core Web Vitals
import web-vitals;
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);  // Cumulative Layout Shift
getFID(console.log);  // First Input Delay
getFCP(console.log);  // First Contentful Paint
getLCP(console.log);  // Largest Contentful Paint
getTTFB(console.log); // Time to First Byte
```

---

## Load Testing

### Prepare for High Traffic

**Test Limits**:
```bash
# Firebase has built-in scaling, but test to be safe

# Load test tools:
# - Apache JMeter
# - k6 (https://k6.io)
# - Locust

# Example: 100 concurrent users, 5 minutes
# Expected: No errors, response time < 2s
```

### Database Limits

```
Firestore Default Quotas:
- 25K writes/day (soft limit)
- 100K reads/day (soft limit)
- 10 QPS sustained (Cloud Functions)

Increase via:
Firebase Console → Firestore → Quotas
Request quota increase if needed
```

---

## Optimization Checklist

### Frontend Optimization

- [ ] Bundle size < 500KB (gzipped)
- [ ] First Contentful Paint < 2s
- [ ] Largest Contentful Paint < 3s
- [ ] Cumulative Layout Shift < 0.1
- [ ] Lighthouse score > 90
- [ ] No console errors
- [ ] Images optimized and lazy-loaded
- [ ] Code splitting implemented
- [ ] Unused dependencies removed
- [ ] Minification enabled

### Backend Optimization

- [ ] Database queries use indexes
- [ ] Firestore composite indexes created
- [ ] Query response time < 500ms
- [ ] Function cold start < 5s
- [ ] Function memory appropriate (256-512MB)
- [ ] Timeouts configured
- [ ] Error rates < 0.1%
- [ ] Batch operations used
- [ ] Connection pooling enabled
- [ ] Caching implemented

### Network Optimization

- [ ] Compression enabled (gzip)
- [ ] CDN configured (Firebase Hosting)
- [ ] DNS prefetch configured
- [ ] API response time < 1s
- [ ] Pagination implemented
- [ ] No N+1 queries
- [ ] Data over-fetching eliminated

---

## Performance Budget

Track performance across releases:

```javascript
// Performance budget thresholds
const performanceBudget = {
  bundleSize: 500 * 1024,      // 500KB
  firstContentfulPaint: 2000,   // 2s
  largestContentfulPaint: 3000, // 3s
  timeToInteractive: 4000,      // 4s
  jsSize: 250 * 1024,           // 250KB
  cssSize: 50 * 1024            // 50KB
};
```

---

## Continuous Performance Monitoring

### Monthly Review

- [ ] Review performance metrics
- [ ] Check error rates
- [ ] Analyze slow operations
- [ ] Review user feedback
- [ ] Plan optimizations

### Quarterly Optimization

- [ ] Full performance audit
- [ ] Update optimization strategies
- [ ] Test with production-like load
- [ ] Document improvements

---

**Last Updated**: December 2, 2025
