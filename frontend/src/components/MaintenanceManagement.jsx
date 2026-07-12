import React, { useState, useContext, useRef } from 'react';
import { AppContext } from '../App';
import './MaintenanceManagement.css';

// ---------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------

/**
 * Ordered workflow stages for the Kanban board.
 * Each stage maps to a column.
 *
 * Workflow: Pending → Approved | Rejected (by Asset Manager / Admin)
 *           Approved → Technician Assigned → In Progress → Resolved
 *
 * TODO (Backend): These statuses must match the `maintenance_requests.status`
 *   enum in your database schema.
 */
const STAGES = [
  { key: 'Pending',             label: 'Pending',              icon: '🕐' },
  { key: 'Approved',            label: 'Approved',             icon: '✅' },
  { key: 'Rejected',            label: 'Rejected',             icon: '✕'  },
  { key: 'Technician Assigned', label: 'Technician Assigned',  icon: '👷' },
  { key: 'In Progress',         label: 'In Progress',          icon: '🔧' },
  { key: 'Resolved',            label: 'Resolved',             icon: '🎉' },
];

const PRIORITY_META = {
  Low:      { cls: 'priority-low',    label: 'Low'      },
  Medium:   { cls: 'priority-medium', label: 'Medium'   },
  High:     { cls: 'priority-high',   label: 'High'     },
  Critical: { cls: 'priority-critical', label: 'Critical' },
};

// Who can approve/reject — checked against currentRole from AppContext.
// TODO (Backend): Replace with server-side role check on PATCH /api/maintenance/:id
const CAN_APPROVE_ROLES = ['Admin', 'Asset Manager'];

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// KANBAN CARD
// ---------------------------------------------------------------------------

/**
 * A single maintenance card inside a Kanban column.
 * Clicking it opens the detail / action modal.
 */
function MaintCard({ record, onClick }) {
  return (
    <div
      className={`mm-card priority-border-${record.priority?.toLowerCase()}`}
      onClick={() => onClick(record)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick(record)}
      aria-label={`${record.assetTag} – ${record.description}`}
    >
      <div className="mm-card-header">
        <span className="mm-card-tag">{record.assetTag}</span>
        <span className={`mm-priority-badge ${PRIORITY_META[record.priority]?.cls}`}>
          {record.priority}
        </span>
      </div>
      <p className="mm-card-desc">{record.assetName}</p>
      <p className="mm-card-issue">{record.description}</p>
      {record.technician && (
        <p className="mm-card-tech">👷 {record.technician}</p>
      )}
      {record.resolvedAt && (
        <p className="mm-card-resolved">Resolved {fmtDate(record.resolvedAt)}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// KANBAN BOARD
// ---------------------------------------------------------------------------

function KanbanBoard({ records, onCardClick }) {
  return (
    <div className="mm-kanban">
      {STAGES.map(stage => {
        const cards = records.filter(r => r.status === stage.key);
        return (
          <div key={stage.key} className={`mm-column mm-col-${stage.key.replace(/\s/g, '-').toLowerCase()}`}>
            <div className="mm-col-header">
              <span className="mm-col-icon">{stage.icon}</span>
              <span className="mm-col-label">{stage.label}</span>
              <span className="mm-col-count">{cards.length}</span>
            </div>
            <div className="mm-col-body">
              {cards.length === 0
                ? <p className="mm-col-empty">No requests</p>
                : cards.map(r => (
                    <MaintCard key={r.id} record={r} onClick={onCardClick} />
                  ))
              }
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// RAISE REQUEST FORM
// ---------------------------------------------------------------------------

/**
 * Form to raise a new maintenance request.
 *
 * TODO (Backend): On submit → POST /api/maintenance
 *   Body: { assetTag, assetName, description, priority, photoUrl?, raisedBy }
 *   Response 201: MaintenanceRequestDTO { id, status: "Pending", ... }
 *
 * Photo upload:
 *   TODO (Backend): Upload photo to cloud storage (e.g. S3/GCS) first:
 *     POST /api/uploads/photo → { url }
 *   Then include the returned URL in the maintenance request body.
 *   Currently, only the local filename is stored as a placeholder.
 */
function RaiseRequestForm({ assets, currentUser, onSubmit, onClose }) {
  const [assetTag, setAssetTag]       = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority]       = useState('Medium');
  const [photoFile, setPhotoFile]     = useState(null);   // File object (local preview only)
  const [photoPreview, setPhotoPreview] = useState(null); // local blob URL for preview
  const [error, setError]             = useState('');
  const fileInputRef                  = useRef();

  const selectedAsset = assets.find(a => a.tag === assetTag) || null;

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    // TODO (Frontend): Replace blob URL with actual upload to backend storage.
    setPhotoPreview(URL.createObjectURL(file));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!assetTag)      { setError('Please select an asset.'); return; }
    if (!description.trim()) { setError('Please describe the issue.'); return; }

    onSubmit({
      assetTag,
      assetName: selectedAsset?.name ?? assetTag,
      description: description.trim(),
      priority,
      // TODO (Backend): Replace with actual uploaded URL from POST /api/uploads/photo
      photoUrl: photoFile ? photoFile.name : null,
      raisedBy: currentUser,
    });
    onClose();
  }

  return (
    <div className="mm-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="rr-title">
      <div className="mm-modal">
        <div className="mm-modal-head">
          <h3 id="rr-title" className="mm-modal-title">Raise Maintenance Request</h3>
          <button className="mm-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form className="mm-modal-body" onSubmit={handleSubmit}>
          {/* Asset selector */}
          <div className="mm-field">
            <label htmlFor="rr-asset">Asset *</label>
            {/*
             * TODO (Backend): Populate from GET /api/assets?status=Available,Allocated
             * so only real assets appear in the list.
             */}
            <select id="rr-asset" value={assetTag} onChange={e => { setAssetTag(e.target.value); setError(''); }}>
              <option value="">— Select asset —</option>
              {assets.map(a => (
                <option key={a.tag} value={a.tag}>
                  {a.tag} · {a.name} ({a.status})
                </option>
              ))}
            </select>
          </div>

          {/* Issue description */}
          <div className="mm-field">
            <label htmlFor="rr-desc">Issue Description *</label>
            <textarea
              id="rr-desc"
              rows={3}
              placeholder="Describe the problem clearly, e.g. 'Projector bulb not turning on after power cycle.'"
              value={description}
              onChange={e => { setDescription(e.target.value); setError(''); }}
            />
          </div>

          {/* Priority */}
          <div className="mm-field">
            <label htmlFor="rr-priority">Priority</label>
            <div className="mm-priority-row" id="rr-priority">
              {Object.keys(PRIORITY_META).map(p => (
                <button
                  key={p}
                  type="button"
                  className={`mm-priority-btn ${PRIORITY_META[p].cls} ${priority === p ? 'selected' : ''}`}
                  onClick={() => setPriority(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Photo attachment */}
          <div className="mm-field">
            <label>Attach Photo <span className="mm-optional">(optional)</span></label>
            {/*
             * TODO (Backend): On file select, upload immediately via:
             *   POST /api/uploads/photo (multipart/form-data)
             *   Response: { url: "https://cdn.assetflow.com/photos/xxx.jpg" }
             * Store the returned URL and send it with the maintenance request.
             */}
            <div className="mm-photo-area" onClick={() => fileInputRef.current?.click()}>
              {photoPreview
                ? <img src={photoPreview} alt="Preview" className="mm-photo-preview" />
                : <span className="mm-photo-placeholder">📷 Click to attach a photo</span>
              }
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoChange}
            />
            {photoFile && <p className="mm-photo-name">📎 {photoFile.name}</p>}
          </div>

          {error && <p className="mm-error">{error}</p>}

          <div className="mm-modal-actions">
            <button type="button" className="mm-btn mm-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="mm-btn mm-btn-primary">Submit Request</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DETAIL / ACTION MODAL
// ---------------------------------------------------------------------------

/**
 * Shows full details of a maintenance record and exposes workflow actions.
 *
 * Workflow transitions allowed per role:
 *   Admin / Asset Manager : Pending → Approved | Rejected
 *                           Approved → Technician Assigned (assign tech)
 *   Any role (self-service): Technician Assigned → In Progress
 *                            In Progress → Resolved
 *
 * TODO (Backend): All PATCH calls below should hit:
 *   PATCH /api/maintenance/:id
 *   Body: { status, technician?, resolvedAt? }
 *   Response 200: Updated MaintenanceRequestDTO
 *
 * Asset status side-effects (must be done server-side atomically):
 *   On Approved  → PATCH /api/assets/:tag { status: "Under Maintenance" }
 *   On Resolved  → PATCH /api/assets/:tag { status: "Available" }
 *   TODO (Backend): Wrap both writes in a DB transaction so they can't diverge.
 */
function DetailModal({ record, canApprove, onClose, onTransition }) {
  const [techName, setTechName] = useState(record.technician ?? '');
  const [rejectReason, setRejectReason] = useState('');
  const [mode, setMode] = useState('view'); // 'view' | 'assign' | 'reject'

  function doTransition(newStatus, extra = {}) {
    onTransition(record.id, newStatus, extra);
    onClose();
  }

  const s = record.status;

  return (
    <div className="mm-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="det-title">
      <div className="mm-modal">
        <div className="mm-modal-head">
          <div>
            <span className="mm-modal-tag">{record.assetTag} · {record.assetName}</span>
            <h3 id="det-title" className="mm-modal-title">Maintenance Request</h3>
          </div>
          <button className="mm-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="mm-modal-body">
          {/* Status + Priority */}
          <div className="mm-detail-chips">
            <span className={`mm-status-chip mm-status-${s.replace(/\s/g, '-').toLowerCase()}`}>{s}</span>
            <span className={`mm-priority-badge ${PRIORITY_META[record.priority]?.cls}`}>{record.priority}</span>
          </div>

          {/* Details grid */}
          <div className="mm-detail-grid">
            <div><span className="mm-detail-label">Raised by</span><span>{record.raisedBy ?? record.userName}</span></div>
            <div><span className="mm-detail-label">Date</span><span>{fmtDate(record.date)}</span></div>
            <div className="mm-detail-full">
              <span className="mm-detail-label">Issue</span>
              <span>{record.description}</span>
            </div>
            {record.technician && (
              <div><span className="mm-detail-label">Technician</span><span>👷 {record.technician}</span></div>
            )}
            {record.rejectReason && (
              <div className="mm-detail-full">
                <span className="mm-detail-label">Rejection reason</span>
                <span className="mm-reject-reason">{record.rejectReason}</span>
              </div>
            )}
            {record.resolvedAt && (
              <div><span className="mm-detail-label">Resolved on</span><span>{fmtDate(record.resolvedAt)}</span></div>
            )}
            {record.photoUrl && (
              <div className="mm-detail-full">
                <span className="mm-detail-label">Attached photo</span>
                {/* TODO (Backend): Render <img src={record.photoUrl} /> once real URLs are stored */}
                <span className="mm-photo-link">📎 {record.photoUrl}</span>
              </div>
            )}
          </div>

          {/* ---- Workflow actions ---------------------------------------- */}

          {/* Pending → Approve / Reject (Asset Manager / Admin only) */}
          {s === 'Pending' && canApprove && mode === 'view' && (
            <div className="mm-action-bar">
              <p className="mm-action-hint">
                Approving will set the asset status to <strong>Under Maintenance</strong>.
                {/* TODO (Backend): This side-effect happens server-side atomically. */}
              </p>
              <div className="mm-btn-row">
                <button className="mm-btn mm-btn-ghost" onClick={() => setMode('reject')}>✕ Reject</button>
                <button className="mm-btn mm-btn-primary" onClick={() => doTransition('Approved')}>✅ Approve</button>
              </div>
            </div>
          )}

          {/* Reject with reason */}
          {s === 'Pending' && canApprove && mode === 'reject' && (
            <div className="mm-action-bar">
              <div className="mm-field">
                <label htmlFor="det-reject">Rejection reason</label>
                <textarea id="det-reject" rows={2} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="e.g. Duplicate request, out of budget…" />
              </div>
              <div className="mm-btn-row">
                <button className="mm-btn mm-btn-ghost" onClick={() => setMode('view')}>← Back</button>
                <button className="mm-btn mm-btn-danger" onClick={() => doTransition('Rejected', { rejectReason })}>Confirm Rejection</button>
              </div>
            </div>
          )}

          {/* Pending (not approver) — waiting message */}
          {s === 'Pending' && !canApprove && (
            <div className="mm-waiting-banner">🕐 Awaiting approval from Asset Manager or Admin.</div>
          )}

          {/* Approved → Assign Technician (Asset Manager / Admin) */}
          {s === 'Approved' && canApprove && mode === 'view' && (
            <div className="mm-action-bar">
              <button className="mm-btn mm-btn-primary" onClick={() => setMode('assign')}>👷 Assign Technician</button>
            </div>
          )}

          {s === 'Approved' && canApprove && mode === 'assign' && (
            <div className="mm-action-bar">
              <div className="mm-field">
                <label htmlFor="det-tech">Technician name</label>
                {/*
                 * TODO (Backend): Populate from GET /api/users?role=Technician
                 * and change this to a select instead of a free-text input.
                 */}
                <input id="det-tech" type="text" placeholder="e.g. Ravi Varma" value={techName} onChange={e => setTechName(e.target.value)} />
              </div>
              <div className="mm-btn-row">
                <button className="mm-btn mm-btn-ghost" onClick={() => setMode('view')}>← Back</button>
                <button className="mm-btn mm-btn-primary" disabled={!techName.trim()}
                  onClick={() => doTransition('Technician Assigned', { technician: techName.trim() })}>
                  Confirm Assignment
                </button>
              </div>
            </div>
          )}

          {/* Technician Assigned → In Progress */}
          {s === 'Technician Assigned' && (
            <div className="mm-action-bar">
              <p className="mm-action-hint">Technician <strong>{record.technician}</strong> is assigned. Mark as started when work begins.</p>
              <button className="mm-btn mm-btn-primary" onClick={() => doTransition('In Progress')}>
                🔧 Mark In Progress
              </button>
            </div>
          )}

          {/* In Progress → Resolved */}
          {s === 'In Progress' && (
            <div className="mm-action-bar">
              <p className="mm-action-hint">
                Resolving will set the asset status back to <strong>Available</strong>.
                {/* TODO (Backend): This side-effect happens server-side atomically. */}
              </p>
              <button className="mm-btn mm-btn-success" onClick={() => doTransition('Resolved', { resolvedAt: new Date().toISOString() })}>
                🎉 Mark Resolved
              </button>
            </div>
          )}

          {/* Resolved / Rejected — read-only */}
          {(s === 'Resolved' || s === 'Rejected') && (
            <div className="mm-action-bar">
              <button className="mm-btn mm-btn-ghost" onClick={onClose}>Close</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// HISTORY TABLE
// ---------------------------------------------------------------------------

/**
 * Flat list of all maintenance records for a specific asset tag.
 * Shown in the Asset History panel at the bottom.
 *
 * TODO (Backend): GET /api/maintenance?assetTag=AF-0099&includeResolved=true
 */
function AssetHistoryTable({ records, filterTag, onClearFilter }) {
  const rows = filterTag ? records.filter(r => r.assetTag === filterTag) : records;
  if (!rows.length) return <p className="mm-empty-msg">{filterTag ? `No history for ${filterTag}.` : 'No maintenance records yet.'}</p>;

  return (
    <div className="mm-table-wrap">
      {filterTag && (
        <div className="mm-history-filter-bar">
          Showing history for <strong>{filterTag}</strong>
          <button className="mm-clear-filter" onClick={onClearFilter}>✕ Clear</button>
        </div>
      )}
      <table className="mm-table">
        <thead>
          <tr>
            <th>Asset</th>
            <th>Issue</th>
            <th>Priority</th>
            <th>Raised by</th>
            <th>Status</th>
            <th>Technician</th>
            <th>Raised on</th>
            <th>Resolved on</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} className={r.status === 'Resolved' ? 'mm-row-resolved' : r.status === 'Rejected' ? 'mm-row-rejected' : ''}>
              <td><span className="mm-tag-mono">{r.assetTag}</span> {r.assetName}</td>
              <td className="mm-td-desc">{r.description}</td>
              <td><span className={`mm-priority-badge ${PRIORITY_META[r.priority]?.cls}`}>{r.priority}</span></td>
              <td>{r.raisedBy ?? r.userName}</td>
              <td><span className={`mm-status-chip mm-status-${r.status.replace(/\s/g, '-').toLowerCase()}`}>{r.status}</span></td>
              <td>{r.technician ?? '—'}</td>
              <td>{fmtDate(r.date)}</td>
              <td>{fmtDate(r.resolvedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------

/**
 * MaintenanceManagement – Screen 7
 *
 * Data flow (current — all state lives in AppContext via App.jsx):
 *   reads:  context.maintenance, context.assets, context.currentRole, context.employees
 *   writes: context.createMaintenanceRequest, context.logActivity, local state for
 *           status transitions (persisted to localStorage via App.jsx useEffect)
 *
 * TODO (Backend): Replace all context reads/writes with API calls:
 *   GET  /api/maintenance             → MaintenanceRequestDTO[]
 *   POST /api/maintenance             → 201 MaintenanceRequestDTO
 *   PATCH /api/maintenance/:id        → 200 MaintenanceRequestDTO
 *     Includes server-side asset status mutation (Under Maintenance / Available)
 *
 * MaintenanceRequestDTO shape:
 *   { id, assetTag, assetName, description, priority, status, raisedBy,
 *     technician?, rejectReason?, photoUrl?, date (ISO), resolvedAt? (ISO) }
 */
const MaintenanceManagement = () => {
  const {
    maintenance,
    assets,
    currentRole,
    logActivity,
    loadGlobalState,
  } = useContext(AppContext);

  // Local enriched copy of records so workflow transitions reflect immediately.
  // TODO (Backend): Replace with react-query / SWR mutation + invalidation.
  const [records, setRecords] = useState(() =>
    maintenance.map(r => ({
      ...r,
      raisedBy: r.userName ?? r.raisedBy ?? 'Unknown',
      priority: r.priority ?? 'Medium',
    }))
  );

  const [showRaiseForm,  setShowRaiseForm]  = useState(false);
  const [detailRecord,   setDetailRecord]   = useState(null);
  const [historyFilter,  setHistoryFilter]  = useState('');   // filter history by assetTag
  const [searchQuery,    setSearchQuery]    = useState('');

  const canApprove = CAN_APPROVE_ROLES.includes(currentRole);

  /** Logged-in user name derived from simulated role. */
  const getCurrentUserName = () => {
    // TODO (Backend): Replace with auth session / JWT claim.
    switch (currentRole) {
      case 'Admin':           return 'Kunal Singh';
      case 'Asset Manager':   return 'Vikram Seth';
      case 'Department Head': return 'Aditi Rao';
      case 'Employee':        return 'Priya Shah';
      default:                return 'Kunal Singh';
    }
  };

  async function handleRaise(data) {
    try {
      const payload = {
        assetId: assets.find(a => a.tag === data.assetTag)?.id,
        description: data.description,
        priority: data.priority,
        raisedById: 1, // fallback
      };
      await import('../api/maintenanceApi').then(m => m.createMaintenance(payload));
      logActivity('maintenance', `Maintenance request raised for ${data.assetName} (${data.assetTag}) — ${data.priority} priority.`);
      await loadGlobalState();
    } catch (e) {
      console.error('Failed to raise request', e);
    }
  }

  async function handleTransition(id, newStatus, extras = {}) {
    try {
      const payload = { status: newStatus, ...extras };
      if (extras.resolvedAt) {
        payload.resolvedAt = new Date(extras.resolvedAt).toISOString();
      }
      await import('../api/maintenanceApi').then(m => m.updateMaintenance(id, payload));
      
      const target = records.find(r => r.id === id);
      if (target) {
        if (newStatus === 'Approved') {
          logActivity('maintenance', `Maintenance approved for ${target.assetName} (${target.assetTag}) — asset set to Under Maintenance.`);
        } else if (newStatus === 'Rejected') {
          logActivity('maintenance', `Maintenance request for ${target.assetName} (${target.assetTag}) rejected.`);
        } else if (newStatus === 'Technician Assigned') {
          logActivity('maintenance', `Technician ${extras.technician} assigned to ${target.assetName} (${target.assetTag}).`);
        } else if (newStatus === 'Resolved') {
          logActivity('maintenance', `${target.assetName} (${target.assetTag}) maintenance resolved — asset back to Available.`);
        }
      }
      await loadGlobalState();
    } catch (e) {
      console.error('Failed to transition status', e);
    }
  }

  // Filtered records for the Kanban board
  const filteredRecords = searchQuery.trim()
    ? records.filter(r =>
        r.assetTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.assetName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : records;

  // Stats for the summary bar
  const stats = {
    pending:    records.filter(r => r.status === 'Pending').length,
    inProgress: records.filter(r => r.status === 'In Progress').length,
    resolved:   records.filter(r => r.status === 'Resolved').length,
  };

  return (
    <div className="mm-screen">

      {/* ---------------------------------------------------------------- */}
      {/* PAGE HEADER                                                       */}
      {/* ---------------------------------------------------------------- */}
      <div className="mm-header">
        <div>
          <h2 className="mm-page-title">Maintenance Management</h2>
          <p className="mm-page-sub">
            Route repairs through an approval workflow. Approving locks the asset; resolving frees it.
          </p>
        </div>
        <button
          id="btn-raise-request"
          className="mm-btn mm-btn-primary mm-btn-lg"
          onClick={() => setShowRaiseForm(true)}
        >
          + Raise Request
        </button>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* SUMMARY STATS BAR                                                */}
      {/* ---------------------------------------------------------------- */}
      <div className="mm-stats-bar">
        <div className="mm-stat mm-stat-pending">
          <span className="mm-stat-num">{stats.pending}</span>
          <span className="mm-stat-label">Pending</span>
        </div>
        <div className="mm-stat mm-stat-progress">
          <span className="mm-stat-num">{stats.inProgress}</span>
          <span className="mm-stat-label">In Progress</span>
        </div>
        <div className="mm-stat mm-stat-resolved">
          <span className="mm-stat-num">{stats.resolved}</span>
          <span className="mm-stat-label">Resolved</span>
        </div>
        <div className="mm-stat mm-stat-total">
          <span className="mm-stat-num">{records.length}</span>
          <span className="mm-stat-label">Total</span>
        </div>
      </div>

      {/* Role notice */}
      {!canApprove && (
        <div className="mm-role-notice">
          🔒 You are viewing as <strong>{currentRole}</strong>. Only Asset Managers and Admins can approve or reject requests.
        </div>
      )}

      {/* Kanban search */}
      <div className="mm-search-bar">
        <span className="mm-search-icon">🔍</span>
        <input
          type="text"
          className="mm-search-input"
          placeholder="Filter by asset tag, name, or issue…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="mm-clear-search" onClick={() => setSearchQuery('')}>✕</button>
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* KANBAN BOARD                                                      */}
      {/* ---------------------------------------------------------------- */}
      {/*
       * The Kanban board renders one column per workflow stage.
       * Cards are clickable → opens DetailModal for workflow actions.
       *
       * TODO (Frontend): Add drag-and-drop (e.g. @dnd-kit) to allow managers
       *   to drag cards between columns as a shortcut for status transitions.
       *   Each drop should call handleTransition() which hits the backend PATCH.
       */}
      <KanbanBoard
        records={filteredRecords}
        onCardClick={r => {
          setDetailRecord(r);
          setHistoryFilter(r.assetTag);
        }}
      />

      {/* ---------------------------------------------------------------- */}
      {/* ASSET MAINTENANCE HISTORY                                         */}
      {/* ---------------------------------------------------------------- */}
      <section className="mm-panel mm-history-panel">
        <div className="mm-panel-header">
          <h3 className="mm-panel-title">Maintenance History</h3>
          {historyFilter && (
            <span className="mm-history-asset-badge">{historyFilter}</span>
          )}
        </div>
        {/*
         * TODO (Backend): GET /api/maintenance?assetTag=:tag&includeAll=true
         * Returns full history including resolved and rejected records.
         */}
        <AssetHistoryTable
          records={records}
          filterTag={historyFilter}
          onClearFilter={() => setHistoryFilter('')}
        />
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* MODALS                                                            */}
      {/* ---------------------------------------------------------------- */}
      {showRaiseForm && (
        <RaiseRequestForm
          assets={assets}
          currentUser={getCurrentUserName()}
          onSubmit={handleRaise}
          onClose={() => setShowRaiseForm(false)}
        />
      )}

      {detailRecord && (
        <DetailModal
          record={detailRecord}
          canApprove={canApprove}
          onClose={() => setDetailRecord(null)}
          onTransition={handleTransition}
        />
      )}
    </div>
  );
};

export default MaintenanceManagement;
