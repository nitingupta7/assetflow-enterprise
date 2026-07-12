import React, { useState, useEffect, useContext, useRef } from 'react';
import { AppContext } from '../App';
import './ResourceBooking.css';

// ---------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------

// Hours displayed on the day timeline (24-h)
const TIMELINE_START_HOUR = 8;   // 8 AM
const TIMELINE_END_HOUR   = 20;  // 8 PM
const PX_PER_HOUR         = 72;  // pixel height of one hour slot

// Booking status labels and colour tokens used across the UI
const STATUS_META = {
  Upcoming:   { label: 'Upcoming',   cls: 'status-upcoming'   },
  Ongoing:    { label: 'Ongoing',    cls: 'status-ongoing'    },
  Completed:  { label: 'Completed',  cls: 'status-completed'  },
  Cancelled:  { label: 'Cancelled',  cls: 'status-cancelled'  },
};

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

/** Convert a "YYYY-MM-DDTHH:mm" string to fractional hours since midnight. */
function toHours(isoLocal) {
  const [, time] = isoLocal.split('T');
  const [h, m]   = time.split(':').map(Number);
  return h + m / 60;
}

/** Format ISO-local string → "9:00 AM" */
function fmtTime(isoLocal) {
  const [, time] = isoLocal.split('T');
  const [h, m]   = time.split(':').map(Number);
  const ampm     = h >= 12 ? 'PM' : 'AM';
  const h12      = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

/** Format ISO-local string → "Tue, 7 Jul 2026" */
function fmtDate(isoLocal) {
  const [date] = isoLocal.split('T');
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

/** Today as "YYYY-MM-DD" in local time. */
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Derive the live status of a booking based on current time.
 * Cancelled bookings keep their status.
 *
 * TODO (Backend): Replace this client-side derivation with a status field
 * returned by the API: GET /api/bookings/:id → { status: "Upcoming"|"Ongoing"|"Completed"|"Cancelled" }
 * The backend should update status automatically via a scheduled job.
 */
function deriveStatus(booking) {
  if (booking.status === 'Cancelled') return 'Cancelled';
  const now   = Date.now();
  const start = new Date(booking.startTime).getTime();
  const end   = new Date(booking.endTime).getTime();
  if (now < start)  return 'Upcoming';
  if (now >= end)   return 'Completed';
  return 'Ongoing';
}

/**
 * Overlap check: returns true if [aStart, aEnd) overlaps [bStart, bEnd).
 * Rule: a booking ending exactly when another starts is NOT a conflict.
 *
 * TODO (Backend): Mirror this logic server-side in POST /api/bookings.
 * The backend must enforce overlap validation at the DB level (advisory locks
 * or a CHECK constraint on the bookings table) to prevent race conditions.
 */
function hasOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

// ---------------------------------------------------------------------------
// SUB-COMPONENTS
// ---------------------------------------------------------------------------

/** A single booking block rendered on the day timeline. */
function TimelineBlock({ booking, onSelect, isConflict }) {
  const startH  = toHours(booking.startTime);
  const endH    = toHours(booking.endTime);
  const topPx   = (startH - TIMELINE_START_HOUR) * PX_PER_HOUR;
  const heightPx = Math.max((endH - startH) * PX_PER_HOUR, 28);
  const status  = deriveStatus(booking);

  return (
    <div
      className={`timeline-block ${isConflict ? 'conflict' : ''} ${STATUS_META[status]?.cls ?? ''}`}
      style={{ top: topPx, height: heightPx }}
      title={`${booking.bookedBy} · ${fmtTime(booking.startTime)} – ${fmtTime(booking.endTime)}`}
      onClick={() => onSelect(booking)}
      role="button"
      aria-label={`Booking by ${booking.bookedBy}`}
    >
      <span className="block-title">{booking.bookedBy}</span>
      <span className="block-time">{fmtTime(booking.startTime)} – {fmtTime(booking.endTime)}</span>
      {isConflict && <span className="block-conflict-label">⚠ Conflict</span>}
    </div>
  );
}

/** Ghost block showing a pending (not-yet-submitted) booking request. */
function GhostBlock({ startTime, endTime, isConflict }) {
  if (!startTime || !endTime) return null;
  const startH   = toHours(startTime);
  const endH     = toHours(endTime);
  if (endH <= startH) return null;
  const topPx    = (startH - TIMELINE_START_HOUR) * PX_PER_HOUR;
  const heightPx = Math.max((endH - startH) * PX_PER_HOUR, 28);

  return (
    <div
      className={`timeline-block ghost ${isConflict ? 'ghost-conflict' : 'ghost-ok'}`}
      style={{ top: topPx, height: heightPx }}
      aria-hidden="true"
    >
      <span className="block-title">Your request</span>
      <span className="block-time">{fmtTime(startTime)} – {fmtTime(endTime)}</span>
      {isConflict
        ? <span className="block-conflict-label">⚠ slot unavailable</span>
        : <span className="block-ok-label">✓ slot available</span>
      }
    </div>
  );
}

/** Hour-ruler on the left of the timeline. */
function HourRuler() {
  const hours = [];
  for (let h = TIMELINE_START_HOUR; h <= TIMELINE_END_HOUR; h++) {
    const label = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
    hours.push(
      <div key={h} className="hour-mark" style={{ top: (h - TIMELINE_START_HOUR) * PX_PER_HOUR }}>
        <span className="hour-label">{label}</span>
        <div className="hour-line" />
      </div>
    );
  }
  return <div className="hour-ruler">{hours}</div>;
}

// ---------------------------------------------------------------------------
// BOOKING DETAIL MODAL
// ---------------------------------------------------------------------------

/**
 * Shows full details of a selected booking and allows Cancel / Reschedule.
 *
 * TODO (Backend): Cancel  → PATCH /api/bookings/:id  { status: "Cancelled" }
 * TODO (Backend): Reschedule → PATCH /api/bookings/:id  { startTime, endTime }
 *                 Server must re-validate overlap before accepting the update.
 */
function BookingDetailModal({ booking, allBookings, onClose, onCancel, onReschedule }) {
  const [mode, setMode]           = useState('view');  // 'view' | 'reschedule'
  const [newStart, setNewStart]   = useState(booking.startTime);
  const [newEnd, setNewEnd]       = useState(booking.endTime);
  const [rescheduleErr, setErr]   = useState('');

  const status = deriveStatus(booking);

  function handleReschedule() {
    if (!newStart || !newEnd || newEnd <= newStart) {
      setErr('End time must be after start time.');
      return;
    }
    // Check overlap with all OTHER bookings on the same asset and same day
    const conflict = allBookings.find(b =>
      b.id !== booking.id &&
      b.assetTag === booking.assetTag &&
      b.status !== 'Cancelled' &&
      hasOverlap(newStart, newEnd, b.startTime, b.endTime)
    );
    if (conflict) {
      setErr(`Conflicts with ${conflict.bookedBy}'s booking (${fmtTime(conflict.startTime)} – ${fmtTime(conflict.endTime)}).`);
      return;
    }
    onReschedule(booking.id, newStart, newEnd);
    onClose();
  }

  return (
    <div className="rb-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="rb-modal">
        {/* Header */}
        <div className="rb-modal-head">
          <div>
            <p className="rb-modal-asset">{booking.assetName} · <span className="rb-tag">{booking.assetTag}</span></p>
            <h3 id="modal-title" className="rb-modal-title">Booking Detail</h3>
          </div>
          <button className="rb-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Body */}
        <div className="rb-modal-body">
          <div className="rb-detail-grid">
            <div><span className="rb-detail-label">Booked by</span><span>{booking.bookedBy}</span></div>
            <div><span className="rb-detail-label">Status</span>
              <span className={`rb-status-badge ${STATUS_META[status]?.cls}`}>{status}</span>
            </div>
            <div><span className="rb-detail-label">Date</span><span>{fmtDate(booking.startTime)}</span></div>
            <div><span className="rb-detail-label">Time</span><span>{fmtTime(booking.startTime)} – {fmtTime(booking.endTime)}</span></div>
            {booking.purpose && (
              <div className="rb-detail-full"><span className="rb-detail-label">Purpose</span><span>{booking.purpose}</span></div>
            )}
          </div>

          {/* Reminder notice - shown for Upcoming bookings */}
          {status === 'Upcoming' && (
            /*
             * TODO (Backend): Wire to a notification service.
             * POST /api/notifications/schedule  { bookingId, triggerAt: startTime - 15min }
             * Currently this is a static UI indicator only.
             */
            <div className="rb-reminder-banner">
              🔔 A reminder will be sent 15 minutes before the slot starts.
            </div>
          )}

          {/* Reschedule form */}
          {mode === 'reschedule' && (
            <div className="rb-reschedule-form">
              <h4 className="rb-section-label">Reschedule</h4>
              <div className="rb-field-row">
                <div className="rb-field">
                  <label htmlFor="rs-start">New Start</label>
                  <input id="rs-start" type="datetime-local" value={newStart}
                    onChange={e => { setNewStart(e.target.value); setErr(''); }} />
                </div>
                <div className="rb-field">
                  <label htmlFor="rs-end">New End</label>
                  <input id="rs-end" type="datetime-local" value={newEnd}
                    onChange={e => { setNewEnd(e.target.value); setErr(''); }} />
                </div>
              </div>
              {rescheduleErr && <p className="rb-error">{rescheduleErr}</p>}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="rb-modal-actions">
          {status === 'Upcoming' || status === 'Ongoing' ? (
            <>
              {mode === 'view' ? (
                <>
                  <button className="rb-btn rb-btn-ghost" onClick={() => setMode('reschedule')}
                    disabled={status === 'Ongoing'} title={status === 'Ongoing' ? 'Cannot reschedule an ongoing booking' : ''}>
                    📅 Reschedule
                  </button>
                  <button className="rb-btn rb-btn-danger" onClick={() => { onCancel(booking.id); onClose(); }}>
                    ✕ Cancel Booking
                  </button>
                </>
              ) : (
                <>
                  <button className="rb-btn rb-btn-ghost" onClick={() => { setMode('view'); setErr(''); }}>
                    ← Back
                  </button>
                  <button className="rb-btn rb-btn-primary" onClick={handleReschedule}>
                    Confirm Reschedule
                  </button>
                </>
              )}
            </>
          ) : (
            <button className="rb-btn rb-btn-ghost" onClick={onClose}>Close</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BOOKING FORM MODAL
// ---------------------------------------------------------------------------

/**
 * "Book a slot" form. Validates overlap before submitting.
 *
 * TODO (Backend): On submit → POST /api/bookings
 *   Body: { assetTag, assetName, bookedBy, startTime, endTime, purpose }
 *   Response 201: created booking object
 *   Response 409: { conflict: true, message: "..." }  ← overlap detected server-side
 *
 * The client already validates overlap locally for fast UX feedback, but the
 * server MUST re-validate to prevent race conditions between concurrent users.
 */
/** Add `hours` hours to a "YYYY-MM-DDTHH:mm" local string, returns same format. */
function addHours(localStr, hours) {
  const d = new Date(localStr);
  d.setHours(d.getHours() + hours);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function BookingFormModal({ resource, dateStr, allBookings, currentUser, onClose, onBook }) {
  // Default start = next full hour on the selected date
  const nextHour = () => {
    const n = new Date();
    n.setMinutes(0, 0, 0);
    n.setHours(n.getHours() + 1);
    return `${dateStr}T${String(n.getHours()).padStart(2,'0')}:00`;
  };

  const defaultStart = nextHour();
  const defaultEnd   = addHours(defaultStart, 1); // End pre-filled = start + 1 hour

  const [startTime, setStart]   = useState(defaultStart);
  const [endTime,   setEnd]     = useState(defaultEnd);   // ← pre-filled, not empty
  const [purpose,   setPurpose] = useState('');
  const [error,     setError]   = useState('');

  // When the user changes Start, auto-advance End by the same 1-hour gap
  // (only if End hasn't been moved ahead of start+1h already)
  function handleStartChange(val) {
    setStart(val);
    setError('');
    // Keep End at least 1 hour after new Start
    if (!endTime || endTime <= val) {
      setEnd(addHours(val, 1));
    }
  }

  // Live overlap check
  const conflictingBooking = (startTime && endTime && endTime > startTime)
    ? allBookings.find(b =>
        b.assetTag === resource.tag &&
        b.status !== 'Cancelled' &&
        hasOverlap(startTime, endTime, b.startTime, b.endTime)
      )
    : null;

  function handleSubmit(e) {
    e.preventDefault();
    if (!startTime || !endTime) { setError('Please fill in both start and end times.'); return; }
    if (endTime <= startTime)   { setError('End time must be after start time.'); return; }
    if (conflictingBooking)     { setError(`This slot conflicts with an existing booking.`); return; }

    /*
     * TODO (Backend): Replace the local state update below with:
     *   const res = await fetch('/api/bookings', { method: 'POST', body: JSON.stringify({...}) });
     *   if (res.status === 409) { setError((await res.json()).message); return; }
     *   const created = await res.json();
     *   onBook(created);
     */
    onBook({
      assetTag:  resource.tag,
      assetName: resource.name,
      bookedBy:  currentUser,
      startTime,
      endTime,
      purpose,
      status: 'Upcoming',
    });
    onClose();
  }

  return (
    <div className="rb-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="form-modal-title">
      <div className="rb-modal">
        <div className="rb-modal-head">
          <div>
            <p className="rb-modal-asset">{resource.name} · <span className="rb-tag">{resource.tag}</span></p>
            <h3 id="form-modal-title" className="rb-modal-title">Book a Slot</h3>
          </div>
          <button className="rb-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="rb-modal-body">
          <div className="rb-field-row">
            <div className="rb-field">
              <label htmlFor="bf-start">Start Time *</label>
              <input id="bf-start" type="datetime-local" required value={startTime}
                onChange={e => handleStartChange(e.target.value)} />
            </div>
            <div className="rb-field">
              <label htmlFor="bf-end">End Time *</label>
              <input id="bf-end" type="datetime-local" required value={endTime}
                onChange={e => { setEnd(e.target.value); setError(''); }} />
            </div>
          </div>

          <div className="rb-field">
            <label htmlFor="bf-purpose">Purpose <span className="rb-optional">(optional)</span></label>
            <input id="bf-purpose" type="text" placeholder="e.g. Team standup, Client demo…"
              value={purpose} onChange={e => setPurpose(e.target.value)} />
          </div>

          {/* Live conflict feedback */}
          {conflictingBooking && (
            <div className="rb-conflict-banner">
              ⚠ <strong>Slot unavailable.</strong> {conflictingBooking.bookedBy} has already booked
              {' '}{fmtTime(conflictingBooking.startTime)} – {fmtTime(conflictingBooking.endTime)}.
              {/*
               * The dashed red region on the mockup (Screen 6) is represented here
               * as a banner. The timeline ghost block also shows the conflict visually.
               */}
            </div>
          )}
          {!conflictingBooking && startTime && endTime && endTime > startTime && (
            <div className="rb-available-banner">
              ✓ Slot is available — {fmtTime(startTime)} to {fmtTime(endTime)}.
            </div>
          )}

          {error && <p className="rb-error">{error}</p>}

          <div className="rb-modal-actions">
            <button type="button" className="rb-btn rb-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="rb-btn rb-btn-primary" disabled={!!conflictingBooking}>
              Confirm Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------

/**
 * ResourceBooking – Screen 6
 *
 * Data flow (current – all state lives in AppContext via App.jsx):
 *   - reads:  context.bookings, context.assets, context.currentRole, context.employees
 *   - writes: context.createBooking, context.logActivity  (passed in from App.jsx)
 *
 * TODO (Backend): Replace context reads/writes with API calls:
 *   GET  /api/bookings?assetTag=AF-0062&date=2026-07-12  → BookingDTO[]
 *   POST /api/bookings                                    → BookingDTO (201) | 409 conflict
 *   PATCH /api/bookings/:id                              → BookingDTO (cancel / reschedule)
 *
 * BookingDTO shape:
 *   { id, assetTag, assetName, bookedBy, startTime (ISO), endTime (ISO), purpose, status }
 */
const ResourceBooking = () => {
  const {
    bookings,
    assets,
    currentRole,
    employees,
    logActivity,
    loadGlobalState,
  } = useContext(AppContext);

  // ---- Local state --------------------------------------------------------

  // Which shared resource (asset) the user is browsing
  const [selectedTag,  setSelectedTag]  = useState('');

  // Day being viewed on the timeline
  const [viewDate,     setViewDate]     = useState(todayStr());

  // Active status filter for the booking list panel
  const [statusFilter, setStatusFilter] = useState('All');

  // Currently open detail modal
  const [detailBooking, setDetailBooking] = useState(null);

  // Whether the "Book a slot" modal is open
  const [showBookForm,  setShowBookForm]  = useState(false);

  // Local copy of bookings so cancel/reschedule reflect instantly without a
  // page reload.
  // TODO (Backend): Remove localBookings – derive everything from a useSWR /
  // react-query hook that refetches after mutations.
  const [localBookings, setLocalBookings] = useState(bookings);

  // Keep localBookings in sync if parent context changes (e.g. Dashboard adds one)
  useEffect(() => { setLocalBookings(bookings); }, [bookings]);

  // ---- Derived values -----------------------------------------------------

  /** Assets that are marked as shared — these are bookable resources. */
  const sharedAssets = assets.filter(a => a.shared);

  /** The asset object for the currently selected tag. */
  const selectedAsset = sharedAssets.find(a => a.tag === selectedTag) ?? null;

  /** Bookings for the selected resource on the selected date. */
  const dayBookings = localBookings.filter(b =>
    b.assetTag === selectedTag &&
    b.startTime.startsWith(viewDate) &&
    b.status !== 'Cancelled'
  );

  /** Determine the currently logged-in user name based on simulated role. */
  const getCurrentUserName = () => {
    // TODO (Backend): Replace with auth token / session user
    switch (currentRole) {
      case 'Admin':          return 'Kunal Singh';
      case 'Asset Manager':  return 'Vikram Seth';
      case 'Department Head':return 'Aditi Rao';
      case 'Employee':       return 'Priya Shah';
      default:               return 'Kunal Singh';
    }
  };

  // ---- Handlers -----------------------------------------------------------

  async function handleCancel(bookingId) {
    try {
      await import('../api/bookingApi').then(m => m.updateBooking(bookingId, { status: 'Cancelled' }));
      const target = localBookings.find(b => b.id === bookingId);
      if (target) logActivity('booking', `Booking for ${target.assetName} by ${target.bookedBy} cancelled.`);
      await loadGlobalState();
    } catch (e) {
      console.error('Failed to cancel booking', e);
    }
  }

  async function handleReschedule(bookingId, newStart, newEnd) {
    try {
      await import('../api/bookingApi').then(m => m.updateBooking(bookingId, { startTime: new Date(newStart).toISOString(), endTime: new Date(newEnd).toISOString() }));
      const target = localBookings.find(b => b.id === bookingId);
      if (target) logActivity('booking', `Booking for ${target.assetName} rescheduled to ${fmtTime(newStart)} – ${fmtTime(newEnd)}.`);
      await loadGlobalState();
    } catch (e) {
      console.error('Failed to reschedule booking', e);
    }
  }

  async function handleBook(bookingData) {
    try {
      const payload = {
        assetId: sharedAssets.find(a => a.tag === bookingData.assetTag)?.id,
        employeeId: employees.find(e => e.name === bookingData.bookedBy)?.id || 1, // fallback
        startTime: new Date(bookingData.startTime).toISOString(),
        endTime: new Date(bookingData.endTime).toISOString(),
      };
      await import('../api/bookingApi').then(m => m.createBooking(payload));
      logActivity('booking', `Booking for ${bookingData.assetName} by ${bookingData.bookedBy} confirmed.`);
      await loadGlobalState();
    } catch (e) {
      console.error('Failed to create booking', e);
    }
  }

  // ---- Render -------------------------------------------------------------

  const filteredList = localBookings
    .filter(b => b.assetTag === selectedTag)
    .filter(b => statusFilter === 'All' || deriveStatus(b) === statusFilter)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const timelineHeight = (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * PX_PER_HOUR;

  return (
    <div className="rb-screen">
      {/* ------------------------------------------------------------------ */}
      {/* PAGE HEADER                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="rb-header">
        <div>
          <h2 className="rb-page-title">Resource Booking</h2>
          <p className="rb-page-sub">Reserve shared assets — rooms, projectors, vehicles — with guaranteed slot exclusivity.</p>
        </div>

        {/* Book a slot CTA — disabled until a resource is selected */}
        <button
          id="btn-book-slot"
          className="rb-btn rb-btn-primary rb-btn-lg"
          disabled={!selectedAsset || selectedAsset.status === 'Under Maintenance'}
          onClick={() => setShowBookForm(true)}
          title={!selectedAsset ? 'Select a resource first' : selectedAsset.status === 'Under Maintenance' ? 'Asset is under maintenance' : ''}
        >
          📅 Book a Slot
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* RESOURCE SELECTOR + DATE PICKER                                     */}
      {/* ------------------------------------------------------------------ */}
      <div className="rb-controls-bar">
        <div className="rb-control-group">
          <label htmlFor="resource-select" className="rb-control-label">Resource</label>
          {/*
           * TODO (Backend): Populate this list from GET /api/assets?shared=true
           * to ensure only truly bookable resources are shown.
           */}
          <select
            id="resource-select"
            className="rb-select"
            value={selectedTag}
            onChange={e => setSelectedTag(e.target.value)}
          >
            <option value="">— Select a shared resource —</option>
            {sharedAssets.map(a => (
              <option key={a.tag} value={a.tag}>
                {a.name} ({a.tag})
                {a.status === 'Under Maintenance' ? ' · ⚠ Maintenance' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="rb-control-group">
          <label htmlFor="date-picker" className="rb-control-label">Date</label>
          <input
            id="date-picker"
            type="date"
            className="rb-input"
            value={viewDate}
            onChange={e => setViewDate(e.target.value)}
          />
        </div>

        {/* Quick-nav: prev / today / next day */}
        <div className="rb-date-nav">
          <button className="rb-nav-btn" aria-label="Previous day"
            onClick={() => {
              const d = new Date(`${viewDate}T00:00:00`);
              d.setDate(d.getDate() - 1);
              setViewDate(d.toISOString().slice(0, 10));
            }}>‹</button>
          <button className="rb-nav-btn rb-today-btn"
            onClick={() => setViewDate(todayStr())}>Today</button>
          <button className="rb-nav-btn" aria-label="Next day"
            onClick={() => {
              const d = new Date(`${viewDate}T00:00:00`);
              d.setDate(d.getDate() + 1);
              setViewDate(d.toISOString().slice(0, 10));
            }}>›</button>
        </div>
      </div>

      {/* Maintenance warning */}
      {selectedAsset?.status === 'Under Maintenance' && (
        <div className="rb-maintenance-warning">
          ⚠ <strong>{selectedAsset.name}</strong> is currently under maintenance and cannot be booked.
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MAIN LAYOUT: TIMELINE  +  BOOKING LIST                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="rb-main-grid">

        {/* -------- DAY TIMELINE ------------------------------------------ */}
        <section className="rb-panel rb-timeline-panel">
          <div className="rb-panel-header">
            <h3 className="rb-panel-title">
              {selectedAsset ? selectedAsset.name : 'Select a Resource'}
              {viewDate && <span className="rb-panel-date"> · {fmtDate(`${viewDate}T00:00`)}</span>}
            </h3>
            <span className="rb-booking-count">
              {dayBookings.length} booking{dayBookings.length !== 1 ? 's' : ''}
            </span>
          </div>

          {!selectedTag ? (
            <div className="rb-empty-state">
              <span className="rb-empty-icon">🗓️</span>
              <p>Select a shared resource above to view its calendar.</p>
            </div>
          ) : (
            /*
             * Scrollable timeline canvas. The hour ruler sits on the left;
             * booking blocks are absolutely positioned within .timeline-blocks.
             *
             * TODO (Frontend): For multi-resource views, render one column per
             * resource side-by-side (like Google Calendar's day view).
             */
            <div className="rb-timeline-scroll">
              <div className="rb-timeline-canvas" style={{ height: timelineHeight }}>
                <HourRuler />
                <div className="rb-timeline-blocks" style={{ height: timelineHeight }}>
                  {dayBookings.map(b => (
                    <TimelineBlock
                      key={b.id}
                      booking={b}
                      onSelect={setDetailBooking}
                      isConflict={false}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* -------- BOOKING LIST ------------------------------------------ */}
        <section className="rb-panel rb-list-panel">
          <div className="rb-panel-header">
            <h3 className="rb-panel-title">All Bookings</h3>

            {/* Status filter tabs */}
            <div className="rb-status-tabs" role="tablist">
              {['All', 'Upcoming', 'Ongoing', 'Completed', 'Cancelled'].map(s => (
                <button
                  key={s}
                  role="tab"
                  aria-selected={statusFilter === s}
                  className={`rb-tab ${statusFilter === s ? 'rb-tab-active' : ''}`}
                  onClick={() => setStatusFilter(s)}
                  id={`tab-${s.toLowerCase()}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {!selectedTag ? (
            <div className="rb-empty-state">
              <span className="rb-empty-icon">📋</span>
              <p>No resource selected.</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="rb-empty-state">
              <span className="rb-empty-icon">✅</span>
              <p>No {statusFilter !== 'All' ? statusFilter.toLowerCase() : ''} bookings for this resource.</p>
            </div>
          ) : (
            <ul className="rb-booking-list">
              {filteredList.map(b => {
                const st = deriveStatus(b);
                return (
                  <li
                    key={b.id}
                    className={`rb-booking-item ${STATUS_META[st]?.cls ?? ''}`}
                    onClick={() => setDetailBooking(b)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setDetailBooking(b)}
                    aria-label={`Booking by ${b.bookedBy} on ${fmtDate(b.startTime)}`}
                  >
                    <div className="rb-item-left">
                      <span className={`rb-status-badge ${STATUS_META[st]?.cls}`}>{st}</span>
                      <span className="rb-item-user">{b.bookedBy}</span>
                      <span className="rb-item-time">{fmtDate(b.startTime)} · {fmtTime(b.startTime)} – {fmtTime(b.endTime)}</span>
                      {b.purpose && <span className="rb-item-purpose">{b.purpose}</span>}
                    </div>
                    <span className="rb-item-arrow">›</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* MODALS                                                              */}
      {/* ------------------------------------------------------------------ */}

      {/* Booking detail / cancel / reschedule */}
      {detailBooking && (
        <BookingDetailModal
          booking={detailBooking}
          allBookings={localBookings}
          onClose={() => setDetailBooking(null)}
          onCancel={handleCancel}
          onReschedule={handleReschedule}
        />
      )}

      {/* New booking form */}
      {showBookForm && selectedAsset && (
        <BookingFormModal
          resource={selectedAsset}
          dateStr={viewDate}
          allBookings={localBookings}
          currentUser={getCurrentUserName()}
          onClose={() => setShowBookForm(false)}
          onBook={handleBook}
        />
      )}
    </div>
  );
};

export default ResourceBooking;
