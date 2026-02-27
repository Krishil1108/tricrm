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
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  INTENTS,
  FIELD_DEFS,
  detectIntent,
  extractEntities,
  parseNaturalDate,
  formatDateTime,
  getNavigationPath,
  isSkip,
  validateField,
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

**Add Records**
• "Add client named Ravi Sharma"
• "Create associate named Priya, email priya@ex.com"
• "Schedule a meeting about Design Review"
• "Add a note titled Follow-up"

**Search**
• "Find client Ravi"
• "Search associate Priya"

**Navigate**
• "Go to Projects"
• "Open Finance"
• "Take me to Analytics"

Just type naturally — I'll guide you through the rest!`;

// ─── Stage constants ────────────────────────────────────────
const STAGE = {
  IDLE: 'idle',
  COLLECTING: 'collecting',
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

  // ── Intent / field collection state ──────────────────────
  const [stage, setStage] = useState(STAGE.IDLE);
  const [intent, setIntent] = useState(null);
  const [collected, setCollected] = useState({});
  const [fieldQueue, setFieldQueue] = useState([]);
  const [currentField, setCurrentField] = useState(null);
  const [currentOptions, setCurrentOptions] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);

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
        addAssistantMsg(
          "Hi! I'm your CRM assistant. 👋\n\nI can **add clients, associates, meetings, notes**, **search records**, and **navigate** to any page.\n\nWhat would you like to do?",
          ['Add Client', 'Schedule Meeting', 'Add Note', 'Help']
        );
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

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
  function goToConfirm(intentDef, collectedData) {
    setStage(STAGE.CONFIRMING);
    setCurrentField(null);
    const text = buildConfirmText(intentDef, collectedData);
    addAssistantMsg(text, ['Yes, create it!', 'Cancel']);
  }

  // ── Execute the confirmed action ──────────────────────────
  async function runAction(intentDef, collectedData) {
    setStage(STAGE.EXECUTING);
    setIsExecuting(true);
    setCurrentOptions([]);
    setIsTyping(true);

    try {
      const result = await executeAction(intentDef.action, collectedData);
      setIsTyping(false);

      const successText = intentDef.successMessage(collectedData);
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
      // Help shortcut / direct quick-reply
      if (/^help$/i.test(text) || text === 'Help') {
        addAssistantMsg(HELP_TEXT, ['Add Client', 'Schedule Meeting', 'Add Note', 'Find Client']);
        return;
      }
      if (text === 'Do something else') {
        addAssistantMsg("Sure! What would you like to do?", ['Add Client', 'Schedule Meeting', 'Add Note', 'Help']);
        return;
      }
      if (text === 'Close') {
        setIsOpen(false);
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
        addAssistantMsg(
          "I'm not sure what you mean. Try saying something like **\"Add client named Ravi\"** or type **Help** to see what I can do.",
          ['Add Client', 'Schedule Meeting', 'Help']
        );
        return;
      }

      // Immediate intents (help, navigate with no nav detected)
      if (foundIntent.action === 'help') {
        addAssistantMsg(HELP_TEXT, ['Add Client', 'Schedule Meeting', 'Add Note', 'Find Client']);
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

      // Search intent
      if (foundIntent.isSearch) {
        // Extract query from text by removing the intent keywords
        const queryMatch = effectiveText.match(
          /(?:find|search|look\s*up|show|get|list)\s+(client|associate)s?\s*(.*)/i
        );
        const preQuery = queryMatch ? queryMatch[2].trim() : '';
        setIntent(foundIntent);
        if (preQuery) {
          // Execute search directly
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

      // Create intent — extract known entities from the initial message
      const entities = extractEntities(effectiveText);
      setIntent(foundIntent);
      setCollected(entities);

      // Ask for unknown required fields first, then optional
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
          // Short pause before first question
          await new Promise(r => setTimeout(r, 300));
        }
        askNextField(remaining, entities, foundIntent);
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

      // Search field
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
        // Store formatted version for display
        setCollected(prev => ({ ...prev, _dateFormatted: formatDateTime(parsed) }));
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
      const yes = /^(yes|yeah|yep|y|confirm|go ahead|sure|ok|proceed|create it!?|yes,?\s*create\s*it!?)/i.test(text);
      const no = /^(no|nope|cancel|stop|abort|don't|do not|nevermind|never mind)/i.test(text);

      if (no) {
        addAssistantMsg('Cancelled. Anything else I can help with?', [
          'Add Client',
          'Schedule Meeting',
          'Help',
        ]);
        resetConversation();
        return;
      }
      if (yes) {
        await runAction(intent, collected);
        return;
      }
      addAssistantMsg('Please confirm with **Yes** or **No**.', ['Yes, create it!', 'Cancel']);
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
        'Add Client',
        'Schedule Meeting',
        'Help',
      ]);
      return;
    }
    if (text === 'Do something else') {
      resetConversation();
      addAssistantMsg("Sure! What would you like to do?", [
        'Add Client',
        'Add Associate',
        'Schedule Meeting',
        'Add Note',
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
    processInput(text);
  }

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
        ['Add Client', 'Schedule Meeting', 'Add Note', 'Help']
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
          <input
            ref={inputRef}
            className="aia-input"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              stage === STAGE.IDLE
                ? 'Ask me anything…'
                : stage === STAGE.COLLECTING
                ? 'Type your answer or pick an option…'
                : stage === STAGE.CONFIRMING
                ? 'Yes or No?'
                : 'Working…'
            }
            disabled={isExecuting}
            autoComplete="off"
            spellCheck="false"
          />
          <button
            type="submit"
            className="aia-send-btn"
            disabled={!inputValue.trim() || isExecuting}
            aria-label="Send"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
