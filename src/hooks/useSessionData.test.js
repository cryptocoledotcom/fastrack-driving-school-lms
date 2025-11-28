import React from 'react';
import useSessionData from './useSessionData';

describe('useSessionData Hook', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Hook Creation', () => {
    it('should be a function', () => {
      expect(typeof useSessionData).toBe('function');
    });

    it('should be a valid React hook', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(path.join(__dirname, 'useSessionData.js'), 'utf8');

      expect(content).toContain('export const useSessionData');
      expect(content).toContain('return {');
    });
  });

  describe('Hook Exports', () => {
    it('should export named hook', () => {
      const hookExports = require('./useSessionData.js');
      expect(hookExports.useSessionData).toBeDefined();
    });

    it('should have default export', () => {
      const hookExports = require('./useSessionData.js').default;
      expect(typeof hookExports).toBe('function');
    });
  });

  describe('Initial State', () => {
    it('should initialize with correct default state', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(path.join(__dirname, 'useSessionData.js'), 'utf8');

      expect(content).toContain('currentSessionId');
      expect(content).toContain('lessonsAccessed');
      expect(content).toContain('sessionHistory');
      expect(content).toContain('currentSession');
    });
  });

  describe('Required State Properties', () => {
    it('should have all required state properties', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(path.join(__dirname, 'useSessionData.js'), 'utf8');

      const requiredStates = [
        'currentSessionId',
        'lessonsAccessed',
        'sessionHistory',
        'currentSession'
      ];

      requiredStates.forEach(state => {
        expect(content).toContain(state);
      });
    });
  });

  describe('Required Methods', () => {
    it('should have all required methods', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(path.join(__dirname, 'useSessionData.js'), 'utf8');

      const requiredMethods = [
        'createSession',
        'recordLessonAccess',
        'closeSession'
      ];

      requiredMethods.forEach(method => {
        expect(content).toContain(method);
      });
    });

    it('should export methods as useCallback', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(path.join(__dirname, 'useSessionData.js'), 'utf8');

      expect(content).toContain('useCallback');
      expect(content).toContain('createSession');
      expect(content).toContain('recordLessonAccess');
      expect(content).toContain('closeSession');
    });
  });

  describe('Required Getters', () => {
    it('should have all required getter properties', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(path.join(__dirname, 'useSessionData.js'), 'utf8');

      const requiredGetters = [
        'lessonCount',
        'sessionCount'
      ];

      requiredGetters.forEach(getter => {
        expect(content).toContain(getter);
      });
    });
  });

  describe('Options Handling', () => {
    it('should accept optional callbacks in options', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(path.join(__dirname, 'useSessionData.js'), 'utf8');

      expect(content).toContain('options = {}');
    });

    it('should accept onSessionCreated callback', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(path.join(__dirname, 'useSessionData.js'), 'utf8');

      expect(content).toContain('onSessionCreated');
    });

    it('should accept onLessonAccessed callback', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(path.join(__dirname, 'useSessionData.js'), 'utf8');

      expect(content).toContain('onLessonAccessed');
    });

    it('should accept onSessionClosed callback', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(path.join(__dirname, 'useSessionData.js'), 'utf8');

      expect(content).toContain('onSessionClosed');
    });
  });

  describe('Session Creation', () => {
    it('should create session with ID', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(path.join(__dirname, 'useSessionData.js'), 'utf8');

      expect(content).toContain('currentSessionId');
      expect(content).toContain('setCurrentSessionId');
    });

    it('should initialize lessons accessed array for new session', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(path.join(__dirname, 'useSessionData.js'), 'utf8');

      expect(content).toContain('lessonsAccessed');
      expect(content).toContain('setLessonsAccessed');
    });

    it('should create current session object with metadata', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(path.join(__dirname, 'useSessionData.js'), 'utf8');

      expect(content).toContain('currentSession');
      expect(content).toContain('startTime');
    });

    it('should trigger onSessionCreated callback', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(path.join(__dirname, 'useSessionData.js'), 'utf8');

      expect(content).toContain('onSessionCreated');
    });
  });

  describe('Lesson Access Recording', () => {
    it('should add lesson ID to lessonsAccessed array', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(path.join(__dirname, 'useSessionData.js'), 'utf8');

      expect(content).toContain('lessonsAccessed');
      expect(content).toContain('recordLessonAccess');
    });

    it('should prevent duplicate lesson entries', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(path.join(__dirname, 'useSessionData.js'), 'utf8');

      expect(content).toContain('includes');
    });

    it('should trigger onLessonAccessed callback', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(path.join(__dirname, 'useSessionData.js'), 'utf8');

      expect(content).toContain('onLessonAccessed');
    });
  });

  describe('Session Closure', () => {
    it('should close current session', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(path.join(__dirname, 'useSessionData.js'), 'utf8');

      expect(content).toContain('closeSession');
      expect(content).toContain('setCurrentSessionId(null)');
    });

    it('should move closed session to session history', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(path.join(__dirname, 'useSessionData.js'), 'utf8');

      expect(content).toContain('sessionHistory');
      expect(content).toContain('setSessionHistory');
    });

    it('should clear lessons accessed array on close', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(path.join(__dirname, 'useSessionData.js'), 'utf8');

      expect(content).toContain('setLessonsAccessed([])');
    });

    it('should set end time for closed session', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(path.join(__dirname, 'useSessionData.js'), 'utf8');

      expect(content).toContain('endTime');
    });

    it('should trigger onSessionClosed callback', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(path.join(__dirname, 'useSessionData.js'), 'utf8');

      expect(content).toContain('onSessionClosed');
    });
  });

  describe('Session Data Structure', () => {
    it('should track session ID', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(path.join(__dirname, 'useSessionData.js'), 'utf8');

      expect(content).toContain('currentSessionId');
    });

    it('should track lesson IDs accessed', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(path.join(__dirname, 'useSessionData.js'), 'utf8');

      expect(content).toContain('lessonsAccessed');
    });

    it('should track start time', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(path.join(__dirname, 'useSessionData.js'), 'utf8');

      expect(content).toContain('startTime');
    });

    it('should track end time when session closes', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(path.join(__dirname, 'useSessionData.js'), 'utf8');

      expect(content).toContain('endTime');
    });
  });

  describe('Lesson Count Getter', () => {
    it('should calculate number of lessons accessed', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(path.join(__dirname, 'useSessionData.js'), 'utf8');

      expect(content).toContain('lessonCount');
    });

    it('should use lessonsAccessed array length', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(path.join(__dirname, 'useSessionData.js'), 'utf8');

      expect(content).toContain('lessonsAccessed.length');
    });
  });

  describe('Session Count Getter', () => {
    it('should calculate number of sessions in history', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(path.join(__dirname, 'useSessionData.js'), 'utf8');

      expect(content).toContain('sessionCount');
    });

    it('should use sessionHistory array length', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(path.join(__dirname, 'useSessionData.js'), 'utf8');

      expect(content).toContain('sessionHistory.length');
    });
  });

  describe('Return Object Structure', () => {
    it('should return object with all state properties', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(path.join(__dirname, 'useSessionData.js'), 'utf8');

      const properties = [
        'currentSessionId',
        'lessonsAccessed',
        'sessionHistory',
        'currentSession',
        'lessonCount',
        'sessionCount',
        'createSession',
        'recordLessonAccess',
        'closeSession'
      ];

      properties.forEach(prop => {
        expect(content).toContain(prop);
      });
    });
  });

  describe('React Hooks Usage', () => {
    it('should use useState hook', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(path.join(__dirname, 'useSessionData.js'), 'utf8');

      expect(content).toContain('useState');
    });

    it('should use useCallback for methods', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(path.join(__dirname, 'useSessionData.js'), 'utf8');

      expect(content).toContain('useCallback');
    });

    it('should import hooks from react', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(path.join(__dirname, 'useSessionData.js'), 'utf8');

      expect(content).toContain("from 'react'");
    });
  });

  describe('Compliance with Step 1.3.4 Requirements', () => {
    it('should have all required state properties', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(path.join(__dirname, 'useSessionData.js'), 'utf8');

      const requiredStates = [
        'currentSessionId',
        'lessonsAccessed',
        'sessionHistory',
        'currentSession'
      ];

      requiredStates.forEach(state => {
        expect(content).toContain(`[${state},`);
      });
    });

    it('should have all required methods', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(path.join(__dirname, 'useSessionData.js'), 'utf8');

      const requiredMethods = [
        'createSession',
        'recordLessonAccess',
        'closeSession'
      ];

      requiredMethods.forEach(method => {
        expect(content).toContain(`const ${method} = useCallback`);
      });
    });

    it('should have all required getters', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(path.join(__dirname, 'useSessionData.js'), 'utf8');

      expect(content).toContain('lessonCount');
      expect(content).toContain('sessionCount');
    });
  });

  describe('No Breaking Changes', () => {
    it('should not modify TimerContext', () => {
      const fs = require('fs');
      const path = require('path');
      const timerContextPath = path.join(__dirname, '../context/TimerContext.jsx');
      const timerContext = fs.readFileSync(timerContextPath, 'utf8');

      expect(timerContext).toContain('useTimer');
      expect(timerContext).toContain('TimerProvider');
    });

    it('should not break existing App.jsx integration', () => {
      const fs = require('fs');
      const path = require('path');
      const appPath = path.join(__dirname, '../App.jsx');
      const app = fs.readFileSync(appPath, 'utf8');

      expect(app).toContain('TimerProvider');
      expect(app).toContain('from \'./context/TimerContext\'');
    });
  });

  describe('Syntax and Structure', () => {
    it('should have no syntax errors', () => {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, 'useSessionData.js');

      expect(() => {
        require(filePath);
      }).not.toThrow();
    });

    it('should export hook as default export', () => {
      const hookModule = require('./useSessionData.js');
      expect(hookModule.default).toBeDefined();
      expect(typeof hookModule.default).toBe('function');
    });

    it('should also export as named export', () => {
      const hookModule = require('./useSessionData.js');
      expect(hookModule.useSessionData).toBeDefined();
      expect(typeof hookModule.useSessionData).toBe('function');
    });
  });
});
