// ============================================================
// AI Assistant — Global CRM Chat Assistant
// Accessible on every authenticated page via a floating button.
// Handles Create / Find / Navigate intents with a guided
// conversational state machine.
// ============================================================
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useId,
  useMemo,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  INTENTS,
  FIELD_DEFS,
  detectIntent,
  extractEntities,
  extractProjectQuery,
  detectExpenseCategory,
  parseNaturalDate,
  formatDateTime,
  formatDate,
  getNavigationPath,
  isSkip,
  validateField,
  parseAmount,
  fmtINR,
  formatProjectSummary,
  formatPaymentList,
  formatFinanceStats,
  formatClientList,
  formatAssociateList,
  formatProjectList,
  formatPendingProjects,
  formatTopProjects,
  formatRecentPayments,
  formatAssociatePaymentStatus,
  formatFySummary,
} from './intentEngine';
import { executeAction } from './actionHandlers';
import './AIAssistant.css';

// ─── Message factory ───────────────────────────────────────
let _msgId = 0;
function msg(role, text, extras = {}) {
  return { id: ++_msgId, role, text, ts: new Date(), ...extras };
}

// ─── HELP text ─────────────────────────────────────────────
const HELP_TEXT = `Here's what I can do for you:

**📋 Add Records**
• "Add client named Ravi Sharma"
• "Create associate named Priya, email priya@ex.com"
• "Schedule a meeting about Design Review"
• "Add a note titled Follow-up"

**🔍 Search & Browse**
• "Find client Ravi" / "Search associate Priya"
• "Find project TRI-001" / "Show project house design"
• "List all clients" / "Show all associates"
• "All projects" / "How many clients"

**💰 Finance — Projects**
• "Payment history for project X"
• "Add payment ₹50,000 NEFT to project X"
• "Add associate Priya to project X with 10% share"
• "Update drawing percent to 15% for project X"
• "Set yearly distribution to 1.5L for project X"
• "Update finalized fees to 5L for project X"

**📊 Finance Analytics**
• "Finance summary" / "Total expenses" / "Net profit"
• "Pending fees" / "Who hasn't paid"
• "Recent payments" / "Top projects"
• "Associate payment status"
• "FY 2024-25 summary" / "This year's total"

**📤 Export**
• "Export to Excel" / "Export to PDF"

**🧮 Calculator**
• "Calculate 15% of 5 lakhs"
• "What is 10% of ₹50,000"

**🧭 Navigate**
• "Go to Projects" / "Open Finance" / "Analytics"

Just type naturally — I'll guide you!`;

// ─── Stage constants ────────────────────────────────────────
const STAGE = {
  IDLE: 'idle',
  COLLECTING: 'collecting',
  CHOOSING_PROJECT: 'choosing_project',
  CONFIRMING: 'confirming',
  EXECUTING: 'executing',
};

// ─── Format search results ─────────────────────────────────
function formatSearchResults(results, type) {
  if (!results || results.length === 0)
    return `No ${type}s found matching your search.`;
  const top = results.slice(0, 5);
  const lines = top.map(r => {
    const details = [r.email, r.phone, r.company].filter(Boolean).join(' · ');
    return `• **${r.name}**${details ? `  —  ${details}` : ''}`;
  });
  const extra = results.length > 5 ? `\n…and ${results.length - 5} more.` : '';
  return `Found ${results.length} ${type}${results.length > 1 ? 's' : ''}:\n\n${lines.join('\n')}${extra}`;
}

// ─── Build confirmation message ────────────────────────────
function buildConfirmText(intent, collected) {
  const rows = intent.summaryRows(collected)
    .map(([k, v]) => `  • **${k}:** ${v}`)
    .join('\n');
  return `Ready to create this **${intent.confirmLabel}**:\n\n${rows}\n\nShall I go ahead?`;
}

// ─── Message renderer ──────────────────────────────────────
function Message({ m }) {
  // Convert **bold** markdown-ish to bold spans
  function renderText(text) {
    if (!text) return null;
    const parts = text.split(/\*\*(.+?)\*\*/g);
    return parts.map((p, i) =>
      i % 2 === 1 ? <strong key={i}>{p}</strong> : <span key={i}>{p}</span>
    );
  }

  const lines = (m.text || '').split('\n');
  return (
    <div className={`aia-msg aia-msg--${m.role}`}>
      {m.role === 'assistant' && (
        <div className="aia-avatar">✨</div>
      )}
      <div className="aia-bubble">
        {lines.map((line, i) => (
          <React.Fragment key={i}>
            {renderText(line)}
            {i < lines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ─── Typing indicator ──────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="aia-msg aia-msg--assistant">
      <div className="aia-avatar">✨</div>
      <div className="aia-bubble aia-typing">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

// ─── Quick-reply pill buttons ─────────────────────────────
function QuickReplies({ options, onPick, disabled }) {
  if (!options || options.length === 0) return null;
  return (
    <div className="aia-quick-replies">
      {options.map(opt => (
        <button
          key={opt}
          className="aia-qr-btn"
          onClick={() => !disabled && onPick(opt)}
          disabled={disabled}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────
export default function AIAssistant() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const bottomRef = useRef(null);
  const uid = useId();

  // ── Panel visibility ──────────────────────────────────────
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewBadge, setHasNewBadge] = useState(true);
  const [isTyping, setIsTyping] = useState(false);

  // ── Conversation state ────────────────────────────────────
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');

  // ── Voice input state ─────────────────────────────────────
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef(null);
  const voiceErrorTimerRef = useRef(null);

  // ── Check browser support once ────────────────────────────
  const isSpeechSupported = useMemo(() =>
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window),
  []);

  // ── Intent / field collection state ──────────────────────
  const [stage, setStage] = useState(STAGE.IDLE);
  const [intent, setIntent] = useState(null);
  const [collected, setCollected] = useState({});
  const [fieldQueue, setFieldQueue] = useState([]);
  const [currentField, setCurrentField] = useState(null);
  const [currentOptions, setCurrentOptions] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  // ── Finance / project context state ───────────────────────────
  // contextProject persists in conversation so follow-up commands reuse it
  const [contextProject, setContextProject] = useState(null); // {_id, projectName, projectNumber}
  const [projectChoices, setProjectChoices] = useState([]);   // list when multiple matches
  const [pendingIntentAfterProject, setPendingIntentAfterProject] = useState(null); // intent waiting for project
  const [pendingCollected, setPendingCollected] = useState({}); // pre-collected data for pending intent
  // ── Scroll to bottom on new messages ─────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ── Focus input when panel opens ──────────────────────────
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setHasNewBadge(false);
      if (messages.length === 0) {
        const hour = new Date().getHours();
        const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
        addAssistantMsg(
          `${greet}! I'm your CRM assistant. ✨\n\nI can **add clients, associates, meetings, notes**, **search records**, **analyse finance**, and **navigate** any page.\n\nWhat would you like to do?`,
          ['Add Client', 'Finance Stats', 'Pending Fees', 'Help']
        );
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ── Voice: stop recognition (safe) ──────────────────────
  const stopVoice = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  // ── Voice: show error briefly ─────────────────────────────
  const showVoiceError = useCallback((msg) => {
    setVoiceError(msg);
    clearTimeout(voiceErrorTimerRef.current);
    voiceErrorTimerRef.current = setTimeout(() => setVoiceError(''), 4000);
  }, []);

  // ── Voice: start / toggle ─────────────────────────────────
  const startVoice = useCallback(() => {
    if (!isSpeechSupported) {
      showVoiceError('Voice input is not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    if (isListening) {
      stopVoice();
      return;
    }
    setVoiceError('');
    setInterimTranscript('');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = 'en-IN';
    recognition.interimResults = true;   // show live transcript while speaking
    recognition.maxAlternatives = 1;
    recognition.continuous = false;      // stop automatically after a pause

    recognition.onstart = () => {
      setIsListening(true);
      setInterimTranscript('');
    };

    recognition.onresult = (event) => {
      let interim = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      // Stream interim into the visible input field
      setInterimTranscript(interim);
      // Final result — auto-submit
      if (finalText.trim()) {
        setInterimTranscript('');
        setIsListening(false);
        // Small delay so user sees the recognised text flash
        setInputValue(finalText.trim());
        setTimeout(() => {
          setInputValue('');
          processInputRef.current(finalText.trim());
        }, 300);
      }
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      setInterimTranscript('');
      const msgs = {
        'not-allowed': '🎤 Microphone permission denied. Please allow mic access in your browser.',
        'no-speech':   '🔇 No speech detected. Tap the mic and try again.',
        'network':     '📶 Network error during voice recognition. Check your connection.',
        'aborted':     '', // user-initiated abort — silent
      };
      const errMsg = msgs[event.error] ?? `🎤 Voice error: ${event.error}`;
      if (errMsg) showVoiceError(errMsg);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    try {
      recognition.start();
    } catch (err) {
      showVoiceError('Could not start voice recognition. Please try again.');
      setIsListening(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpeechSupported, isListening, stopVoice, showVoiceError]);

  // ── Keep processInput in a ref so voice callback always has latest version ─
  const processInputRef = useRef(null);

  // ── Stop voice on panel close ─────────────────────────────
  useEffect(() => {
    if (!isOpen) stopVoice();
  }, [isOpen, stopVoice]);

  // ── Cleanup on unmount ────────────────────────────────────
  useEffect(() => {
    return () => {
      stopVoice();
      clearTimeout(voiceErrorTimerRef.current);
    };
  }, [stopVoice]);

  // ── Escape key aborts voice ───────────────────────────────
  useEffect(() => {
    function onKeyUp(e) {
      if (e.key === 'Escape' && isListening) stopVoice();
    }
    window.addEventListener('keyup', onKeyUp);
    return () => window.removeEventListener('keyup', onKeyUp);
  }, [isListening, stopVoice]);

  // ── helpers ───────────────────────────────────────────────
  const addMsg = useCallback(m => setMessages(prev => [...prev, m]), []);

  function addAssistantMsg(text, options = []) {
    addMsg(msg('assistant', text, { options }));
    setCurrentOptions(options);
  }

  function addUserMsg(text) {
    addMsg(msg('user', text));
    setCurrentOptions([]);
  }

  function resetConversation() {
    setStage(STAGE.IDLE);
    setIntent(null);
    setCollected({});
    setFieldQueue([]);
    setCurrentField(null);
    setCurrentOptions([]);
    setProjectChoices([]);
    setPendingIntentAfterProject(null);
    setPendingCollected({});
  }

  // ── Ask the next field in the queue ──────────────────────
  function askNextField(queue, collectedSoFar, intentDef) {
    // Skip over already-collected fields
    const remaining = queue.filter(f => collectedSoFar[f] == null);
    if (remaining.length === 0) {
      // All fields collected → confirm
      goToConfirm(intentDef, collectedSoFar);
      return;
    }
    const nextF = remaining[0];
    const def = FIELD_DEFS[nextF];
    setCurrentField(nextF);
    setFieldQueue(remaining.slice(1));

    let questionText = def.question;
    const opts = [];

    if (def.skippable) {
      questionText += ' (type "skip" to omit)';
    }
    if (def.type === 'enum') {
      opts.push(...def.options);
    }
    if (def.skippable) {
      opts.push('Skip');
    }

    setStage(STAGE.COLLECTING);
    addAssistantMsg(questionText, opts);
  }

  // ── Move to confirmation stage ────────────────────────────
  function goToConfirm(intentDef, collectedData, ctx) {
    setStage(STAGE.CONFIRMING);
    setCurrentField(null);
    const rows = intentDef.summaryRows(collectedData, ctx)
      .map(([k, v]) => `  • **${k}:** ${v}`)
      .join('\n');
    const text = `Ready to submit **${intentDef.confirmLabel}**:\n\n${rows}\n\nShall I go ahead?`;
    addAssistantMsg(text, ['Yes, confirm!', 'Cancel']);
  }

  // ── Execute the confirmed action ──────────────────────────
  async function runAction(intentDef, collectedData, ctx) {
    setStage(STAGE.EXECUTING);
    setIsExecuting(true);
    setCurrentOptions([]);
    setIsTyping(true);

    try {
      await executeAction(intentDef.action, collectedData, ctx);
      setIsTyping(false);

      const successText = intentDef.successMessage(collectedData, ctx);
      addAssistantMsg(successText, ['Do something else', 'Close']);
    } catch (err) {
      setIsTyping(false);
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Something went wrong. Please try again.';
      addAssistantMsg(`❌ Error: ${errMsg}`, ['Try again', 'Cancel']);
    } finally {
      setIsExecuting(false);
      resetConversation();
    }
  }

  // ── Process any submitted text (from input or quick-reply) ─
  async function processInput(rawText) {
    const text = rawText.trim();
    if (!text) return;

    addUserMsg(text);
    setIsTyping(true);

    // Small artificial delay for natural feel
    await new Promise(r => setTimeout(r, 500));
    setIsTyping(false);

    // ── IDLE: detect new intent ──────────────────────────────
    if (stage === STAGE.IDLE) {
      // Global quick replies
      if (/^help$/i.test(text) || text === 'Help') {
        addAssistantMsg(HELP_TEXT, ['Add Client', 'Finance Stats', 'Find Project', 'Export Excel']);
        return;
      }
      if (text === 'Do something else') {
        addAssistantMsg("Sure! What would you like to do?", ['Add Client', 'Finance Stats', 'Pending Fees', 'Find Project', 'Help']);
        return;
      }
      if (text === 'Close') {
        setIsOpen(false);
        return;
      }
      if (text === 'View Payments' && contextProject) {
        // Shortcut: view payments for currently contextual project
        setIsTyping(true);
        await new Promise(r => setTimeout(r, 400));
        setIsTyping(false);
        try {
          const proj = await executeAction('view_project_payments', {}, { projectId: contextProject._id });
          addAssistantMsg(formatPaymentList(contextProject.projectName, proj.payments || []),
            ['Add Payment', 'Update Expenses', 'Export Excel', 'Do something else']);
        } catch (err) {
          addAssistantMsg(`❌ ${err?.response?.data?.message || err.message}`, ['Try again']);
        }
        return;
      }
      if (text === 'Add Payment' && contextProject) {
        const foundIntent = INTENTS.ADD_PROJECT_PAYMENT;
        setIntent(foundIntent);
        setCollected({});
        askNextField(foundIntent.fields, {}, foundIntent);
        return;
      }
      if (text === 'Update Expenses' && contextProject) {
        const foundIntent = INTENTS.UPDATE_EXPENSE_PCT;
        setIntent(foundIntent);
        setCollected({});
        askNextField(foundIntent.fields, {}, foundIntent);
        return;
      }
      if (text === 'Export Excel') {
        setIsTyping(true);
        await new Promise(r => setTimeout(r, 400));
        setIsTyping(false);
        try {
          await executeAction('export_excel', {});
          addAssistantMsg('✅ Excel file downloaded!', ['Export PDF', 'Finance Stats', 'Do something else']);
        } catch (err) {
          addAssistantMsg(`❌ Export failed: ${err?.message}`, ['Try again']);
        }
        return;
      }
      if (text === 'Export PDF') {
        setIsTyping(true);
        await new Promise(r => setTimeout(r, 400));
        setIsTyping(false);
        try {
          await executeAction('export_pdf', {});
          addAssistantMsg('✅ PDF report downloaded!', ['Export Excel', 'Finance Stats', 'Do something else']);
        } catch (err) {
          addAssistantMsg(`❌ PDF export failed: ${err?.message}`, ['Try again']);
        }
        return;
      }
      if (text === 'Finance Stats') {
        setIsTyping(true);
        await new Promise(r => setTimeout(r, 500));
        setIsTyping(false);
        try {
          const stats = await executeAction('finance_stats', {});
          addAssistantMsg(formatFinanceStats(stats), ['Pending Fees', 'Recent Payments', 'Export Excel', 'Find Project', 'Do something else']);
        } catch (err) {
          addAssistantMsg(`❌ Could not fetch stats: ${err?.message}`, ['Try again']);
        }
        return;
      }
      if (text === 'Pending Fees') {
        setIsTyping(true);
        await new Promise(r => setTimeout(r, 500));
        setIsTyping(false);
        try {
          const projects = await executeAction('pending_fees', {});
          addAssistantMsg(formatPendingProjects(projects), ['Finance Stats', 'Recent Payments', 'Find Project', 'Do something else']);
        } catch (err) {
          addAssistantMsg(`❌ ${err?.message}`, ['Try again']);
        }
        return;
      }
      if (text === 'Recent Payments') {
        setIsTyping(true);
        await new Promise(r => setTimeout(r, 500));
        setIsTyping(false);
        try {
          const payments = await executeAction('recent_payments', {});
          addAssistantMsg(formatRecentPayments(payments), ['Finance Stats', 'Pending Fees', 'Find Project', 'Do something else']);
        } catch (err) {
          addAssistantMsg(`❌ ${err?.message}`, ['Try again']);
        }
        return;
      }
      if (text === 'Top Projects') {
        setIsTyping(true);
        await new Promise(r => setTimeout(r, 500));
        setIsTyping(false);
        try {
          const projects = await executeAction('top_projects', {});
          addAssistantMsg(formatTopProjects(projects), ['Finance Stats', 'Pending Fees', 'Find Project', 'Do something else']);
        } catch (err) {
          addAssistantMsg(`❌ ${err?.message}`, ['Try again']);
        }
        return;
      }
      if (text === 'Find Project') {
        setIntent(INTENTS.FIND_PROJECT);
        setStage(STAGE.COLLECTING);
        setCurrentField('projectQuery');
        addAssistantMsg("Which project are you looking for? Enter a name, number or keyword.");
        return;
      }

      // Map quick-reply shortcuts to natural language commands
      const shortcuts = {
        'Add Client': 'add client',
        'Add Associate': 'add associate',
        'Schedule Meeting': 'schedule a meeting',
        'Add Note': 'add a note',
        'Find Client': 'find client',
        'Find Associate': 'find associate',
      };
      const effectiveText = shortcuts[text] || text;

      // Navigation intent
      const navPath = getNavigationPath(effectiveText);
      if (
        navPath &&
        /\b(go\s*to|open|navigate|take\s*me|show\s*me)\b/i.test(effectiveText)
      ) {
        addAssistantMsg(`Navigating to **${navPath}**…`);
        setTimeout(() => navigate(navPath), 600);
        return;
      }

      // Detect intent
      const foundIntent = detectIntent(effectiveText);
      if (!foundIntent) {
        // Smart fallback: suggest closest matching capabilities
        const lower = effectiveText.toLowerCase();
        const suggestions = [];
        if (/client|customer/i.test(lower)) suggestions.push('Add Client', 'Find Client');
        if (/associate|partner/i.test(lower)) suggestions.push('Add Associate', 'Find Associate');
        if (/project|TRI/i.test(lower)) suggestions.push('Find Project', 'List Projects');
        if (/finance|fee|payment|profit|expense/i.test(lower)) suggestions.push('Finance Stats', 'Pending Fees', 'Recent Payments');
        if (/meeting|call|schedule/i.test(lower)) suggestions.push('Schedule Meeting');
        if (/note|reminder/i.test(lower)) suggestions.push('Add Note');
        if (/export|download|pdf|excel/i.test(lower)) suggestions.push('Export Excel', 'Export PDF');
        const fallbackOptions = suggestions.length > 0
          ? suggestions.slice(0, 4)
          : ['Finance Stats', 'Find Project', 'Add Client', 'Help'];
        addAssistantMsg(
          `I'm not sure I understood that. Did you mean one of these?`,
          fallbackOptions
        );
        return;
      }

      // ── Help / Navigate ──────────────────────────────────
      if (foundIntent.action === 'help') {
        addAssistantMsg(HELP_TEXT, ['Add Client', 'Finance Stats', 'Find Project', 'Export Excel']);
        return;
      }
      if (foundIntent.action === 'navigate') {
        if (!navPath) {
          addAssistantMsg('Where would you like to go?', [
            'Home', 'Clients', 'Associates', 'Projects', 'Finance', 'Analytics', 'Settings',
          ]);
          setStage(STAGE.COLLECTING);
          setIntent({ action: 'navigate_dest' });
        }
        return;
      }

      // ── Immediate intents (no collection needed) ─────────
      if (foundIntent.isImmediate) {
        // Calculator is handled fully inline — no API call
        if (foundIntent.action === 'calculate') {
          const m = effectiveText.match(/(\d+(?:\.\d+)?)\s*%\s*of\s+([\d₹,.\s]+(?:lakh|lac|crore|cr\b|k\b)?)/i);
          if (m) {
            const pct = parseFloat(m[1]);
            const base = parseAmount(m[2].trim());
            if (!isNaN(pct) && base != null) {
              const result = (pct / 100) * base;
              addAssistantMsg(
                `🧮 **${pct}% of ${fmtINR(base)} = ${fmtINR(result)}**`,
                ['Finance Stats', 'Do something else']
              );
              return;
            }
          }
          addAssistantMsg(
            'Please provide the calculation in the format:\n**"15% of 5 lakhs"** or **"10% of ₹50,000"**'
          );
          return;
        }

        setIsTyping(true);
        await new Promise(r => setTimeout(r, 500));
        setIsTyping(false);
        try {
          if (foundIntent.action === 'finance_stats') {
            const stats = await executeAction('finance_stats', {});
            addAssistantMsg(formatFinanceStats(stats), ['Pending Fees', 'Recent Payments', 'Export Excel', 'Find Project', 'Do something else']);
          } else if (foundIntent.action === 'list_clients') {
            const clients = await executeAction('list_clients', {});
            addAssistantMsg(formatClientList(clients), ['Add Client', 'Find Client', 'Do something else']);
          } else if (foundIntent.action === 'list_associates') {
            const associates = await executeAction('list_associates', {});
            addAssistantMsg(formatAssociateList(associates), ['Add Associate', 'Find Associate', 'Do something else']);
          } else if (foundIntent.action === 'list_projects') {
            const projects = await executeAction('list_projects', {});
            addAssistantMsg(formatProjectList(projects), ['Pending Fees', 'Top Projects', 'Find Project', 'Do something else']);
          } else if (foundIntent.action === 'pending_fees') {
            const projects = await executeAction('pending_fees', {});
            addAssistantMsg(formatPendingProjects(projects), ['Finance Stats', 'Recent Payments', 'Find Project', 'Do something else']);
          } else if (foundIntent.action === 'top_projects') {
            const projects = await executeAction('top_projects', {});
            addAssistantMsg(formatTopProjects(projects), ['Finance Stats', 'Pending Fees', 'Find Project', 'Do something else']);
          } else if (foundIntent.action === 'recent_payments') {
            const payments = await executeAction('recent_payments', {});
            addAssistantMsg(formatRecentPayments(payments), ['Finance Stats', 'Pending Fees', 'Find Project', 'Do something else']);
          } else if (foundIntent.action === 'associate_payment_status') {
            const statuses = await executeAction('associate_payment_status', {});
            addAssistantMsg(formatAssociatePaymentStatus(statuses), ['Finance Stats', 'Pending Fees', 'Do something else']);
          } else if (foundIntent.action === 'fy_summary') {
            const { stats, projects } = await executeAction('fy_summary', {});
            addAssistantMsg(formatFySummary(stats, projects), ['Finance Stats', 'Pending Fees', 'Recent Payments', 'Do something else']);
          } else if (foundIntent.action === 'export_excel') {
            await executeAction('export_excel', {});
            addAssistantMsg('✅ **Excel file downloaded!** All projects exported.', ['Export PDF', 'Finance Stats', 'Do something else']);
          } else if (foundIntent.action === 'export_pdf') {
            await executeAction('export_pdf', {});
            addAssistantMsg('✅ **PDF report downloaded!**', ['Export Excel', 'Finance Stats', 'Do something else']);
          } else if (foundIntent.action === 'project_detail' && foundIntent.needsProject) {
            // handled below via needsProject
          }
        } catch (err) {
          addAssistantMsg(`❌ ${err?.response?.data?.message || err.message}`, ['Try again']);
        }
        if (!foundIntent.needsProject) return;
      }

      // ── Project search intent ─────────────────────────────
      if (foundIntent.action === 'find_project') {
        const preQuery = extractProjectQuery(effectiveText) || '';
        setIntent(foundIntent);
        if (preQuery) {
          setIsTyping(true);
          await new Promise(r => setTimeout(r, 500));
          setIsTyping(false);
          try {
            const results = await executeAction('find_project', { projectQuery: preQuery });
            const arr = Array.isArray(results) ? results : [];
            if (arr.length === 0) {
              addAssistantMsg(`No projects found matching **"${preQuery}"**. Try a different name or number.`, ['Do something else']);
            } else if (arr.length === 1) {
              const p = arr[0];
              setContextProject({ _id: p._id, projectName: p.projectName, projectNumber: p.projectNumber });
              addAssistantMsg(formatProjectSummary(p), ['Add Payment', 'View Payments', 'Update Expenses', 'Export Excel']);
            } else {
              const list = arr.slice(0, 5).map((p, i) => `  ${i + 1}. **${p.projectNumber}** — ${p.projectName} (${p.status || '—'})`).join('\n');
              setProjectChoices(arr.slice(0, 5));
              setPendingIntentAfterProject(foundIntent);
              setPendingCollected({});
              setStage(STAGE.CHOOSING_PROJECT);
              addAssistantMsg(`Found **${arr.length}** matching projects. Pick one:\n\n${list}`, arr.slice(0, 5).map((_, i) => String(i + 1)));
            }
          } catch (err) {
            addAssistantMsg(`❌ Search failed: ${err?.message}`, ['Try again']);
          }
        } else {
          setStage(STAGE.COLLECTING);
          setCurrentField('projectQuery');
          addAssistantMsg("Which project are you looking for? Enter a name, number or keyword.");
        }
        return;
      }

      // ── needsProject intents (payments, expense %, yearly) ─
      if (foundIntent.needsProject) {
        setIntent(foundIntent);
        // Pre-extract entity values from the message
        const preEntities = extractEntities(effectiveText);

        // If we already have a contextProject, use it directly
        if (contextProject) {
          setCollected(preEntities);
          if (foundIntent.action === 'view_project_payments' || foundIntent.action === 'project_detail') {
            // Immediate: show payments/detail
            setIsTyping(true);
            await new Promise(r => setTimeout(r, 500));
            setIsTyping(false);
            try {
              const proj = await executeAction('view_project_payments', {}, { projectId: contextProject._id });
              if (foundIntent.action === 'view_project_payments') {
                addAssistantMsg(formatPaymentList(contextProject.projectName, proj.payments || []),
                  ['Add Payment', 'Update Expenses', 'Do something else']);
              } else {
                addAssistantMsg(formatProjectSummary(proj),
                  ['Add Payment', 'View Payments', 'Update Expenses', 'Do something else']);
              }
            } catch (err) {
              addAssistantMsg(`❌ ${err?.message}`, ['Try again']);
            }
            return;
          }
          // Else: collect fields
          const remaining = foundIntent.fields.filter(f => preEntities[f] == null);
          if (remaining.length === 0) {
            goToConfirm(foundIntent, preEntities, { projectId: contextProject._id, projectName: contextProject.projectName });
          } else {
            askNextField(remaining, preEntities, foundIntent);
          }
          return;
        }

        // Try to extract project query from message
        const projQuery = extractProjectQuery(effectiveText);
        if (projQuery) {
          setIsTyping(true);
          await new Promise(r => setTimeout(r, 500));
          setIsTyping(false);
          try {
            const results = await executeAction('find_project', { projectQuery: projQuery });
            const arr = Array.isArray(results) ? results : [];
            if (arr.length === 0) {
              addAssistantMsg(`No project found matching **"${projQuery}"**.\nWhich project is this for?`, []);
              setStage(STAGE.COLLECTING);
              setCurrentField('projectQuery');
              setPendingIntentAfterProject(foundIntent);
              setPendingCollected(preEntities);
            } else if (arr.length === 1) {
              const p = arr[0];
              const ctx = { _id: p._id, projectName: p.projectName, projectNumber: p.projectNumber };
              setContextProject(ctx);
              if (foundIntent.action === 'view_project_payments') {
                addAssistantMsg(formatPaymentList(p.projectName, p.payments || []),
                  ['Add Payment', 'Update Expenses', 'Do something else']);
              } else {
                const remaining = foundIntent.fields.filter(f => preEntities[f] == null);
                setCollected(preEntities);
                if (remaining.length === 0) {
                  goToConfirm(foundIntent, preEntities, { projectId: p._id, projectName: p.projectName });
                } else {
                  addAssistantMsg(`✅ Project identified: **${p.projectNumber}** — ${p.projectName}`);
                  await new Promise(r => setTimeout(r, 300));
                  askNextField(remaining, preEntities, foundIntent);
                }
              }
            } else {
              const list = arr.slice(0, 5).map((p, i) => `  ${i + 1}. **${p.projectNumber}** — ${p.projectName} (${p.status || '—'})`).join('\n');
              setProjectChoices(arr.slice(0, 5));
              setPendingIntentAfterProject(foundIntent);
              setPendingCollected(preEntities);
              setStage(STAGE.CHOOSING_PROJECT);
              addAssistantMsg(`Found **${arr.length}** projects. Pick one:\n\n${list}`, arr.slice(0, 5).map((_, i) => String(i + 1)));
            }
          } catch (err) {
            addAssistantMsg(`❌ Search failed: ${err?.message}`, ['Try again']);
          }
        } else {
          // Ask for project name
          setPendingIntentAfterProject(foundIntent);
          setPendingCollected(preEntities);
          setStage(STAGE.COLLECTING);
          setCurrentField('projectQuery');
          addAssistantMsg(`Which project is this for? Enter a name, number, or keyword.`);
        }
        return;
      }

      // ── Search intent (client/associate) ──────────────────
      if (foundIntent.isSearch) {
        const queryMatch = effectiveText.match(
          /(?:find|search|look\s*up|show|get|list)\s+(?:client|associate)s?\s*(.*)/i
        );
        const preQuery = queryMatch ? queryMatch[1].trim() : '';
        setIntent(foundIntent);
        if (preQuery) {
          try {
            const results = await executeAction(foundIntent.action, { query: preQuery });
            const type = foundIntent.action === 'find_client' ? 'client' : 'associate';
            addAssistantMsg(formatSearchResults(results, type), ['Search again', 'Do something else']);
          } catch {
            addAssistantMsg('Search failed. Please try again.', ['Try again']);
          }
        } else {
          setStage(STAGE.COLLECTING);
          setCurrentField('query');
          const type = foundIntent.action === 'find_client' ? 'client' : 'associate';
          addAssistantMsg(`What's the name, email, or phone of the ${type} you're looking for?`);
        }
        return;
      }

      // ── Create intent ─────────────────────────────────────
      const entities = extractEntities(effectiveText);
      setIntent(foundIntent);
      setCollected(entities);

      const allFields = foundIntent.fields;
      const remaining = allFields.filter(f => entities[f] == null);

      if (remaining.length === 0) {
        goToConfirm(foundIntent, entities);
      } else {
        if (Object.keys(entities).length > 0) {
          const prefilled = Object.keys(entities)
            .map(k => `**${FIELD_DEFS[k]?.label || k}:** ${entities[k]}`)
            .join(', ');
          addAssistantMsg(`Got it — I've noted ${prefilled}. Let me gather a few more details.`);
          await new Promise(r => setTimeout(r, 300));
        }
        askNextField(remaining, entities, foundIntent);
      }
      return;
    }

    // ── CHOOSING_PROJECT stage ───────────────────────────────
    if (stage === STAGE.CHOOSING_PROJECT) {
      const num = parseInt(text, 10);
      if (!isNaN(num) && num >= 1 && num <= projectChoices.length) {
        const chosen = projectChoices[num - 1];
        const ctx = { _id: chosen._id, projectName: chosen.projectName, projectNumber: chosen.projectNumber };
        setContextProject(ctx);
        setStage(STAGE.IDLE);

        // Now resume the pending intent with the chosen project
        const pendingIntent = pendingIntentAfterProject;
        const preEntities = pendingCollected || {};
        setProjectChoices([]);
        setPendingIntentAfterProject(null);
        setPendingCollected({});

        if (!pendingIntent || pendingIntent.action === 'find_project') {
          // Just showing project detail
          setIsTyping(true);
          await new Promise(r => setTimeout(r, 400));
          setIsTyping(false);
          try {
            const proj = await executeAction('view_project_payments', {}, { projectId: chosen._id });
            addAssistantMsg(formatProjectSummary(proj), ['Add Payment', 'View Payments', 'Update Expenses', 'Export Excel']);
          } catch (err) {
            addAssistantMsg(`❌ ${err?.message}`, ['Try again']);
          }
          return;
        }

        if (pendingIntent.action === 'view_project_payments') {
          setIsTyping(true);
          await new Promise(r => setTimeout(r, 400));
          setIsTyping(false);
          try {
            const proj = await executeAction('view_project_payments', {}, { projectId: chosen._id });
            addAssistantMsg(formatPaymentList(chosen.projectName, proj.payments || []),
              ['Add Payment', 'Update Expenses', 'Do something else']);
          } catch (err) {
            addAssistantMsg(`❌ ${err?.message}`, ['Try again']);
          }
          return;
        }

        // For other needsProject intents, collect remaining fields
        setIntent(pendingIntent);
        setCollected(preEntities);
        addAssistantMsg(`✅ Project: **${chosen.projectNumber}** — ${chosen.projectName}`);
        await new Promise(r => setTimeout(r, 300));
        const remaining = pendingIntent.fields.filter(f => preEntities[f] == null);
        if (remaining.length === 0) {
          goToConfirm(pendingIntent, preEntities, { projectId: chosen._id, projectName: chosen.projectName });
        } else {
          askNextField(remaining, preEntities, pendingIntent);
        }
        return;
      }

      // User typed something other than a number — retry search
      setIsTyping(true);
      await new Promise(r => setTimeout(r, 400));
      setIsTyping(false);
      try {
        const results = await executeAction('find_project', { projectQuery: text });
        const arr = Array.isArray(results) ? results : [];
        if (arr.length === 0) {
          addAssistantMsg(`No projects found for **"${text}"**. Please try again.`);
        } else if (arr.length === 1) {
          const p = arr[0];
          const ctx = { _id: p._id, projectName: p.projectName, projectNumber: p.projectNumber };
          setContextProject(ctx);
          setStage(STAGE.IDLE);
          setProjectChoices([]);
          addAssistantMsg(formatProjectSummary(p), ['Add Payment', 'View Payments', 'Update Expenses', 'Export Excel']);
        } else {
          const list = arr.slice(0, 5).map((p, i) => `  ${i + 1}. **${p.projectNumber}** — ${p.projectName}`).join('\n');
          setProjectChoices(arr.slice(0, 5));
          addAssistantMsg(`Found ${arr.length} projects:\n\n${list}`, arr.slice(0, 5).map((_, i) => String(i + 1)));
        }
      } catch (err) {
        addAssistantMsg(`❌ Search failed: ${err?.message}`, ['Try again']);
        setStage(STAGE.IDLE);
      }
      return;
    }

    // ── COLLECTING: accept field value ───────────────────────
    if (stage === STAGE.COLLECTING) {
      // Handle deferred navigation destination
      if (intent?.action === 'navigate_dest') {
        const path = getNavigationPath(text);
        if (path) {
          addAssistantMsg(`Navigating to **${path}**…`);
          setTimeout(() => navigate(path), 600);
          resetConversation();
        } else {
          addAssistantMsg(
            "I didn't recognise that page. Try one of:",
            ['Home', 'Clients', 'Associates', 'Projects', 'Finance', 'Analytics', 'Settings']
          );
        }
        return;
      }

      // Project search field (for needsProject intents)
      if (currentField === 'projectQuery') {
        setIsTyping(true);
        await new Promise(r => setTimeout(r, 400));
        setIsTyping(false);
        try {
          const results = await executeAction('find_project', { projectQuery: text });
          const arr = Array.isArray(results) ? results : [];
          if (arr.length === 0) {
            addAssistantMsg(`No projects found for **"${text}"**. Please try a different name or code.`);
          } else if (arr.length === 1) {
            const p = arr[0];
            const ctx = { _id: p._id, projectName: p.projectName, projectNumber: p.projectNumber };
            setContextProject(ctx);
            // Now: was this a find-project intent or a project-dependent intent?
            const resumeIntent = pendingIntentAfterProject || intent;
            if (!resumeIntent || resumeIntent.action === 'find_project') {
              setStage(STAGE.IDLE);
              addAssistantMsg(formatProjectSummary(p), ['Add Payment', 'View Payments', 'Update Expenses', 'Export Excel']);
            } else if (resumeIntent.action === 'view_project_payments') {
              setStage(STAGE.IDLE);
              addAssistantMsg(formatPaymentList(p.projectName, p.payments || []),
                ['Add Payment', 'Update Expenses', 'Do something else']);
            } else {
              const preEntities = pendingCollected || {};
              setIntent(resumeIntent);
              setCollected(preEntities);
              setPendingIntentAfterProject(null);
              setPendingCollected({});
              addAssistantMsg(`✅ Project: **${p.projectNumber}** — ${p.projectName}`);
              await new Promise(r => setTimeout(r, 300));
              const remaining = resumeIntent.fields.filter(f => preEntities[f] == null);
              if (remaining.length === 0) {
                goToConfirm(resumeIntent, preEntities, { projectId: p._id, projectName: p.projectName });
              } else {
                askNextField(remaining, preEntities, resumeIntent);
              }
            }
          } else {
            const list = arr.slice(0, 5).map((p, i) => `  ${i + 1}. **${p.projectNumber}** — ${p.projectName}`).join('\n');
            setProjectChoices(arr.slice(0, 5));
            setStage(STAGE.CHOOSING_PROJECT);
            addAssistantMsg(`Found ${arr.length} projects. Pick one:\n\n${list}`, arr.slice(0, 5).map((_, i) => String(i + 1)));
          }
        } catch (err) {
          addAssistantMsg(`❌ Search failed: ${err?.message}`, ['Try again']);
        }
        return;
      }

      // Regular search field (client/associate)
      if (currentField === 'query') {
        try {
          const results = await executeAction(intent.action, { query: text });
          const type = intent.action === 'find_client' ? 'client' : 'associate';
          addAssistantMsg(formatSearchResults(results, type), ['Search again', 'Do something else']);
          resetConversation();
        } catch {
          addAssistantMsg('Search failed. Please try again.', ['Try again']);
        }
        return;
      }

      // Handle skip
      if (isSkip(text) && FIELD_DEFS[currentField]?.skippable) {
        const useDefault = FIELD_DEFS[currentField]?.defaultValue;
        const newCollected = {
          ...collected,
          ...(useDefault != null ? { [currentField]: useDefault } : {}),
        };
        setCollected(newCollected);
        askNextField(fieldQueue, newCollected, intent);
        return;
      }

      // Datetime field: parse natural language
      let value = text;
      if (FIELD_DEFS[currentField]?.type === 'datetime') {
        const parsed = parseNaturalDate(text);
        if (!parsed) {
          addAssistantMsg(
            "I couldn't understand that date. Try something like **\"tomorrow at 3pm\"**, **\"Monday 10am\"**, or **\"Mar 5 2026 2pm\"**."
          );
          return;
        }
        value = parsed.toISOString();
        setCollected(prev => ({ ...prev, _dateFormatted: formatDateTime(parsed) }));
      }

      // Amount field: parse human amounts like "50k", "1.5L"
      if (currentField === 'paymentAmount' || currentField === 'yearlyAmount') {
        const parsed = parseAmount(text);
        if (isNaN(parsed) || parsed <= 0) {
          addAssistantMsg('Please enter a valid amount (e.g. **50000**, **50k**, **1.5L**).');
          return;
        }
        value = String(parsed);
      }

      // Number field
      if (FIELD_DEFS[currentField]?.type === 'number') {
        const n = Number(text);
        if (isNaN(n)) {
          addAssistantMsg('Please enter a valid number.');
          return;
        }
        value = n;
      }

      // Validate
      const validationError = validateField(currentField, value);
      if (validationError) {
        addAssistantMsg(`⚠️ ${validationError}`);
        return;
      }

      // Store and continue
      const newCollected = { ...collected, [currentField]: value };
      setCollected(newCollected);
      askNextField(fieldQueue, newCollected, intent);
      return;
    }

    // ── CONFIRMING: yes/no ────────────────────────────────────
    if (stage === STAGE.CONFIRMING) {
      const yes = /^(yes|yeah|yep|y|confirm|go ahead|sure|ok|proceed|yes,?\s*confirm!?)/i.test(text);
      const no = /^(no|nope|cancel|stop|abort|don't|do not|nevermind|never mind)/i.test(text);

      if (no) {
        addAssistantMsg('Cancelled. Anything else I can help with?', [
          'Add Client', 'Finance Stats', 'Help',
        ]);
        resetConversation();
        return;
      }
      if (yes) {
        const ctx = contextProject
          ? { projectId: contextProject._id, projectName: contextProject.projectName }
          : null;
        await runAction(intent, collected, ctx);
        return;
      }
      addAssistantMsg('Please confirm with **Yes** or **No**.', ['Yes, confirm!', 'Cancel']);
      return;
    }

    // ── EXECUTING ─────────────────────────────────────────────
    if (stage === STAGE.EXECUTING) {
      addAssistantMsg("I'm still working on that — please wait a moment…");
      return;
    }

    // ── Post-execution quick replies ──────────────────────────
    if (text === 'Search again') {
      if (intent?.isSearch) {
        setStage(STAGE.COLLECTING);
        setCurrentField('query');
        const type = intent.action === 'find_client' ? 'client' : 'associate';
        addAssistantMsg(`What's the name, email, or phone of the ${type} you're looking for?`);
      }
      return;
    }
    if (text === 'Try again') {
      resetConversation();
      addAssistantMsg("Let's try again. What would you like to do?", [
        'Add Client', 'Finance Stats', 'Find Project', 'Help',
      ]);
      return;
    }
    if (text === 'Do something else') {
      resetConversation();
      addAssistantMsg("Sure! What would you like to do?", [
        'Add Client', 'Add Associate', 'Finance Stats', 'Find Project',
      ]);
      return;
    }
  }

  // ── Submit handler ────────────────────────────────────────
  function handleSubmit(e) {
    e?.preventDefault();
    const text = inputValue.trim();
    if (!text || isExecuting) return;
    setInputValue('');
    stopVoice();
    processInput(text);
  }

  // ── Keep processInput ref up to date ─────────────────────
  processInputRef.current = processInput;

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  // ── Toggle panel ──────────────────────────────────────────
  function togglePanel() {
    setIsOpen(v => !v);
  }

  function handleClose() {
    setIsOpen(false);
  }

  function handleClearChat() {
    setMessages([]);
    resetConversation();
    setHasNewBadge(false);
    // Re-show greeting
    setTimeout(() => {
        addAssistantMsg(
          "Chat cleared! What would you like to do?",
          ['Finance Stats', 'Pending Fees', 'Find Project', 'Help']
        );
      }, 50);
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="aia-root" id={uid}>
      {/* Floating action button */}
      <button
        className={`aia-fab ${isOpen ? 'aia-fab--open' : ''}`}
        onClick={togglePanel}
        aria-label="AI Assistant"
        title="AI Assistant"
      >
        {isOpen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
          </svg>
        )}
        {hasNewBadge && !isOpen && <span className="aia-fab-badge" />}
      </button>

      {/* Chat panel */}
      <div className={`aia-panel ${isOpen ? 'aia-panel--open' : ''}`} role="dialog" aria-label="AI Assistant">
        {/* Header */}
        <div className="aia-panel-header">
          <div className="aia-header-info">
            <div className="aia-header-icon">✨</div>
            <div>
              <div className="aia-header-title">CRM Assistant</div>
              <div className="aia-header-sub">AI-powered · always ready</div>
            </div>
          </div>
          <div className="aia-header-actions">
            <button className="aia-icon-btn" onClick={handleClearChat} title="Clear chat">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
              </svg>
            </button>
            <button className="aia-icon-btn" onClick={handleClose} title="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Context project banner */}
        {contextProject && (
          <div className="aia-ctx-banner">
            <span>📁 Working on: <strong>{contextProject.projectNumber}</strong> — {contextProject.projectName}</span>
            <button className="aia-ctx-clear" onClick={() => setContextProject(null)} title="Clear project context">✕</button>
          </div>
        )}

        {/* Messages */}
        <div className="aia-messages">
          {messages.map(m => (
            <React.Fragment key={m.id}>
              <Message m={m} />
              {/* Show quick replies only after the last assistant message */}
              {m.role === 'assistant' &&
                m.id === messages.filter(x => x.role === 'assistant').slice(-1)[0]?.id &&
                m.options?.length > 0 &&
                stage !== STAGE.EXECUTING && (
                  <QuickReplies
                    options={m.options}
                    onPick={processInput}
                    disabled={isExecuting}
                  />
                )}
            </React.Fragment>
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form className="aia-input-row" onSubmit={handleSubmit}>
          {/* Voice waveform indicator — visible while listening */}
          {isListening && (
            <div className="aia-voice-indicator" aria-hidden="true">
              <span /><span /><span /><span /><span />
            </div>
          )}

          <div className="aia-input-wrap">
            <input
              ref={inputRef}
              className={`aia-input${isListening ? ' aia-input--listening' : ''}`}
              value={isListening ? (interimTranscript || inputValue) : inputValue}
              onChange={e => !isListening && setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isListening
                  ? '🎤 Listening… speak now'
                  : stage === STAGE.IDLE
                  ? 'Ask me or tap 🎤 to speak…'
                  : stage === STAGE.COLLECTING
                  ? 'Type your answer or speak…'
                  : stage === STAGE.CONFIRMING
                  ? 'Yes or No?'
                  : 'Working…'
              }
              disabled={isExecuting}
              autoComplete="off"
              spellCheck="false"
              readOnly={isListening}
            />
          </div>

          {/* Mic button */}
          {isSpeechSupported && (
            <button
              type="button"
              className={`aia-mic-btn${isListening ? ' aia-mic-btn--active' : ''}`}
              onClick={startVoice}
              disabled={isExecuting}
              aria-label={isListening ? 'Stop listening' : 'Start voice input'}
              title={isListening ? 'Stop (Esc)' : 'Voice input'}
            >
              {isListening ? (
                /* Stop icon when recording */
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                /* Mic icon when idle */
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
              )}
            </button>
          )}

          <button
            type="submit"
            className="aia-send-btn"
            disabled={(!inputValue.trim() && !interimTranscript) || isExecuting || isListening}
            aria-label="Send"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </form>

        {/* Voice error chip */}
        {voiceError && (
          <div className="aia-voice-error" role="alert">
            {voiceError}
            <button
              className="aia-voice-error-close"
              onClick={() => setVoiceError('')}
              aria-label="Dismiss"
            >✕</button>
          </div>
        )}
      </div>
    </div>
  );
}
