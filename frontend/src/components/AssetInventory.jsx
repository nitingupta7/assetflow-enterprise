import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { 
  Search, 
  Plus, 
  MoreVertical, 
  Package, 
  CheckCircle, 
  AlertTriangle, 
  HelpCircle,
  Eye, 
  UserCheck, 
  Wrench,
  ChevronDown,
  XCircle,
  FolderMinus
} from 'lucide-react';

const AssetInventory = () => {
  const {
    assets,
    categories,
    departments,
    employees,
    loadGlobalState,
    logActivity
  } = useContext(AppContext);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');

  // Dropdown open states
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  
  // Active Action Menu Row ID
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Drawer / Modals open states
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedAssetDetail, setSelectedAssetDetail] = useState(null);
  const [selectedDrawerAsset, setSelectedDrawerAsset] = useState(null);
  const [allocateAssetTarget, setAllocateAssetTarget] = useState(null);
  const [maintenanceAssetTarget, setMaintenanceAssetTarget] = useState(null);

  // Forms
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

  const [allocationForm, setAllocationForm] = useState({
    userName: '',
    startTime: new Date().toISOString().split('T')[0] + 'T09:00',
    endTime: new Date().toISOString().split('T')[0] + 'T18:00'
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    userName: '',
    description: '',
    priority: 'Medium'
  });

  // Derived calculations
  const totalAssets = assets.length;
  const availableCount = assets.filter(a => a.status === 'Available').length;
  const inRepairCount = assets.filter(a => a.status === 'Under Maintenance').length;
  const sharedCount = assets.filter(a => a.shared).length;

  // Filter application
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = 
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.serial.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.location && asset.location.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || asset.category === selectedCategory;
    const matchesStatus = selectedStatus === 'All' || asset.status === selectedStatus;
    
    let matchesDept = true;
    if (selectedDept !== 'All') {
      matchesDept = asset.department === selectedDept;
    }

    return matchesSearch && matchesCategory && matchesStatus && matchesDept;
  });

  // Formatting helpers
  const toTitleCase = (str) => {
    if (!str) return '-';
    return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedStatus('All');
    setSelectedDept('All');
  };

  // Submit handlers
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!newAsset.name) return;
    try {
      const payload = {
        ...newAsset,
        name: toTitleCase(newAsset.name),
        location: toTitleCase(newAsset.location),
        categoryId: categories.find(c => c.name === newAsset.category)?.id || 1,
        departmentId: departments.find(d => d.name === newAsset.department)?.id || 1,
      };
      await import('../api/assetApi').then(m => m.createAsset(payload));
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
      await loadGlobalState();
    } catch (error) {
      console.error('Failed to register asset', error);
    }
  };

  const handleAllocateSubmit = async (e) => {
    e.preventDefault();
    if (!allocationForm.userName || !allocateAssetTarget) return;

    try {
      const payload = {
        assetId: allocateAssetTarget.id,
        employeeId: employees.find(emp => emp.name === allocationForm.userName)?.id || 1,
        startTime: new Date(allocationForm.startTime).toISOString(),
        endTime: new Date(allocationForm.endTime).toISOString(),
      };
      await import('../api/bookingApi').then(m => m.createBooking(payload));
      setAllocateAssetTarget(null);
      setAllocationForm({ userName: '', startTime: '', endTime: '' });
      alert('Asset successfully allocated!');
      await loadGlobalState();
    } catch (error) {
      console.error('Failed to allocate asset', error);
    }
  };

  const handleMaintenanceSubmit = async (e) => {
    e.preventDefault();
    if (!maintenanceForm.description || !maintenanceAssetTarget) return;

    try {
      const payload = {
        assetId: maintenanceAssetTarget.id,
        description: maintenanceForm.description,
        priority: maintenanceForm.priority,
        raisedById: employees.find(emp => emp.name === maintenanceForm.userName)?.id || 1, // Fallback
      };
      await import('../api/maintenanceApi').then(m => m.createMaintenance(payload));
      setMaintenanceAssetTarget(null);
      setMaintenanceForm({ userName: '', description: '', priority: 'Medium' });
      alert('Maintenance request successfully raised!');
      await loadGlobalState();
    } catch (error) {
      console.error('Failed to raise maintenance request', error);
    }
  };

  return (
    <div className="space-y-6 text-zinc-100 animate-fadeIn relative">
      {/* 1. Header Layout */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">Asset Directory</h1>
          <p className="text-zinc-500 text-sm mt-1">Register, track, and manage physical inventory lifecycles.</p>
        </div>

        <div className="flex items-center space-x-3 self-stretch lg:self-auto">
          <div className="relative flex-1 lg:w-80">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search by tag, serial, or QR code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#16171D] border border-zinc-800 text-zinc-200 text-xs rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:border-[#00B074] transition-all placeholder-zinc-550"
            />
          </div>
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="flex items-center justify-center space-x-2 bg-[#00B074] hover:bg-[#009b65] text-white font-semibold text-xs px-5 py-2.5 rounded-lg transition-all shadow-md shadow-emerald-950/20 cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Register Asset</span>
          </button>
        </div>
      </div>

      {/* 2. Asset Summary Micro-Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#16171D] border border-zinc-800 rounded-xl p-4 flex items-center space-x-3 shadow-lg shadow-zinc-950/20">
          <div className="p-2.5 rounded-lg bg-zinc-900/60 text-zinc-400">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Assets</span>
            <span className="text-xl font-extrabold text-white leading-tight mt-0.5 block">{totalAssets}</span>
          </div>
        </div>

        <div className="bg-[#16171D] border border-zinc-800 rounded-xl p-4 flex items-center space-x-3 shadow-lg shadow-zinc-950/20">
          <div className="p-2.5 rounded-lg bg-emerald-950/20 text-[#00B074]">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Available Now</span>
            <span className="text-xl font-extrabold text-white leading-tight mt-0.5 block">{availableCount}</span>
          </div>
        </div>

        <div className="bg-[#16171D] border border-zinc-800 rounded-xl p-4 flex items-center space-x-3 shadow-lg shadow-zinc-950/20">
          <div className="p-2.5 rounded-lg bg-red-950/20 text-red-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">In Repair</span>
            <span className="text-xl font-extrabold text-white leading-tight mt-0.5 block">{inRepairCount}</span>
          </div>
        </div>

        <div className="bg-[#16171D] border border-zinc-800 rounded-xl p-4 flex items-center space-x-3 shadow-lg shadow-zinc-950/20">
          <div className="p-2.5 rounded-lg bg-indigo-950/20 text-indigo-400">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Shared Resources</span>
            <span className="text-xl font-extrabold text-white leading-tight mt-0.5 block">{sharedCount}</span>
          </div>
        </div>
      </div>

      {/* 3. Filter & Query Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-[#16171D]/40 border border-zinc-800 rounded-xl p-4">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mr-2">Filters:</span>

        {/* Category Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setIsCatDropdownOpen(!isCatDropdownOpen);
              setIsStatusDropdownOpen(false);
              setIsDeptDropdownOpen(false);
            }}
            className="flex items-center space-x-2 px-3 py-1.5 bg-[#16171D] border border-zinc-800 rounded-lg text-xs font-medium text-zinc-300 hover:border-zinc-700 transition cursor-pointer"
          >
            <span>Category: <strong className="text-white">{selectedCategory}</strong></span>
            <ChevronDown className="h-3 w-3 text-zinc-500" />
          </button>
          {isCatDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1 z-20 min-w-40 text-xs">
              <button
                onClick={() => { setSelectedCategory('All'); setIsCatDropdownOpen(false); }}
                className="w-full text-left px-3 py-2 hover:bg-zinc-800 text-zinc-300 hover:text-white"
              >
                All Categories
              </button>
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedCategory(c.name); setIsCatDropdownOpen(false); }}
                  className="w-full text-left px-3 py-2 hover:bg-zinc-800 text-zinc-300 hover:text-white"
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setIsStatusDropdownOpen(!isStatusDropdownOpen);
              setIsCatDropdownOpen(false);
              setIsDeptDropdownOpen(false);
            }}
            className="flex items-center space-x-2 px-3 py-1.5 bg-[#16171D] border border-zinc-800 rounded-lg text-xs font-medium text-zinc-300 hover:border-zinc-700 transition cursor-pointer"
          >
            <span>Status: <strong className="text-white">{selectedStatus}</strong></span>
            <ChevronDown className="h-3 w-3 text-zinc-500" />
          </button>
          {isStatusDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1 z-20 min-w-44 text-xs">
              <button
                onClick={() => { setSelectedStatus('All'); setIsStatusDropdownOpen(false); }}
                className="w-full text-left px-3 py-2 hover:bg-zinc-800 text-zinc-300 hover:text-white"
              >
                All Statuses
              </button>
              {['Available', 'Allocated', 'Reserved', 'Under Maintenance', 'Lost', 'Retired', 'Disposed'].map(s => (
                <button
                  key={s}
                  onClick={() => { setSelectedStatus(s); setIsStatusDropdownOpen(false); }}
                  className="w-full text-left px-3 py-2 hover:bg-zinc-800 text-zinc-300 hover:text-white"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Department Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setIsDeptDropdownOpen(!isDeptDropdownOpen);
              setIsCatDropdownOpen(false);
              setIsStatusDropdownOpen(false);
            }}
            className="flex items-center space-x-2 px-3 py-1.5 bg-[#16171D] border border-zinc-800 rounded-lg text-xs font-medium text-zinc-300 hover:border-zinc-700 transition cursor-pointer"
          >
            <span>Department: <strong className="text-white">{selectedDept}</strong></span>
            <ChevronDown className="h-3 w-3 text-zinc-500" />
          </button>
          {isDeptDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1 z-20 min-w-44 text-xs">
              <button
                onClick={() => { setSelectedDept('All'); setIsDeptDropdownOpen(false); }}
                className="w-full text-left px-3 py-2 hover:bg-zinc-800 text-zinc-300 hover:text-white"
              >
                All Departments
              </button>
              <button
                onClick={() => { setSelectedDept('-'); setIsDeptDropdownOpen(false); }}
                className="w-full text-left px-3 py-2 hover:bg-zinc-800 text-zinc-305 hover:text-white"
              >
                Unallocated (-)
              </button>
              {departments.map(d => (
                <button
                  key={d.id}
                  onClick={() => { setSelectedDept(d.name); setIsDeptDropdownOpen(false); }}
                  className="w-full text-left px-3 py-2 hover:bg-zinc-800 text-zinc-300 hover:text-white"
                >
                  {d.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Clear Filters Button */}
        {(searchQuery || selectedCategory !== 'All' || selectedStatus !== 'All' || selectedDept !== 'All') && (
          <button
            onClick={resetFilters}
            className="text-xs font-bold text-red-400 hover:text-red-305 transition ml-auto cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* 4. Asset Inventory Table */}
      <div className="bg-[#16171D] border border-zinc-800 rounded-xl overflow-hidden shadow-lg shadow-zinc-950/20">
        {filteredAssets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4 font-mono">Tag</th>
                  <th className="px-6 py-4">Asset Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
                {filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-zinc-800/20 transition duration-155 group">
                    <td 
                      onClick={() => setSelectedDrawerAsset(asset)}
                      className="px-6 py-4 font-mono font-bold text-[#00B074] hover:underline cursor-pointer"
                    >
                      {asset.tag}
                    </td>
                    <td 
                      onClick={() => setSelectedDrawerAsset(asset)}
                      className="px-6 py-4 font-semibold text-white hover:underline cursor-pointer"
                    >
                      {asset.name}
                    </td>
                    <td className="px-6 py-4 text-zinc-400">{toTitleCase(asset.category)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        asset.status === 'Available' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50' :
                        asset.status === 'Allocated' ? 'bg-amber-950/40 text-amber-400 border-amber-900/50' :
                        asset.status === 'Under Maintenance' ? 'bg-red-950/40 text-red-400 border-red-900/50' :
                        'bg-zinc-950/40 text-zinc-500 border-zinc-800'
                      }`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">{toTitleCase(asset.location)}</td>
                    <td className="px-6 py-4 text-right relative">
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === asset.id ? null : asset.id)}
                        className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {/* Dropdown Action Menu */}
                      {activeMenuId === asset.id && (
                        <div className="absolute right-6 top-10 mt-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1 z-30 min-w-48 text-left text-xs animate-fadeIn">
                          <button
                            onClick={() => {
                              setSelectedAssetDetail(asset);
                              setActiveMenuId(null);
                            }}
                            className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-zinc-800 text-zinc-300 hover:text-white"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>View Details & History</span>
                          </button>
                          <button
                            onClick={() => {
                              if (asset.status !== 'Available') {
                                alert(`Asset is currently ${asset.status} and cannot be directly allocated.`);
                              } else {
                                setAllocateAssetTarget(asset);
                              }
                              setActiveMenuId(null);
                            }}
                            className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-zinc-800 text-zinc-300 hover:text-white"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            <span>Allocate Asset</span>
                          </button>
                          <button
                            onClick={() => {
                              setMaintenanceAssetTarget(asset);
                              setActiveMenuId(null);
                            }}
                            className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-zinc-800 text-zinc-300 hover:text-white"
                          >
                            <Wrench className="h-3.5 w-3.5" />
                            <span>Raise Maintenance Request</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* 5. Empty State Component */
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500">
              <FolderMinus className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">No Assets Found</h4>
              <p className="text-zinc-500 text-xs mt-1">No matching assets found for your search query or filter options.</p>
            </div>
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold rounded-lg transition"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Interactive Asset Quick-View Drawer (Sliding from Right) */}
      <div className={`fixed inset-0 z-40 transition-opacity duration-300 ${
        selectedDrawerAsset ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        {/* Backdrop overlay */}
        <div className="absolute inset-0 bg-black/55 backdrop-blur-xs" onClick={() => setSelectedDrawerAsset(null)} />
        
        {/* Drawer Panel */}
        <div className={`absolute top-0 right-0 h-full w-full max-w-md bg-[#16171D] border-l border-zinc-800 shadow-2xl p-6 transition-transform duration-300 transform flex flex-col justify-between ${
          selectedDrawerAsset ? 'translate-x-0' : 'translate-x-full'
        }`}>
          {selectedDrawerAsset && (
            <div className="flex-1 flex flex-col overflow-hidden text-xs">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                <div>
                  <span className="text-[10px] bg-zinc-950 border border-zinc-805 text-zinc-400 font-mono font-bold px-2 py-0.5 rounded uppercase">
                    Asset Timeline
                  </span>
                  <h3 className="font-bold text-base text-white mt-1.5">{selectedDrawerAsset.name}</h3>
                </div>
                <button onClick={() => setSelectedDrawerAsset(null)} className="text-zinc-500 hover:text-zinc-300 text-lg cursor-pointer">✕</button>
              </div>

              {/* Scrollable content area */}
              <div className="flex-1 overflow-y-auto py-6 space-y-6 pr-1">
                {/* Asset illustration card */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 flex flex-col items-center justify-center space-y-3 relative overflow-hidden">
                  <span className="text-4xl">
                    {selectedDrawerAsset.category === 'Electronics' ? '💻' :
                     selectedDrawerAsset.category === 'Vehicles' ? '🚗' :
                     selectedDrawerAsset.category === 'Furniture' ? '🪑' : '📁'}
                  </span>
                  <div className="text-center">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">{selectedDrawerAsset.category}</span>
                    <p className="text-[10px] text-zinc-550 mt-0.5">{selectedDrawerAsset.serial}</p>
                  </div>
                </div>

                {/* Acquisition detail items */}
                <div className="space-y-3 bg-[#1e202a]/30 border border-zinc-800 p-4 rounded-xl">
                  <h4 className="text-xs font-bold text-zinc-450 uppercase tracking-wider">Acquisition details</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="block text-[10px] text-zinc-500 font-bold uppercase">Date</span>
                      <span className="text-zinc-300 font-semibold">{selectedDrawerAsset.acquisitionDate}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-zinc-500 font-bold uppercase">Cost</span>
                      <span className="text-zinc-300 font-bold">${selectedDrawerAsset.acquisitionCost}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-zinc-500 font-bold uppercase">Condition</span>
                      <span className="text-zinc-300 font-semibold">{selectedDrawerAsset.condition}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-zinc-500 font-bold uppercase">Site Location</span>
                      <span className="text-zinc-300 font-semibold">{toTitleCase(selectedDrawerAsset.location)}</span>
                    </div>
                  </div>
                </div>

                {/* Vertical Timeline */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-zinc-450 uppercase tracking-wider">Operational Timeline</h4>
                  <div className="flow-root pl-2">
                    <ul className="-mb-8">
                      {(selectedDrawerAsset.history || []).map((hist, idx) => (
                        <li key={hist.id}>
                          <div className="relative pb-8">
                            {idx !== selectedDrawerAsset.history.length - 1 ? (
                              <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-zinc-850" aria-hidden="true" />
                            ) : null}
                            <div className="relative flex space-x-3">
                              <div>
                                <span className="h-8 w-8 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center text-xs font-bold text-[#00B074] ring-8 ring-[#16171D]">
                                  ✓
                                </span>
                              </div>
                              <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                                <div>
                                  <p className="text-xs text-zinc-305 font-medium">{hist.event}</p>
                                </div>
                                <div className="text-right text-[9px] whitespace-nowrap text-zinc-505 font-bold">
                                  <span>{hist.date}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Close Action */}
              <div className="pt-4 border-t border-zinc-800 flex justify-end">
                <button
                  onClick={() => setSelectedDrawerAsset(null)}
                  className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-bold text-zinc-200 transition cursor-pointer"
                >
                  Close Drawer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal 1: Register Asset */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden animate-zoomIn shadow-2xl">
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
                    placeholder="e.g. ThinkPad E14"
                    value={newAsset.name}
                    onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-[#00B074]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={newAsset.category}
                    onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-[#00B074]"
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
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-[#00B074]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Acquisition Cost ($)</label>
                  <input
                    type="number"
                    placeholder="e.g. 1200"
                    value={newAsset.acquisitionCost}
                    onChange={(e) => setNewAsset({ ...newAsset, acquisitionCost: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-[#00B074]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Condition</label>
                  <select
                    value={newAsset.condition}
                    onChange={(e) => setNewAsset({ ...newAsset, condition: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-[#00B074]"
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
                    placeholder="e.g. Bengaluru"
                    value={newAsset.location}
                    onChange={(e) => setNewAsset({ ...newAsset, location: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-[#00B074]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Allocated Department</label>
                  <select
                    value={newAsset.department}
                    onChange={(e) => setNewAsset({ ...newAsset, department: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-[#00B074]"
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
                    id="shared_dir"
                    checked={newAsset.shared}
                    onChange={(e) => setNewAsset({ ...newAsset, shared: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 bg-zinc-950 border-zinc-800 rounded focus:ring-[#00B074]"
                  />
                  <label htmlFor="shared_dir" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider cursor-pointer">Shared/Bookable asset</label>
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
                  className="px-4 py-2 bg-[#00B074] hover:bg-[#009b65] rounded-lg text-sm font-semibold text-white cursor-pointer"
                >
                  Register Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: View Details & History */}
      {selectedAssetDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#16171D] border border-zinc-850 rounded-2xl w-full max-w-md overflow-hidden animate-zoomIn shadow-2xl">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] bg-zinc-950 border border-zinc-850 px-2 py-0.5 font-mono text-zinc-400 rounded">
                  🏷️ {selectedAssetDetail.tag}
                </span>
                <h3 className="font-bold text-lg text-white mt-1.5">{selectedAssetDetail.name}</h3>
              </div>
              <button onClick={() => setSelectedAssetDetail(null)} className="text-zinc-500 hover:text-zinc-300 text-lg cursor-pointer">✕</button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Category</span>
                  <span className="text-zinc-200 font-semibold">{toTitleCase(selectedAssetDetail.category)}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Serial Number</span>
                  <span className="text-zinc-200 font-mono font-semibold">{selectedAssetDetail.serial}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Location</span>
                  <span className="text-zinc-300">{toTitleCase(selectedAssetDetail.location)}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Condition</span>
                  <span className="text-zinc-300">{selectedAssetDetail.condition}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Department</span>
                  <span className="text-zinc-300">{selectedAssetDetail.department || '-'}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Current Holder</span>
                  <span className="text-zinc-300">{selectedAssetDetail.employee || 'None'}</span>
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-3 flex items-center justify-between">
                <div>
                  <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Asset Status</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                    selectedAssetDetail.status === 'Available' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50' :
                    selectedAssetDetail.status === 'Allocated' ? 'bg-amber-950/40 text-amber-400 border border-amber-900/50' :
                    'bg-red-950/40 text-red-400 border border-red-900/50'
                  }`}>
                    {selectedAssetDetail.status}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Acquisition Cost</span>
                  <span className="text-zinc-200 font-bold">${selectedAssetDetail.acquisitionCost}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end">
                <button
                  onClick={() => setSelectedAssetDetail(null)}
                  className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-bold text-zinc-200 transition"
                >
                  Close Detail
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Allocate Asset */}
      {allocateAssetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden animate-zoomIn shadow-2xl">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-lg text-white">Allocate {allocateAssetTarget.name} ({allocateAssetTarget.tag})</h3>
              <button onClick={() => setAllocateAssetTarget(null)} className="text-zinc-500 hover:text-zinc-300 text-lg cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleAllocateSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Allocate to Employee</label>
                <select
                  value={allocationForm.userName}
                  onChange={(e) => setAllocationForm({ ...allocationForm, userName: e.target.value })}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-[#00B074]"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.name}>{emp.name} ({emp.department})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Expected Return Date</label>
                  <input
                    type="date"
                    required
                    value={allocationForm.endTime.split('T')[0]}
                    onChange={(e) => setAllocationForm({ ...allocationForm, endTime: e.target.value + 'T18:00' })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setAllocateAssetTarget(null)}
                  className="px-4 py-2 border border-zinc-700 hover:bg-zinc-800 rounded-lg font-semibold text-zinc-305 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00B074] hover:bg-[#009b65] rounded-lg font-semibold text-white cursor-pointer"
                >
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Raise Maintenance Request */}
      {maintenanceAssetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden animate-zoomIn shadow-2xl">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-lg text-white">Maintenance: {maintenanceAssetTarget.name}</h3>
              <button onClick={() => setMaintenanceAssetTarget(null)} className="text-zinc-500 hover:text-zinc-300 text-lg cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleMaintenanceSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Reported By</label>
                <select
                  value={maintenanceForm.userName}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, userName: e.target.value })}
                  required
                  className="w-full bg-zinc-950 border border-zinc-805 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-[#00B074]"
                >
                  <option value="">-- Select reporter --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.name}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Describe Issue</label>
                <textarea
                  required
                  placeholder="Explain problem..."
                  value={maintenanceForm.description}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                  className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-[#ffffff] focus:outline-none focus:border-[#00B074] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Priority Level</label>
                <select
                  value={maintenanceForm.priority}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, priority: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div className="pt-4 border-t border-zinc-850 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setMaintenanceAssetTarget(null)}
                  className="px-4 py-2 border border-zinc-700 hover:bg-zinc-800 rounded-lg font-semibold text-zinc-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00B074] hover:bg-[#009b65] rounded-lg font-semibold text-white cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetInventory;
