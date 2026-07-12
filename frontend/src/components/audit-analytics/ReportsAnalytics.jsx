import React, { useContext, useMemo } from 'react';
import { BarChart3, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import { AppContext } from '../../App';

export default function ReportsAnalytics() {
  const { assets } = useContext(AppContext);

  // Compute stats
  const totalValue = assets.reduce((acc, asset) => acc + (asset.acquisitionCost || 0), 0);
  
  const overdueAssets = assets.filter(a => {
    if (a.status !== 'Allocated' || !a.expectedReturnDate) return false;
    return new Date(a.expectedReturnDate) < new Date();
  });

  const utilization = useMemo(() => {
    const cats = {};
    assets.forEach(a => {
      if (!cats[a.category]) cats[a.category] = { total: 0, active: 0 };
      cats[a.category].total++;
      if (a.status === 'Allocated') cats[a.category].active++;
    });
    return Object.entries(cats).map(([name, data]) => ({
      name,
      value: data.total > 0 ? Math.round((data.active / data.total) * 100) : 0
    }));
  }, [assets]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">Reports & Analytics</h1>
        <p className="text-sm text-zinc-400">System-wide asset utilization and health metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Utilization Chart */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl col-span-1 md:col-span-2">
          <h2 className="text-lg font-bold text-zinc-200 flex items-center"><BarChart3 className="w-5 h-5 mr-2 text-emerald-500"/> Asset Utilization by Category</h2>
          <div className="flex flex-col gap-5 mt-6">
            {utilization.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span className="text-zinc-400 uppercase tracking-wider">{item.name}</span>
                  <span className="text-emerald-400">{item.value}%</span>
                </div>
                <div className="w-full bg-zinc-950 rounded-full h-2.5 border border-zinc-800">
                  <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${item.value}%` }}></div>
                </div>
              </div>
            ))}
            {utilization.length === 0 && <div className="text-zinc-500 text-sm">No data available.</div>}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex flex-col gap-6">
          <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-900/10 border border-emerald-800/50 rounded-xl p-6 shadow-xl">
            <h2 className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">Total Value Managed</h2>
            <div className="text-4xl font-bold text-emerald-100 mt-2">${totalValue.toLocaleString()}</div>
            <div className="flex items-center text-xs mt-3 text-emerald-400/80 font-medium">
              <TrendingUp className="w-4 h-4 mr-1"/> Active Valuation
            </div>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl flex items-center gap-5">
            <div className="p-4 bg-zinc-950 border border-zinc-800 text-amber-500 rounded-full shadow-inner flex-shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-3xl font-bold text-zinc-200">{overdueAssets.length}</div>
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mt-1">Overdue Assets</div>
            </div>
          </div>
        </div>

        {/* Watchlist */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl col-span-1 md:col-span-3 overflow-hidden">
          <div className="p-6 border-b border-zinc-800">
            <h2 className="text-lg font-bold text-red-400 flex items-center"><AlertCircle className="w-5 h-5 mr-2"/> Aging Equipment & Overdue Watchlist</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="bg-zinc-950/50 text-xs uppercase font-semibold text-zinc-500 border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4">Asset Tag</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Current Holder</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {overdueAssets.map(item => (
                  <tr key={item.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-emerald-500 font-bold">{item.tag}</td>
                    <td className="px-6 py-4 text-zinc-200 font-medium">{item.name}</td>
                    <td className="px-6 py-4 text-zinc-300">{item.employee}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-950/40 text-red-400 border border-red-900/50">
                        Overdue: {item.expectedReturnDate}
                      </span>
                    </td>
                  </tr>
                ))}
                {overdueAssets.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-zinc-500">No overdue items in the watchlist.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
