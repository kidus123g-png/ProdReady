import React from 'react';
import { Project } from '../types';
import { FileCheck, X, Printer } from 'lucide-react';

export const cleanText = (text: string): string => {
  if (!text) return '';
  return text.replace(/Valedation/gi, 'Validation');
};

export const buildReportHTML = (proj: Project): string => {
  const totalItems = proj.items.length;
  const highItemsCount = proj.items.filter(i => i.priority === 'high').length;
  const medItemsCount = proj.items.filter(i => i.priority === 'medium').length;
  const lowItemsCount = proj.items.filter(i => i.priority === 'low').length;
  const completedCount = proj.items.filter(i => i.status === 'completed').length;
  const completionPercentage = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;
  const generatedDateStr = new Date().toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // 1. Build Phase Rows html
  const focusPhasesRows = proj.categories.map(cat => {
    const catItems = proj.items.filter(i => i.category === cat.id);
    const total = catItems.length;
    const completed = catItems.filter(i => i.status === 'completed').length;
    
    let statusText = 'PENDING';
    let statusClass = 'pill-pending';
    if (completed === total && total > 0) {
      statusText = 'COMPLETE';
      statusClass = 'pill-complete';
    } else if (completed > 0) {
      statusText = 'IN PROGRESS';
      statusClass = 'pill-progress';
    }
    
    return `
      <tr>
        <td style="font-weight: 500;">${cleanText(cat.name)}</td>
        <td style="text-align: center;">${completed}</td>
        <td style="text-align: center;">${total}</td>
        <td style="text-align: center;"><span class="${statusClass}">${statusText}</span></td>
      </tr>
    `;
  }).join('');

  // 2. Build Team Roster rows html
  const teamRosterRows = proj.team.map(m => {
    const memberTasks = proj.items.filter(i => i.assignedTo?.includes(m.id));
    const count = memberTasks.length;
    const initials = m.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    
    const countText = count > 0 
      ? `<span>${count} tasks</span>` 
      : `<span class="muted-text">No tasks assigned</span>`;
      
    const avatarBg = '#787774';
    
    return `
      <div class="member-row">
        <div class="member-avatar" style="background-color: ${avatarBg};">${initials}</div>
        <div class="member-info">
          <span class="member-name">${cleanText(m.name)}</span>
          <span class="member-role">${cleanText(m.role)}</span>
        </div>
        <div class="member-count">${countText}</div>
      </div>
    `;
  }).join('');

  // Filter index for task grouping (Pages 3+)
  const nonCanceledCategories = proj.categories;
  const phasesContent = nonCanceledCategories.map((cat, catIdx) => {
    const catItems = proj.items.filter(i => i.category === cat.id);
    if (catItems.length === 0) return '';
    
    const completed = catItems.filter(i => i.status === 'completed').length;
    const total = catItems.length;
    
    const itemsHTML = catItems.map(item => {
      let priorityColor = '#aeaca8';
      let badgeClass = 'badge-low';
      let priorityLabel = 'Low';
      
      if (item.priority === 'high') {
        priorityColor = '#e03e3e';
        badgeClass = 'badge-high';
        priorityLabel = 'High';
      } else if (item.priority === 'medium') {
        priorityColor = '#d9730d';
        badgeClass = 'badge-med';
        priorityLabel = 'Medium';
      } else if (item.priority === 'low') {
        priorityColor = '#0f7b6c';
        badgeClass = 'badge-low';
        priorityLabel = 'Low';
      }

      const assignees = proj.team.filter(t => item.assignedTo?.includes(t.id));
      const assigneeNames = assignees.length > 0 
        ? assignees.map(a => a.name).join(', ') 
        : 'Unassigned';

      let statusIndicator = '○  Not started';
      if (item.status === 'completed') {
        statusIndicator = '●  Completed';
      } else if (item.status === 'in-progress') {
        statusIndicator = '◐  In progress';
      }

      const statusStyle = item.status === 'completed' 
        ? 'color: #166534; font-weight: 500;' 
        : item.status === 'in-progress'
        ? 'color: #d9730d; font-weight: 500;'
        : 'color: #787774;';

      const cardClass = `task-card ${item.priority}`;

      return `
        <div class="${cardClass}" style="border-left: 3px solid ${priorityColor};">
          <div class="card-row-1">
            <h4 class="card-title">${cleanText(item.title)}</h4>
            <span class="priority-badge ${badgeClass}">${priorityLabel}</span>
          </div>
          <p class="card-desc">${cleanText(item.description)}</p>
          <div class="card-metadata">
            <div>Phase: ${cleanText(cat.name)}</div>
            <div>Assignee: ${cleanText(assigneeNames)}</div>
          </div>
          <div class="card-status" style="${statusStyle}">
            ${statusIndicator}
          </div>
        </div>
      `;
    }).join('');

    const isLastPhase = catIdx === nonCanceledCategories.length - 1;
    const pageBreakStyle = isLastPhase ? '' : 'style="page-break-after: always;"';

    return `
      <div class="phase-group" ${pageBreakStyle}>
        <div class="phase-header-bar">
          <h3 class="phase-header-title">${cleanText(cat.name)}</h3>
          <span class="phase-header-comp">${completed} / ${total} items complete</span>
        </div>
        <div>
          ${itemsHTML}
        </div>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Executive Audit Report - ${cleanText(proj.name)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4;
      margin: 20mm 16mm;
    }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      color: #37352f;
      background: #ffffff;
      font-size: 13px;
      line-height: 1.5;
      margin: 0;
      padding: 0;
    }
    * { 
      box-sizing: border-box;
      -webkit-print-color-adjust: exact; 
      print-color-adjust: exact; 
    }
    
    /* Cover Page CSS */
    .page-cover {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      min-height: 250mm;
      height: 100%;
      position: relative;
      box-sizing: border-box;
      padding: 20px;
      page-break-after: always;
    }
    .cover-logo {
      font-size: 32px;
      font-weight: 600;
      color: #37352f;
      margin: 0;
    }
    .cover-subtitle {
      font-size: 18px;
      font-weight: 400;
      color: #787774;
      margin: 4px 0 0 0;
    }
    .cover-hr {
      border: none;
      border-top: 1px solid #e9e9e7;
      width: 60%;
      margin: 32px auto;
    }
    .cover-project-name {
      font-size: 22px;
      font-weight: 500;
      color: #37352f;
      margin: 0 0 8px 0;
    }
    .cover-desc {
      font-size: 14px;
      color: #787774;
      max-width: 480px;
      margin: 0 auto;
      text-align: center;
      line-height: 1.5;
    }
    .cover-date {
      font-size: 12px;
      color: #aeaca8;
      margin-top: 8px;
    }
    .cover-spacer {
      height: 80px;
    }
    .cover-metrics {
      display: flex;
      justify-content: center;
      gap: 48px;
      margin-top: 48px;
      width: 100%;
    }
    .cover-metric-box {
      text-align: center;
    }
    .cover-metric-value {
      font-size: 28px;
      font-weight: 600;
      color: #37352f;
      margin: 0;
    }
    .cover-metric-label {
      font-size: 12px;
      font-weight: 400;
      color: #aeaca8;
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .cover-confidential {
      position: absolute;
      bottom: 10mm;
      left: 0;
      right: 0;
      font-size: 10px;
      color: #aeaca8;
      text-align: center;
      letter-spacing: 0.1em;
    }

    /* Page-Section for dashboard */
    .page-section {
      page-break-after: always;
      box-sizing: border-box;
      padding-top: 10px;
    }
    .section-header {
      font-size: 16px;
      font-weight: 500;
      border-bottom: 1px solid #e9e9e7;
      padding-bottom: 8px;
      margin-top: 0;
      margin-bottom: 20px;
      color: #37352f;
    }
    .two-column-grid {
      display: flex;
      gap: 24px;
      margin-bottom: 24px;
    }
    .column-half {
      flex: 1;
      width: 50%;
    }
    .section-lbl {
      font-size: 11px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: #aeaca8;
      margin-bottom: 12px;
    }
    
    /* Tables styling */
    .phases-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .phases-table th {
      text-align: left;
      padding: 8px 4px;
      border-bottom: 1px solid #e9e9e7;
      color: #787774;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .phases-table td {
      padding: 10px 4px;
      border-bottom: 1px solid #e9e9e7;
    }
    .pill-pending {
      background-color: #fffbeb !important;
      color: #92400e !important;
      border: 1px solid #fde68a;
      padding: 2px 6px;
      font-size: 10px;
      border-radius: 3px;
      font-weight: 500;
    }
    .pill-progress {
      background-color: #eff6ff !important;
      color: #1e40af !important;
      border: 1px solid #bfdbfe;
      padding: 2px 6px;
      font-size: 10px;
      border-radius: 3px;
      font-weight: 500;
    }
    .pill-complete {
      background-color: #f0fdf4 !important;
      color: #166534 !important;
      border: 1px solid #bbf7d0;
      padding: 2px 6px;
      font-size: 10px;
      border-radius: 3px;
      font-weight: 500;
    }
    
    /* Roster list */
    .member-row {
      display: flex;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #e9e9e7;
    }
    .member-avatar {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      color: #ffffff;
      font-size: 9px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 8px;
    }
    .member-info {
      flex-grow: 1;
    }
    .member-name {
      font-weight: 500;
    }
    .member-role {
      font-size: 11px;
      color: #787774;
      margin-left: 6px;
    }
    .member-count {
      font-size: 11px;
      color: #aeaca8;
      font-family: monospace;
    }
    .muted-text {
      color: #aeaca8;
      font-style: italic;
    }
    
    /* Risk boxes */
    .risk-summary-bar {
      display: flex;
      gap: 16px;
      margin-top: 16px;
    }
    .risk-box {
      flex: 1;
      padding: 12px 24px;
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
    }
    .risk-box.high {
      background-color: #fef2f2 !important;
      color: #991b1b !important;
      border: 1px solid #fecaca;
    }
    .risk-box.med {
      background-color: #fffbeb !important;
      color: #92400e !important;
      border: 1px solid #fde68a;
    }
    .risk-box.low {
      background-color: #f0fdf4 !important;
      color: #166534 !important;
      border: 1px solid #bbf7d0;
    }
    .risk-box-count {
      font-size: 22px;
      font-weight: 600;
      line-height: 1;
    }
    .risk-box-lbl {
      font-size: 11px;
      margin-top: 4px;
      font-weight: 400;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    /* Checklist groupings */
    .phase-group {
      page-break-after: always;
      box-sizing: border-box;
      padding-top: 10px;
    }
    .phase-group:last-of-type {
      page-break-after: avoid !important;
    }
    .phase-header-bar {
      background: #f7f6f3 !important;
      padding: 10px 16px;
      border-left: 3px solid #37352f;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .phase-header-title {
      font-size: 14px;
      font-weight: 600;
      margin: 0;
      color: #37352f;
    }
    .phase-header-comp {
      font-size: 12px;
      color: #787774;
    }
    
    /* Card details */
    .task-card {
      border: 1px solid #e9e9e7;
      border-radius: 4px;
      padding: 12px 16px;
      margin-bottom: 8px;
      page-break-inside: avoid !important;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    
    .card-row-1 {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }
    .card-title {
      font-size: 14px;
      font-weight: 500;
      margin: 0;
      color: #37352f;
    }
    .priority-badge {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 3px;
      font-weight: 600;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .badge-high {
      background-color: #fef2f2 !important;
      color: #991b1b !important;
      border: 1px solid #fecaca;
    }
    .badge-med {
      background-color: #fffbeb !important;
      color: #92400e !important;
      border: 1px solid #fde68a;
    }
    .badge-low {
      background-color: #f0fdf4 !important;
      color: #166534 !important;
      border: 1px solid #bbf7d0;
    }
    
    .card-desc {
      font-size: 12px;
      color: #787774;
      line-height: 1.5;
      margin: 6px 0 0 0;
    }
    
    .card-metadata {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #aeaca8;
      margin-top: 4px;
    }
    .card-status {
      font-size: 11px;
      color: #aeaca8;
      margin-top: 2px;
      font-weight: 500;
    }
  </style>
</head>
<body>

  <!-- PAGE 1: Cover Page -->
  <div class="page-cover">
    <h1 class="cover-logo">ProdReady</h1>
    <h2 class="cover-subtitle">Executive Audit Report</h2>
    <hr class="cover-hr">
    <h3 class="cover-project-name">${cleanText(proj.name)}</h3>
    <p class="cover-desc">${cleanText(proj.description || 'Verified software compliance checklist tracking data integrity, secrets lifecycle, and architectural specifications.')}</p>
    <div class="cover-date">Generated on ${generatedDateStr}</div>
    
    <div class="cover-spacer"></div>
    
    <div class="cover-metrics">
      <div class="cover-metric-box">
        <div class="cover-metric-value">${totalItems}</div>
        <div class="cover-metric-label">Total items</div>
      </div>
      <div class="cover-metric-box">
        <div class="cover-metric-value">${highItemsCount}</div>
        <div class="cover-metric-label">High blockers</div>
      </div>
      <div class="cover-metric-box">
        <div class="cover-metric-value">${completionPercentage}%</div>
        <div class="cover-metric-label">Completion</div>
      </div>
    </div>
    
    <div class="cover-confidential">CONFIDENTIAL — INTERNAL USE ONLY</div>
  </div>

  <!-- PAGE 2: Summary Dashboard -->
  <div class="page-section">
    <h2 class="section-header">Project Overview</h2>
    
    <div class="two-column-grid">
      <!-- Left Column: Focus Phases -->
      <div class="column-half">
        <div class="section-lbl">Focus phases</div>
        <table class="phases-table">
          <thead>
            <tr>
              <th>Phase</th>
              <th style="text-align: center;">Completed</th>
              <th style="text-align: center;">Total</th>
              <th style="text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${focusPhasesRows}
          </tbody>
        </table>
      </div>
      
      <!-- Right Column: Team Roster -->
      <div class="column-half">
        <div class="section-lbl">Team roster</div>
        <div>
          ${teamRosterRows || '<div class="muted-text">No crew members registered.</div>'}
        </div>
      </div>
    </div>
    
    <!-- Below the Grid: Risk summary bar -->
    <div style="margin-top: 32px;">
      <div class="section-lbl">Risk profiles</div>
      <div class="risk-summary-bar">
        <div class="risk-box high">
          <div class="risk-box-count">${highItemsCount}</div>
          <div class="risk-box-lbl">HIGH</div>
        </div>
        <div class="risk-box med">
          <div class="risk-box-count">${medItemsCount}</div>
          <div class="risk-box-lbl">MED</div>
        </div>
        <div class="risk-box low">
          <div class="risk-box-count">${lowItemsCount}</div>
          <div class="risk-box-lbl">LOW</div>
        </div>
      </div>
    </div>
  </div>

  <!-- PAGES 3+: Checklist details, grouped by phase -->
  ${phasesContent}

</body>
</html>
`;
};

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  isLightMode: boolean;
}

export default function ExecutiveReportModal({
  isOpen,
  onClose,
  project,
  isLightMode
}: ExecutiveReportModalProps) {
  if (!isOpen) return null;

  const generatePDF = (proj: Project) => {
    const html = buildReportHTML(proj);
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.onload = () => {
      win.print();
      win.onafterprint = () => win.close();
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-neutral-950/60 overflow-y-auto">
      <div 
        className={`w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border flex flex-col p-6 space-y-6 transition-all duration-200 ${
          isLightMode 
            ? 'bg-white border-neutral-200 text-neutral-800' 
            : 'bg-neutral-900 border-neutral-800 text-white'
        }`}
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight">Executive Audit PDF</h3>
              <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                Staging Compliance Report
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-neutral-500 leading-relaxed">
            Ready to generate the official executive audit and verification package. 
            This will launch a clean, standalone printable report containing:
          </p>
          <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400 font-mono">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>Full A4 executive cover page & summary metrics</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>Gating matrix and team operational roster</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>All compliance checklist cards grouped by phase</span>
            </li>
          </ul>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => generatePDF(project)}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-550 text-white text-xs font-semibold rounded-xl shadow-sm transition transform active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Generate PDF Report</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-neutral-300 dark:border-neutral-750 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-semibold rounded-xl transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
