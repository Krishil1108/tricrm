// ============================================================
// AI Assistant — Action Handlers
// Calls existing REST APIs to execute confirmed actions.
// ============================================================
import axios from 'axios';
import API_BASE_URL from '../../config/api';

const API = API_BASE_URL;

// Auth header from localStorage (same pattern as all other services)
function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Create Client ──────────────────────────────────────────
export async function createClient(data) {
  const payload = {
    name: data.name,
    email: data.email || undefined,
    phone: data.phone || undefined,
    company: data.company || undefined,
    city: data.city || undefined,
    state: data.state || undefined,
    status: data.status || 'Active',
  };
  const res = await axios.post(`${API}/clients`, payload, {
    headers: authHeader(),
  });
  return res.data;
}

// ── Create Associate ──────────────────────────────────────
export async function createAssociate(data) {
  const payload = {
    name: data.name,
    email: data.email,
    phone: data.phone || undefined,
    company: data.company || undefined,
    city: data.city || undefined,
    state: data.state || undefined,
    status: data.status || 'Active',
  };
  const res = await axios.post(`${API}/associates`, payload, {
    headers: authHeader(),
  });
  return res.data;
}

// ── Create Meeting ──────────────────────────────────────
export async function createMeeting(data) {
  const payload = {
    title: data.title,
    dateTime: data.dateTime,
    type: data.meetingType || 'Meeting',
    priority: data.priority || 'Medium',
    location: data.location || undefined,
    description: data.description || undefined,
    duration: data.duration ? Number(data.duration) : 60,
    status: 'Scheduled',
  };
  const res = await axios.post(`${API}/meetings`, payload, {
    headers: authHeader(),
  });
  return res.data;
}

// ── Create Note ──────────────────────────────────────────
export async function createNote(data) {
  const payload = {
    title: data.noteTitle,
    content: data.noteContent,
    category: data.noteCategory || 'General',
    priority: data.notePriority || 'Medium',
    status: 'Active',
  };
  const res = await axios.post(`${API}/notes`, payload, {
    headers: authHeader(),
  });
  return res.data;
}

// ── Find Clients ──────────────────────────────────────────
export async function findClients(query) {
  const res = await axios.get(`${API}/clients`, {
    headers: authHeader(),
  });
  const all = res.data?.data || res.data || [];
  const q = query.toLowerCase();
  return all.filter(
    c =>
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q) ||
      c.phone?.includes(q)
  );
}

// ── Find Associates ───────────────────────────────────────
export async function findAssociates(query) {
  const res = await axios.get(`${API}/associates`, {
    headers: authHeader(),
  });
  const all = res.data?.data || res.data || [];
  const q = query.toLowerCase();
  return all.filter(
    a =>
      a.name?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q) ||
      a.company?.toLowerCase().includes(q) ||
      a.phone?.includes(q)
  );
}

// ── Find Finance Projects ─────────────────────────────────
export async function findFinanceProjects(query) {
  const res = await axios.get(`${API}/finance/projects`, {
    headers: authHeader(),
    params: { search: query || '' },
  });
  return res.data?.data || res.data || [];
}

// ── Get single project with full payment/expense detail ───
export async function getProjectById(id) {
  const res = await axios.get(`${API}/finance/projects/${id}`, {
    headers: authHeader(),
  });
  return res.data?.data || res.data;
}

// ── Add a payment to a project ────────────────────────────
// Fetches the project, appends the new payment, then PUTs
// back — the backend pre-save hook auto-recalculates totals.
export async function addProjectPayment(projectId, { amount, date, mode, ref }) {
  const projRes = await axios.get(`${API}/finance/projects/${projectId}`, {
    headers: authHeader(),
  });
  const project = projRes.data?.data || projRes.data;
  const existing = Array.isArray(project.payments) ? project.payments : [];
  const updatedPayments = [
    ...existing,
    {
      date: new Date(date).toISOString(),
      mode,
      amount: Number(amount),
      chequeNeftNumber: ref || '',
    },
  ];
  const res = await axios.put(
    `${API}/finance/projects/${projectId}`,
    { payments: updatedPayments },
    { headers: authHeader() }
  );
  return res.data;
}

// ── Update arbitrary project field(s) (expense %, yearly…) ─
export async function updateProject(projectId, fields) {
  const res = await axios.put(
    `${API}/finance/projects/${projectId}`,
    fields,
    { headers: authHeader() }
  );
  return res.data;
}

// ── Finance statistics (totals across all projects) ───────
export async function getFinanceStats() {
  const res = await axios.get(`${API}/finance/stats`, { headers: authHeader() });
  return res.data?.data || res.data;
}

// ── List all clients ──────────────────────────────────────
export async function listAllClients() {
  const res = await axios.get(`${API}/clients`, { headers: authHeader() });
  return res.data?.data || res.data || [];
}

// ── List all associates ───────────────────────────────────
export async function listAllAssociates() {
  const res = await axios.get(`${API}/associates`, { headers: authHeader() });
  return res.data?.data || res.data || [];
}

// ── List all finance projects ─────────────────────────────
export async function listAllProjects() {
  const res = await axios.get(`${API}/finance/projects`, { headers: authHeader() });
  return res.data?.data || res.data || [];
}

// ── Projects with pending fees ────────────────────────────
export async function getPendingProjects() {
  const res = await axios.get(`${API}/finance/projects`, { headers: authHeader() });
  const all = res.data?.data || res.data || [];
  return all
    .filter(p => (p.finalizedFees || 0) - (p.totalReceivedFees || 0) > 0)
    .sort((a, b) =>
      ((b.finalizedFees || 0) - (b.totalReceivedFees || 0)) -
      ((a.finalizedFees || 0) - (a.totalReceivedFees || 0))
    );
}

// ── Top projects by finalized fees ────────────────────────
export async function getTopProjects() {
  const res = await axios.get(`${API}/finance/projects`, { headers: authHeader() });
  const all = res.data?.data || res.data || [];
  return all
    .filter(p => (p.finalizedFees || 0) > 0)
    .sort((a, b) => (b.finalizedFees || 0) - (a.finalizedFees || 0))
    .slice(0, 10);
}

// ── Recent payments across all projects ──────────────────
export async function getRecentPayments() {
  const res = await axios.get(`${API}/finance/projects`, { headers: authHeader() });
  const all = res.data?.data || res.data || [];
  const payments = [];
  for (const p of all) {
    if (Array.isArray(p.payments)) {
      p.payments.forEach(pay => {
        payments.push({
          ...pay,
          projectName: p.projectName,
          projectNumber: p.projectNumber,
        });
      });
    }
  }
  return payments
    .filter(p => p.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);
}

// ── Associate payment status across all projects ──────────
export async function getAssociatePaymentStatus() {
  const res = await axios.get(`${API}/finance/projects`, { headers: authHeader() });
  const all = res.data?.data || res.data || [];
  const map = {};
  for (const p of all) {
    if (p.associateId) {
      const name = p.associateId?.name || p.associateId?.company || 'Unknown';
      if (!map[name]) map[name] = { name, totalOwed: 0, totalPaid: 0, projects: 0 };
      map[name].totalOwed += p.totalAssociateAmount || 0;
      map[name].totalPaid += p.totalAssociatePaid || 0;
      map[name].projects += 1;
    }
  }
  return Object.values(map).sort(
    (a, b) => (b.totalOwed - b.totalPaid) - (a.totalOwed - a.totalPaid)
  );
}

// ── Update finalized fees for a project ──────────────────
export async function updateFinalizedFees(projectId, amount) {
  const res = await axios.put(
    `${API}/finance/projects/${projectId}`,
    { finalizedFees: Number(amount) },
    { headers: authHeader() }
  );
  return res.data;
}

// ── Export all projects as Excel (blob download) ──────────
export async function exportProjectsExcel() {
  const response = await axios.get(`${API}/finance/export/projects`, {
    headers: authHeader(),
    responseType: 'blob',
  });
  const url = URL.createObjectURL(new Blob([response.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = `finance_projects_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Export finance report as PDF (client-side via jsPDF) ──
export async function exportProjectsPDF() {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const res = await axios.get(`${API}/finance/overview`, { headers: authHeader() });
  const raw = res.data?.data || res.data;
  const projects = raw.projects || [];
  const summary = raw.summary || {};

  const doc = new jsPDF({ orientation: 'landscape', format: 'a3' });
  const fmtI = n => (n != null ? '₹' + Number(n).toLocaleString('en-IN') : '₹0');

  // Title
  doc.setFontSize(20);
  doc.setTextColor(37, 99, 235);
  doc.text('Finance Overview Report', 14, 18);
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 25);

  // Summary table
  autoTable(doc, {
    startY: 32,
    head: [['Metric', 'Value']],
    body: [
      ['Total Projects', summary.projectCount ?? projects.length],
      ['Finalized Fees', fmtI(summary.totalFinalizedFees)],
      ['Total Received', fmtI(summary.totalReceivedFees)],
      ['Pending Fees', fmtI(summary.pendingFees ?? ((summary.totalFinalizedFees || 0) - (summary.totalReceivedFees || 0)))],
      ['Total Drawing', fmtI(summary.totalDrawing)],
      ['Total Documents', fmtI(summary.totalDocuments)],
      ['Total Site Visit', fmtI(summary.totalSiteVisit)],
      ['Marketing & Misc', fmtI(summary.totalMarketingMisc ?? summary.totalMarketingAndMisc)],
      ['Office Management', fmtI(summary.totalOfficeManagement)],
      ['Total Expenses', fmtI(summary.totalExpenses)],
      ['Associate Paid', fmtI(summary.totalAssociatePaid)],
      ['Net Profit', fmtI(summary.netProfit)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    tableWidth: 130,
  });

  // Projects breakdown table
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 12,
    head: [[
      '#', 'Project', 'Client', 'Finalized', 'Received', 'Pending',
      'Drawing', 'Docs', 'Site Visit', 'Mktg', 'Office', 'YR 24-25', 'Status',
    ]],
    body: projects.map(p => [
      p.projectNumber,
      p.projectName,
      p.clientId?.name || p.clientId?.company || '—',
      fmtI(p.finalizedFees),
      fmtI(p.totalReceivedFees),
      fmtI((p.finalizedFees || 0) - (p.totalReceivedFees || 0)),
      fmtI(p.drawing),
      fmtI(p.documents),
      fmtI(p.siteVisit),
      fmtI(p.marketingAndMisc),
      fmtI(p.officeManagement),
      fmtI(p.year2024_25),
      p.status,
    ]),
    theme: 'striped',
    headStyles: { fillColor: [30, 64, 175], fontSize: 7 },
    bodyStyles: { fontSize: 7 },
  });

  doc.save(`finance_report_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ── Dispatcher ───────────────────────────────────────────
// Single entry point used by AIAssistant.js
export async function executeAction(action, data, ctx) {
  switch (action) {
    case 'create_client':
      return createClient(data);
    case 'create_associate':
      return createAssociate(data);
    case 'create_meeting':
      return createMeeting(data);
    case 'create_note':
      return createNote(data);
    case 'find_client':
      return findClients(data.query);
    case 'find_associate':
      return findAssociates(data.query);
    // ── Finance ──────────────────────────────────────────
    case 'find_project':
      return findFinanceProjects(data.projectQuery || data.query);
    case 'project_detail':
      return getProjectById(ctx?.projectId);
    case 'view_project_payments':
      return getProjectById(ctx?.projectId);
    case 'add_project_payment':
      return addProjectPayment(ctx.projectId, {
        amount: data.paymentAmount,
        date: data.paymentDate,
        mode: data.paymentMode,
        ref: data.paymentRef,
      });
    case 'update_expense_pct': {
      const catMap = {
        'Drawing': 'drawingPercent',
        'Documents': 'documentsPercent',
        'Site Visit': 'siteVisitPercent',
        'Marketing & Misc': 'marketingAndMiscPercent',
        'Office Management': 'officeManagementPercent',
      };
      const field = catMap[data.expenseCategory];
      if (!field) throw new Error(`Unknown expense category: ${data.expenseCategory}`);
      return updateProject(ctx.projectId, { [field]: Number(data.expensePercent) });
    }
    case 'update_yearly_dist': {
      const { parseAmount } = await import('./intentEngine');
      return updateProject(ctx.projectId, {
        year2024_25: parseAmount(String(data.yearlyAmount)),
      });
    }
    case 'update_finalized_fees': {
      const { parseAmount: pa } = await import('./intentEngine');
      return updateFinalizedFees(ctx.projectId, pa(String(data.finalizedFeesAmount)));
    }
    case 'finance_stats':
      return getFinanceStats();
    case 'list_clients':
      return listAllClients();
    case 'list_associates':
      return listAllAssociates();
    case 'list_projects':
      return listAllProjects();
    case 'pending_fees':
      return getPendingProjects();
    case 'top_projects':
      return getTopProjects();
    case 'recent_payments':
      return getRecentPayments();
    case 'associate_payment_status':
      return getAssociatePaymentStatus();
    case 'fy_summary': {
      const [stats, projects] = await Promise.all([getFinanceStats(), listAllProjects()]);
      return { stats, projects };
    }
    case 'export_excel':
      return exportProjectsExcel();
    case 'export_pdf':
      return exportProjectsPDF();
    case 'calculate':
      return null; // handled inline in AIAssistant.js
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
