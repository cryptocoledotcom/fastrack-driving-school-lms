const OHIO_COMPLIANCE = {
  JURISDICTION: 'Ohio',
  REGULATORY_CODE: 'OAC Chapter 4501-7',
  LAST_UPDATED: '2025-12-03',

  TIME_REQUIREMENTS: {
    TOTAL_INSTRUCTION_MINUTES: 1440,
    MINUTES_PER_HOUR: 60,
    DAILY_LIMIT_HOURS: 4,
    DAILY_LIMIT_MINUTES: 240,
    IDLE_TIMEOUT_MINUTES: 15,
    TIMEZONE: 'America/New_York',
    COURSE_COMPLETION_DEADLINE_DAYS: 180,
  },

  IDENTITY_VERIFICATION: {
    CHALLENGE_AFTER_HOURS: 2,
    CHALLENGE_AFTER_MINUTES: 120,
    MAX_ATTEMPTS: 2,
    LOCKOUT_DURATION_HOURS: 24,
    LOCKOUT_DURATION_MS: 86400000,
    REQUIRES_THIRD_PARTY_VERIFICATION: true,
    REQUIRES_SSN_STORAGE: true,
  },

  VIDEO_REQUIREMENTS: {
    MIN_HOURS: 3,
    MAX_HOURS: 9,
    MIN_VIDEO_LENGTH_SECONDS_FOR_QUESTIONS: 60,
    QUESTION_REQUIRED_ABOVE_SECONDS: 60,
  },

  CURRICULUM_UNITS: [
    {
      id: 'unit_1',
      number: 1,
      title: 'The System and You',
      duration_minutes: 60,
      topics: [
        'Highway Transportation System (HTS)',
        'Risks of Driving (leading cause of death ages 15-20)',
        'Ohio GDL Laws (TIPIC rules)',
        'Probationary License Restrictions',
        'Anatomical Gifts / Organ Donation Module (mandated)',
      ],
      learning_type: 'video_text',
      interactive_required: false,
    },
    {
      id: 'unit_2',
      number: 2,
      title: 'Vehicle Familiarization',
      duration_minutes: 60,
      topics: [
        'Pre-drive Checks (tires, leaks, debris)',
        'Safety Systems (seatbelts, airbags, head restraints)',
        'Control Systems (gear selector, pedals, parking brake)',
      ],
      learning_type: 'interactive_svg_diagrams',
      interactive_required: true,
      interactive_description: 'Dashboard element identification quiz',
    },
    {
      id: 'unit_3',
      number: 3,
      title: 'Basic Control Tasks',
      duration_minutes: 210,
      topics: [
        'Starting and Moving',
        'Steering',
        'Stopping',
        'Parking Maneuvers',
        'Ohio Maneuverability Test (9x20 foot cone course)',
      ],
      learning_type: 'video_3d_animation',
      interactive_required: true,
      sub_modules: 15,
      sub_module_duration_minutes: 14,
      special_notes: 'Break into 15-minute sub-modules to prevent session timeout',
    },
    {
      id: 'unit_4',
      number: 4,
      title: 'Traffic Control Devices & Laws',
      duration_minutes: 120,
      topics: [
        'Traffic Signs (colors, shapes, meanings)',
        'Traffic Signals',
        'Pavement Markings',
        'Right-of-Way Rules',
      ],
      learning_type: 'gamified_quiz',
      interactive_required: true,
      interactive_description: 'Sign identification quiz (5 seconds per sign)',
    },
    {
      id: 'unit_5',
      number: 5,
      title: 'Perception and Driving Strategies',
      duration_minutes: 330,
      topics: [
        'S.E.E. System (Search, Evaluate, Execute)',
        'Smith System (Aim High, Get Big Picture, Keep Eyes Moving, Leave Out, Make Sure They See You)',
        'Space Management (3-4 second following distance)',
        'Hazard Perception',
      ],
      learning_type: 'mixed_media',
      interactive_required: true,
      interactive_description: 'Hazard perception tests and scenario videos',
      special_notes: 'Longest unit - requires diverse media to maintain engagement',
    },
    {
      id: 'unit_6',
      number: 6,
      title: 'Natural Laws',
      duration_minutes: 60,
      topics: [
        'Gravity',
        'Kinetic Energy',
        'Friction',
        'Inertia',
        'Force of Impact',
      ],
      learning_type: 'physics_simulation',
      interactive_required: true,
      interactive_description: 'Braking distance vs speed simulations',
    },
    {
      id: 'unit_7',
      number: 7,
      title: 'Handling Emergencies',
      duration_minutes: 90,
      topics: [
        'Brake Failure',
        'Tire Blowouts',
        'Stuck Accelerator',
        'Off-Road Recovery',
      ],
      learning_type: 'video_scenario',
      interactive_required: false,
      critical_instruction: 'Do NOT slam brakes during blowout or wheel drop',
    },
    {
      id: 'unit_8',
      number: 8,
      title: 'Operating in Adverse Conditions',
      duration_minutes: 90,
      topics: [
        'Night Driving',
        'Rain and Hydroplaning',
        'Snow',
        'Ice',
        'Fog',
      ],
      learning_type: 'video_scenario',
      interactive_required: false,
      gdl_correlation: '10 hours of night driving practice required',
    },
    {
      id: 'unit_9',
      number: 9,
      title: 'Driver Fitness',
      duration_minutes: 240,
      topics: [
        'Alcohol and OVI Laws (.02 BAC limit for under 21)',
        'Drugs and Substance Abuse',
        'Fatigue',
        'Emotions',
        'Distracted Driving (electronic devices)',
      ],
      learning_type: 'video_scenario',
      interactive_required: false,
      compliance_note: 'Explicit instruction on texting ban for novice drivers (OAC 4501-7-09(A)(5))',
    },
    {
      id: 'unit_10',
      number: 10,
      title: 'Responsibilities',
      duration_minutes: 45,
      topics: [
        'Buying a Car',
        'Title and Registration',
        'Insurance Types (liability, collision, comprehensive)',
        'Basic Maintenance (oil changes, tire rotation)',
      ],
      learning_type: 'video_text',
      interactive_required: false,
    },
  ],

  ASSESSMENT_REQUIREMENTS: {
    MODULE_QUIZZES_MINIMUM: 10,
    VIDEO_QUIZZES_REQUIRED: true,
    VIDEO_QUIZ_TRIGGER_SECONDS: 60,
    TOTAL_CONTENT_QUESTIONS_MINIMUM: 30,
    INCORRECT_ANSWER_PROTOCOL: 'Force content review before retry',
    QUESTION_DIFFICULTY: 'Specific recall questions, not general knowledge',
  },

  FINAL_EXAMINATION: {
    TOTAL_QUESTIONS: 50,
    QUESTION_SOURCE: 'State-provided 250-question test bank',
    PASSING_SCORE_PERCENTAGE: 75,
    PASSING_SCORE_QUESTIONS: 38,
    RANDOMIZATION_REQUIRED: true,
    NO_DUPLICATE_QUESTIONS_PER_EXAM: true,
    REVEAL_CORRECT_ANSWERS_TIMING: 'Only after entire test submitted/graded',
    FAILURE_PROTOCOLS: {
      ATTEMPT_1_FAILURE: {
        order: 1,
        action: 'Show score but not correct answers',
        lockout_hours: 24,
        can_retry: true,
      },
      ATTEMPT_2_FAILURE: {
        order: 2,
        action: 'Show score but not correct answers',
        lockout_hours: 24,
        can_retry: true,
      },
      ATTEMPT_3_FAILURE: {
        order: 3,
        action: 'Flag account for Academic Reset',
        additional_opportunities: 2,
        requires_remediation: true,
        note: 'Student may need to restart course or undergo significant remediation',
      },
    },
  },

  OPERATIONAL_WORKFLOWS: {
    ENROLLMENT_CERTIFICATE: {
      trigger_condition: 'cumulative_minutes >= 120 && unit_1_complete && unit_2_complete',
      document_type: 'Certificate of Enrollment',
      distinct_from_completion_cert: true,
    },
    COMPLETION_PROCESSING: {
      steps: [
        'Generate PDF Certificate of Completion',
        'Prepare data packet for DETS (Driver Education and Training System)',
        'Export student data (Name, DOB, License Number, Address, Completion Date, Final Exam Score)',
        'Validate license format against BASS database',
        'Email certificate to student/school',
      ],
      license_format_regex: '^[A-Z]{2}\\d{6}$',
      license_format_example: 'AB123456',
      certificate_issuance_sla_days: 3,
    },
    DETS_INTEGRATION: {
      system_name: 'Driver Education and Training System',
      continuous_upload_available: true,
      data_validation: 'DETS validates license number against BMV BASS database',
      required_fields: [
        'student_name',
        'date_of_birth',
        'license_permit_number',
        'address',
        'completion_date',
        'final_exam_score',
      ],
    },
  },

  DATA_RETENTION: {
    FINAL_EXAM_RECORDS_YEARS: 3,
    AUDIT_LOGS_YEARS: 3,
    SOFT_DELETE_REQUIRED: true,
    DELETION_POLICY: 'Audit logs and exam results must be archived (soft delete) even if user deletes account',
    IMMUTABLE_LOGS: true,
  },

  SECURITY_DTO_0201: {
    ASSESSMENT_NAME: 'Online Driver Education Security Assessment (DTO 0201)',
    MAPPED_TO: 'Center for Internet Security (CIS) controls',
    DOMAINS: [
      {
        domain: 'Inventory of Assets',
        requirement: 'Identify all software assets',
        implementation: 'Maintain detailed package.json inventory, document Cloud Functions and third-party APIs',
      },
      {
        domain: 'Data Protection',
        requirement: 'Protect sensitive data at rest and in transit',
        implementation: 'HTTPS/SSL enforced, Firestore encryption, mask PII in UI, no-cache headers on sensitive pages',
      },
      {
        domain: 'Audit Logs',
        requirement: 'Management of audit logs',
        implementation: 'Dedicated audit_logs collection, immutable records of login/logout/quiz/profile changes, 3-year retention',
      },
      {
        domain: 'Access Control',
        requirement: 'Secure configuration and account management',
        implementation: 'Firebase Custom Claims for roles, strict Firestore Security Rules (request.auth.uid == resource.data.userId)',
      },
      {
        domain: 'Vulnerability Management',
        requirement: 'Patching and updates',
        implementation: 'Automated dependency checks (GitHub Dependabot), regular Firebase SDK updates',
      },
    ],
  },

  ACCESSIBILITY: {
    STANDARD: 'WCAG 2.1 AA',
    REQUIREMENTS: [
      'All images must have descriptive alt text (especially traffic signs)',
      'Full keyboard navigation support (Tab, Enter keys)',
      'Text color contrast minimum 4.5:1',
      'All video content must have closed captions (3-9 hours)',
      'Built-in text-to-speech for exam questions',
      'Extended time accommodations for learning difficulties',
    ],
  },

  ROLE_BASED_ACCESS: {
    STUDENT: {
      permissions: [
        'view_own_progress',
        'complete_lessons',
        'take_quizzes',
        'take_final_exam',
        'submit_identity_verification',
        'download_certificate',
      ],
    },
    INSTRUCTOR: {
      permissions: [
        'view_student_progress',
        'respond_to_student_inquiries',
        'view_audit_logs',
        'manage_student_identity_challenges',
      ],
      license_requirements: 'Must pass background check, physical exam, knowledge test',
    },
    ADMIN: {
      permissions: [
        'manage_users',
        'view_all_audit_logs',
        'generate_reports',
        'manage_content',
        'export_dets_data',
      ],
    },
    AUTHORIZING_OFFICIAL: {
      permissions: [
        'submit_license_application',
        'manage_enterprise_settings',
        'view_compliance_status',
      ],
      requirements: 'Must be of sound physical and mental health, free of disqualifying offenses, fingerprinting/background checks (BCI & FBI)',
    },
  },

  TECHNICAL_ENFORCEMENTS: {
    SERVER_SIDE_TIME_AUTHORITY: {
      description: 'All time tracking must be server-side (Cloud Functions), not client-side',
      reason: 'Client-side time can be manipulated by users',
    },
    HEARTBEAT_MECHANISM: {
      ping_frequency_seconds: 60,
      logic: [
        'Retrieve server timestamp',
        'Increment minutes_completed in daily log',
        'Check if minutes_completed >= 240 (4 hours)',
        'If limit reached, set user status to locked_daily_limit and return 403',
      ],
    },
    SESSION_DOCUMENT: {
      firestore_collection: 'daily_activity_logs',
      key_pattern: '{userID}_{YYYY-MM-DD}',
      fields: [
        'user_id',
        'date',
        'minutes_completed',
        'sessions_started',
        'sessions_ended',
        'identity_challenges_completed',
      ],
    },
    VIDEO_PLAYER_RESTRICTIONS: {
      seek_bar_disabled: true,
      skip_to_end_prevented: true,
      conditions_for_next_button: [
        'onEnded event fired from video player',
        'Student answered post-video question correctly',
      ],
    },
    IDLE_TIMER: {
      frontend_hook: 'useIdleTimer',
      monitored_events: ['mousemove', 'keydown', 'scroll', 'touchstart'],
      timeout_minutes: 15,
      action_on_timeout: 'firebase.auth().signOut()',
      server_validation: 'Heartbeat should validate meaningful progress (slide navigation, quiz answers) at reasonable intervals',
    },
  },

  REGULATORY_NOTES: {
    CONTENT_EQUIVALENCY: 'Online curriculum must be "content equivalent" to 24-hour classroom instruction, not a summarized version',
    ONE_HOUR_DEFINITION: '60 minutes of instruction = 1 hour credited (no academic hour allowance)',
    ONLINE_INSTRUCTOR_REQUIRED: 'OAC 4501-7-09(C)(1) mandates online instructor response to student questions and content-based inquiries',
    CALENDAR_DAY_DEFINITION: 'Enforce daily limits at midnight EST/EDT regardless of student physical location',
    THREE_YEAR_RULE: 'Final exam records must be accessible to state auditors for 3 years',
  },

  IMPLEMENTATION_PHASES: {
    PHASE_1: {
      name: 'Administrative Foundation',
      duration_months: 2,
      tasks: [
        'Entity Formation (Ohio business entity)',
        'Designate Authorizing Official',
        'Hire/contract Training Manager and Online Instructor',
        'Submit fingerprints for background checks (BCI & FBI)',
        'Register enterprise in DETS portal',
      ],
    },
    PHASE_2: {
      name: 'Content & Curriculum',
      duration_months: 3,
      tasks: [
        'Create Lesson Plan (DTO 0229)',
        'Map every screen to curriculum units',
        'Write 15+ hours of text content',
        'Film or license 3+ hours of video',
        'Author 30+ module questions',
        'Import 250+ state exam questions',
      ],
    },
    PHASE_3: {
      name: 'Technical Build',
      duration_months: 3,
      tasks: [
        'Build React shell with Firebase Auth',
        'Implement 4-hour daily limit logic',
        'Implement 15-minute idle timeout',
        'Implement identity verification challenges',
        'Configure Firestore Security Rules',
        'Complete DTO 0201 security assessment',
        'Integrate ID verification API',
        'Integrate email service (SendGrid/Mailgun)',
      ],
    },
    PHASE_4: {
      name: 'Audit & Approval',
      duration_months: 1,
      tasks: [
        'Submit DTO 0229 (Lesson Plan)',
        'Submit DTO 0201 (Security Assessment)',
        'Submit Enterprise Application',
        'Provide ODPS review environment access',
        'Implement requested revisions (up to 3 attempts)',
        'Obtain license and move to production',
      ],
    },
  },
};

export default OHIO_COMPLIANCE;
