import React, { useContext, useState } from 'react';
import { AppContext } from '../App';

const Dashboard = () => {
  const {
    currentRole,
    assets,
    activity,
    categories,
    departments,
    employees,
    registerAsset,
    createBooking,
    createMaintenanceRequest,
    bookings,
    maintenance,
    auditCycles,
    addAuditCycle,
    transfers,
    requestTransfer,
    approveTransfer,
    returnAsset,
    logActivity
  } = useContext(AppContext);

  // Modal open states
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isApproveTransferOpen, setIsApproveTransferOpen] = useState(false);
  const [isReturnAssetOpen, setIsReturnAssetOpen] = useState(false);
  const [isRequestTransferOpen, setIsRequestTransferOpen] = useState(false);
  const [overdueTarget, setOverdueTarget] = useState(null);

  // Form states
  const [newAsset, setNewAsset] = useState({
    name: '',
    category: 'Electronics',
    serial: '',
    acquisitionDate: new Date().toISOString().split('T')[0],
    acquisitionCost: '',
    condition: 'Excellent',
    location: '',
    shared: false,
    department: 'Engineering'
  });

  const [newBooking, setNewBooking] = useState({
    assetTag: '',
    userName: '',
    startTime: '',
    endTime: ''
  });

  const [newRequest, setNewRequest] = useState({
    assetTag: '',
    userName: '',
    description: '',
    priority: 'Medium'
  });

  const [newAudit, setNewAudit] = useState({
    name: '',
    department: 'Engineering',
    location: 'HQ - 4th Floor',
    auditor: 'Vikram Seth'
  });

  const [newTransferReq, setNewTransferReq] = useState({
    assetTag: '',
    reason: ''
  });

  const [returnAssetForm, setReturnAssetForm] = useState({
    assetTag: '',
    notes: ''
  });

  // Derived user details based on simulated identity
  const getSimulatedUser = () => {
    switch (currentRole) {
      case 'Employee': return 'Priya Shah';
      case 'Department Head': return 'aditi rao';
      case 'Asset Manager': return 'Vikram Seth';
      case 'Admin': return 'Kunal Singh';
      default: return 'Kunal Singh';
    }
  };

  const simulatedUser = getSimulatedUser();

  // Dynamic calculations
  const currentDate = new Date('2026-07-12');
  const overdueAssets = assets.filter(
    a => a.status === 'Allocated' && a.expectedReturnDate && new Date(a.expectedReturnDate) < currentDate
  );

  // Form submit handlers
  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!newAsset.name) return;
    registerAsset(newAsset);
    setIsRegisterOpen(false);
    setNewAsset({
      name: '',
      category: categories[0]?.name || 'Electronics',
      serial: '',
      acquisitionDate: new Date().toISOString().split('T')[0],
      acquisitionCost: '',
      condition: 'Excellent',
      location: '',
      shared: false,
      department: departments[0]?.name || 'Engineering'
    });
  };

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    const tag = currentRole === 'Employee' ? assets.filter(a => a.shared && a.status === 'Available')[0]?.tag : newBooking.assetTag;
    const userName = currentRole === 'Employee' ? 'Priya Shah' : newBooking.userName;
    
    if (!tag || !userName) return;
    const selectedAsset = assets.find(a => a.tag === tag);
    if (!selectedAsset) return;

    createBooking({
      assetTag: tag,
      assetName: selectedAsset.name,
      userName: userName,
      startTime: newBooking.startTime,
      endTime: newBooking.endTime
    });
    setIsBookOpen(false);
    setNewBooking({ assetTag: '', userName: '', startTime: '', endTime: '' });
  };

  const handleRequestSubmit = (e) => {
    e.preventDefault();
    const tag = currentRole === 'Employee' ? assets.filter(a => a.employee === 'Priya Shah')[0]?.tag : newRequest.assetTag;
    const userName = currentRole === 'Employee' ? 'Priya Shah' : newRequest.userName;
    
    if (!tag || !newRequest.description) return;
    const selectedAsset = assets.find(a => a.tag === tag);
    if (!selectedAsset) return;

    createMaintenanceRequest({
      assetTag: tag,
      assetName: selectedAsset.name,
      userName: userName,
      description: newRequest.description,
      priority: newRequest.priority
    });
    setIsRequestOpen(false);
    setNewRequest({ assetTag: '', userName: '', description: '', priority: 'Medium' });
  };

  const handleAuditSubmit = (e) => {
    e.preventDefault();
    if (!newAudit.name) return;
    addAuditCycle(newAudit);
    setIsAuditOpen(false);
    alert('Audit Cycle successfully created!');
    setNewAudit({ name: '', department: 'Engineering', location: 'HQ - 4th Floor', auditor: 'Vikram Seth' });
  };

  const handleTransferSubmit = (e) => {
    e.preventDefault();
    if (!newTransferReq.assetTag) return;
    const targetAsset = assets.find(a => a.tag === newTransferReq.assetTag);
    if (!targetAsset) return;

    requestTransfer({
      assetTag: targetAsset.tag,
      assetName: targetAsset.name,
      currentHolder: targetAsset.employee,
      requester: 'Priya Shah',
      department: 'Engineering',
      reason: newTransferReq.reason
    });
    setIsRequestTransferOpen(false);
    alert('Transfer request submitted to Department Head!');
    setNewTransferReq({ assetTag: '', reason: '' });
  };

  const handleReturnSubmit = (e) => {
    e.preventDefault();
    if (!returnAssetForm.assetTag) return;
    returnAsset(returnAssetForm.assetTag, returnAssetForm.notes);
    setIsReturnAssetOpen(false);
    alert('Asset successfully returned and set to Available!');
    setReturnAssetForm({ assetTag: '', notes: '' });
  };

  const handleSendReminder = (holderName, email, tag) => {
    logActivity('notifications', `Reminder email sent to ${holderName} (${email}) for asset ${tag}.`);
    alert(`Return reminder email sent to ${email}!`);
    setOverdueTarget(null);
  };

  // Render role-based KPI metrics
  const renderKPIs = () => {
    if (currentRole === 'Employee') {
      const myPossessions = assets.filter(a => a.employee === 'Priya Shah').length;
      const myBookings = bookings.filter(b => b.userName === 'Priya Shah' && b.status === 'Approved').length;
      const myActiveTickets = maintenance.filter(m => m.userName === 'Priya Shah' && m.status !== 'Resolved').length;

      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg">
            <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Assets in my possession</div>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-4xl font-extrabold text-white">{myPossessions}</span>
              <span className="text-emerald-500 text-xs font-semibold">Assigned</span>
            </div>
            <p className="text-zinc-550 text-xs mt-3">Hardware physically allocated to you</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg">
            <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider">My Upcoming Bookings</div>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-4xl font-extrabold text-white">{myBookings}</span>
              <span className="text-blue-400 text-xs font-semibold">Scheduled</span>
            </div>
            <p className="text-zinc-550 text-xs mt-3">Bookings for conference rooms / shared items</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg">
            <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider">My Active Tickets</div>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-4xl font-extrabold text-white">{myActiveTickets}</span>
              <span className="text-amber-500 text-xs font-semibold">Open tickets</span>
            </div>
            <p className="text-zinc-550 text-xs mt-3">Pending maintenance requests</p>
          </div>
        </div>
      );
    }

    if (currentRole === 'Department Head') {
      const deptAssets = assets.filter(a => a.department === 'Engineering').length;
      const teamApprovals = transfers.filter(t => t.department === 'Engineering' && t.status === 'Pending Approval').length;

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg">
            <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Department Assets (Engineering)</div>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-4xl font-extrabold text-white">{deptAssets}</span>
              <span className="text-emerald-500 text-xs font-semibold">Allocated</span>
            </div>
            <p className="text-zinc-550 text-xs mt-3">Total assets allocated to your team</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg">
            <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Pending Approvals for My Team</div>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-4xl font-extrabold text-white">{teamApprovals}</span>
              <span className={`text-xs font-semibold ${teamApprovals > 0 ? 'text-amber-400 animate-pulse' : 'text-zinc-400'}`}>
                {teamApprovals > 0 ? 'Action required' : 'Clear'}
              </span>
            </div>
            <p className="text-zinc-550 text-xs mt-3">Transfer request authorization queues</p>
          </div>
        </div>
      );
    }

    // Default Admin/Manager view
    const totalAvailable = assets.filter(a => a.status === 'Available').length;
    const totalAllocated = assets.filter(a => a.status === 'Allocated').length;
    const totalMaintenance = assets.filter(a => a.status === 'Under Maintenance').length;
    const activeBookingsCount = bookings.filter(b => b.status === 'Approved').length;
    const pendingTransfersCount = transfers.filter(t => t.status === 'Pending Approval').length;
    const upcomingReturnsCount = assets.filter(
      a => a.status === 'Allocated' && a.expectedReturnDate && new Date(a.expectedReturnDate) >= currentDate
    ).length;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 transition hover:border-zinc-700/60 shadow-lg">
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Available Assets</div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-4xl font-extrabold text-white">{totalAvailable}</span>
            <span className="text-emerald-500 text-xs font-semibold">In stock</span>
          </div>
          <p className="text-zinc-550 text-xs mt-3">Ready to be allocated or booked</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 transition hover:border-zinc-700/60 shadow-lg">
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Allocated Assets</div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-4xl font-extrabold text-white">{totalAllocated}</span>
            <span className="text-amber-500 text-xs font-semibold">With users</span>
          </div>
          <p className="text-zinc-550 text-xs mt-3">Assigned to employees/departments</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 transition hover:border-zinc-700/60 shadow-lg">
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Under Maintenance Today</div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-4xl font-extrabold text-white">{totalMaintenance}</span>
            <span className="text-red-400 text-xs font-semibold">In repair</span>
          </div>
          <p className="text-zinc-550 text-xs mt-3">Offline for troubleshooting</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 transition hover:border-zinc-700/60 shadow-lg">
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Active Bookings</div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-4xl font-extrabold text-white">{activeBookingsCount}</span>
            <span className="text-blue-400 text-xs font-semibold">Shared slots</span>
          </div>
          <p className="text-zinc-550 text-xs mt-3">Current active bookings</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 transition hover:border-zinc-700/60 shadow-lg">
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Pending Transfers</div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-4xl font-extrabold text-white">{pendingTransfersCount}</span>
            <span className="text-indigo-400 text-xs font-semibold">Awaiting review</span>
          </div>
          <p className="text-zinc-550 text-xs mt-3">Cross-department handovers</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 transition hover:border-zinc-700/60 shadow-lg">
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Upcoming Returns</div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-4xl font-extrabold text-white">{upcomingReturnsCount}</span>
            <span className="text-zinc-400 text-xs font-semibold">Expected soon</span>
          </div>
          <p className="text-zinc-550 text-xs mt-3">Due back in next 7 days</p>
        </div>
      </div>
    );
  };

  // Render role-specific Quick Action buttons
  const renderQuickActions = () => {
    if (currentRole === 'Admin' || currentRole === 'Asset Manager') {
      return (
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-5 py-3 rounded-lg transition-all shadow-md cursor-pointer"
          >
            <span>➕ Register Asset</span>
          </button>
          <button
            onClick={() => setIsBookOpen(true)}
            className="flex items-center space-x-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-750 font-semibold text-xs px-5 py-3 rounded-lg transition-all cursor-pointer"
          >
            <span>📅 Book Resource</span>
          </button>
          <button
            onClick={() => setIsRequestOpen(true)}
            className="flex items-center space-x-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-750 font-semibold text-xs px-5 py-3 rounded-lg transition-all cursor-pointer"
          >
            <span>🛠️ Raise Request</span>
          </button>
          <button
            onClick={() => setIsAuditOpen(true)}
            className="flex items-center space-x-2 bg-indigo-650 hover:bg-indigo-600 text-white font-semibold text-xs px-5 py-3 rounded-lg transition-all shadow-md cursor-pointer"
          >
            <span>📋 Create Audit Cycle</span>
          </button>
        </div>
      );
    }

    if (currentRole === 'Department Head') {
      return (
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setIsBookOpen(true)}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-5 py-3 rounded-lg transition-all cursor-pointer"
          >
            <span>📅 Book Resource</span>
          </button>
          <button
            onClick={() => setIsRequestOpen(true)}
            className="flex items-center space-x-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-750 font-semibold text-xs px-5 py-3 rounded-lg transition-all cursor-pointer"
          >
            <span>🛠️ Raise Request</span>
          </button>
          <button
            onClick={() => setIsApproveTransferOpen(true)}
            className="flex items-center space-x-2 bg-amber-650 hover:bg-amber-600 text-white font-semibold text-xs px-5 py-3 rounded-lg transition-all shadow-md cursor-pointer"
          >
            <span>🔄 Approve Team Transfer</span>
          </button>
        </div>
      );
    }

    // Standard Employee view
    return (
      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => setIsBookOpen(true)}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-5 py-3 rounded-lg transition-all cursor-pointer"
        >
          <span>📅 Book Resource</span>
        </button>
        <button
          onClick={() => setIsRequestOpen(true)}
          className="flex items-center space-x-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-750 font-semibold text-xs px-5 py-3 rounded-lg transition-all cursor-pointer"
        >
          <span>🛠️ Raise Request</span>
        </button>
        <button
          onClick={() => setIsReturnAssetOpen(true)}
          className="flex items-center space-x-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-755 font-semibold text-xs px-5 py-3 rounded-lg transition-all cursor-pointer"
        >
          <span>📦 Return Asset</span>
        </button>
        <button
          onClick={() => setIsRequestTransferOpen(true)}
          className="flex items-center space-x-2 bg-blue-650 hover:bg-blue-600 text-white font-semibold text-xs px-5 py-3 rounded-lg transition-all shadow-md cursor-pointer"
        >
          <span>🔄 Request Transfer</span>
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fadeIn text-zinc-100">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard Portal</h1>
          <p className="text-zinc-500 text-sm mt-1">Operational view customized for: <strong className="text-emerald-400">{currentRole}</strong></p>
        </div>
      </div>

      {/* Dynamic Scoped KPI Grid */}
      {renderKPIs()}

      {/* Overdue Returns Warning Banner (Clickable) */}
      {overdueAssets.length > 0 && (
        <div className="bg-red-950/20 border border-red-900/60 rounded-xl p-4 text-red-400">
          <div className="flex items-center space-x-2 mb-2 text-sm font-semibold">
            <span>⚠️</span>
            <span>{overdueAssets.length} assets overdue for return - click tags below for actions</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {overdueAssets.map(a => (
              <button
                key={a.id}
                onClick={() => setOverdueTarget(a)}
                className="bg-red-950/60 hover:bg-red-900 border border-red-800/80 px-2.5 py-1 rounded text-xs font-mono font-bold tracking-wide transition cursor-pointer text-red-300"
              >
                🏷️ {a.tag} ({a.employee})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Operations panel */}
      <div className="bg-zinc-900/50 border border-zinc-850 rounded-xl p-6">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Quick Operations</h3>
        {renderQuickActions()}
      </div>

      {/* Recent Activity Log */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Recent Activity Feed</h3>
        <div className="flow-root">
          <ul className="-mb-8">
            {activity.slice(0, 7).map((act, actIdx) => (
              <li key={act.id}>
                <div className="relative pb-8">
                  {actIdx !== activity.length - 1 ? (
                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-zinc-850" aria-hidden="true" />
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div>
                      <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-zinc-900 ${
                        act.type === 'allocation' ? 'bg-amber-950/60 text-amber-400' :
                        act.type === 'booking' ? 'bg-blue-950/60 text-blue-400' :
                        act.type === 'maintenance' ? 'bg-red-950/60 text-red-400' :
                        act.type === 'audit' ? 'bg-indigo-950/60 text-indigo-400' :
                        'bg-zinc-800 text-zinc-400'
                      }`}>
                        {act.type === 'allocation' ? '🔄' :
                         act.type === 'booking' ? '📅' :
                         act.type === 'maintenance' ? '🛠️' : 
                         act.type === 'audit' ? '📋' : '📦'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-zinc-300 font-medium">{act.text}</p>
                      </div>
                      <div className="text-right text-xs whitespace-nowrap text-zinc-500 font-semibold">
                        <span>{act.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Modal 1: Register Asset */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden animate-zoomIn">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-lg text-white">Register New Asset</h3>
              <button onClick={() => setIsRegisterOpen(false)} className="text-zinc-500 hover:text-zinc-300 text-lg cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Asset Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dell Monitor"
                    value={newAsset.name}
                    onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={newAsset.category}
                    onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Serial Number</label>
                  <input
                    type="text"
                    placeholder="SN-XXXXXX"
                    value={newAsset.serial}
                    onChange={(e) => setNewAsset({ ...newAsset, serial: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Acquisition Cost ($)</label>
                  <input
                    type="number"
                    placeholder="Acquisition Cost"
                    value={newAsset.acquisitionCost}
                    onChange={(e) => setNewAsset({ ...newAsset, acquisitionCost: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Condition</label>
                  <select
                    value={newAsset.condition}
                    onChange={(e) => setNewAsset({ ...newAsset, condition: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Location / Site</label>
                  <input
                    type="text"
                    placeholder="HQ - Room 4B"
                    value={newAsset.location}
                    onChange={(e) => setNewAsset({ ...newAsset, location: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Allocated Department</label>
                  <select
                    value={newAsset.department}
                    onChange={(e) => setNewAsset({ ...newAsset, department: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="-">-</option>
                    {departments.filter(d => d.status === 'Active').map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="shared"
                    checked={newAsset.shared}
                    onChange={(e) => setNewAsset({ ...newAsset, shared: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 bg-zinc-950 border-zinc-800 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="shared" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider cursor-pointer">Shared/Bookable asset</label>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 border border-zinc-700 hover:bg-zinc-800 rounded-lg text-sm font-semibold text-zinc-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-semibold text-white cursor-pointer"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Book Resource */}
      {isBookOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden animate-zoomIn">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-lg text-white">Book Shared Resource</h3>
              <button onClick={() => setIsBookOpen(false)} className="text-zinc-500 hover:text-zinc-300 text-lg cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleBookingSubmit} className="p-6 space-y-4">
              {currentRole !== 'Employee' ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Select Shared Resource</label>
                    <select
                      value={newBooking.assetTag}
                      onChange={(e) => setNewBooking({ ...newBooking, assetTag: e.target.value })}
                      required
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">-- Choose asset --</option>
                      {assets.filter(a => a.shared && a.status === 'Available').map(a => (
                        <option key={a.id} value={a.tag}>{a.name} ({a.tag})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Employee Booking</label>
                    <select
                      value={newBooking.userName}
                      onChange={(e) => setNewBooking({ ...newBooking, userName: e.target.value })}
                      required
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">-- Choose Employee --</option>
                      {employees.filter(e => e.status === 'Active').map(emp => (
                        <option key={emp.id} value={emp.name}>{emp.name} ({emp.department})</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-xs space-y-2 text-zinc-400">
                  <p><strong>Prefilled Holder:</strong> Priya Shah (Employee)</p>
                  <p><strong>Selecting Available Shared Asset:</strong> Epson Projector 4K (AF-0062)</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={newBooking.startTime}
                    onChange={(e) => setNewBooking({ ...newBooking, startTime: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={newBooking.endTime}
                    onChange={(e) => setNewBooking({ ...newBooking, endTime: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsBookOpen(false)}
                  className="px-4 py-2 border border-zinc-700 hover:bg-zinc-800 rounded-lg text-sm font-semibold text-zinc-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-semibold text-white cursor-pointer"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Raise Request */}
      {isRequestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden animate-zoomIn">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-lg text-white">Raise Maintenance Request</h3>
              <button onClick={() => setIsRequestOpen(false)} className="text-zinc-500 hover:text-zinc-300 text-lg cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleRequestSubmit} className="p-6 space-y-4">
              {currentRole !== 'Employee' ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Select Asset needing Repair</label>
                    <select
                      value={newRequest.assetTag}
                      onChange={(e) => setNewRequest({ ...newRequest, assetTag: e.target.value })}
                      required
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">-- Choose Asset --</option>
                      {assets.filter(a => a.status === 'Available' || a.status === 'Allocated').map(a => (
                        <option key={a.id} value={a.tag}>{a.name} ({a.tag}) - {a.status}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Reported By</label>
                    <select
                      value={newRequest.userName}
                      onChange={(e) => setNewRequest({ ...newRequest, userName: e.target.value })}
                      required
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">-- Choose Employee --</option>
                      {employees.filter(e => e.status === 'Active').map(emp => (
                        <option key={emp.id} value={emp.name}>{emp.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-xs space-y-2 text-zinc-400">
                  <p><strong>Prefilled Holder:</strong> Priya Shah (Employee)</p>
                  <p><strong>Selecting Assigned Asset:</strong> MacBook Pro 16" (AF-0114)</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Issue Description</label>
                <textarea
                  required
                  placeholder="Explain the problem (e.g. keyboard sticking, screen flicker)..."
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                  className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Priority Level</label>
                <select
                  value={newRequest.priority}
                  onChange={(e) => setNewRequest({ ...newRequest, priority: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsRequestOpen(false)}
                  className="px-4 py-2 border border-zinc-700 hover:bg-zinc-800 rounded-lg text-sm font-semibold text-zinc-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-semibold text-white cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Create Audit Cycle (Admin/Manager only) */}
      {isAuditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden animate-zoomIn">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-lg text-white">Create Asset Audit Cycle</h3>
              <button onClick={() => setIsAuditOpen(false)} className="text-zinc-500 hover:text-zinc-300 text-lg cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleAuditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Audit Cycle Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q3 Hardware Verification"
                  value={newAudit.name}
                  onChange={(e) => setNewAudit({ ...newAudit, name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Scope Department</label>
                <select
                  value={newAudit.department}
                  onChange={(e) => setNewAudit({ ...newAudit, department: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Audit Location Site</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HQ - 4th Floor"
                  value={newAudit.location}
                  onChange={(e) => setNewAudit({ ...newAudit, location: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Assigned Auditor</label>
                <select
                  value={newAudit.auditor}
                  onChange={(e) => setNewAudit({ ...newAudit, auditor: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                >
                  {employees.filter(emp => emp.role === 'Admin' || emp.role === 'Asset Manager' || emp.role === 'Department Head').map(emp => (
                    <option key={emp.id} value={emp.name}>{emp.name} ({emp.role})</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAuditOpen(false)}
                  className="px-4 py-2 border border-zinc-700 hover:bg-zinc-800 rounded-lg text-sm font-semibold text-zinc-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-semibold text-white cursor-pointer"
                >
                  Initialize Cycle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 5: Approve Team Transfer (Department Head only) */}
      {isApproveTransferOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden animate-zoomIn">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-lg text-white">Approve Team Transfers</h3>
              <button onClick={() => setIsApproveTransferOpen(false)} className="text-zinc-500 hover:text-zinc-300 text-lg cursor-pointer">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {transfers.filter(t => t.department === 'Engineering' && t.status === 'Pending Approval').map(t => (
                  <div key={t.id} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex flex-col justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white text-sm">{t.assetName}</span>
                        <span className="font-mono bg-zinc-900 px-2 py-0.5 border border-zinc-800 text-[10px] text-zinc-400 font-bold rounded">{t.assetTag}</span>
                      </div>
                      <p className="text-zinc-400 mt-1"><strong>From:</strong> {t.currentHolder} ➔ <strong>To:</strong> {t.requester}</p>
                      <p className="text-zinc-500 mt-2 italic">Reason: "{t.reason}"</p>
                    </div>
                    <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-850">
                      <button
                        onClick={() => {
                          approveTransfer(t.id);
                          alert('Transfer authorized and reallocated!');
                          setIsApproveTransferOpen(false);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold cursor-pointer transition text-[11px]"
                      >
                        ✓ Approve Transfer
                      </button>
                    </div>
                  </div>
                ))}

                {transfers.filter(t => t.department === 'Engineering' && t.status === 'Pending Approval').length === 0 && (
                  <div className="text-center text-zinc-500 text-xs py-8">
                    No pending transfer requests for your department.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 6: Return Asset (Employee only) */}
      {isReturnAssetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden animate-zoomIn">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-lg text-white">Return Allocated Asset</h3>
              <button onClick={() => setIsReturnAssetOpen(false)} className="text-zinc-500 hover:text-zinc-300 text-lg cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleReturnSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Select Asset in your possession</label>
                <select
                  value={returnAssetForm.assetTag}
                  onChange={(e) => setReturnAssetForm({ ...returnAssetForm, assetTag: e.target.value })}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Select Asset --</option>
                  {assets.filter(a => a.employee === 'Priya Shah').map(a => (
                    <option key={a.id} value={a.tag}>{a.name} ({a.tag})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Check-in Condition Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Returned in perfect condition, slight scratch on lid"
                  value={returnAssetForm.notes}
                  onChange={(e) => setReturnAssetForm({ ...returnAssetForm, notes: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsReturnAssetOpen(false)}
                  className="px-4 py-2 border border-zinc-700 hover:bg-zinc-800 rounded-lg text-sm font-semibold text-zinc-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-semibold text-white cursor-pointer"
                >
                  Submit Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 7: Request Transfer (Employee only) */}
      {isRequestTransferOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden animate-zoomIn">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-lg text-white">Request Asset Transfer</h3>
              <button onClick={() => setIsRequestTransferOpen(false)} className="text-zinc-500 hover:text-zinc-300 text-lg cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleTransferSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Select Asset allocated to others</label>
                <select
                  value={newTransferReq.assetTag}
                  onChange={(e) => setNewTransferReq({ ...newTransferReq, assetTag: e.target.value })}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Choose Asset --</option>
                  {assets.filter(a => a.status === 'Allocated' && a.employee !== 'Priya Shah').map(a => (
                    <option key={a.id} value={a.tag}>{a.name} ({a.tag}) - held by {a.employee}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Reason for request</label>
                <textarea
                  required
                  placeholder="Justify why you need this asset (e.g. testing requirements, monitor replacement)..."
                  value={newTransferReq.reason}
                  onChange={(e) => setNewTransferReq({ ...newTransferReq, reason: e.target.value })}
                  className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsRequestTransferOpen(false)}
                  className="px-4 py-2 border border-zinc-700 hover:bg-zinc-800 rounded-lg text-sm font-semibold text-zinc-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-semibold text-white cursor-pointer"
                >
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Overdue Badge Click Quick-View Modal */}
      {overdueTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm overflow-hidden animate-zoomIn shadow-2xl">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <span className="bg-red-950/60 border border-red-800 text-red-400 font-mono text-[10px] font-bold px-2.5 py-0.5 rounded tracking-wide">
                  ⚠️ Overdue Follow-up
                </span>
                <h3 className="font-bold text-base text-white mt-1.5">{overdueTarget.name}</h3>
              </div>
              <button onClick={() => setOverdueTarget(null)} className="text-zinc-500 hover:text-zinc-300 text-lg cursor-pointer">✕</button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Asset Tag</span>
                  <span className="text-zinc-300 font-mono font-bold">{overdueTarget.tag}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Expected Return Date</span>
                  <span className="text-red-400 font-semibold">{overdueTarget.expectedReturnDate}</span>
                </div>
              </div>

              <div className="border-t border-zinc-850 pt-3">
                <div className="mb-1">
                  <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Current Holder</span>
                  <span className="text-zinc-200 font-semibold text-sm">{overdueTarget.employee}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <span className="block text-[10px] text-zinc-500 font-bold">Email Address</span>
                    <span className="text-zinc-400">{
                      employees.find(e => e.name.toLowerCase() === overdueTarget.employee.toLowerCase())?.email || 
                      `${overdueTarget.employee.toLowerCase().replace(' ', '.')}@assetflow.com`
                    }</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-zinc-500 font-bold">Phone Number</span>
                    <span className="text-zinc-400">+1 (555) 019-2834</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex flex-col gap-2">
                <button
                  onClick={() => handleSendReminder(
                    overdueTarget.employee,
                    employees.find(e => e.name.toLowerCase() === overdueTarget.employee.toLowerCase())?.email || `${overdueTarget.employee.toLowerCase().replace(' ', '.')}@assetflow.com`,
                    overdueTarget.tag
                  )}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg cursor-pointer transition text-center"
                >
                  ✉️ Send Return Reminder Email
                </button>
                <button
                  onClick={() => {
                    alert(`Initiating transfer workflow for ${overdueTarget.tag}...`);
                    setOverdueTarget(null);
                  }}
                  className="w-full py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 border border-zinc-700 font-bold rounded-lg cursor-pointer transition text-center"
                >
                  🔄 Initiate Transfer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
