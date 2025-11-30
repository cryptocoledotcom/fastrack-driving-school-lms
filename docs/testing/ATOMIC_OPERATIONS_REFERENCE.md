---
description: Atomic Operations Reference Guide - Race Condition Prevention
alwaysApply: true
---

# Atomic Operations Reference Guide

**Purpose**: Prevent race conditions in concurrent Firestore updates  
**Pattern**: Use server-side atomic operations instead of client-side read-modify-write

---

## Quick Reference

### ❌ DON'T: Read-Modify-Write (Vulnerable)
```javascript
const doc = await getDoc(docRef);
const oldCount = doc.data().count || 0;
const newCount = oldCount + 1;
await updateDoc(docRef, { count: newCount });  // Race condition!
```

### ✅ DO: Atomic Operations (Safe)
```javascript
import { increment } from 'firebase/firestore';

await updateDoc(docRef, {
  count: increment(1)  // Server-side atomic
});
```

---

## Pattern 1: Counter Increment

**When**: Multiple users/tabs updating same counter

**Before** (❌ Unsafe):
```javascript
const data = await getDoc(ref);
const count = data.data().count || 0;
await updateDoc(ref, { count: count + 1 });
```

**After** (✅ Safe):
```javascript
import { increment } from 'firebase/firestore';
await updateDoc(ref, { count: increment(1) });
```

---

## Pattern 2: Counter Decrement

**When**: Subtracting from a counter

**❌ Unsafe**:
```javascript
const data = await getDoc(ref);
const balance = data.data().balance || 0;
await updateDoc(ref, { balance: balance - 100 });
```

**✅ Safe**:
```javascript
await updateDoc(ref, {
  balance: increment(-100)  // Negative increment
});
```

---

## Pattern 3: Batch Atomic Operations

**When**: Multiple fields need atomic update

**Example**: Payment processing
```javascript
import { writeBatch, increment, serverTimestamp } from 'firebase/firestore';

const batch = writeBatch(db);
const enrollmentRef = doc(db, 'users', userId, 'courses', courseId);

batch.update(enrollmentRef, {
  amountPaid: increment(paymentAmount),      // Atomic increment
  amountDue: increment(-paymentAmount),      // Atomic decrement
  paymentCount: increment(1),                // Counter increment
  lastPaymentAt: serverTimestamp(),          // Server timestamp
  status: 'COMPLETED'                        // Regular field
});

await batch.commit();  // All or nothing
```

---

## Pattern 4: Array Operations (Safe Append)

**When**: Adding items to arrays (won't lose concurrent appends)

**❌ Unsafe**:
```javascript
const data = await getDoc(ref);
const history = data.data().history || [];
history.push(newEvent);
await updateDoc(ref, { history });  // Could lose concurrent appends
```

**✅ Safe**:
```javascript
import { arrayUnion } from 'firebase/firestore';

await updateDoc(ref, {
  history: arrayUnion(newEvent)  // Server-side atomic append
});
```

---

## Pattern 5: Array Multiple Operations

**When**: Multiple arrays being updated

```javascript
import { writeBatch, arrayUnion, serverTimestamp } from 'firebase/firestore';

const batch = writeBatch(db);

batch.update(ref1, {
  events: arrayUnion(newEvent),
  timestamp: serverTimestamp()
});

batch.update(ref2, {
  notifications: arrayUnion(notification),
  processed: true
});

await batch.commit();
```

---

## Pattern 6: Complex Conditional Logic

**When**: Need to set status based on computed value

**Challenge**: Can't read value inside atomic operation

**Solution**: Compute condition BEFORE update, use atomic operation
```javascript
import { increment, serverTimestamp, writeBatch } from 'firebase/firestore';

const data = await getDoc(ref);
const currentDue = Number(data.data().amountDue || 0);
const paymentAmount = 250;

// COMPUTE condition before atomic operation
const remainingAfterPayment = Math.max(0, currentDue - paymentAmount);
const newStatus = remainingAfterPayment === 0 ? 'COMPLETED' : 'PARTIAL';

// USE atomic operations for updates
const batch = writeBatch(db);
batch.update(ref, {
  amountDue: increment(-paymentAmount),    // Atomic
  status: newStatus,                       // Computed beforehand
  updatedAt: serverTimestamp()
});
await batch.commit();
```

---

## Common Mistakes

### ❌ Mistake 1: Using computed value with increment
```javascript
// WRONG!
const increase = 10;
await updateDoc(ref, {
  count: count + increase  // Not atomic!
});
```

### ✅ Correct
```javascript
const increase = 10;
await updateDoc(ref, {
  count: increment(increase)  // Atomic
});
```

---

### ❌ Mistake 2: Forgetting negative for decrement
```javascript
// WRONG!
await updateDoc(ref, {
  balance: increment(-100)  // This is actually a subtraction
  // Wait, no... this is CORRECT! Use negative values
});

// Actually, that was right. But common mistake:
await updateDoc(ref, {
  balance: -100  // WRONG! Sets value to -100, doesn't subtract
});
```

### ✅ Correct
```javascript
await updateDoc(ref, {
  balance: increment(-100)  // Subtract 100 atomically
});
```

---

### ❌ Mistake 3: Not using writeBatch for multiple updates
```javascript
// WRONG - Multiple operations, not atomic
await updateDoc(ref1, { count: increment(1) });
await updateDoc(ref2, { total: increment(1) });
// If second fails, first succeeds = inconsistent state
```

### ✅ Correct
```javascript
const batch = writeBatch(db);
batch.update(ref1, { count: increment(1) });
batch.update(ref2, { total: increment(1) });
await batch.commit();
// Both succeed or both fail
```

---

## When to Use Each Operation

| Operation | Use Case | Thread-Safe |
|-----------|----------|------------|
| `increment()` | Counters, amounts | ✅ Yes |
| `increment(-n)` | Decrement, subtract | ✅ Yes |
| `arrayUnion()` | Add to array | ✅ Yes |
| `serverTimestamp()` | Record time | ✅ Yes |
| Regular update | Non-numeric fields | ⚠️ Maybe |
| `setDoc()` | Create new | ✅ Usually |
| `writeBatch()` | Multi-doc transaction | ✅ Yes |

---

## Best Practices

### 1. Always use `increment()` for counters
```javascript
// Good
batch.update(ref, { count: increment(1) });

// Bad
const count = await getDoc(ref);
batch.update(ref, { count: count.data().count + 1 });
```

### 2. Always use `arrayUnion()` for arrays
```javascript
// Good
batch.update(ref, { items: arrayUnion(newItem) });

// Bad
const doc = await getDoc(ref);
const items = doc.data().items || [];
items.push(newItem);
batch.update(ref, { items });
```

### 3. Always use `serverTimestamp()` for timestamps
```javascript
// Good
batch.update(ref, { updatedAt: serverTimestamp() });

// Bad
batch.update(ref, { updatedAt: new Date() });  // Client time!
```

### 4. Group related updates in batches
```javascript
// Good
const batch = writeBatch(db);
batch.update(ref1, { ...updates1 });
batch.update(ref2, { ...updates2 });
await batch.commit();

// Bad - could be inconsistent if second fails
await updateDoc(ref1, { ...updates1 });
await updateDoc(ref2, { ...updates2 });
```

### 5. Handle errors for batch operations
```javascript
const batch = writeBatch(db);
batch.update(ref, { count: increment(1) });

try {
  await batch.commit();
  console.log('✅ Update successful');
} catch (error) {
  console.error('❌ Update failed:', error);
  // Both updates failed - no partial state
}
```

---

## Real-World Examples

### Example 1: Payment Processing
```javascript
import { writeBatch, increment, serverTimestamp } from 'firebase/firestore';

async function processPayment(enrollmentRef, paymentAmount) {
  const batch = writeBatch(db);
  
  const enrollment = await getDoc(enrollmentRef);
  const remainingDue = Math.max(
    0,
    (enrollment.data().amountDue || 0) - paymentAmount
  );

  batch.update(enrollmentRef, {
    amountPaid: increment(paymentAmount),
    amountDue: increment(-paymentAmount),
    paymentCount: increment(1),
    paymentStatus: remainingDue === 0 ? 'COMPLETED' : 'PARTIAL',
    lastPaymentAt: serverTimestamp()
  });

  await batch.commit();
  return { success: true, remainingDue };
}
```

### Example 2: Quiz Submission
```javascript
async function submitQuizAttempt(quizRef, attempt) {
  const batch = writeBatch(db);
  
  const userRef = doc(db, 'users', attempt.userId);
  const courseRef = doc(db, 'courses', attempt.courseId);

  batch.update(quizRef, {
    attempts: increment(1),
    totalScore: increment(attempt.score),
    results: arrayUnion({
      attemptNumber: Date.now(),
      score: attempt.score,
      timestamp: serverTimestamp()
    })
  });

  batch.update(userRef, {
    quizzesCompleted: increment(1),
    totalQuizScore: increment(attempt.score)
  });

  batch.update(courseRef, {
    studentQuizzesCompleted: increment(1),
    averageScore: increment(attempt.score)  // Needs averaging logic
  });

  await batch.commit();
}
```

### Example 3: Engagement Tracking
```javascript
async function recordEngagement(userRef, courseRef, eventType) {
  const batch = writeBatch(db);

  batch.update(userRef, {
    engagementScore: increment(10),
    lastActiveAt: serverTimestamp(),
    activityHistory: arrayUnion({
      type: eventType,
      timestamp: serverTimestamp()
    })
  });

  batch.update(courseRef, {
    studentEngagementCount: increment(1),
    lastActivityAt: serverTimestamp()
  });

  await batch.commit();
}
```

---

## Testing Atomic Operations

### Unit Test Example
```javascript
import { describe, it, expect, vi } from 'vitest';
import { increment, writeBatch } from 'firebase/firestore';

describe('Atomic Operations', () => {
  it('should use atomic increment', async () => {
    const mockBatch = {
      update: vi.fn().mockReturnThis(),
      commit: vi.fn().mockResolvedValue(undefined)
    };

    vi.mocked(writeBatch).mockReturnValue(mockBatch);

    // Your function here
    await updateCount(ref, 5);

    expect(mockBatch.update).toHaveBeenCalledWith(
      ref,
      expect.objectContaining({
        count: increment(5)
      })
    );

    expect(mockBatch.commit).toHaveBeenCalled();
  });
});
```

---

## Summary

**Key Takeaway**: Never read, compute, then write in separate operations.  
**Always use**: `increment()`, `arrayUnion()`, `serverTimestamp()`, and `writeBatch()`

---

**For more info**: See `ISSUE4_RACE_CONDITION_AUDIT.md` and `enrollmentServices.js` for real-world examples.
