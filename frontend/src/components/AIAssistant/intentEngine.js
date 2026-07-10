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
  // ── Finalized fees update ────────────────────────────────
  finalizedFeesAmount: {
    label: 'New Finalized Fees (₹)', type: 'currency',
    question: 'New finalized fee amount? (e.g. ₹5,00,000 or 5L)',
    validate: v => {
      const n = parseAmount(String(v));
      return (n == null || n < 0) ? 'Please enter a valid amount.' : null;
    },
  },
  // ── Add Associate to Project ──────────────────────────────
  assocName: {
    label: 'Associate Name', type: 'text',
    question: 'Which associate? (type part of their name)',
  },
  assocPercentage: {
    label: 'Share (%)', type: 'number',
    question: 'What percentage share? (1–100, e.g. type 10 for 10%)',
    validate: v => {
      const n = parseFloat(v);
      return (isNaN(n) || n <= 0 || n > 100) ? 'Please enter a number between 1 and 100.' : null;
    },
  },
  assocAmountPaid: {
    label: 'Amount Paid (₹)', type: 'currency',
    question: 'Amount already paid to them? (or skip)',
    skippable: true,
  },
  assocPaymentDate: {
    label: 'Payment Date', type: 'datetime',
    question: 'Payment date to this associate? (or skip)',
    skippable: true,
  },
  assocPaymentBank: {
    label: 'Paid via Bank', type: 'text',
    question: 'Which bank was payment made from? (or skip)',
    skippable: true,
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
  // ── List all (instant, no query needed) ─────────────────
  LIST_CLIENTS: {
    id: 'LIST_CLIENTS', label: 'List All Clients', icon: '👥',
    description: 'Show all clients with count and status',
    patterns: [
      /\b(list|show)\s+(?:all\s+)?clients?\s*$/i,
      /\bhow\s+many\s+clients?\b/i,
      /\ball\s+clients?\b/i,
      /\bclient\s+(list|count|total|directory)\b/i,
    ],
    fields: [], requiredFields: [],
    action: 'list_clients', isImmediate: true,
  },
  LIST_ASSOCIATES: {
    id: 'LIST_ASSOCIATES', label: 'List All Associates', icon: '🤝',
    description: 'Show all associates with count and status',
    patterns: [
      /\b(list|show)\s+(?:all\s+)?associates?\s*$/i,
      /\bhow\s+many\s+associates?\b/i,
      /\ball\s+associates?\b/i,
      /\bassociate\s+(list|count|total|directory)\b/i,
    ],
    fields: [], requiredFields: [],
    action: 'list_associates', isImmediate: true,
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
  LIST_PROJECTS: {
    id: 'LIST_PROJECTS', label: 'List All Projects', icon: '📂',
    description: 'Show summary list of all finance projects',
    patterns: [
      /\b(list|show)\s+(?:all\s+)?projects?\s*$/i,
      /\bhow\s+many\s+projects?\b/i,
      /\ball\s+projects?\b/i,
      /\bproject\s+(list|count|total|directory)\b/i,
    ],
    fields: [], requiredFields: [],
    action: 'list_projects', isImmediate: true,
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
  // ── Recent payments (global, no project) ──────────────────
  RECENT_PAYMENTS: {
    id: 'RECENT_PAYMENTS', label: 'Recent Payments', icon: '💳',
    description: 'Show latest payments received across all projects',
    patterns: [
      /\b(recent|latest|last|new)\b.{0,20}\bpayments?\b/i,
      /\bpayments?\b.{0,20}\b(recent|latest|last)\b/i,
      /\blatest\s+transactions?\b/i,
      /\bwhat.s\s+been\s+(received|paid)\b/i,
    ],
    fields: [], requiredFields: [],
    action: 'recent_payments', isImmediate: true,
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
      // eslint-disable-next-line no-useless-escape
      /\b(update|change|set|modify|edit)\b.{0,30}\b(yearly|year|2024[\-_]?25|annual|distribution)\b/i,
      /\byearly\s+distribution\b/i,
      // eslint-disable-next-line no-useless-escape
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
  UPDATE_FINALIZED_FEES: {
    id: 'UPDATE_FINALIZED_FEES', label: 'Update Finalized Fees', icon: '💼',
    description: 'Update the finalized fee amount for a project',
    patterns: [
      /\b(update|change|set|modify|edit)\b.{0,25}\b(finalized\s+fees?|project\s+fees?|contract\s+fees?)\b/i,
      /\bfinalized\s+fees?\b.{0,25}\b(update|change|set|to)\b/i,
    ],
    fields: ['finalizedFeesAmount'],
    requiredFields: ['finalizedFeesAmount'],
    action: 'update_finalized_fees', needsProject: true,
    confirmLabel: 'Update Finalized Fees',
    successMessage: (d, ctx) => `✅ Finalized fees updated to **${fmtINR(parseAmount(String(d.finalizedFeesAmount)))}** for **${ctx?.projectName || 'project'}**!`,
    summaryRows: (d, ctx) => [
      ['Project', ctx?.projectName || '—'],
      ['New Finalized Fees', fmtINR(parseAmount(String(d.finalizedFeesAmount)))],
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
  PENDING_FEES: {
    id: 'PENDING_FEES', label: 'Pending Fee Projects', icon: '⏳',
    description: 'Show projects with outstanding/pending fees',
    patterns: [
      /\b(pending\s+fees?|outstanding\s+fees?|unpaid\s+fees?)\b/i,
      /\bwho\s+hasn.t\s+paid\b/i,
      /\boverdue\s+(payments?|fees?|invoices?)\b/i,
      /\bprojects?\b.{0,25}\b(pending|outstanding|unpaid|balance)\b/i,
      /\bshow\b.{0,15}\bpending\b/i,
    ],
    fields: [], requiredFields: [],
    action: 'pending_fees', isImmediate: true,
  },
  TOP_PROJECTS: {
    id: 'TOP_PROJECTS', label: 'Top Projects', icon: '🏆',
    description: 'Show highest-value projects by fees',
    patterns: [
      /\b(top|highest|biggest|largest|best)\b.{0,20}\bprojects?\b/i,
      /\bprojects?\b.{0,20}\b(highest|biggest|largest)\b.{0,20}\bfees?\b/i,
      /\bhighest\s+(revenue|value|fees?)\b/i,
    ],
    fields: [], requiredFields: [],
    action: 'top_projects', isImmediate: true,
  },
  ASSOCIATE_PAYMENT_STATUS: {
    id: 'ASSOCIATE_PAYMENT_STATUS', label: 'Associate Payment Status', icon: '🤝',
    description: 'Show associate payment summary and pending dues',
    patterns: [
      /\bassociate\s+(payment\s*status|dues?|payouts?|pending\s+payouts?)\b/i,
      /\b(pending|outstanding)\s+associate\s+(payments?|dues?|amounts?)\b/i,
      /\bhow\s+much\b.{0,25}\b(owe|paid|due)\b.{0,25}\bassociate\b/i,
      /\bassociate\s+(summary|overview|financials?)\b/i,
      /\bwhat\s+(do\s+)?i\s+owe\s+(to\s+)?associates?\b/i,
    ],
    fields: [], requiredFields: [],
    action: 'associate_payment_status', isImmediate: true,
  },
  FY_SUMMARY: {
    id: 'FY_SUMMARY', label: 'FY 2024-25 Summary', icon: '📅',
    description: 'Financial year summary and yearly distribution totals',
    patterns: [
      /\b(fy|financial\s+year|fiscal\s+year)\b/i,
      // eslint-disable-next-line no-useless-escape
      /\b2024[\-_]?\s*25\s+(summary|overview|total|report)\b/i,
      /\b(this\s+year|yearly)\s+(summary|total|overview|revenue|profit)\b/i,
      /\byearly\s+(overview|report|summary|stats?)\b/i,
      /\bannual\s+(overview|report|summary|stats?)\b/i,
    ],
    fields: [], requiredFields: [],
    action: 'fy_summary', isImmediate: true,
  },
  // ── Add Associate to Project ────────────────────────────
  ADD_ASSOCIATE_TO_PROJECT: {
    id: 'ADD_ASSOCIATE_TO_PROJECT', label: 'Add Associate to Project', icon: '🤝',
    description: 'Assign an associate with a percentage share to a project',
    patterns: [
      /\badd\b.{0,30}\bassociate\b.{0,60}\bproject\b/i,
      /\bassign\b.{0,30}\bassociate\b/i,
      /\bassociate\b.{0,30}\b(add|assign|link|attach)\b/i,
      /\badd\b.{0,30}\bto\b.{0,30}\bproject\b.{0,30}\b(associate|with\s+\d+%)/i,
      /\b(give|set)\b.{0,20}\bassociate\b.{0,20}\b(share|percent)/i,
    ],
    fields: ['assocName', 'assocPercentage', 'assocAmountPaid', 'assocPaymentDate', 'assocPaymentBank'],
    requiredFields: ['assocName', 'assocPercentage'],
    action: 'add_associate_to_project', needsProject: true,
    confirmLabel: 'Add Associate',
    successMessage: (d, ctx) => `✅ Associate **${d.assocName}** added to **${ctx?.projectName || 'project'}** with **${d.assocPercentage}%** share!`,
    summaryRows: (d, ctx) => [
      ['Project', ctx?.projectName || '—'],
      ['Associate', d.assocName],
      ['Share', `${d.assocPercentage}%`],
      ['Amount Paid', d.assocAmountPaid ? fmtINR(parseAmount(String(d.assocAmountPaid))) : '₹0'],
      ['Payment Date', d.assocPaymentDate || '—'],
      ['Bank', d.assocPaymentBank || '—'],
    ],
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
  // ── Calculator ────────────────────────────────────────────
  CALCULATOR: {
    id: 'CALCULATOR', label: 'Calculate', icon: '🧮',
    description: 'Calculate percentages or amounts',
    patterns: [
      /\b(calculate|compute|what\s+is)\b.{0,30}\b\d+\s*%\s*of\b/i,
      /\b\d+(?:\.\d+)?\s*%\s*of\s+[\d₹]/i,
      /\bhow\s+much\s+is\b.{0,30}\b\d+\s*%\b/i,
    ],
    fields: [], requiredFields: [],
    action: 'calculate', isImmediate: true,
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
  // eslint-disable-next-line no-useless-escape
  // eslint-disable-next-line no-useless-escape
  const emailMatch = text.match(/\b([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})\b/);
  if (emailMatch) entities.email = emailMatch[1];

  // associate name: "associate Vaishal Shah", "add Priya as associate"
  const assocNameMatch = text.match(
    /\bassociate\s+([A-Z][a-zA-Z\s.'-]{1,40}?)(?=\s+(?:to|with|in|at|from|,|and|$))/i
  ) || text.match(
    /\b(add|assign)\s+([A-Z][a-zA-Z\s.'-]{2,40}?)\s+(?:as\s+)?associate/i
  );
  if (assocNameMatch) entities.assocName = (assocNameMatch[1] || assocNameMatch[2]).trim();

  // percentage: "10%", "10 percent", "with a share of 10"
  const pctMatch = text.match(/\b(\d{1,3})(?:\.\d+)?\s*(?:%|percent(?:age)?)\b/i);
  if (pctMatch) entities.assocPercentage = pctMatch[1];

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

// ─── Format full client list ─────────────────────────────────────────────────
export function formatClientList(clients) {
  if (!clients || clients.length === 0) return '👥 No clients found.';
  const active = clients.filter(c => c.status === 'Active').length;
  const lines = [
    `👥 **All Clients (${clients.length} total · ${active} active)**`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    '',
  ];
  clients.slice(0, 15).forEach((c, i) => {
    const details = [c.company, c.city].filter(Boolean).join(', ');
    lines.push(`  ${i + 1}. **${c.name}**${details ? `  ·  ${details}` : ''}  ·  ${c.status || 'Active'}`);
  });
  if (clients.length > 15) lines.push(`  … and ${clients.length - 15} more clients`);
  return lines.join('\n');
}

// ─── Format full associate list ──────────────────────────────────────────────
export function formatAssociateList(associates) {
  if (!associates || associates.length === 0) return '🤝 No associates found.';
  const active = associates.filter(a => a.status === 'Active').length;
  const lines = [
    `🤝 **All Associates (${associates.length} total · ${active} active)**`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    '',
  ];
  associates.slice(0, 15).forEach((a, i) => {
    const details = [a.company, a.city].filter(Boolean).join(', ');
    lines.push(`  ${i + 1}. **${a.name}**${details ? `  ·  ${details}` : ''}  ·  ${a.status || 'Active'}`);
  });
  if (associates.length > 15) lines.push(`  … and ${associates.length - 15} more associates`);
  return lines.join('\n');
}

// ─── Format project list ─────────────────────────────────────────────────────
export function formatProjectList(projects) {
  if (!projects || projects.length === 0) return '📂 No projects found.';
  const active = projects.filter(p => p.status === 'Active' || p.status === 'In Progress').length;
  const totalFees = projects.reduce((s, p) => s + (p.finalizedFees || 0), 0);
  const lines = [
    `📂 **All Projects (${projects.length} total · ${active} active)**`,
    `Total Finalized: ${fmtINR(totalFees)}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    '',
  ];
  projects.slice(0, 15).forEach((p, i) => {
    const client = p.clientId?.name || p.clientId?.company || '—';
    lines.push(`  ${i + 1}. **${p.projectNumber}** ${p.projectName}  ·  ${client}  ·  ${fmtINR(p.finalizedFees)}  ·  ${p.status || '—'}`);
  });
  if (projects.length > 15) lines.push(`  … and ${projects.length - 15} more projects`);
  return lines.join('\n');
}

// ─── Format pending-fee projects ─────────────────────────────────────────────
export function formatPendingProjects(projects) {
  if (!projects || projects.length === 0)
    return '✅ No pending fees — all projects are fully paid!';
  const totalPending = projects.reduce((s, p) => s + ((p.finalizedFees || 0) - (p.totalReceivedFees || 0)), 0);
  const lines = [
    `⏳ **Pending Fee Projects (${projects.length} project${projects.length !== 1 ? 's' : ''})**`,
    `Total Outstanding: **${fmtINR(totalPending)}**`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    '',
  ];
  projects.slice(0, 10).forEach((p, i) => {
    const client = p.clientId?.name || p.clientId?.company || '—';
    const pending = (p.finalizedFees || 0) - (p.totalReceivedFees || 0);
    lines.push(`  ${i + 1}. **${p.projectNumber}** ${p.projectName}`);
    lines.push(`     ${client}  ·  Pending: **${fmtINR(pending)}** of ${fmtINR(p.finalizedFees)}`);
  });
  if (projects.length > 10) lines.push(`  … and ${projects.length - 10} more projects`);
  return lines.join('\n');
}

// ─── Format top projects by finalized fees ────────────────────────────────────
export function formatTopProjects(projects) {
  if (!projects || projects.length === 0) return '📊 No projects found.';
  const lines = [
    `🏆 **Top ${projects.length} Projects by Finalized Fee**`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    '',
  ];
  projects.forEach((p, i) => {
    const client = p.clientId?.name || p.clientId?.company || '—';
    const received = p.totalReceivedFees || 0;
    const pct = p.finalizedFees > 0 ? Math.round((received / p.finalizedFees) * 100) : 0;
    lines.push(`  ${i + 1}. **${p.projectNumber}** ${p.projectName}`);
    lines.push(`     ${client}  ·  ${fmtINR(p.finalizedFees)}  ·  ${pct}% received`);
  });
  return lines.join('\n');
}

// ─── Format recent payments across all projects ───────────────────────────────
export function formatRecentPayments(payments) {
  if (!payments || payments.length === 0) return '💳 No recent payments found.';
  const total = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const lines = [
    `💳 **Recent Payments (last ${payments.length})**`,
    `Total: **${fmtINR(total)}**`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    '',
  ];
  payments.forEach((p, i) => {
    const ref = p.chequeNeftNumber ? ` [${p.chequeNeftNumber}]` : '';
    lines.push(`  ${i + 1}. ${formatDate(p.date)}  ·  **${fmtINR(p.amount)}**`);
    lines.push(`     ${p.projectName}  ·  ${p.mode}${ref}`);
  });
  return lines.join('\n');
}

// ─── Format associate payment status ────────────────────────────────────────
export function formatAssociatePaymentStatus(statuses) {
  if (!statuses || statuses.length === 0)
    return '🤝 No associate payment data found.';
  const totalOwed = statuses.reduce((s, a) => s + (a.totalOwed || 0), 0);
  const totalPaid = statuses.reduce((s, a) => s + (a.totalPaid || 0), 0);
  const lines = [
    `🤝 **Associate Payment Summary**`,
    `Owed: ${fmtINR(totalOwed)}  ·  Paid: ${fmtINR(totalPaid)}  ·  Balance: **${fmtINR(totalOwed - totalPaid)}**`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    '',
  ];
  statuses.forEach((a, i) => {
    const balance = (a.totalOwed || 0) - (a.totalPaid || 0);
    lines.push(`  ${i + 1}. **${a.name}**  ·  ${a.projects} project${a.projects !== 1 ? 's' : ''}`);
    lines.push(`     Owed: ${fmtINR(a.totalOwed)}  ·  Paid: ${fmtINR(a.totalPaid)}  ·  Balance: **${fmtINR(balance)}**`);
  });
  return lines.join('\n');
}

// ─── Format FY 2024-25 summary ───────────────────────────────────────────────
export function formatFySummary(stats, projects) {
  const totalYearly = (projects || []).reduce((s, p) => s + (p.year2024_25 || 0), 0);
  const r = stats?.revenue || stats || {};
  const finalized = r.totalFinalizedFees ?? r.totalFinalized ?? 0;
  const received  = r.totalReceivedFees  ?? r.totalReceived  ?? 0;
  return [
    `📅 **FY 2024-25 Financial Summary**`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📁 Total Projects:   ${stats?.projects?.total || (projects || []).length}`,
    `💼 Finalized Fees:   ${fmtINR(finalized)}`,
    `✅ Total Received:   ${fmtINR(received)}`,
    `⏳ Pending:          ${fmtINR(finalized - received)}`,
    `📅 2024-25 Yearly:   ${fmtINR(totalYearly)}`,
    `💰 Net Profit:       ${fmtINR(r.netProfit ?? 0)}`,
  ].join('\n');
}
