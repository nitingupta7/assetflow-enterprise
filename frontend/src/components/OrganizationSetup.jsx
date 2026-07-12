import React, { useState, useContext } from 'react';
import { AppContext } from '../App';

const OrganizationSetup = () => {
  const {
    currentRole,
    departments,
    addDepartment,
    updateDepartment,
    categories,
    addCategory,
    updateCategory,
    employees,
    addEmployee,
    updateEmployee
  } = useContext(AppContext);

  const [activeTab, setActiveTab] = useState('departments'); // 'departments' | 'categories' | 'employees'
  const [viewHierarchy, setViewHierarchy] = useState(false); // Toggle tree view for departments
  const [selectedDeptIds, setSelectedDeptIds] = useState([]); // Bulk actions checkboxes
  const [bulkAction, setBulkAction] = useState('');

  // Modal open states
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);

  // Edit target states (null if creating new)
  const [editDept, setEditDept] = useState(null);
  const [editCat, setEditCat] = useState(null);
  const [editEmp, setEditEmp] = useState(null);

  // Form states
  const [deptForm, setDeptForm] = useState({ name: '', head: '-', parent: '-', status: 'Active' });
  const [catForm, setCatForm] = useState({ name: '', customFields: [{ key: '', value: '' }] });
  const [empForm, setEmpForm] = useState({ name: '', email: '', department: '-', role: 'Employee', status: 'Active' });

  const isAdmin = currentRole === 'Admin';

  // Stats calculation
  const totalDepts = departments.length;
  const activeHeads = departments.filter(d => d.status === 'Active' && d.head !== '-').length;
  const inactiveUnits = departments.filter(d => d.status === 'Inactive').length;

  const handleOpenAddModal = () => {
    if (!isAdmin) return;
    if (activeTab === 'departments') {
      setEditDept(null);
      setDeptForm({ name: '', head: '-', parent: '-', status: 'Active' });
      setIsDeptModalOpen(true);
    } else if (activeTab === 'categories') {
      setEditCat(null);
      setCatForm({ name: '', customFields: [{ key: '', value: '' }] });
      setIsCatModalOpen(true);
    } else if (activeTab === 'employees') {
      setEditEmp(null);
      setEmpForm({ name: '', email: '', department: departments[0]?.name || '-', role: 'Employee', status: 'Active' });
      setIsEmpModalOpen(true);
    }
  };

  const handleOpenEditDept = (dept) => {
    if (!isAdmin) return;
    setEditDept(dept);
    setDeptForm({ name: dept.name, head: dept.head, parent: dept.parent, status: dept.status });
    setIsDeptModalOpen(true);
  };

  const handleOpenEditCat = (cat) => {
    if (!isAdmin) return;
    setEditCat(cat);
    const fields = Object.entries(cat.attributes || {}).map(([key, value]) => ({ key, value }));
    setCatForm({ name: cat.name, customFields: fields.length ? fields : [{ key: '', value: '' }] });
    setIsCatModalOpen(true);
  };

  const handleOpenEditEmp = (emp) => {
    if (!isAdmin) return;
    setEditEmp(emp);
    setEmpForm({ name: emp.name, email: emp.email, department: emp.department, role: emp.role, status: emp.status });
    setIsEmpModalOpen(true);
  };

  const handleDeptSubmit = (e) => {
    e.preventDefault();
    if (!deptForm.name) return;

    if (editDept) {
      updateDepartment({ ...editDept, ...deptForm });
    } else {
      addDepartment(deptForm);
    }
    setIsDeptModalOpen(false);
  };

  const handleCatSubmit = (e) => {
    e.preventDefault();
    if (!catForm.name) return;

    const attrs = {};
    catForm.customFields.forEach(field => {
      if (field.key.trim()) {
        attrs[field.key.trim()] = field.value.trim();
      }
    });

    if (editCat) {
      updateCategory({ ...editCat, name: catForm.name, attributes: attrs });
    } else {
      addCategory({ name: catForm.name, attributes: attrs });
    }
    setIsCatModalOpen(false);
  };

  const handleEmpSubmit = (e) => {
    e.preventDefault();
    if (!empForm.name || !empForm.email) return;

    if (editEmp) {
      updateEmployee({ ...editEmp, ...empForm });
    } else {
      addEmployee(empForm);
    }
    setIsEmpModalOpen(false);
  };

  const handleAddCustomField = () => {
    setCatForm({
      ...catForm,
      customFields: [...catForm.customFields, { key: '', value: '' }]
    });
  };

  const handleRemoveCustomField = (index) => {
    const fields = [...catForm.customFields];
    fields.splice(index, 1);
    setCatForm({ ...catForm, customFields: fields });
  };

  const handleCustomFieldChange = (index, part, value) => {
    const fields = [...catForm.customFields];
    fields[index][part] = value;
    setCatForm({ ...catForm, customFields: fields });
  };

  // Bulk Actions Handlers
  const handleToggleSelectAll = () => {
    if (selectedDeptIds.length === departments.length) {
      setSelectedDeptIds([]);
    } else {
      setSelectedDeptIds(departments.map(d => d.id));
    }
  };

  const handleSelectDept = (id) => {
    setSelectedDeptIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleApplyBulkAction = () => {
    if (!bulkAction || selectedDeptIds.length === 0) return;

    selectedDeptIds.forEach(id => {
      const dept = departments.find(d => d.id === id);
      if (dept) {
        if (bulkAction === 'deactivate') {
          updateDepartment({ ...dept, status: 'Inactive' });
        } else if (bulkAction === 'activate') {
          updateDepartment({ ...dept, status: 'Active' });
        } else if (bulkAction === 'clear-parent') {
          updateDepartment({ ...dept, parent: '-' });
        }
      }
    });

    setSelectedDeptIds([]);
    setBulkAction('');
    alert('Bulk action executed successfully!');
  };

  // Recursive render node for org hierarchy tree
  const renderDeptNode = (dept, depth = 0) => {
    const children = departments.filter(d => d.parent === dept.name);
    return (
      <div key={dept.id} className="space-y-2">
        <div className="flex items-center justify-between p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl hover:border-zinc-700/80 transition shadow-sm">
          <div className="flex items-center space-x-3">
            <span className="text-zinc-500 font-semibold">{depth > 0 ? '↳ 📂' : '🏢'}</span>
            <div>
              <span className="font-semibold text-white text-sm">{dept.name}</span>
              {dept.head !== '-' && (
                <span className="text-[10px] text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-850 ml-3">
                  Head: {dept.head}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
              dept.status === 'Active'
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/80'
                : 'bg-zinc-950/40 text-zinc-505 border-zinc-800'
            }`}>{dept.status}</span>
            {isAdmin && (
              <button
                onClick={() => handleOpenEditDept(dept)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
              >
                Edit
              </button>
            )}
          </div>
        </div>
        {children.length > 0 && (
          <div className="pl-6 border-l border-zinc-800/60 space-y-2 ml-4">
            {children.map(child => renderDeptNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const topLevelDepts = departments.filter(d => d.parent === '-' || !d.parent);

  return (
    <div className="space-y-8 animate-fadeIn text-zinc-100">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">Organization Setup</h1>
          <p className="text-zinc-500 text-sm mt-1">Maintain master data, departments, category fields, and system roles.</p>
        </div>

        {!isAdmin && (
          <div className="bg-amber-950/20 border border-amber-800/80 rounded-xl px-4 py-3 text-amber-400 text-xs flex items-center space-x-2">
            <span>🔒</span>
            <span><strong>Read-Only View:</strong> Simulated user role must be promoted to <strong>Admin</strong> to modify data.</span>
          </div>
        )}
      </div>

      {/* Tabs & Contextual Add Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-zinc-800 pb-px gap-4">
        <div className="flex space-x-1 p-0.5 bg-zinc-900 rounded-lg border border-zinc-800/80 self-start">
          <button
            onClick={() => setActiveTab('departments')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'departments'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Departments</span>
            <span className="px-1.5 py-0.5 text-[9px] rounded-full font-bold bg-zinc-950 text-zinc-400">
              {departments.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Categories</span>
            <span className="px-1.5 py-0.5 text-[9px] rounded-full font-bold bg-zinc-950 text-zinc-400">
              {categories.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'employees'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Employee Directory</span>
            <span className="px-1.5 py-0.5 text-[9px] rounded-full font-bold bg-zinc-950 text-zinc-400">
              {employees.length}
            </span>
          </button>
        </div>

        <div className="flex items-center space-x-3">
          {/* View Hierarchy Toggle (Departments Tab Only) */}
          {activeTab === 'departments' && (
            <button
              onClick={() => setViewHierarchy(!viewHierarchy)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-bold text-zinc-350 hover:bg-zinc-800 transition cursor-pointer"
            >
              <span>{viewHierarchy ? '📋 Flat Table' : '🌳 Org Hierarchy'}</span>
            </button>
          )}

          <button
            onClick={handleOpenAddModal}
            disabled={!isAdmin}
            className={`flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer ${
              isAdmin
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/20'
                : 'bg-zinc-800 text-zinc-500 border border-zinc-700/50 cursor-not-allowed'
            }`}
          >
            <span>➕ Add</span>
            <span className="capitalize">
              {activeTab === 'departments' ? 'Department' : activeTab === 'categories' ? 'Category' : 'Employee'}
            </span>
          </button>
        </div>
      </div>

      {/* Summary Micro-Cards Strip */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col">
            <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider">Total Departments</span>
            <span className="text-xl font-extrabold text-white mt-1">{totalDepts}</span>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col">
            <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider">Active Heads</span>
            <span className="text-xl font-extrabold text-emerald-450 mt-1">{activeHeads}</span>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col">
            <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider">Inactive Units</span>
            <span className="text-xl font-extrabold text-zinc-400 mt-1">{inactiveUnits}</span>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar (Table View Only) */}
      {isAdmin && activeTab === 'departments' && !viewHierarchy && selectedDeptIds.length > 0 && (
        <div className="bg-zinc-900 border border-emerald-900/40 rounded-xl p-4 flex items-center justify-between animate-fadeIn">
          <div className="text-xs text-zinc-305 font-medium">
            Selected <strong className="text-emerald-400">{selectedDeptIds.length}</strong> department(s)
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs rounded-lg px-3 py-2 focus:outline-none cursor-pointer"
            >
              <option value="">-- Choose Bulk Action --</option>
              <option value="activate">Bulk Activate</option>
              <option value="deactivate">Bulk Deactivate</option>
              <option value="clear-parent">Bulk Clear Parent Department</option>
            </select>
            <button
              onClick={handleApplyBulkAction}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
            >
              Apply Action
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg shadow-zinc-950/20">
        
        {/* Tab A: Departments List */}
        {activeTab === 'departments' && (
          viewHierarchy ? (
            /* Tree View / Folder Structure */
            <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
              {topLevelDepts.map(dept => renderDeptNode(dept))}
              {topLevelDepts.length === 0 && (
                <p className="text-center text-zinc-500 text-xs py-8">No root departments found to render hierarchy tree.</p>
              )}
            </div>
          ) : (
            /* Flat Table View */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                    {isAdmin && (
                      <th className="px-6 py-4 w-12 text-center">
                        <input
                          type="checkbox"
                          checked={selectedDeptIds.length === departments.length}
                          onChange={handleToggleSelectAll}
                          className="w-3.5 h-3.5 text-emerald-600 bg-zinc-950 border-zinc-850 rounded focus:ring-emerald-500 cursor-pointer"
                        />
                      </th>
                    )}
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4">Head</th>
                    <th className="px-6 py-4">Parent Dept</th>
                    <th className="px-6 py-4">Status</th>
                    {isAdmin && <th className="px-6 py-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
                  {departments.map((dept) => (
                    <tr key={dept.id} className="hover:bg-zinc-800/25 transition">
                      {isAdmin && (
                        <td className="px-6 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedDeptIds.includes(dept.id)}
                            onChange={() => handleSelectDept(dept.id)}
                            className="w-3.5 h-3.5 text-emerald-600 bg-zinc-950 border-zinc-850 rounded focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 font-semibold text-white">{dept.name}</td>
                      <td className="px-6 py-4 text-zinc-400">{dept.head}</td>
                      <td className="px-6 py-4 text-zinc-500">{dept.parent}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          dept.status === 'Active'
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/80'
                            : 'bg-zinc-950/40 text-zinc-505 border-zinc-800'
                        }`}>{dept.status}</span>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleOpenEditDept(dept)}
                            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition mr-2 cursor-pointer"
                          >
                            Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Tab B: Categories Table */}
        {activeTab === 'categories' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Category Name</th>
                  <th className="px-6 py-4">Specific Fields / Attributes</th>
                  {isAdmin && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-zinc-800/25 transition">
                    <td className="px-6 py-4 font-semibold text-white">{cat.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(cat.attributes || {}).map(([key, val]) => (
                          <span key={key} className="bg-zinc-950 text-zinc-400 text-xs px-2.5 py-1 rounded-md border border-zinc-800 font-medium">
                            <strong className="text-zinc-305">{key}:</strong> {val}
                          </span>
                        ))}
                        {Object.keys(cat.attributes || {}).length === 0 && (
                          <span className="text-zinc-650 italic text-xs">No extra attributes defined</span>
                        )}
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenEditCat(cat)}
                          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition mr-2 cursor-pointer"
                        >
                          Edit
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab C: Employee Directory Table */}
        {activeTab === 'employees' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">System Role</th>
                  <th className="px-6 py-4">Status</th>
                  {isAdmin && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-zinc-800/25 transition">
                    <td className="px-6 py-4 font-semibold text-white">{emp.name}</td>
                    <td className="px-6 py-4 text-zinc-400">{emp.email}</td>
                    <td className="px-6 py-4 text-zinc-400">{emp.department}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        emp.role === 'Admin' ? 'bg-red-950/40 text-red-400 border border-red-900/50' :
                        emp.role === 'Department Head' ? 'bg-amber-950/40 text-amber-400 border border-amber-900/50' :
                        emp.role === 'Asset Manager' ? 'bg-blue-950/40 text-blue-400 border border-blue-900/50' :
                        'bg-zinc-950 text-zinc-405 border border-zinc-800'
                      }`}>{emp.role}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        emp.status === 'Active'
                          ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/80'
                          : 'bg-zinc-950/40 text-zinc-505 border-zinc-800'
                      }`}>{emp.status}</span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenEditEmp(emp)}
                          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition mr-2 cursor-pointer"
                        >
                          Promote / Edit
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="text-zinc-500 text-xs mt-3 flex items-center space-x-2">
        <span>💡</span>
        <span>Editing a department here also drives the picklists when creating/editing employees or registering assets.</span>
      </div>

      {/* Modal A: Create/Edit Department */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden animate-zoomIn">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-lg text-white">
                {editDept ? 'Edit Department' : 'Create Department'}
              </h3>
              <button onClick={() => setIsDeptModalOpen(false)} className="text-zinc-500 hover:text-zinc-300 text-lg cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleDeptSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operations, IT, Finance"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Department Head</label>
                <select
                  value={deptForm.head}
                  onChange={(e) => setDeptForm({ ...deptForm, head: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="-">-</option>
                  {employees.filter(e => e.status === 'Active').map(emp => (
                    <option key={emp.id} value={emp.name}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Parent Department</label>
                <select
                  value={deptForm.parent}
                  onChange={(e) => setDeptForm({ ...deptForm, parent: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="-">-</option>
                  {departments.filter(d => d.id !== editDept?.id).map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Status</label>
                <select
                  value={deptForm.status}
                  onChange={(e) => setDeptForm({ ...deptForm, status: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="px-4 py-2 border border-zinc-700 hover:bg-zinc-800 rounded-lg text-sm font-semibold text-zinc-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-semibold text-white cursor-pointer"
                >
                  {editDept ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal B: Create/Edit Category */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden animate-zoomIn">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-lg text-white">
                {editCat ? 'Edit Category' : 'Create Category'}
              </h3>
              <button onClick={() => setIsCatModalOpen(false)} className="text-zinc-500 hover:text-zinc-300 text-lg cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleCatSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Laptops, Office Desks, Vehicles"
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">Category-Specific Fields (Attributes)</label>
                  <button
                    type="button"
                    onClick={handleAddCustomField}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer"
                  >
                    + Add Attribute
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {catForm.customFields.map((field, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Label"
                        value={field.key}
                        onChange={(e) => handleCustomFieldChange(idx, 'key', e.target.value)}
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                      />
                      <input
                        type="text"
                        placeholder="Default"
                        value={field.value}
                        onChange={(e) => handleCustomFieldChange(idx, 'value', e.target.value)}
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                      />
                      {catForm.customFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomField(idx)}
                          className="text-red-400 hover:text-red-300 text-xs px-1 cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2 border border-zinc-700 hover:bg-zinc-800 rounded-lg text-sm font-semibold text-zinc-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-semibold text-white cursor-pointer"
                >
                  {editCat ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal C: Create/Edit Employee & Promote */}
      {isEmpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden animate-zoomIn">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-lg text-white">
                {editEmp ? 'Edit & Promote Employee' : 'Add Employee'}
              </h3>
              <button onClick={() => setIsEmpModalOpen(false)} className="text-zinc-500 hover:text-zinc-300 text-lg cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleEmpSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Employee Name</label>
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={empForm.name}
                  onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="username@company.com"
                  value={empForm.email}
                  onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Department</label>
                <select
                  value={empForm.department}
                  onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                >
                  {departments.filter(d => d.status === 'Active').map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">System Role (Admin Promotes Here)</label>
                <select
                  value={empForm.role}
                  onChange={(e) => setEmpForm({ ...empForm, role: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 text-amber-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 font-semibold"
                >
                  <option value="Employee">Employee</option>
                  <option value="Asset Manager">Asset Manager</option>
                  <option value="Department Head">Department Head</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">System Status</label>
                <select
                  value={empForm.status}
                  onChange={(e) => setEmpForm({ ...empForm, status: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEmpModalOpen(false)}
                  className="px-4 py-2 border border-zinc-700 hover:bg-zinc-800 rounded-lg text-sm font-semibold text-zinc-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-semibold text-white cursor-pointer"
                >
                  {editEmp ? 'Save & Promote' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationSetup;
