import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFileExcel, FaFilePdf, FaSearch, FaTimes, FaFilter, FaEdit, FaExternalLinkAlt, FaEye, FaEyeSlash } from 'react-icons/fa';
import { FiRefreshCw, FiChevronDown, FiChevronRight, FiCreditCard } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import FinanceService from './services/FinanceService';
import { useToast } from './context/ToastContext';
import './FinanceDashboard.css';
import Watermark from './components/Watermark';

// ─── Utility helpers ──────────────────────────────────────────────────────────
const fmt = (v) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(v ?? 0);

const fmtCurrency = (v) => `₹${fmt(v)}`;

const getFYBounds = (fy) => {
  if (!fy || fy === 'all') return [null, null];
  const yr = parseInt(fy.split('-')[0], 10);
  return [
    new Date(`${yr}-04-01T00:00:00Z`),
    new Date(`${yr + 1}-03-31T23:59:59Z`),
  ];
};

const fyReceivedFor = (project, fyStart, fyEnd) => {
  if (!fyStart) return project.totalReceivedFees ?? 0;
  return (project.payments ?? [])
    .filter((p) => {
      const d = new Date(p.date);
      return d >= fyStart && d <= fyEnd;
    })
    .reduce((s, p) => s + (p.amount ?? 0), 0);
};

const fyPaymentsFor = (project, fyStart, fyEnd) => {
  if (!fyStart) return project.payments ?? [];
  return (project.payments ?? []).filter((p) => {
    const d = new Date(p.date);
    return d >= fyStart && d <= fyEnd;
  });
};

// ─── Main Component ───────────────────────────────────────────────────────────
const FinanceDashboard = () => {
  const { showError, showSuccess } = useToast();

  // ── Remote data ──────────────────────────────────────────────────────────
  const [rawData, setRawData]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState(null);

  // ── UI state ─────────────────────────────────────────────────────────────
  const [activeTab,    setActiveTab]    = useState('overview');
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [exporting,    setExporting]    = useState(false);
  const [hideValues,   setHideValues]   = useState(false);

  // ── Filters ──────────────────────────────────────────────────────────────
  const [filterClient, setFilterClient] = useState('all');
  const [filterFY,     setFilterFY]     = useState('all');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await FinanceService.getFinancialOverview({});
      if (res?.success) {
        setRawData(res.data);
      } else {
        setError('Unexpected response from server.');
      }
    } catch (err) {
      setError(err?.response?.data?.message ?? err.message ?? 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Derived FY bounds ─────────────────────────────────────────────────────
  const [fyStart, fyEnd] = useMemo(() => getFYBounds(filterFY), [filterFY]);

  // ── Filtered & enriched projects ─────────────────────────────────────────
  const filteredProjects = useMemo(() => {
    if (!rawData?.projects) return [];
    const q = filterSearch.toLowerCase().trim();

    return rawData.projects
      .filter((p) => {
        if (filterClient !== 'all' && String(p.clientId?._id) !== filterClient) return false;
        if (filterStatus !== 'all' && p.status !== filterStatus) return false;
        if (q) {
          const hit =
            (p.projectName  ?? '').toLowerCase().includes(q) ||
            (p.projectNumber ?? '').toLowerCase().includes(q) ||
            (p.clientId?.name ?? '').toLowerCase().includes(q);
          if (!hit) return false;
        }
        if (filterFY !== 'all') {
          const fyFees = fyReceivedFor(p, fyStart, fyEnd);
          if (fyFees === 0) return false;
        }
        return true;
      })
      .map((p) => ({
        ...p,
        fyReceivedFees: fyReceivedFor(p, fyStart, fyEnd),
        fyPayments:     fyPaymentsFor(p, fyStart, fyEnd),
      }));
  }, [rawData, filterClient, filterStatus, filterSearch, filterFY, fyStart, fyEnd]);

  // ── Summary recalculated from filtered data ───────────────────────────────
  const summary = useMemo(() => {
    const s = {
      totalFinalizedFees: 0, totalReceivedFees: 0,
      totalProfitMargin: 0,  totalDrawing: 0, totalDocuments: 0,
      totalSiteVisit: 0,     totalMarketingMisc: 0, totalOfficeManagement: 0,
      totalAssociatePaid: 0, totalAssociateAmount: 0,
    };
    filteredProjects.forEach((p) => {
      s.totalFinalizedFees    += p.finalizedFees        ?? 0;
      s.totalReceivedFees     += p.fyReceivedFees       ?? 0;
      s.totalProfitMargin     += p.profitMargin         ?? 0;
      s.totalDrawing          += p.drawing              ?? 0;
      s.totalDocuments        += p.documents            ?? 0;
      s.totalSiteVisit        += p.siteVisit            ?? 0;
      s.totalMarketingMisc    += p.marketingAndMisc     ?? 0;
      s.totalOfficeManagement += p.officeManagement     ?? 0;
      s.totalAssociatePaid    += p.totalAssociatePaid   ?? 0;
      s.totalAssociateAmount  += p.totalAssociateAmount ?? 0;
    });
    s.totalExpenses = s.totalDrawing + s.totalDocuments + s.totalSiteVisit +
                      s.totalMarketingMisc + s.totalOfficeManagement;
    s.pendingFees   = s.totalFinalizedFees - s.totalReceivedFees;
    s.netProfit     = s.totalReceivedFees - s.totalExpenses - s.totalAssociatePaid;
    s.projectCount  = filteredProjects.length;
    return s;
  }, [filteredProjects]);

  // ── Row toggle ───────────────────────────────────────────────────────────
  const toggleRow = (id) =>
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const clearFilters = () => {
    setFilterClient('all');
    setFilterFY('all');
    setFilterSearch('');
    setFilterStatus('all');
    setExpandedRows(new Set());
  };

  const hasFilters =
    filterClient !== 'all' || filterFY !== 'all' ||
    filterSearch !== ''    || filterStatus !== 'all';

  // ── Export: Excel ─────────────────────────────────────────────────────────
  const exportExcel = () => {
    setExporting(true);
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1 – Overview
      const ws1 = XLSX.utils.json_to_sheet(
        filteredProjects.map((p, i) => {
          const expenses = (p.drawing??0)+(p.documents??0)+(p.siteVisit??0)+(p.marketingAndMisc??0)+(p.officeManagement??0);
          return {
            'Sr.No'               : i + 1,
            'Project #'           : p.projectNumber,
            'Project Name'        : p.projectName,
            'Client'              : p.clientId?.name    ?? '—',
            'Status'              : p.status,
            'Finalized Fees (₹)'  : p.finalizedFees      ?? 0,
            'Received Fees (₹)'   : p.fyReceivedFees     ?? 0,
            'Pending (₹)'         : (p.finalizedFees??0) - (p.fyReceivedFees??0),
            'Profit Margin (₹)'   : p.profitMargin       ?? 0,
            'Drawing (₹)'         : p.drawing            ?? 0,
            'Documents (₹)'       : p.documents          ?? 0,
            'Site Visit (₹)'      : p.siteVisit          ?? 0,
            'Mktg & Misc (₹)'     : p.marketingAndMisc   ?? 0,
            'Office Mgmt (₹)'     : p.officeManagement   ?? 0,
            'Associate Paid (₹)'  : p.totalAssociatePaid ?? 0,
            'Net Profit (₹)'      : (p.fyReceivedFees??0) - expenses - (p.totalAssociatePaid??0),
          };
        })
      );
      XLSX.utils.book_append_sheet(wb, ws1, 'Overview');

      // Sheet 2 – Payments
      const payRows = [];
      filteredProjects.forEach((p) => {
        (p.fyPayments ?? []).forEach((pay) => {
          payRows.push({
            'Project #'  : p.projectNumber,
            'Project Name': p.projectName,
            'Client'     : p.clientId?.name ?? '—',
            'Date'       : pay.date ? new Date(pay.date).toLocaleDateString('en-IN') : '—',
            'Amount (₹)' : pay.amount ?? 0,
            'Mode'       : pay.mode ?? '—',
            'Ref No.'    : pay.chequeNeftNumber ?? '—',
          });
        });
      });
      const ws2 = XLSX.utils.json_to_sheet(payRows.length ? payRows : [{ Note: 'No payments' }]);
      XLSX.utils.book_append_sheet(wb, ws2, 'Payments');

      // Sheet 3 – Associates
      const assocRows = [];
      filteredProjects.forEach((p) => {
        (p.projectAssociates ?? []).forEach((a) => {
          const alloc   = (p.totalReceivedFees??0) * ((a.percentage??0)/100);
          const pending = Math.max(0, alloc - (a.amountPaid??0));
          assocRows.push({
            'Project #'      : p.projectNumber,
            'Project Name'   : p.projectName,
            'Client'         : p.clientId?.name         ?? '—',
            'Associate Name' : a.associateId?.name      ?? '—',
            'Company'        : a.associateId?.company   ?? '—',
            '% Share'        : a.percentage             ?? 0,
            'Allocated (₹)'  : Math.round(alloc),
            'Paid (₹)'       : a.amountPaid             ?? 0,
            'Pending (₹)'    : Math.round(pending),
          });
        });
      });
      const ws3 = XLSX.utils.json_to_sheet(assocRows.length ? assocRows : [{ Note: 'No associates' }]);
      XLSX.utils.book_append_sheet(wb, ws3, 'Associates');

      const fyLabel = filterFY !== 'all' ? `_FY${filterFY}` : '';
      XLSX.writeFile(wb, `FinancialOverview${fyLabel}_${new Date().toISOString().slice(0,10)}.xlsx`);
    } catch (err) {
      showError('Excel export failed: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  // ── Export: PDF ───────────────────────────────────────────────────────────
  const exportPDF = () => {
    setExporting(true);
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'A3' });
      doc.setFontSize(18);
      doc.setTextColor(37, 99, 235);
      doc.text('Financial Overview', 40, 44);
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Generated: ${new Date().toLocaleString('en-IN')}  |  Projects: ${summary.projectCount}  |  FY: ${filterFY==='all'?'All Years':'FY '+filterFY}`,
        40, 60
      );

      autoTable(doc, {
        startY: 74,
        head: [['#','Project','Client','Finalized','Received','Pending','Profit Margin','Drawing','Documents','Site Visit','Mktg&Misc','Office Mgmt','Associate','Net Profit']],
        body: filteredProjects.map((p, i) => {
          const exp = (p.drawing??0)+(p.documents??0)+(p.siteVisit??0)+(p.marketingAndMisc??0)+(p.officeManagement??0);
          return [
            i+1,
            `${p.projectNumber}\n${p.projectName}`,
            p.clientId?.name ?? '—',
            fmt(p.finalizedFees),
            fmt(p.fyReceivedFees),
            fmt((p.finalizedFees??0)-(p.fyReceivedFees??0)),
            fmt(p.profitMargin),
            fmt(p.drawing),
            fmt(p.documents),
            fmt(p.siteVisit),
            fmt(p.marketingAndMisc),
            fmt(p.officeManagement),
            fmt(p.totalAssociatePaid),
            fmt((p.fyReceivedFees??0)-exp-(p.totalAssociatePaid??0)),
          ];
        }),
        foot: [[
          '', 'TOTAL', '',
          fmt(summary.totalFinalizedFees), fmt(summary.totalReceivedFees), fmt(summary.pendingFees),
          fmt(summary.totalProfitMargin), fmt(summary.totalDrawing), fmt(summary.totalDocuments),
          fmt(summary.totalSiteVisit), fmt(summary.totalMarketingMisc), fmt(summary.totalOfficeManagement),
          fmt(summary.totalAssociatePaid), fmt(summary.netProfit),
        ]],
        styles       : { fontSize: 7.5, cellPadding: 4, overflow: 'linebreak' },
        headStyles   : { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
        footStyles   : { fillColor: [241, 245, 249], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles : { 1: { cellWidth: 90 } },
      });

      const fyLabel = filterFY !== 'all' ? `_FY${filterFY}` : '';
      doc.save(`FinancialOverview${fyLabel}_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (err) {
      showError('PDF export failed: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="fd-loading-wrap">
        <div className="fd-spinner" />
        <p className="fd-loading-text">Loading financial data…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fd-error-wrap">
        <span className="fd-error-icon">⚠️</span>
        <p>{error}</p>
        <button className="fd-btn fd-btn-refresh" onClick={fetchData}>Retry</button>
      </div>
    );
  }

  const { financialYears = [], clients = [] } = rawData?.filterOptions ?? {};

  return (
    <div className="fd-wrapper">
      <Watermark />

      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="fd-header">
        <div className="fd-header-left">
          <h1 className="fd-title">
            <span className="fd-title-icon">💰</span>
            Financial Overview
          </h1>
          <span className="fd-subtitle">
            {summary.projectCount} project{summary.projectCount !== 1 ? 's' : ''}
            {filterFY !== 'all' && <span className="fd-fy-badge">FY {filterFY}</span>}
          </span>
        </div>
        <div className="fd-header-actions">
          <button
            className="fd-btn fd-btn-excel"
            onClick={exportExcel}
            disabled={exporting || !filteredProjects.length}
            title="Export to Excel (Overview + Payments + Associates sheets)"
          >
            <FaFileExcel /> Export Excel
          </button>
          <button
            className="fd-btn fd-btn-pdf"
            onClick={exportPDF}
            disabled={exporting || !filteredProjects.length}
            title="Export overview to PDF"
          >
            <FaFilePdf /> Export PDF
          </button>
          <button className="fd-btn fd-btn-refresh" onClick={fetchData} title="Reload data">
            <FiRefreshCw /> Refresh
          </button>
        </div>
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────────── */}
      <div className="fd-cards-section">
      <button
        className="fd-hide-toggle"
        onClick={() => setHideValues(v => !v)}
        title={hideValues ? 'Show figures' : 'Hide figures'}
      >
        {hideValues ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
        <span>{hideValues ? 'Show' : 'Hide'}</span>
      </button>
      <div className="fd-cards">
        <SummaryCard
          label="Total Finalized Fees"
          value={summary.totalFinalizedFees}
          color="blue"
          icon="📋"
          sub={`${summary.projectCount} project${summary.projectCount !== 1 ? 's' : ''}`}
          hidden={hideValues}
        />
        <SummaryCard
          label="Total Received"
          value={summary.totalReceivedFees}
          color="green"
          icon="✅"
          sub={filterFY !== 'all' ? `FY ${filterFY}` : 'All time'}
          hidden={hideValues}
        />
        <SummaryCard
          label="Pending Fees"
          value={summary.pendingFees}
          color="orange"
          icon="⏳"
          sub="Outstanding balance"
          hidden={hideValues}
        />
        <SummaryCard
          label="Total Expenses"
          value={summary.totalExpenses}
          color="red"
          icon="📉"
          sub="Drawing + Docs + Site + Mktg + Office"
          hidden={hideValues}
        />
        <SummaryCard
          label="Net Profit"
          value={summary.netProfit}
          color={summary.netProfit >= 0 ? 'emerald' : 'crimson'}
          icon={summary.netProfit >= 0 ? '🚀' : '⚠️'}
          sub="After expenses & associate payouts"
          hidden={hideValues}
        />
        <SummaryCard
          label="Associate Payouts"
          value={summary.totalAssociatePaid}
          color="purple"
          icon="🤝"
          sub={`${fmtCurrency(summary.totalAssociateAmount)} allocated`}
          hidden={hideValues}
        />
      </div>
      </div>

      {/* ── Filter Bar ────────────────────────────────────────────────────── */}
      <div className="fd-filters">
        <div className="fd-filter-group">
          <FaSearch className="fd-fi" />
          <input
            className="fd-filter-input"
            placeholder="Search project / client…"
            value={filterSearch}
            onChange={(e) => { setFilterSearch(e.target.value); setExpandedRows(new Set()); }}
          />
        </div>

        <div className="fd-filter-group">
          <FaFilter className="fd-fi" />
          <select
            className="fd-filter-select"
            value={filterClient}
            onChange={(e) => { setFilterClient(e.target.value); setExpandedRows(new Set()); }}
          >
            <option value="all">All Clients</option>
            {clients.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}{c.company ? ` — ${c.company}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="fd-filter-group">
          <span className="fd-fi" style={{fontSize: 14}}>📅</span>
          <select
            className="fd-filter-select"
            value={filterFY}
            onChange={(e) => { setFilterFY(e.target.value); setExpandedRows(new Set()); }}
          >
            <option value="all">All Financial Years</option>
            {financialYears.map((fy) => (
              <option key={fy} value={fy}>FY {fy}</option>
            ))}
          </select>
        </div>

        <div className="fd-filter-group">
          <span className="fd-fi" style={{fontSize: 14}}>🏷</span>
          <select
            className="fd-filter-select"
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setExpandedRows(new Set()); }}
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {hasFilters && (
          <button className="fd-btn fd-btn-clear" onClick={clearFilters}>
            <FaTimes /> Clear
          </button>
        )}

        <span className="fd-results-hint">
          {filteredProjects.length} result{filteredProjects.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="fd-tabs">
        {[
          { key: 'overview',   label: '📊 Overview'   },
          { key: 'payments',   label: '💳 Payments'   },
          { key: 'associates', label: '🤝 Associates' },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={`fd-tab ${activeTab === key ? 'active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ───────────────────────────────────────────────────── */}
      <div className="fd-tab-content">
        {activeTab === 'overview'   && (
          <OverviewTab
            projects={filteredProjects}
            summary={summary}
            expandedRows={expandedRows}
            toggleRow={toggleRow}
          />
        )}
        {activeTab === 'payments'   && <PaymentsTab   projects={filteredProjects} />}
        {activeTab === 'associates' && <AssociatesTab projects={filteredProjects} />}
      </div>
    </div>
  );
};

// ─── Summary Card ─────────────────────────────────────────────────────────────
const SummaryCard = ({ label, value, color, icon, sub, hidden }) => (
  <div className={`fd-card fd-card-${color}`}>
    <div className="fd-card-left">
      <div className="fd-card-icon">{icon}</div>
    </div>
    <div className="fd-card-right">
      <div className={`fd-card-value${hidden ? ' fd-card-value--hidden' : ''}`}>
        {hidden ? <span className="fd-card-mask">••••••</span> : fmtCurrency(value)}
      </div>
      <div className="fd-card-label">{label}</div>
      {sub && <div className="fd-card-sub">{sub}</div>}
    </div>
  </div>
);

// ─── Pagination Component ────────────────────────────────────────────────────
const PAGE_SIZE = 50;

const Pagination = ({ page, totalPages, totalItems, onPage }) => {
  if (totalPages <= 1) return null;

  const start = (page - 1) * PAGE_SIZE + 1;
  const end   = Math.min(page * PAGE_SIZE, totalItems);

  // Build page numbers to show: always first, last, current ±2, ellipsis gaps
  const getPages = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
        pages.push(i);
      }
    }
    // Insert ellipsis markers
    const result = [];
    let prev = 0;
    for (const p of pages) {
      if (p - prev > 1) result.push('...');
      result.push(p);
      prev = p;
    }
    return result;
  };

  return (
    <div className="fd-pagination">
      <span className="fd-pagination-info">
        Showing <strong>{start}–{end}</strong> of <strong>{totalItems}</strong> items
      </span>
      <div className="fd-pagination-controls">
        <button className="fd-pg-btn" onClick={() => onPage(1)}       disabled={page === 1} title="First">«</button>
        <button className="fd-pg-btn" onClick={() => onPage(page - 1)} disabled={page === 1} title="Previous">‹</button>
        {getPages().map((p, i) =>
          p === '...' ? (
            <span key={`e-${i}`} className="fd-pg-ellipsis">…</span>
          ) : (
            <button
              key={p}
              className={`fd-pg-btn ${p === page ? 'active' : ''}`}
              onClick={() => onPage(p)}
            >{p}</button>
          )
        )}
        <button className="fd-pg-btn" onClick={() => onPage(page + 1)} disabled={page === totalPages} title="Next">›</button>
        <button className="fd-pg-btn" onClick={() => onPage(totalPages)} disabled={page === totalPages} title="Last">»</button>
      </div>
    </div>
  );
};

// ─── Column definitions (configurable: can hide + reorder) ───────────────────
const ALL_COL_DEFS = [
  { key: 'client',        label: 'Client',         thCls: '',                          numeric: false },
  { key: 'status',        label: 'Status',         thCls: '',                          numeric: false },
  { key: 'finalizedFees', label: 'Finalized Fees', thCls: 'fd-th-num fd-col-blue',    numeric: true  },
  { key: 'received',      label: 'Received',       thCls: 'fd-th-num fd-col-blue',    numeric: true  },
  { key: 'trimityFees',   label: 'Trimity Fees',   thCls: 'fd-th-num fd-col-emerald',  numeric: true  },
  { key: 'pending',       label: 'Pending',        thCls: 'fd-th-num fd-col-orange',  numeric: true  },
  { key: 'profitMargin',  label: 'Profit Margin',  thCls: 'fd-th-num',                numeric: true  },
  { key: 'drawing',       label: 'Drawing',        thCls: 'fd-th-num',                numeric: true  },
  { key: 'documents',     label: 'Documents',      thCls: 'fd-th-num',                numeric: true  },
  { key: 'siteVisit',     label: 'Site Visit',     thCls: 'fd-th-num',                numeric: true  },
  { key: 'marketingMisc', label: 'Mktg & Misc',    thCls: 'fd-th-num',                numeric: true  },
  { key: 'officeMgmt',    label: 'Office Mgmt',    thCls: 'fd-th-num',                numeric: true  },
  { key: 'associatePaid', label: 'Associate Paid', thCls: 'fd-th-num',                numeric: true  },
  { key: 'netProfit',     label: 'Net Profit',     thCls: 'fd-th-num fd-col-green',   numeric: true  },
  { key: 'actions',       label: 'Actions',        thCls: 'fd-th-actions',            numeric: false },
];
const DEFAULT_COL_ORDER  = ALL_COL_DEFS.map(c => c.key);
const DEFAULT_HIDDEN_COLS = [];
const COL_PREFS_KEY = 'fd_col_prefs_v3';

const loadColPrefs = () => {
  try {
    const s = localStorage.getItem(COL_PREFS_KEY);
    if (!s) return { order: DEFAULT_COL_ORDER, hidden: DEFAULT_HIDDEN_COLS };
    const p = JSON.parse(s);
    // Ensure any new columns added later are appended to the saved order
    const extra = DEFAULT_COL_ORDER.filter(k => !p.order.includes(k));
    return { order: [...p.order, ...extra], hidden: p.hidden ?? [] };
  } catch { return { order: DEFAULT_COL_ORDER, hidden: DEFAULT_HIDDEN_COLS }; }
};
const saveColPrefs = (order, hidden) => {
  try { localStorage.setItem(COL_PREFS_KEY, JSON.stringify({ order, hidden })); } catch {}
};

// ─── Column Manager Popover ───────────────────────────────────────────────────
const ColumnManager = ({ colOrder, hiddenCols, onChange, onReset }) => {
  const [open, setOpen] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const panelRef = React.useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggleHidden = (key) => {
    const next = hiddenCols.includes(key)
      ? hiddenCols.filter(k => k !== key)
      : [...hiddenCols, key];
    onChange(colOrder, next);
  };

  const onDragStart = (e, idx) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOver = (e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIdx(idx);
  };
  const onDrop = (e, idx) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setDragOverIdx(null); return; }
    const next = [...colOrder];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(idx, 0, moved);
    setDragIdx(null);
    setDragOverIdx(null);
    onChange(next, hiddenCols);
  };
  const onDragEnd = () => { setDragIdx(null); setDragOverIdx(null); };

  const visibleCount = colOrder.filter(k => !hiddenCols.includes(k)).length;

  return (
    <div className="fd-col-mgr" ref={panelRef}>
      <button
        className={`fd-col-mgr-btn ${open ? 'active' : ''}`}
        onClick={() => setOpen(v => !v)}
        title="Show / hide and reorder columns"
      >
        ⚙ Columns {hiddenCols.length > 0 && <span className="fd-col-badge">{colOrder.length - hiddenCols.length}/{colOrder.length}</span>}
      </button>

      {open && (
        <div className="fd-col-panel">
          <div className="fd-col-panel-header">
            <span>Configure Columns</span>
            <button className="fd-col-reset" onClick={() => { onReset(); setOpen(false); }}>↺ Reset</button>
          </div>
          <p className="fd-col-hint">Drag ≡ to reorder • Check to show/hide</p>
          <ul className="fd-col-list">
            {colOrder.map((key, idx) => {
              const def = ALL_COL_DEFS.find(c => c.key === key);
              if (!def) return null;
              const isHidden = hiddenCols.includes(key);
              return (
                <li
                  key={key}
                  className={`fd-col-item ${dragOverIdx === idx ? 'fd-col-drag-over' : ''} ${dragIdx === idx ? 'fd-col-dragging' : ''}`}
                  draggable
                  onDragStart={e => onDragStart(e, idx)}
                  onDragOver={e => onDragOver(e, idx)}
                  onDrop={e => onDrop(e, idx)}
                  onDragEnd={onDragEnd}
                >
                  <span className="fd-col-drag-handle" title="Drag to reorder">⠿</span>
                  <label className="fd-col-label">
                    <input
                      type="checkbox"
                      checked={!isHidden}
                      onChange={() => toggleHidden(key)}
                    />
                    <span>{def.label}</span>
                  </label>
                </li>
              );
            })}
          </ul>
          <div className="fd-col-panel-footer">
            {visibleCount} of {colOrder.length} columns visible
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Overview Tab ─────────────────────────────────────────────────────────────
const OverviewTab = ({ projects, summary, expandedRows, toggleRow }) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [projects]);

  // Column prefs
  const [colPrefs, setColPrefs] = useState(loadColPrefs);
  const colOrder    = colPrefs.order;
  const hiddenCols  = colPrefs.hidden;

  const updateColPrefs = (order, hidden) => {
    const next = { order, hidden };
    setColPrefs(next);
    saveColPrefs(order, hidden);
  };
  const resetColPrefs = () => updateColPrefs(DEFAULT_COL_ORDER, DEFAULT_HIDDEN_COLS);

  // Build ordered visible column defs
  const visibleCols = colOrder
    .map(k => ALL_COL_DEFS.find(c => c.key === k))
    .filter(Boolean)
    .filter(c => !hiddenCols.includes(c.key));

  // Total colspan: 2 fixed left (expand+#) + 1 fixed (project) + visible (includes actions if visible)
  const totalColSpan = 3 + visibleCols.length;

  if (!projects.length) return <EmptyState />;

  const totalPages   = Math.ceil(projects.length / PAGE_SIZE);
  const pageStart    = (page - 1) * PAGE_SIZE;
  const pageProjects = projects.slice(pageStart, pageStart + PAGE_SIZE);

  // Cell renderer for each column key
  const renderCell = (key, p) => {
    const expenses = (p.drawing??0)+(p.documents??0)+(p.siteVisit??0)+(p.marketingAndMisc??0)+(p.officeManagement??0);
    const netProfit = (p.fyReceivedFees??0) - expenses - (p.totalAssociatePaid??0);
    const pending   = (p.finalizedFees??0)  - (p.fyReceivedFees??0);
    switch (key) {
      case 'client':        return <td key={key} className="fd-td fd-td-client">{p.clientId?.name ?? '—'}</td>;
      case 'status':        return <td key={key} className="fd-td"><StatusBadge status={p.status} /></td>;
      case 'finalizedFees': return <td key={key} className="fd-td fd-td-num">{fmtCurrency(p.finalizedFees)}</td>;
      case 'received':      return <td key={key} className="fd-td fd-td-num fd-num-blue">{fmtCurrency(p.fyReceivedFees)}</td>;
      case 'trimityFees':   return <td key={key} className="fd-td fd-td-num fd-num-emerald">{fmtCurrency((p.fyReceivedFees ?? 0) - (p.totalAssociateAmount ?? 0))}</td>;
      case 'pending':       return <td key={key} className={`fd-td fd-td-num ${pending>0?'fd-num-orange':'fd-num-green'}`}>{fmtCurrency(pending)}</td>;
      case 'profitMargin':  return <td key={key} className="fd-td fd-td-num fd-meta">{fmtCurrency(p.profitMargin)}</td>;
      case 'drawing':       return <td key={key} className="fd-td fd-td-num fd-meta">{fmtCurrency(p.drawing)}</td>;
      case 'documents':     return <td key={key} className="fd-td fd-td-num fd-meta">{fmtCurrency(p.documents)}</td>;
      case 'siteVisit':     return <td key={key} className="fd-td fd-td-num fd-meta">{fmtCurrency(p.siteVisit)}</td>;
      case 'marketingMisc': return <td key={key} className="fd-td fd-td-num fd-meta">{fmtCurrency(p.marketingAndMisc)}</td>;
      case 'officeMgmt':    return <td key={key} className="fd-td fd-td-num fd-meta">{fmtCurrency(p.officeManagement)}</td>;
      case 'associatePaid': return <td key={key} className="fd-td fd-td-num fd-meta">{fmtCurrency(p.totalAssociatePaid)}</td>;
      case 'netProfit':     return <td key={key} className={`fd-td fd-td-num fd-td-net ${netProfit>=0?'fd-num-green':'fd-num-red'}`}><strong>{fmtCurrency(netProfit)}</strong></td>;
      case 'actions':       return (
        <td key={key} className="fd-td fd-td-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className="fd-action-btn fd-action-edit"
            title="View / Edit project"
            onClick={() => navigate(`/projects/${p._id}`, { state: { projectName: p.projectName } })}
          >
            <FaEdit size={11} /> Edit
          </button>
          <button
            className="fd-action-btn fd-action-payment"
            title="Add payment"
            onClick={() => navigate(`/projects/${p._id}?addPayment=true`, { state: { projectName: p.projectName } })}
          >
            <FiCreditCard size={11} /> Payment
          </button>
        </td>
      );
      default:              return null;
    }
  };

  // Footer cell renderer
  const renderFoot = (key) => {
    switch (key) {
      case 'finalizedFees': return <td key={key} className="fd-td fd-td-num"><strong>{fmtCurrency(summary.totalFinalizedFees)}</strong></td>;
      case 'received':      return <td key={key} className="fd-td fd-td-num fd-num-blue"><strong>{fmtCurrency(summary.totalReceivedFees)}</strong></td>;
      case 'trimityFees':   return <td key={key} className="fd-td fd-td-num fd-num-emerald"><strong>{fmtCurrency(summary.totalTrimityFees)}</strong></td>;
      case 'pending':       return <td key={key} className="fd-td fd-td-num fd-num-orange"><strong>{fmtCurrency(summary.pendingFees)}</strong></td>;
      case 'profitMargin':  return <td key={key} className="fd-td fd-td-num"><strong>{fmtCurrency(summary.totalProfitMargin)}</strong></td>;
      case 'drawing':       return <td key={key} className="fd-td fd-td-num"><strong>{fmtCurrency(summary.totalDrawing)}</strong></td>;
      case 'documents':     return <td key={key} className="fd-td fd-td-num"><strong>{fmtCurrency(summary.totalDocuments)}</strong></td>;
      case 'siteVisit':     return <td key={key} className="fd-td fd-td-num"><strong>{fmtCurrency(summary.totalSiteVisit)}</strong></td>;
      case 'marketingMisc': return <td key={key} className="fd-td fd-td-num"><strong>{fmtCurrency(summary.totalMarketingMisc)}</strong></td>;
      case 'officeMgmt':    return <td key={key} className="fd-td fd-td-num"><strong>{fmtCurrency(summary.totalOfficeManagement)}</strong></td>;
      case 'associatePaid': return <td key={key} className="fd-td fd-td-num"><strong>{fmtCurrency(summary.totalAssociatePaid)}</strong></td>;
      case 'netProfit':     return <td key={key} className={`fd-td fd-td-num fd-td-net ${summary.netProfit>=0?'fd-num-green':'fd-num-red'}`}><strong>{fmtCurrency(summary.netProfit)}</strong></td>;
      case 'actions':       return <td key={key} />;
      default:              return <td key={key} />;
    }
  };

  return (
    <>
    {/* Column manager bar */}
    <div className="fd-col-mgr-bar">
      <ColumnManager
        colOrder={colOrder}
        hiddenCols={hiddenCols}
        onChange={updateColPrefs}
        onReset={resetColPrefs}
      />
    </div>

    <div className="fd-table-wrapper">
      <table className="fd-table">
        <thead>
          <tr>
            <th className="fd-th fd-th-exp" />
            <th className="fd-th fd-th-num">#</th>
            <th className="fd-th fd-th-project">Project</th>
            {visibleCols.map(c => (
              <th key={c.key} className={`fd-th ${c.thCls}`}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pageProjects.map((p, i) => {
            const isOpen = expandedRows.has(p._id);
            return (
              <React.Fragment key={p._id}>
                <tr
                  className={`fd-row ${isOpen ? 'fd-row-open' : ''}`}
                  onClick={() => toggleRow(p._id)}
                >
                  <td className="fd-td fd-td-exp">
                    {isOpen
                      ? <FiChevronDown size={13} color="#2563eb" />
                      : <FiChevronRight size={13} color="#94a3b8" />}
                  </td>
                  <td className="fd-td fd-td-num fd-meta">{pageStart + i + 1}</td>
                  <td className="fd-td fd-td-project">
                    <div className="fd-proj-num">{p.projectNumber}</div>
                    <div className="fd-proj-name">{p.projectName}</div>
                  </td>
                  {visibleCols.map(c => renderCell(c.key, p))}
                </tr>
                {isOpen && (
                  <tr className="fd-row-expanded">
                    <td colSpan={totalColSpan} className="fd-td-expanded">
                      <ExpandedDetail project={p} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="fd-row-total">
            <td /><td />
            <td className="fd-td">
              <strong>TOTAL — {summary.projectCount} project{summary.projectCount !== 1 ? 's' : ''}</strong>
            </td>
            {visibleCols.map(c => renderFoot(c.key))}
          </tr>
        </tfoot>
      </table>
    </div>
    <Pagination page={page} totalPages={totalPages} totalItems={projects.length} onPage={setPage} />
    </>
  );
};

// ─── Expanded row detail ──────────────────────────────────────────────────────
const ExpandedDetail = ({ project: p }) => {
  const payments = (p.fyPayments ?? p.payments ?? [])
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const expenseItems = [
    { label: 'Profit Margin', value: p.profitMargin,       pct: p.profitMarginPercent,        color: '#10b981' },
    { label: 'Drawing',       value: p.drawing,            pct: p.drawingPercent,             color: '#3b82f6' },
    { label: 'Documents',     value: p.documents,          pct: p.documentsPercent,           color: '#f59e0b' },
    { label: 'Site Visit',    value: p.siteVisit,          pct: p.siteVisitPercent,           color: '#8b5cf6' },
    { label: 'Mktg & Misc',   value: p.marketingAndMisc,   pct: p.marketingAndMiscPercent,    color: '#ec4899' },
    { label: 'Office Mgmt',   value: p.officeManagement,   pct: p.officeManagementPercent,    color: '#f97316' },
    { label: 'Associates',    value: p.totalAssociatePaid, pct: null,                         color: '#6b7280' },
  ].filter((e) => (e.value ?? 0) > 0);

  const base = p.fyReceivedFees || 1;

  return (
    <div className="fd-exp-wrap">
      {/* Payment sub-table */}
      <div className="fd-exp-section">
        <div className="fd-exp-section-header">
          <span>💳 Payment History</span>
          <span className="fd-exp-section-total">
            Total Received: <strong>{fmtCurrency(p.fyReceivedFees)}</strong>
          </span>
        </div>
        {payments.length === 0 ? (
          <p className="fd-exp-empty">No payment records.</p>
        ) : (
          <table className="fd-sub-table">
            <thead>
              <tr>
                <th>#</th><th>Date</th><th>Amount</th><th>Mode</th><th>Reference No.</th><th>Running Total</th>
              </tr>
            </thead>
            <tbody>
              {payments.reduce((acc, pay, idx) => {
                const running = (acc.at(-1)?.running ?? 0) + (pay.amount ?? 0);
                acc.push({ pay, idx, running });
                return acc;
              }, []).map(({ pay, idx, running }) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{pay.date ? new Date(pay.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'}</td>
                  <td className="fd-num-blue"><strong>{fmtCurrency(pay.amount)}</strong></td>
                  <td><span className="fd-mode-badge">{pay.mode ?? '—'}</span></td>
                  <td className="fd-ref">{pay.chequeNeftNumber || '—'}</td>
                  <td className="fd-num-green">{fmtCurrency(running)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Expense distribution bars */}
      {expenseItems.length > 0 && (
        <div className="fd-exp-section">
          <div className="fd-exp-section-header">
            <span>📊 Expense Distribution</span>
          </div>
          <div className="fd-bars">
            {expenseItems.map((e) => (
              <div key={e.label} className="fd-bar-row">
                <span className="fd-bar-label">{e.label}</span>
                <div className="fd-bar-track">
                  <div
                    className="fd-bar-fill"
                    style={{
                      width: `${Math.min(100, ((e.value / base) * 100)).toFixed(1)}%`,
                      background: e.color,
                    }}
                  />
                </div>
                <span className="fd-bar-amount">
                  {fmtCurrency(e.value)}
                  {e.pct != null ? ` (${e.pct}%)` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Associate summary */}
      {(p.projectAssociates ?? []).length > 0 && (
        <div className="fd-exp-section">
          <div className="fd-exp-section-header">
            <span>🤝 Associate Allocations</span>
          </div>
          <table className="fd-sub-table">
            <thead>
              <tr>
                <th>Associate</th><th>Company</th><th>% Share</th>
                <th>Allocated</th><th>Paid</th><th>Pending</th>
              </tr>
            </thead>
            <tbody>
              {p.projectAssociates.map((a, i) => {
                const alloc   = (p.totalReceivedFees ?? 0) * ((a.percentage ?? 0) / 100);
                const pending = Math.max(0, alloc - (a.amountPaid ?? 0));
                return (
                  <tr key={i}>
                    <td><strong>{a.associateId?.name ?? '—'}</strong></td>
                    <td>{a.associateId?.company ?? '—'}</td>
                    <td>{a.percentage ?? 0}%</td>
                    <td>{fmtCurrency(Math.round(alloc))}</td>
                    <td className="fd-num-green">{fmtCurrency(a.amountPaid)}</td>
                    <td className={pending > 0 ? 'fd-num-orange' : 'fd-num-green'}>
                      {fmtCurrency(Math.round(pending))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Payments Tab ─────────────────────────────────────────────────────────────
const PaymentsTab = ({ projects }) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    const out = [];
    projects.forEach((p) => {
      (p.fyPayments ?? p.payments ?? [])
        .slice()
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .forEach((pay, i) => out.push({ p, pay, i }));
    });
    return out;
  }, [projects]);

  useEffect(() => { setPage(1); }, [rows]);

  if (!rows.length) return <EmptyState label="No payment entries for the selected filters." />;

  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const pageStart  = (page - 1) * PAGE_SIZE;
  const pageRows   = rows.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <>
    <div className="fd-table-wrapper">
      <table className="fd-table">
        <thead>
          <tr>
            <th className="fd-th fd-th-num">#</th>
            <th className="fd-th fd-th-project">Project</th>
            <th className="fd-th">Client</th>
            <th className="fd-th fd-th-num">Date</th>
            <th className="fd-th fd-th-num fd-col-blue">Amount</th>
            <th className="fd-th">Mode</th>
            <th className="fd-th">Reference No.</th>
            <th className="fd-th fd-th-num">% of Finalized</th>
          </tr>
        </thead>
        <tbody>
          {pageRows.map(({ p, pay, i }, rowIdx) => {
            const pctOf = p.finalizedFees
              ? `${((pay.amount / p.finalizedFees) * 100).toFixed(1)}%`
              : '—';
            return (
              <tr key={`${p._id}-${i}`} className="fd-row">
                <td className="fd-td fd-td-num fd-meta">{pageStart + rowIdx + 1}</td>
                <td className="fd-td fd-td-project">
                  <button
                    className="fd-proj-link"
                    onClick={() => navigate(`/projects/${p._id}`, { state: { projectName: p.projectName } })}
                    title="Open project"
                  >
                    <div className="fd-proj-num">{p.projectNumber}</div>
                    <div className="fd-proj-name">{p.projectName} <FaExternalLinkAlt size={9} style={{opacity:0.5}} /></div>
                  </button>
                </td>
                <td className="fd-td fd-td-client">{p.clientId?.name ?? '—'}</td>
                <td className="fd-td fd-td-num">
                  {pay.date
                    ? new Date(pay.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
                    : '—'}
                </td>
                <td className="fd-td fd-td-num fd-num-blue">
                  <strong>{fmtCurrency(pay.amount)}</strong>
                </td>
                <td className="fd-td">
                  <span className="fd-mode-badge">{pay.mode ?? '—'}</span>
                </td>
                <td className="fd-td fd-ref">{pay.chequeNeftNumber || '—'}</td>
                <td className="fd-td fd-td-num fd-meta">{pctOf}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    <Pagination page={page} totalPages={totalPages} totalItems={rows.length} onPage={setPage} />
    </>
  );
};

// ─── Associates Tab ───────────────────────────────────────────────────────────
const AssociatesTab = ({ projects }) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    const out = [];
    projects.forEach((p) => {
      (p.projectAssociates ?? []).forEach((a) => {
        const alloc   = (p.totalReceivedFees ?? 0) * ((a.percentage ?? 0) / 100);
        const pending = Math.max(0, alloc - (a.amountPaid ?? 0));
        out.push({ p, a, alloc, pending });
      });
    });
    return out;
  }, [projects]);

  useEffect(() => { setPage(1); }, [rows]);

  if (!rows.length) return <EmptyState label="No associate allocations for the selected filters." />;

  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const pageStart  = (page - 1) * PAGE_SIZE;
  const pageRows   = rows.slice(pageStart, pageStart + PAGE_SIZE);

  const totAlloc   = rows.reduce((s, r) => s + r.alloc,             0);
  const totPaid    = rows.reduce((s, r) => s + (r.a.amountPaid??0), 0);
  const totPending = rows.reduce((s, r) => s + r.pending,           0);

  return (
    <>
    <div className="fd-table-wrapper">
      <table className="fd-table">
        <thead>
          <tr>
            <th className="fd-th fd-th-num">#</th>
            <th className="fd-th fd-th-project">Project</th>
            <th className="fd-th">Client</th>
            <th className="fd-th">Associate</th>
            <th className="fd-th">Company</th>
            <th className="fd-th fd-th-num">% Share</th>
            <th className="fd-th fd-th-num fd-col-blue">Allocated</th>
            <th className="fd-th fd-th-num fd-col-green">Paid</th>
            <th className="fd-th fd-th-num fd-col-orange">Pending</th>
            <th className="fd-th">Payment Status</th>
          </tr>
        </thead>
        <tbody>
          {pageRows.map(({ p, a, alloc, pending }, i) => {
            const paid   = a.amountPaid ?? 0;
            const isPaid = pending === 0 && alloc > 0;
            return (
              <tr key={`${p._id}-${a._id ?? i}`} className="fd-row">
                <td className="fd-td fd-td-num fd-meta">{pageStart + i + 1}</td>
                <td className="fd-td fd-td-project">
                  <button
                    className="fd-proj-link"
                    onClick={() => navigate(`/projects/${p._id}`, { state: { projectName: p.projectName } })}
                    title="Open project"
                  >
                    <div className="fd-proj-num">{p.projectNumber}</div>
                    <div className="fd-proj-name">{p.projectName} <FaExternalLinkAlt size={9} style={{opacity:0.5}} /></div>
                  </button>
                </td>
                <td className="fd-td fd-td-client">{p.clientId?.name ?? '—'}</td>
                <td className="fd-td"><strong>{a.associateId?.name ?? '—'}</strong></td>
                <td className="fd-td fd-td-client">{a.associateId?.company ?? '—'}</td>
                <td className="fd-td fd-td-num fd-meta">{a.percentage ?? 0}%</td>
                <td className="fd-td fd-td-num fd-num-blue">{fmtCurrency(Math.round(alloc))}</td>
                <td className="fd-td fd-td-num fd-num-green"><strong>{fmtCurrency(paid)}</strong></td>
                <td className={`fd-td fd-td-num ${pending > 0 ? 'fd-num-orange' : 'fd-num-green'}`}>
                  {fmtCurrency(Math.round(pending))}
                </td>
                <td className="fd-td">
                  <span className={`fd-assoc-status ${isPaid ? 'a-paid' : pending > 0 ? 'a-partial' : 'a-nil'}`}>
                    {isPaid ? '✓ Paid' : pending > 0 ? '⏳ Partial' : '— Nil'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="fd-row-total">
            <td /><td /><td /><td /><td />
            <td className="fd-td"><strong>TOTAL</strong></td>
            <td className="fd-td fd-td-num fd-num-blue"><strong>{fmtCurrency(Math.round(totAlloc))}</strong></td>
            <td className="fd-td fd-td-num fd-num-green"><strong>{fmtCurrency(totPaid)}</strong></td>
            <td className="fd-td fd-td-num fd-num-orange"><strong>{fmtCurrency(Math.round(totPending))}</strong></td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
    <Pagination page={page} totalPages={totalPages} totalItems={rows.length} onPage={setPage} />
    </>
  );
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_CLASS = {
  Active: 'status-active', Completed: 'status-completed',
  'On Hold': 'status-onhold', Cancelled: 'status-cancelled',
};
const StatusBadge = ({ status }) => (
  <span className={`fd-status-badge ${STATUS_CLASS[status] ?? 'status-active'}`}>{status}</span>
);

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = ({ label = 'No projects match the current filters.' }) => (
  <div className="fd-empty">
    <div className="fd-empty-icon">🔍</div>
    <p>{label}</p>
  </div>
);

export default FinanceDashboard;
