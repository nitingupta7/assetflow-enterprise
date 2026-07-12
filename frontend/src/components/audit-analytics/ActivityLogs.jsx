import React, { useState, useContext } from 'react';
import { Calendar, Search, AlertTriangle, CheckCircle, Clock, Info } from 'lucide-react';
import { AppContext } from '../../App';

export default function ActivityLogs() {
  const { activity } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');

  const tabs = ['All', 'allocation', 'booking', 'maintenance', 'registration', 'audit', 'transfer'];

  const filteredLogs = activity.filter(log => {
    const matchesTab = activeTab === 'All' || log.type === activeTab;
    const matchesSearch = log.text.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getIcon = (type) => {
    switch(type) {
      case 'maintenance': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'allocation': 
      case 'registration': 
      case 'transfer':
      case 'audit':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'booking': return <Calendar className="w-5 h-5 text-blue-400" />;
      default: return <Info className="w-5 h-5 text-zinc-500" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">System Notifications</h1>
          <p className="text-sm text-zinc-400">Real-time audit trail and event tracking</p>
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search notifications..." 
            className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm rounded-full pl-9 pr-4 py-2.5 focus:outline-none focus:border-emerald-500 transition-all placeholder-zinc-600"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex overflow-x-auto space-x-2 pb-2 scrollbar-hide">
        {tabs.map(tab => (
          <button 
            key={tab}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 border border-emerald-500' 
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden">
        <ul className="divide-y divide-zinc-800">
          {filteredLogs.map(log => (
            <li key={log.id} className="p-5 hover:bg-zinc-800/40 transition-colors flex gap-4 items-start">
              <div className="mt-0.5 p-2 bg-zinc-950 rounded-full border border-zinc-800 flex-shrink-0">
                {getIcon(log.type)}
              </div>
              <div className="flex-1">
                <p className="text-zinc-200 text-sm font-medium leading-relaxed">{log.text}</p>
                <div className="flex items-center gap-3 mt-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  <span className="text-emerald-500">{log.type}</span>
                  <span>•</span>
                  <span>{log.time}</span>
                </div>
              </div>
            </li>
          ))}
          {filteredLogs.length === 0 && (
             <li className="p-10 text-center text-zinc-500 text-sm">
               No notifications found matching the current filters.
             </li>
          )}
        </ul>
      </div>
    </div>
  );
}
