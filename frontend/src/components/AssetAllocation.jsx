import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  fetchAllocationState,
  allocateAsset,
  requestTransfer,
  returnAsset,
} from '../api/allocationApi';
import './AssetAllocation.css';

const RETURN_CONDITIONS = ['Good', 'Fair', 'Damaged', 'Needs Repair'];

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const daysBetween = (iso) => Math.round((new Date(iso) - new Date()) / 86400000);

const overdueLabel = (iso) => {
  const days = Math.abs(daysBetween(iso));
  return `${days} day${days === 1 ? '' : 's'} overdue`;
};

const AssetAllocation = () => {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actingUserId, setActingUserId] = useState(1);

  const [returnTarget, setReturnTarget] = useState(null);
  const [transferSeed, setTransferSeed] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchAllocationState();
        if (active) {
          setState(data);
          setError(null);
        }
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const actingUser = useMemo(
    () => state?.users.find((u) => u.id === actingUserId) ?? null,
    [state, actingUserId],
  );

  const refresh = useCallback(async () => {
    setState(await fetchAllocationState());
  }, []);

  if (loading) return <div className="allocation-screen"><p className="muted">Loading allocations…</p></div>;
  if (error) return <div className="allocation-screen"><p className="error-text">Failed to load: {error}</p></div>;

  return (
    <div className="allocation-screen">
      <header className="allocation-header">
        <div>
          <h2>Asset Allocation &amp; Transfer</h2>
          <p className="muted">Manage who holds what — with conflict rules, transfers, and returns.</p>
        </div>
      </header>

      <OverdueBanner overdue={state.overdue} />

      <div className="allocation-grid">
        <section className="panel" style={{ gridColumn: '1 / -1' }}>
          <h3>Allocate an asset</h3>
          <AllocateForm
            state={state}
            onAllocated={refresh}
            onRequestTransfer={(seed) => setTransferSeed(seed)}
          />
        </section>
      </div>

      <section className="panel">
        <h3>Current allocations</h3>
        <ActiveAllocationsTable
          allocations={state.activeAllocations}
          onReturn={(alloc) => setReturnTarget(alloc)}
          onTransfer={(alloc) =>
            setTransferSeed({ assetId: alloc.assetId, heldBy: alloc.holderName, allocationId: alloc.id })
          }
        />
      </section>

      <section className="panel">
        <h3>Allocation history</h3>
        <HistoryTable history={state.history} />
      </section>

      {returnTarget && (
        <ReturnModal
          allocation={returnTarget}
          onClose={() => setReturnTarget(null)}
          onDone={async () => {
            setReturnTarget(null);
            await refresh();
          }}
        />
      )}

      {transferSeed && (
        <TransferModal
          seed={transferSeed}
          state={state}
          actingUserId={actingUserId}
          onClose={() => setTransferSeed(null)}
          onDone={async () => {
            setTransferSeed(null);
            await refresh();
          }}
        />
      )}
    </div>
  );
};

const OverdueBanner = ({ overdue }) => {
  if (!overdue.length) return null;
  return (
    <div className="overdue-banner" role="alert">
      <span className="overdue-icon" aria-hidden="true">⚠</span>
      <div>
        <strong>{overdue.length} overdue allocation{overdue.length === 1 ? '' : 's'}</strong>
        <ul>
          {overdue.map((a) => (
            <li key={a.id}>
              <span className="mono">{a.asset?.assetTag}</span> {a.asset?.assetName} — held by {a.holderName},{' '}
              {overdueLabel(a.expectedReturnAt)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const AllocateForm = ({ state, onAllocated, onRequestTransfer }) => {
  const [assetId, setAssetId] = useState('');
  const [holderId, setHolderId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const selectedAsset = state.assets.find((a) => a.id === Number(assetId)) || null;
  const conflict = useMemo(() => {
    if (!selectedAsset) return null;
    const active = state.activeAllocations.find((a) => a.assetId === selectedAsset.id);
    return active ? { holderName: active.holderName, since: active.allocatedDate, allocationId: active.id } : null;
  }, [selectedAsset, state.activeAllocations]);

  const holderOptions = state.users;
  const blocked = Boolean(conflict);

  const submit = async (e) => {
    e.preventDefault();
    if (!assetId || !holderId) {
      setFormError('Pick an asset and an assignee.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await allocateAsset({
        assetId: Number(assetId),
        holderId: Number(holderId),
      });
      setAssetId('');
      setHolderId('');
      await onAllocated();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="allocate-form" onSubmit={submit}>
      <label className="field">
        <span>Asset</span>
        <select
          value={assetId}
          onChange={(e) => {
            setAssetId(e.target.value);
            setFormError(null);
          }}
        >
          <option value="">Select an asset…</option>
          {state.assets.map((a) => (
            <option key={a.id} value={a.id}>
              {a.assetTag} · {a.assetName} ({a.status})
            </option>
          ))}
        </select>
      </label>

      {blocked && (
        <div className="conflict-box" role="alert">
          <p>
            <strong>Currently held by {conflict?.holderName}</strong>
            {conflict?.since && <span className="muted"> · since {fmtDate(conflict.since)}</span>}
          </p>
          <p className="muted">You can't allocate an asset that's already taken.</p>
          <button
            type="button"
            className="btn btn-amber"
            onClick={() => onRequestTransfer({ assetId: selectedAsset.id, heldBy: conflict?.holderName, allocationId: conflict.allocationId })}
          >
            Transfer Immediately
          </button>
        </div>
      )}

      <div className="field-row">
        <label className="field">
          <span>Assign to Employee</span>
          <select value={holderId} onChange={(e) => setHolderId(e.target.value)} disabled={blocked}>
            <option value="">Select…</option>
            {holderOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {formError && <p className="error-text">{formError}</p>}

      <button type="submit" className="btn btn-primary" disabled={submitting || blocked}>
        {submitting ? 'Allocating…' : 'Allocate asset'}
      </button>
    </form>
  );
};

const ActiveAllocationsTable = ({ allocations, onReturn, onTransfer }) => {
  if (!allocations.length) return <p className="muted">Nothing is allocated right now.</p>;

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Asset</th>
            <th>Held by</th>
            <th>Allocated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {allocations.map((a) => (
            <tr key={a.id} className={a.overdue ? 'row-overdue' : ''}>
              <td>
                <span className="mono">{a.asset?.assetTag}</span> {a.asset?.assetName}
              </td>
              <td>{a.holderName}</td>
              <td>{fmtDate(a.allocatedDate)}</td>
              <td>
                <div className="btn-group">
                  <button className="btn btn-ghost btn-sm" onClick={() => onTransfer(a)}>
                    Transfer
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={() => onReturn(a)}>
                    Return
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const HistoryTable = ({ history }) => {
  if (!history.length) return <p className="muted">No returned or transferred allocations yet.</p>;
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Asset</th>
            <th>Held by</th>
            <th>Period</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {history.map((a) => (
            <tr key={a.id}>
              <td>
                <span className="mono">{a.asset?.assetTag}</span> {a.asset?.assetName}
              </td>
              <td>{a.holderName}</td>
              <td>
                {fmtDate(a.allocatedDate)} → {fmtDate(a.returnedDate)}
              </td>
              <td className="muted">{a.reason || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ReturnModal = ({ allocation, onClose, onDone }) => {
  const [condition, setCondition] = useState(RETURN_CONDITIONS[0]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErr(null);
    try {
      await returnAsset({ allocationId: allocation.id, condition, notes });
      await onDone();
    } catch (e2) {
      setErr(e2.message);
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Return / check-in asset" onClose={onClose}>
      <p className="muted">
        <span className="mono">{allocation.asset?.assetTag}</span> {allocation.asset?.assetName} — held by {allocation.holderName}
      </p>
      <form onSubmit={submit}>
        <label className="field">
          <span>Condition on check-in</span>
          <select value={condition} onChange={(e) => setCondition(e.target.value)}>
            {RETURN_CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Check-in notes</span>
          <textarea
            rows={3}
            value={notes}
            placeholder="e.g. Minor scuff on lid, charger included."
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        {err && <p className="error-text">{err}</p>}
        <p className="muted small">On return the asset status reverts to AVAILABLE.</p>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Confirm return'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const TransferModal = ({ seed, state, actingUserId, onClose, onDone }) => {
  const asset = state.assets.find((a) => a.id === seed.assetId) || null;
  const [toHolderId, setToHolderId] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  const options = state.users;

  const submit = async (e) => {
    e.preventDefault();
    if (!toHolderId) {
      setErr('Pick who the asset should transfer to.');
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      await requestTransfer({
        allocationId: seed.allocationId,
        toHolderId: Number(toHolderId),
        note,
      });
      await onDone();
    } catch (e2) {
      setErr(e2.message);
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Transfer Asset" onClose={onClose}>
      <p className="muted">
        <span className="mono">{asset?.assetTag}</span> {asset?.assetName}
        {seed.heldBy && <> — currently held by <strong>{seed.heldBy}</strong></>}
      </p>
      <form onSubmit={submit}>
        <div className="field-row">
          <label className="field">
            <span>Transfer to Employee</span>
            <select value={toHolderId} onChange={(e) => setToHolderId(e.target.value)}>
              <option value="">Select…</option>
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          <span>Reason / note</span>
          <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        {err && <p className="error-text">{err}</p>}
        <p className="muted small">
          Asset will be immediately transferred.
        </p>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-amber" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Transfer Now'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const Modal = ({ title, children, onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal" onClick={(e) => e.stopPropagation()}>
      <div className="modal-head">
        <h3>{title}</h3>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
      <div className="modal-body">{children}</div>
    </div>
  </div>
);

export default AssetAllocation;
