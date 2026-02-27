// ============================================================
// AI Assistant — Intent Engine
// Rule-based NLP: intent detection, entity extraction,
// field definitions, and natural language date parsing.
// ============================================================

// ----- Field Definitions -----
// Each field declares its label, type, question text, and constraints.

export const FIELD_DEFS = {
  // ── Shared ──────────────────────────────────────────────
  name: {
    label: 'Full Name',
    type: 'text',
    question: "What's the full name?",
  },
  email: {
    label: 'Email',
    type: 'email',
    question: "What's the email address?",
    skippable: true,
    validate: v =>
      !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
        ? null
        : 'Please enter a valid email (e.g. name@example.com).',
  },
  phone: {
    label: 'Phone',
    type: 'text',
    question: "What's the phone number?",
    skippable: true,
  },
  company: {
    label: 'Company',
    type: 'text',
    question: 'Which company are they from?',
    skippable: true,
  },
  city: {
    label: 'City',
    type: 'text',
    question: 'Which city?',
    skippable: true,
  },
  state: {
    label: 'State',
    type: 'text',
    question: 'Which state?',
    skippable: true,
  },
  status: {
    label: 'Status',
    type: 'enum',
    options: ['Active', 'Inactive', 'Pending'],
    question: "What's the status?",
    defaultValue: 'Active',
    skippable: true,
  },

  // ── Meeting ─────────────────────────────────────────────
  title: {
    label: 'Title',
    type: 'text',
    question: "What's the meeting title?",
  },
  dateTime: {
    label: 'Date & Time',
    type: 'datetime',
    question:
      "When is it? (e.g. 'tomorrow at 3pm', 'Monday 10am', 'Mar 5 2pm')",
  },
  meetingType: {
    label: 'Meeting Type',
    type: 'enum',
    options: ['Meeting', 'Call', 'Video Call', 'Presentation', 'Training', 'Interview'],
    question: 'What type of meeting?',
    defaultValue: 'Meeting',
    skippable: true,
  },
  priority: {
    label: 'Priority',
    type: 'enum',
    options: ['Low', 'Medium', 'High', 'Urgent'],
    question: 'What priority level?',
    defaultValue: 'Medium',
    skippable: true,
  },
  location: {
    label: 'Location',
    type: 'text',
    question: 'Where is it? (office, video link, etc.)',
    skippable: true,
  },
  description: {
    label: 'Description',
    type: 'text',
    question: 'Any extra details or agenda?',
    skippable: true,
  },
  duration: {
    label: 'Duration (minutes)',
    type: 'number',
    question: 'How long will it be? (in minutes)',
    defaultValue: 60,
    skippable: true,
  },

  // ── Note ────────────────────────────────────────────────
  noteTitle: {
    label: 'Note Title',
    type: 'text',
    question: "What's the note title?",
  },
  noteContent: {
    label: 'Content',
    type: 'text',
    question: 'What should the note say?',
  },
  noteCategory: {
    label: 'Category',
    type: 'enum',
    options: ['General', 'Client', 'Project', 'Meeting', 'Task', 'Idea', 'Important'],
    question: 'Which category?',
    defaultValue: 'General',
    skippable: true,
  },
  notePriority: {
    label: 'Priority',
    type: 'enum',
    options: ['Low', 'Medium', 'High', 'Urgent'],
    question: 'What priority?',
    defaultValue: 'Medium',
    skippable: true,
  },

  // ── Search ──────────────────────────────────────────────
  query: {
    label: 'Search',
    type: 'text',
    question: 'What are you looking for?',
  },
};

// ----- Intent Definitions -----
export const INTENTS = {
  CREATE_CLIENT: {
    id: 'CREATE_CLIENT',
    label: 'Add Client',
    icon: '👤',
    description: 'Add a new client to the CRM',
    patterns: [
      /\b(add|create|new|register)\b.{0,20}\bclient\b/i,
      /\bclient\b.{0,20}\b(add|create|new|named?|called?)\b/i,
    ],
    fields: ['name', 'email', 'phone', 'company', 'city', 'state', 'status'],
    requiredFields: ['name'],
    action: 'create_client',
    confirmLabel: 'New Client',
    successMessage: data => `✅ Client "${data.name}" added successfully!`,
    summaryRows: data => [
      ['Name', data.name],
      ['Email', data.email || '—'],
      ['Phone', data.phone || '—'],
      ['Company', data.company || '—'],
      ['City', data.city || '—'],
      ['Status', data.status || 'Active'],
    ],
  },

  CREATE_ASSOCIATE: {
    id: 'CREATE_ASSOCIATE',
    label: 'Add Associate',
    icon: '🤝',
    description: 'Add a new associate/partner',
    patterns: [
      /\b(add|create|new|register)\b.{0,20}\bassociate\b/i,
      /\bassociate\b.{0,20}\b(add|create|new|named?|called?)\b/i,
    ],
    fields: ['name', 'email', 'phone', 'company', 'city', 'state', 'status'],
    requiredFields: ['name', 'email'],
    action: 'create_associate',
    confirmLabel: 'New Associate',
    successMessage: data => `✅ Associate "${data.name}" added successfully!`,
    summaryRows: data => [
      ['Name', data.name],
      ['Email', data.email],
      ['Phone', data.phone || '—'],
      ['Company', data.company || '—'],
      ['Status', data.status || 'Active'],
    ],
  },

  CREATE_MEETING: {
    id: 'CREATE_MEETING',
    label: 'Schedule Meeting',
    icon: '📅',
    description: 'Schedule a new meeting or call',
    patterns: [
      /\b(schedule|add|create|book|set\s*up)\b.{0,25}\b(meeting|call|appointment|session)\b/i,
      /\b(meeting|call|appointment)\b.{0,25}\b(schedule|add|create|book)\b/i,
    ],
    fields: ['title', 'dateTime', 'meetingType', 'priority', 'location', 'description'],
    requiredFields: ['title', 'dateTime'],
    action: 'create_meeting',
    confirmLabel: 'New Meeting',
    successMessage: data => `✅ Meeting "${data.title}" scheduled!`,
    summaryRows: data => [
      ['Title', data.title],
      ['When', data._dateFormatted || data.dateTime],
      ['Type', data.meetingType || 'Meeting'],
      ['Priority', data.priority || 'Medium'],
      ['Location', data.location || '—'],
    ],
  },

  CREATE_NOTE: {
    id: 'CREATE_NOTE',
    label: 'Add Note',
    icon: '📝',
    description: 'Create a quick note',
    patterns: [
      /\b(add|create|new|write|jot)\b.{0,20}\bnote\b/i,
      /\bnote\b.{0,20}\b(add|create|new|write)\b/i,
    ],
    fields: ['noteTitle', 'noteContent', 'noteCategory', 'notePriority'],
    requiredFields: ['noteTitle', 'noteContent'],
    action: 'create_note',
    confirmLabel: 'New Note',
    successMessage: data => `✅ Note "${data.noteTitle}" saved!`,
    summaryRows: data => [
      ['Title', data.noteTitle],
      ['Content', data.noteContent?.slice(0, 60) + (data.noteContent?.length > 60 ? '…' : '')],
      ['Category', data.noteCategory || 'General'],
      ['Priority', data.notePriority || 'Medium'],
    ],
  },

  FIND_CLIENT: {
    id: 'FIND_CLIENT',
    label: 'Find Client',
    icon: '🔍',
    description: 'Search for a client',
    patterns: [
      /\b(find|search|look\s*up|show|get|list)\b.{0,20}\bclient\b/i,
    ],
    fields: ['query'],
    requiredFields: ['query'],
    action: 'find_client',
    isSearch: true,
  },

  FIND_ASSOCIATE: {
    id: 'FIND_ASSOCIATE',
    label: 'Find Associate',
    icon: '🔍',
    description: 'Search for an associate',
    patterns: [
      /\b(find|search|look\s*up|show|get|list)\b.{0,20}\bassociate\b/i,
    ],
    fields: ['query'],
    requiredFields: ['query'],
    action: 'find_associate',
    isSearch: true,
  },

  NAVIGATE: {
    id: 'NAVIGATE',
    label: 'Go to page',
    icon: '🧭',
    description: 'Navigate to a page',
    patterns: [
      /\b(go\s*to|open|navigate\s*to|take\s*me\s*to|show\s*me\s*the?)\b/i,
    ],
    fields: [],
    requiredFields: [],
    action: 'navigate',
  },

  HELP: {
    id: 'HELP',
    label: 'Help',
    icon: '❓',
    description: 'Show what I can do',
    patterns: [
      /^(hi|hello|hey|help|what can you do|commands|capabilities|assist)\b/i,
    ],
    fields: [],
    requiredFields: [],
    action: 'help',
  },
};

// ----- Entity Extraction -----
// Pulls known values from the user's natural-language message.
export function extractEntities(text) {
  const entities = {};

  // name: "named John Doe", "called Acme Corp", "name: John"
  const nameMatch = text.match(
    /(?:named?|called?|:)\s+([A-Z][a-zA-Z\s.'"-]{1,50}?)(?=\s+(?:with|email|phone|at|from|,|$))/i
  );
  if (nameMatch) entities.name = nameMatch[1].trim();

  // email
  const emailMatch = text.match(/\b([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})\b/);
  if (emailMatch) entities.email = emailMatch[1];

  // phone (Indian and international)
  const phoneMatch = text.match(/\b(\+?[0-9]{10,15})\b/);
  if (phoneMatch) entities.phone = phoneMatch[1];

  // company: "from TriCo", "at Infosys"
  const companyMatch = text.match(
    /(?:from|at|company\s+)\s*([A-Z][a-zA-Z0-9\s&@.'"-]{1,50}?)(?=\s+(?:email|phone|city|,|$))/i
  );
  if (companyMatch) entities.company = companyMatch[1].trim();

  // title/subject: used for meeting/note — "titled X", "about X", "re: X"
  const titleMatch = text.match(/(?:titled?|about|re:|subject:?)\s+['""]?([^,;.]+?)['""]?(?=\s+(?:on|at|for|,|$))/i);
  if (titleMatch) entities.title = titleMatch[1].trim();

  return entities;
}

// ----- Natural Language Date Parsing -----
export function parseNaturalDate(text) {
  if (!text) return null;
  const t = text.toLowerCase().trim();
  const now = new Date();

  // Extract time from string
  function extractTime(src) {
    const m = src.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
    if (!m) return null;
    let h = parseInt(m[1]);
    const min = parseInt(m[2] || '0');
    const ampm = m[3].toLowerCase();
    if (ampm === 'pm' && h < 12) h += 12;
    if (ampm === 'am' && h === 12) h = 0;
    return { h, min };
  }

  function setTime(date, fallbackHour = 10) {
    const t = extractTime(text);
    date.setHours(t ? t.h : fallbackHour, t ? t.min : 0, 0, 0);
    return date;
  }

  if (t.includes('today')) return setTime(new Date(now));
  if (t.includes('tomorrow')) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return setTime(d);
  }

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let i = 0; i < dayNames.length; i++) {
    if (t.includes(dayNames[i])) {
      const d = new Date(now);
      const diff = (i + 7 - d.getDay()) % 7 || 7;
      d.setDate(d.getDate() + diff);
      return setTime(d);
    }
  }

  // "next week"
  if (t.includes('next week')) {
    const d = new Date(now);
    d.setDate(d.getDate() + 7);
    return setTime(d);
  }

  // Native parse fallback (handles ISO, "Mar 5 2026", etc.)
  const native = new Date(text);
  if (!isNaN(native) && native.getFullYear() >= 2020) return native;

  return null;
}

// ----- Format a Date for display -----
export function formatDateTime(date) {
  if (!date || isNaN(date)) return '—';
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ----- Navigation path mapping -----
const NAV_MAP = {
  home: '/home',
  dashboard: '/home',
  clients: '/clients',
  client: '/clients',
  associates: '/associates',
  associate: '/associates',
  projects: '/projects',
  project: '/projects',
  finance: '/finance',
  financial: '/finance',
  analytics: '/analytics',
  analysis: '/analytics',
  reports: '/analytics',
  settings: '/settings',
  users: '/user-management',
  'user management': '/user-management',
  roles: '/role-management',
  'role management': '/role-management',
};

export function getNavigationPath(text) {
  const t = text.toLowerCase();
  for (const [key, path] of Object.entries(NAV_MAP)) {
    if (t.includes(key)) return path;
  }
  return null;
}

// ----- Detect "skip" responses -----
export function isSkip(text) {
  return /^(skip|no|none|n\/a|-|not now|later|pass|nil)$/i.test(text.trim());
}

// ----- Main intent detector -----
export function detectIntent(text) {
  for (const intent of Object.values(INTENTS)) {
    for (const pattern of intent.patterns) {
      if (pattern.test(text)) return intent;
    }
  }
  return null;
}

// ----- Field validator -----
export function validateField(fieldKey, value) {
  const def = FIELD_DEFS[fieldKey];
  if (!def) return null;
  if (def.validate) return def.validate(value);
  if (def.type === 'email' && value) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      return 'Please enter a valid email address.';
  }
  if (def.type === 'number' && value) {
    if (isNaN(Number(value))) return 'Please enter a number.';
  }
  return null;
}
