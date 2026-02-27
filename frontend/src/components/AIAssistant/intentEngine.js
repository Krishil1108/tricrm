// ============================================================
// AI Assistant — Intent Engine
// Rule-based NLP: intent detection, entity extraction,
// field definitions, and natural language date parsing.
// ============================================================

// ─── Indian number formatter ─────────────────────────────────
export function fmtINR(n) {
  if (n == null || isNaN(n)) return '₹0';
  return '₹' + Number(n).toLocaleString('en-IN');
}

// ─── Natural amount parser: ₹50k, 1.5L, 2cr, 50000 ──────────
export function parseAmount(text) {
  if (!text) return null;
  const t = String(text).replace(/[₹,\s]/g, '').toLowerCase();
  if (/lakh|lac/.test(t)) { const n = parseFloat(t.replace(/lakh|lac/g, '')); return isNaN(n) ? null : n * 100000; }
  if (/crore|cr\b/.test(t)) { const n = parseFloat(t.replace(/crore|cr/g, '')); return isNaN(n) ? null : n * 10000000; }
  if (/k\b/.test(t)) { const n = parseFloat(t.replace(/k/g, '')); return isNaN(n) ? null : n * 1000; }
  const n = parseFloat(t); return isNaN(n) ? null : n;
}

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
  // ── Project resolution ──────────────────────────────────
  projectQuery: {
    label: 'Project', type: 'text',
    question: 'Which project? (type the name or project number)',
  },
  // ── Payment fields ───────────────────────────────────────
  paymentAmount: {
    label: 'Amount (₹)', type: 'currency',
    question: 'Payment amount? (e.g. ₹50000 · 1.5L · 50k)',
    validate: v => {
      const n = parseAmount(String(v));
      return (n == null || n <= 0) ? 'Enter a valid amount (e.g. 50000, 50k, 1.5L).' : null;
    },
  },
  paymentDate: {
    label: 'Payment Date', type: 'datetime',
    question: "Payment date? (e.g. 'today', 'yesterday', '15 Jan 2026')",
  },
  paymentMode: {
    label: 'Payment Mode', type: 'enum',
    options: ['NEFT', 'Cheque', 'UPI', 'RTGS', 'Cash', 'DD'],
    question: 'Mode of payment?',
    defaultValue: 'NEFT',
  },
  paymentRef: {
    label: 'Reference', type: 'text', skippable: true,
    question: 'Cheque / NEFT / UTR reference number? (or skip)',
  },
  // ── Expense % update ─────────────────────────────────────
  expenseCategory: {
    label: 'Expense Category', type: 'enum',
    options: ['Drawing', 'Documents', 'Site Visit', 'Marketing & Misc', 'Office Management'],
    question: 'Which expense category to update?',
  },
  expensePercent: {
    label: 'New %', type: 'number',
    question: 'New percentage? (0–100, e.g. type 15 for 15%)',
    validate: v => {
      const n = Number(v);
      return (isNaN(n) || n < 0 || n > 100) ? 'Please enter a number between 0 and 100.' : null;
    },
  },
  // ── Yearly distribution ──────────────────────────────────
  yearlyAmount: {
    label: '2024-25 Amount (₹)', type: 'currency',
    question: 'New 2024-25 yearly distribution amount? (e.g. ₹1,50,000)',
    validate: v => {
      const n = parseAmount(String(v));
      return (n == null || n < 0) ? 'Please enter a valid amount.' : null;
    },
  },
};

// ----- Intent Definitions -----
export const INTENTS = {
  // ── CRM Create ───────────────────────────────────────────
  CREATE_CLIENT: {
    id: 'CREATE_CLIENT', label: 'Add Client', icon: '👤',
    description: 'Add a new client to the CRM',
    patterns: [
      /\b(add|create|new|register)\b.{0,20}\bclient\b/i,
      /\bclient\b.{0,20}\b(add|create|new|named?|called?)\b/i,
    ],
    fields: ['name', 'email', 'phone', 'company', 'city', 'state', 'status'],
    requiredFields: ['name'],
    action: 'create_client', confirmLabel: 'New Client',
    successMessage: d => `✅ Client **${d.name}** added successfully!`,
    summaryRows: d => [['Name', d.name], ['Email', d.email || '—'], ['Phone', d.phone || '—'], ['Company', d.company || '—'], ['Status', d.status || 'Active']],
  },
  CREATE_ASSOCIATE: {
    id: 'CREATE_ASSOCIATE', label: 'Add Associate', icon: '🤝',
    description: 'Add a new associate/partner',
    patterns: [
      /\b(add|create|new|register)\b.{0,20}\bassociate\b/i,
      /\bassociate\b.{0,20}\b(add|create|new|named?|called?)\b/i,
    ],
    fields: ['name', 'email', 'phone', 'company', 'city', 'state', 'status'],
    requiredFields: ['name', 'email'],
    action: 'create_associate', confirmLabel: 'New Associate',
    successMessage: d => `✅ Associate **${d.name}** added successfully!`,
    summaryRows: d => [['Name', d.name], ['Email', d.email], ['Phone', d.phone || '—'], ['Company', d.company || '—'], ['Status', d.status || 'Active']],
  },
  CREATE_MEETING: {
    id: 'CREATE_MEETING', label: 'Schedule Meeting', icon: '📅',
    description: 'Schedule a meeting or call',
    patterns: [
      /\b(schedule|add|create|book|set\s*up)\b.{0,25}\b(meeting|call|appointment|session)\b/i,
      /\b(meeting|call|appointment)\b.{0,25}\b(schedule|add|create|book)\b/i,
    ],
    fields: ['title', 'dateTime', 'meetingType', 'priority', 'location', 'description'],
    requiredFields: ['title', 'dateTime'],
    action: 'create_meeting', confirmLabel: 'New Meeting',
    successMessage: d => `✅ Meeting **${d.title}** scheduled!`,
    summaryRows: d => [['Title', d.title], ['When', d._dateFormatted || d.dateTime], ['Type', d.meetingType || 'Meeting'], ['Priority', d.priority || 'Medium'], ['Location', d.location || '—']],
  },
  CREATE_NOTE: {
    id: 'CREATE_NOTE', label: 'Add Note', icon: '📝',
    description: 'Create a quick note',
    patterns: [
      /\b(add|create|new|write|jot)\b.{0,20}\bnote\b/i,
      /\bnote\b.{0,20}\b(add|create|new|write)\b/i,
    ],
    fields: ['noteTitle', 'noteContent', 'noteCategory', 'notePriority'],
    requiredFields: ['noteTitle', 'noteContent'],
    action: 'create_note', confirmLabel: 'New Note',
    successMessage: d => `✅ Note **${d.noteTitle}** saved!`,
    summaryRows: d => [['Title', d.noteTitle], ['Content', (d.noteContent || '').slice(0, 60)], ['Category', d.noteCategory || 'General']],
  },
  // ── Search/find ──────────────────────────────────────────
  FIND_CLIENT: {
    id: 'FIND_CLIENT', label: 'Find Client', icon: '🔍',
    description: 'Search for a client',
    patterns: [/\b(find|search|look\s*up|show|get|list)\b.{0,20}\bclient\b/i],
    fields: ['query'], requiredFields: ['query'],
    action: 'find_client', isSearch: true,
  },
  FIND_ASSOCIATE: {
    id: 'FIND_ASSOCIATE', label: 'Find Associate', icon: '🔍',
    description: 'Search for an associate',
    patterns: [/\b(find|search|look\s*up|show|get|list)\b.{0,20}\bassociate\b/i],
    fields: ['query'], requiredFields: ['query'],
    action: 'find_associate', isSearch: true,
  },
  FIND_PROJECT: {
    id: 'FIND_PROJECT', label: 'Find Project', icon: '📁',
    description: 'Search for a project',
    patterns: [
      /\b(find|search|show|get|open|look\s*up)\b.{0,25}\bproject\b/i,
      /\bproject\b.{0,25}\b(find|search|show|details?|info|summary)\b/i,
    ],
    fields: ['projectQuery'], requiredFields: ['projectQuery'],
    action: 'find_project', isSearch: true,
  },
  // ── Project payments ─────────────────────────────────────
  VIEW_PROJECT_PAYMENTS: {
    id: 'VIEW_PROJECT_PAYMENTS', label: 'View Payments', icon: '💳',
    description: 'Show payment history for a project',
    patterns: [
      /\b(payment\s*history|payments?|receipts?|transactions?)\b.{0,30}\bproject\b/i,
      /\bproject\b.{0,30}\b(payment\s*history|payments?|received)\b/i,
      /\bshow\s+(all\s+)?payments?\b/i,
    ],
    fields: [], requiredFields: [],
    action: 'view_project_payments', needsProject: true,
  },
  ADD_PROJECT_PAYMENT: {
    id: 'ADD_PROJECT_PAYMENT', label: 'Add Payment', icon: '💰',
    description: 'Record a payment received for a project',
    patterns: [
      /\b(add|record|log|enter|received?)\b.{0,25}\b(payment|receipt|fees?|amount)\b/i,
      /\bpayment\b.{0,25}\b(add|record|log|received?|of|for)\b/i,
    ],
    fields: ['paymentAmount', 'paymentDate', 'paymentMode', 'paymentRef'],
    requiredFields: ['paymentAmount', 'paymentDate', 'paymentMode'],
    action: 'add_project_payment', needsProject: true,
    confirmLabel: 'Add Payment',
    successMessage: (d, ctx) => `✅ Payment of **${fmtINR(parseAmount(String(d.paymentAmount)))}** via **${d.paymentMode}** added to **${ctx?.projectName || 'project'}**!`,
    summaryRows: (d, ctx) => [
      ['Project', ctx?.projectName || '—'],
      ['Amount', fmtINR(parseAmount(String(d.paymentAmount)))],
      ['Date', d._payDateFormatted || d.paymentDate],
      ['Mode', d.paymentMode],
      ['Reference', d.paymentRef || '—'],
    ],
  },
  // ── Expense & yearly distribution updates ────────────────
  UPDATE_EXPENSE_PCT: {
    id: 'UPDATE_EXPENSE_PCT', label: 'Update Expense %', icon: '✏️',
    description: 'Edit expense distribution percentages for a project',
    patterns: [
      /\b(update|change|set|modify|edit)\b.{0,30}\b(expense|drawing|documents?|site\s*visit|marketing|office|percentage|percent)\b/i,
      /\bedit\s+(expense|distribution|percent)\b/i,
    ],
    fields: ['expenseCategory', 'expensePercent'],
    requiredFields: ['expenseCategory', 'expensePercent'],
    action: 'update_expense_pct', needsProject: true,
    confirmLabel: 'Update Expense %',
    successMessage: (d, ctx) => `✅ **${d.expenseCategory}** updated to **${d.expensePercent}%** for **${ctx?.projectName || 'project'}**!`,
    summaryRows: (d, ctx) => [
      ['Project', ctx?.projectName || '—'],
      ['Category', d.expenseCategory],
      ['New Percentage', `${d.expensePercent}%`],
    ],
  },
  UPDATE_YEARLY_DIST: {
    id: 'UPDATE_YEARLY_DIST', label: 'Update Yearly Dist.', icon: '📆',
    description: 'Update the 2024-25 yearly distribution amount',
    patterns: [
      /\b(update|change|set|modify|edit)\b.{0,30}\b(yearly|year|2024[\-_]?25|annual|distribution)\b/i,
      /\byearly\s+distribution\b/i,
      /\b2024[\-_]?25\b.{0,20}\b(set|update|change|to)\b/i,
    ],
    fields: ['yearlyAmount'],
    requiredFields: ['yearlyAmount'],
    action: 'update_yearly_dist', needsProject: true,
    confirmLabel: 'Update 2024-25 Distribution',
    successMessage: (d, ctx) => `✅ 2024-25 distribution set to **${fmtINR(parseAmount(String(d.yearlyAmount)))}** for **${ctx?.projectName || 'project'}**!`,
    summaryRows: (d, ctx) => [
      ['Project', ctx?.projectName || '—'],
      ['2024-25 Amount', fmtINR(parseAmount(String(d.yearlyAmount)))],
    ],
  },
  // ── Finance analytics (instant, no field collection) ─────
  FINANCE_STATS: {
    id: 'FINANCE_STATS', label: 'Finance Stats', icon: '📊',
    description: 'Get total fees, expenses, profit overview',
    patterns: [
      /\b(total|sum|overall|grand)\b.{0,30}\b(fees|revenue|received|drawing|expenses?|profit|pending|documents?|site\s*visit|marketing|office)\b/i,
      /\b(drawing|documents?|site\s*visit|marketing|office\s*mgmt?|finalized|received|pending|expenses?|profit)\b.{0,20}\b(total|sum|amount)\b/i,
      /\bhow\s+much\b.{0,40}\b(drawing|received|fees|profit|expenses?)\b/i,
      /\bfinance\s+(overview|summary|stats?|report)\b/i,
      /\bgive\s+me\b.{0,20}\b(total|summary|overview|stats?)\b/i,
      /\bshow\b.{0,15}\b(stats?|summary|overview|totals?|finance)\b/i,
    ],
    fields: [], requiredFields: [],
    action: 'finance_stats', isImmediate: true,
  },
  PROJECT_DETAIL: {
    id: 'PROJECT_DETAIL', label: 'Project Details', icon: '📋',
    description: 'Full breakdown of a specific project',
    patterns: [
      /\b(details?|summary|info(?:rmation)?|breakdown|snapshot)\b.{0,20}\b(?:of|for|about)\b.{0,30}\bproject\b/i,
    ],
    fields: [], requiredFields: [],
    action: 'project_detail', needsProject: true, isImmediate: true,
  },
  // ── Export ───────────────────────────────────────────────
  EXPORT_EXCEL: {
    id: 'EXPORT_EXCEL', label: 'Export Excel', icon: '📊',
    description: 'Download all projects as an Excel file',
    patterns: [
      /\bexport\b.{0,20}\b(excel|xlsx|spreadsheet)\b/i,
      /\b(download|get)\b.{0,20}\b(excel|xlsx)\b/i,
    ],
    fields: [], requiredFields: [],
    action: 'export_excel', isImmediate: true,
  },
  EXPORT_PDF: {
    id: 'EXPORT_PDF', label: 'Export PDF', icon: '📄',
    description: 'Download a finance report as PDF',
    patterns: [
      /\bexport\b.{0,20}\bpdf\b/i,
      /\b(download|generate|get)\b.{0,20}\b(pdf|report)\b/i,
      /\bfinance\b.{0,20}\b(pdf|report)\b/i,
    ],
    fields: [], requiredFields: [],
    action: 'export_pdf', isImmediate: true,
  },
  // ── Navigate / Help ──────────────────────────────────────
  NAVIGATE: {
    id: 'NAVIGATE', label: 'Navigate', icon: '🧭',
    description: 'Go to a page',
    patterns: [/\b(go\s*to|open|navigate\s*to|take\s*me\s*to|show\s*me\s*the?)\b/i],
    fields: [], requiredFields: [],
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

// ─── Extract project search query from user message ──────────────────────────
export function extractProjectQuery(text) {
  // Match "project TRI-001" or "project house design"
  const m1 = text.match(
    /(?:project|for\s+project|to\s+project)\s+([A-Za-z0-9][A-Za-z0-9\s\-_]{1,40}?)(?=\s*(?:,|\.|\?|add|show|get|payment|₹|rs\.?|inr|\d{5,}|$))/i
  );
  if (m1) return m1[1].trim();
  // Match bare project codes like TRI-001
  const m2 = text.match(/\b([A-Z]{2,6}[-\s]?\d{1,4})\b/);
  if (m2) return m2[1];
  return null;
}

// ─── Detect which expense category is mentioned ───────────────────────────────
export function detectExpenseCategory(text) {
  const t = text.toLowerCase();
  if (t.includes('drawing')) return 'Drawing';
  if (t.includes('document')) return 'Documents';
  if (t.includes('site')) return 'Site Visit';
  if (t.includes('marketing') || t.includes('misc')) return 'Marketing & Misc';
  if (t.includes('office')) return 'Office Management';
  return null;
}

// ─── Format a date for display ───────────────────────────────────────────────
export function formatDate(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d)) return String(date);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Format a complete project as a readable chat summary ────────────────────
export function formatProjectSummary(p) {
  const client = p.clientId?.name || p.clientId?.company || '—';
  const pending = (p.finalizedFees || 0) - (p.totalReceivedFees || 0);
  const amtForExp = (p.totalReceivedFees || 0) - (p.totalAssociateAmount || 0);
  const lines = [
    `📁 **${p.projectNumber}** — ${p.projectName}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `👤 Client:            ${client}`,
    `🏷️  Status:            ${p.status || '—'}`,
    `💼 Finalized Fees:    ${fmtINR(p.finalizedFees)}`,
    `✅ Total Received:    ${fmtINR(p.totalReceivedFees)}`,
    `⏳ Pending:           ${fmtINR(pending)}`,
    `📅 2024-25 Yearly:    ${fmtINR(p.year2024_25)}`,
    ``,
    `📊 Expense Distribution (base: ${fmtINR(amtForExp)})`,
    `  • Drawing:           ${fmtINR(p.drawing)} (${p.drawingPercent || 0}%)`,
    `  • Documents:         ${fmtINR(p.documents)} (${p.documentsPercent || 0}%)`,
    `  • Site Visit:        ${fmtINR(p.siteVisit)} (${p.siteVisitPercent || 0}%)`,
    `  • Marketing & Misc:  ${fmtINR(p.marketingAndMisc)} (${p.marketingAndMiscPercent || 0}%)`,
    `  • Office Mgmt:       ${fmtINR(p.officeManagement)} (${p.officeManagementPercent || 0}%)`,
    `  • Profit Margin:     ${fmtINR(p.profitMargin)} (${p.profitMarginPercent || 0}%)`,
  ];
  if (p.payments?.length) {
    lines.push('');
    lines.push(`💳 Payment History (${p.payments.length} payment${p.payments.length !== 1 ? 's' : ''})`);
    const shown = p.payments.slice().reverse().slice(0, 3);
    shown.forEach(pay => {
      lines.push(`  • ${formatDate(pay.date)}: ${fmtINR(pay.amount)} via ${pay.mode}${pay.chequeNeftNumber ? ` [${pay.chequeNeftNumber}]` : ''}`);
    });
    if (p.payments.length > 3) lines.push(`  … and ${p.payments.length - 3} more`);
  } else {
    lines.push('');
    lines.push('💳 No payments recorded yet.');
  }
  return lines.join('\n');
}

// ─── Format payment list for chat ────────────────────────────────────────────
export function formatPaymentList(projectName, payments) {
  if (!payments || payments.length === 0)
    return `💳 No payments recorded for **${projectName}** yet.`;
  const total = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const lines = [
    `💳 **Payment History — ${projectName}**`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `Total received: **${fmtINR(total)}** across ${payments.length} payment(s)`,
    ``,
  ];
  payments
    .slice()
    .reverse()
    .forEach((p, i) => {
      const ref = p.chequeNeftNumber ? ` [${p.chequeNeftNumber}]` : '';
      lines.push(`  ${i + 1}. ${formatDate(p.date)} — ${fmtINR(p.amount)} · ${p.mode}${ref}`);
    });
  return lines.join('\n');
}

// ─── Format aggregated finance stats for chat ─────────────────────────────────
export function formatFinanceStats(stats) {
  const r = stats?.revenue || stats || {};
  const e = stats?.expenses?.byCategory || {};
  const proj = stats?.projects || {};
  const finalized = r.totalFinalizedFees ?? r.totalFinalized ?? 0;
  const received  = r.totalReceivedFees  ?? r.totalReceived  ?? 0;
  const expenses  = r.totalExpenses ?? 0;
  const profit    = r.netProfit ?? (received - expenses) ?? 0;
  const pending   = finalized - received;
  return [
    `📊 **Finance Overview — All Projects**`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📁 Total Projects:       ${proj.total || 0}  (Active: ${proj.active || 0} · Done: ${proj.completed || 0})`,
    ``,
    `💼 Finalized Fees:       ${fmtINR(finalized)}`,
    `✅ Total Received:       ${fmtINR(received)}`,
    `⏳ Pending Fees:         ${fmtINR(pending)}`,
    ``,
    `📊 Expense Breakdown`,
    `  • Drawing:             ${fmtINR(e.drawing)}`,
    `  • Documents:           ${fmtINR(e.documents)}`,
    `  • Site Visit:          ${fmtINR(e.siteVisit)}`,
    `  • Marketing & Misc:    ${fmtINR(e.marketingMisc ?? e.marketingAndMisc)}`,
    `  • Office Management:   ${fmtINR(e.officeManagement)}`,
    `  • **Total Expenses:    ${fmtINR(expenses)}**`,
    ``,
    `  💰 **Net Profit:       ${fmtINR(profit)}**`,
  ].join('\n');
}
