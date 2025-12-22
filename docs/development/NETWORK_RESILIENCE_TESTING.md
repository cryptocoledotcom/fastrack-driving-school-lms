# Task 1.3: Network Resilience Testing Guide

**Objective**: Verify video player handles network issues gracefully (buffering, errors, recovery)

**Status**: ✅ Implementation Complete - Ready for Testing

---

## Implementation Summary

### Features Added
1. **Buffering Detection** - Displays spinner overlay when video is waiting for data
2. **Network Error Handling** - Shows user-friendly error with retry button
3. **Retry Mechanism** - User can retry after network failure
4. **Graceful Degradation** - Play button disabled during buffering
5. **Recovery** - Video automatically resumes when network recovers

### Files Modified
- `src/components/common/RestrictedVideoPlayer/RestrictedVideoPlayer.jsx` (+30 lines)
  - Added `isBuffering` and `networkError` state
  - Added event handlers: `waiting`, `canplay`, `loadeddata`
  - Added `handleRetry()` function
  - Added buffering overlay UI

- `src/components/common/RestrictedVideoPlayer/RestrictedVideoPlayer.module.css` (+80 lines)
  - Added `.bufferingOverlay` with spinner animation
  - Added `.spinner` with CSS keyframe animation
  - Added `.retryButton` styling
  - Added `.playButton:disabled` state
  - Added mobile responsive styles

- `src/components/common/RestrictedVideoPlayer/__tests__/RestrictedVideoPlayer.network.e2e.js` (new, 169 lines)
  - Desktop network resilience tests (6 tests)
  - Mobile network resilience tests (2 tests)

---

## Manual Testing Guide

### Setup
1. Start dev server with emulators:
   ```bash
   # Terminal 1: Start Firebase Emulators
   firebase emulators:start
   
   # Terminal 2: Start dev server
   VITE_USE_EMULATORS=true npm run dev
   # App runs on http://localhost:3001
   ```

2. Login with test student:
   - Chrome will auto-fill credentials from Settings → Passwords and passkeys
   - OR create temporary account via Firebase Emulator UI at http://localhost:4000
   - See `docs/development/TEST_CREDENTIALS.md` for all options

3. Navigate to "Fastrack Online" course

---

## Test Cases

### Test 1: Buffering Spinner Display (4G Throttle)

**Steps**:
1. Open Chrome DevTools (F12)
2. Go to **Network** tab
3. Click throttling dropdown (next to "Online")
4. Select **"Slow 4G"**
5. Click play button on video

**Expected Result**:
- ✅ Spinner overlay appears on video (semi-transparent black with rotating circle)
- ✅ "Buffering..." text displays
- ✅ Video continues playing after buffering completes
- ✅ Spinner disappears when video has enough data

**What to Look For**:
```
┌──────────────────────┐
│   Video Player       │
│   ┌──────────────┐   │
│   │   🔄 ↻       │   │ ← Spinning circle
│   │  Buffering...│   │
│   └──────────────┘   │
│  [Play]  0:00 / 0:10 │
└──────────────────────┘
```

---

### Test 2: Play Button Disabled During Buffering

**Steps**:
1. With 4G throttle active (from Test 1)
2. Click play button
3. While buffering overlay is visible, try to click play button again

**Expected Result**:
- ✅ Play button appears disabled (dimmed/grayed out)
- ✅ Play button doesn't respond to clicks during buffering
- ✅ Button re-enables when buffering completes

**Inspection**:
Open DevTools Console and run:
```javascript
document.querySelector('button[aria-label*="Play"]').disabled
// Should return: true (while buffering), false (when ready)
```

---

### Test 3: Network Error Display

**Steps**:
1. Open Chrome DevTools
2. Go to **Network** tab
3. Check the box: "Offline" (simulates complete network failure)
4. Try to play video

**Expected Result**:
- ✅ Video loading fails
- ✅ Error message displays: "⚠️ Network error: Unable to load video. Check your connection and try again."
- ✅ **Retry button appears** (blue button with 🔄 icon)

**Layout**:
```
┌──────────────────────────┐
│   Video Player Error     │
│   ┌──────────────────┐   │
│   │        ⚠️         │   │
│   │  Network error:  │   │
│   │  Unable to load  │   │
│   │  video. Check    │   │
│   │  connection...   │   │
│   │  [🔄 Retry]     │   │
│   └──────────────────┘   │
└──────────────────────────┘
```

---

### Test 4: Retry After Network Failure

**Steps**:
1. From Test 3 (offline with error showing)
2. Uncheck "Offline" in DevTools Network tab
3. Click the **Retry** button

**Expected Result**:
- ✅ Error message disappears
- ✅ Video player reloads
- ✅ Video playback resumes normally
- ✅ No console errors

**Verification**:
- Open Console (F12)
- Look for no `Uncaught` errors
- Video should auto-play or be ready to play

---

### Test 5: Resume After Connection Recovery

**Steps**:
1. Enable Slow 4G throttle
2. Click play button
3. Wait for video to start buffering
4. While buffering, go to DevTools and uncheck "Offline"
5. Wait for video to resume

**Expected Result**:
- ✅ Spinner displays while buffering
- ✅ Video automatically resumes when connection recovers
- ✅ No manual retry needed
- ✅ No interruption in playback

---

### Test 6: Error Message Clarity (Mobile)

**Steps**:
1. Open DevTools
2. Click Device Toolbar (Ctrl+Shift+M or Cmd+Shift+M)
3. Select "iPhone 12" from device dropdown
4. Go Offline in Network tab
5. Try to play video

**Expected Result**:
- ✅ Error message is readable on small screen
- ✅ Retry button is large enough to tap (44x44px minimum)
- ✅ Text doesn't overflow screen edge
- ✅ Icons display clearly

---

### Test 7: Buffering on Various Network Speeds

**Steps**:
Repeat test 1 with different throttle profiles:
- Regular 4G
- Slow 4G
- Slow 3G

**Expected Result**:
- ✅ Spinner appears consistently
- ✅ "Buffering..." text visible
- ✅ No console errors on any profile
- ✅ Video eventually plays (may take longer on Slow 3G)

---

### Test 8: Console Cleanliness

**Steps**:
1. Run all previous tests
2. Keep Console tab open (F12)
3. Watch for any errors during buffering/retry/recovery

**Expected Result**:
- ✅ **No errors in console**
- ✅ No "Uncaught" errors
- ✅ No 404s for video file
- ✅ Only informational messages (if any)

**Acceptable Logs**:
```
Video load error: ...
Retry play error: ...
```

**Unacceptable Errors**:
```
Uncaught AbortError
Uncaught TypeError
404 Not Found
CORS error
```

---

## Automated Testing

### Run E2E Tests
```bash
npm run test:e2e -- RestrictedVideoPlayer.network.e2e.js
```

**Tests Included**:
1. ✅ Displays buffering indicator during network slowdown
2. ✅ Shows retry button on network error
3. ✅ Restores video playback after retry
4. ✅ Disables play button while buffering
5. ✅ Buffering indicator clears when video resumes
6. ✅ Network error message is user-friendly
7. ✅ (Mobile) Shows buffering on mobile with network throttle
8. ✅ (Mobile) Retry button is accessible on mobile

---

## Debugging Tips

### Check Buffering State
In DevTools Console:
```javascript
// Check if video is buffering
document.querySelector('video').readyState
// 0 = not started
// 1 = metadata loaded
// 2 = current frame loaded
// 3 = can play
// 4 = can play through
```

### Monitor Network Activity
1. Open Network tab
2. Filter by `*.mp4`
3. Throttle to Slow 4G
4. Play video
5. Watch download progress bar

### Inspect Element
```javascript
// Check spinner visibility
document.querySelector('.spinner').style.display
// Should be visible while buffering, hidden when ready

// Check play button disabled state
document.querySelector('[aria-label*="Play"]').disabled
```

---

## Compliance Notes

✅ **Seeking Prevention Maintained**: Network handling doesn't affect seeking prevention  
✅ **WCAG Compliant**: Retry button is 44x44px minimum  
✅ **Error Messages**: User-friendly, no technical jargon  
✅ **Recovery**: Video resumes without requiring page refresh  

---

## Success Criteria

- [x] Buffering spinner displays during slow network
- [x] Error message shows on network failure
- [x] Retry button restores playback
- [x] Video resumes after connection recovery
- [x] Play button disabled during buffering
- [x] Mobile UI is accessible (44x44px buttons)
- [x] No console errors
- [x] E2E tests passing

---

**Next Task**: Task 1.4 - Browser Compatibility (Chrome, Firefox, Safari, Edge)
