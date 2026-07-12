import React, { useState, useMemo, useContext, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, FileText, Search, ShieldX } from 'lucide-react';
import { AppContext } from '../../App';

export default function AssetAuditWorkspace() {
  const { assets, auditCycles, logActivity } = useContext(AppContext);
  const [searchQuery, setSearchQuery] = useState('');

  // Use local state to track verification status for this active session
  // Initialize from global assets context
  const [auditItems, setAuditItems] = useState([]);

  useEffect(() => {
    // Only set initially if empty to avoid overriding work in progress
    if (auditItems.length === 0 && assets && assets.length > 0) {
      setAuditItems(assets.map(a => ({
        ...a,
        verificationStatus: 'Pending' // Pending, Verified, Missing, Damaged
      })));
    }
  }, [assets]); // intentionally only checking when assets load. In a real app we'd load the existing audit session.

  const activeAudit = auditCycles && auditCycles.length > 0 ? auditCycles[0] : { name: 'Quarterly Inventory Audit', department: 'All' };

  const handleStatusChange = (id, newStatus) => {
    setAuditItems(prev => prev.map(item => item.id === id ? { ...item, verificationStatus: newStatus } : item));
  };

  const handleCloseAudit = () => {
    logActivity('audit', `Audit cycle "${activeAudit.name}" closed. Anomalies flagged for review.`);
    alert('Audit cycle closed! Discrepancies logged to activity tracker.');
  };

  const filteredItems = auditItems.filter(item =>
    (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.tag && item.tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const stats = useMemo(() => {
    return auditItems.reduce((acc, item) => {
      acc[item.verificationStatus]++;
      return acc;
    }, { Pending: 0, Verified: 0, Missing: 0, Damaged: 0 });
  }, [auditItems]);

  const discrepancyCount = stats.Missing + stats.Damaged;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Asset Audit Workspace</h1>
          <p className="text-sm text-zinc-400">Active Cycle: <span className="font-semibold text-emerald-400">{activeAudit.name}</span></p>
        </div>
        <button
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-5 rounded-lg flex items-center transition-all shadow-lg shadow-emerald-900/20 cursor-pointer"
          onClick={handleCloseAudit}
        >
          <FileText className="w-4 h-4 mr-2" />
          Close Audit Cycle
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xl">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Total Items</div>
          <div className="text-3xl font-bold text-zinc-200">{auditItems.length}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xl">
          <div className="text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-1">Verified</div>
          <div className="text-3xl font-bold text-emerald-400">{stats.Verified}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xl">
          <div className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-1">Pending</div>
          <div className="text-3xl font-bold text-amber-400">{stats.Pending}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xl">
          <div className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-1">Discrepancies</div>
          <div className="text-3xl font-bold text-red-400">{discrepancyCount}</div>
        </div>
      </div>

      {discrepancyCount > 0 && (
        <div className="bg-red-950/40 border border-red-900/50 rounded-xl p-4 flex gap-4 items-start shadow-xl">
          <div className="mt-0.5"><AlertTriangle className="text-red-400 w-5 h-5" /></div>
          <div>
            <h3 className="font-bold text-red-400 text-sm">Discrepancies Detected</h3>
            <div className="text-xs text-red-400/80 mt-1">There are {discrepancyCount} items marked as missing or damaged. These will require resolution workflows upon cycle close.</div>
          </div>
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden">
        <div className="p-5 border-b border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-950/30">
          <h2 className="text-lg font-bold text-zinc-200">Verification Checklist</h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search Tag or Name..."
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs rounded-full pl-9 pr-4 py-2 focus:outline-none focus:border-emerald-500 transition-all placeholder-zinc-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="bg-zinc-950/50 text-xs uppercase font-semibold text-zinc-500 border-b border-zinc-800">
              <tr>
                <th className="px-5 py-4">Asset Tag</th>
                <th className="px-5 py-4">Details</th>
                <th className="px-5 py-4">Expected Location</th>
                <th className="px-5 py-4">Expected State</th>
                <th className="px-5 py-4 text-center">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-5 py-4 font-mono font-bold text-zinc-300">{item.tag}</td>
                  <td className="px-5 py-4">
                    <div className="font-bold text-zinc-200">{item.name}</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">{item.department}</div>
                  </td>
                  <td className="px-5 py-4 text-zinc-300">{item.location}</td>
                  <td className="px-5 py-4">
                    <span className="bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-zinc-700">
                      {item.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="inline-flex rounded-md shadow-sm border border-zinc-800 overflow-hidden bg-zinc-950" role="group">
                      <button
                        className={`p-2 transition-colors cursor-pointer ${item.verificationStatus === 'Verified' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
                        onClick={() => handleStatusChange(item.id, 'Verified')}
                        title="Mark Verified"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        className={`p-2 border-l border-zinc-800 transition-colors cursor-pointer ${item.verificationStatus === 'Missing' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
                        onClick={() => handleStatusChange(item.id, 'Missing')}
                        title="Mark Missing"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                      <button
                        className={`p-2 border-l border-zinc-800 transition-colors cursor-pointer ${item.verificationStatus === 'Damaged' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
                        onClick={() => handleStatusChange(item.id, 'Damaged')}
                        title="Mark Damaged"
                      >
                        <ShieldX className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-5 py-8 text-center text-zinc-500 text-sm">No items found matching criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
