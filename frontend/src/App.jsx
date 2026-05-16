import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Package, 
  Bell, 
  LayoutDashboard, 
  Map, 
  BarChart3,
  RefreshCw,
  Cpu,
  ChevronRight,
  Search,
  Globe,
  Settings
} from 'lucide-react';
import AgentConsole from './components/AgentConsole';
import ShipmentTracker from './components/ShipmentTracker';

function App() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  const fetchState = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/state');
      setState(response.data);
    } catch (error) {
      console.error('Failed to fetch state', error);
    } finally {
      setLoading(false);
    }
  };

  const resetState = async () => {
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/reset');
      fetchState();
    } catch (error) {
      console.error('Reset failed', error);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  if (loading && !state) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#05060a]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-cyan-500 font-bold tracking-[0.3em] text-xs animate-pulse">BOOTING ANTIGRAVITY OS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05060a] text-white flex overflow-hidden">
      {/* Sidebar - Sleek and Narrow */}
      <aside className="w-20 lg:w-72 border-r border-white/5 bg-[#08090d] flex flex-col p-6 h-screen sticky top-0">
        <div className="flex items-center gap-4 mb-12 px-2">
          <div className="w-10 h-10 bg-gradient-to-br from-[#00f2ff] to-[#bc13fe] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.2)]">
            <Cpu className="text-white" size={24} />
          </div>
          <div className="hidden lg:block">
            <h1 className="text-lg font-black tracking-tighter leading-none">ANTIGRAVITY</h1>
            <p className="text-[10px] text-cyan-400 font-bold tracking-[0.2em] mt-1">LOGISTICS OS</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Command Center" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <NavItem 
            icon={<Globe size={20} />} 
            label="Global Network" 
            active={activeTab === 'network'} 
            onClick={() => setActiveTab('network')} 
          />
          <NavItem 
            icon={<BarChart3 size={20} />} 
            label="Impact Analytics" 
            active={activeTab === 'analytics'} 
            onClick={() => setActiveTab('analytics')} 
          />
          <NavItem 
            icon={<Activity size={20} />} 
            label="Operation Logs" 
            active={activeTab === 'logs'} 
            onClick={() => setActiveTab('logs')} 
          />
        </nav>

        <div className="mt-auto space-y-4">
          <button 
            onClick={resetState}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-slate-500 transition-all text-sm group"
          >
            <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
            <span className="hidden lg:block font-semibold">Reset Simulation</span>
          </button>
          
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hidden lg:block">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] text-slate-500 font-bold tracking-widest">SYSTEM NODE</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            </div>
            <p className="text-xs font-bold text-slate-300">Hamburg-01 (Active)</p>
          </div>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto custom-scrollbar">
        {/* Top Header */}
        <header className="h-20 border-b border-white/5 bg-[#05060a]/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-50">
          <div className="flex items-center gap-4">
             <div className="hidden lg:flex items-center gap-2 bg-white/5 rounded-full px-4 py-2 border border-white/5">
                <Search size={16} className="text-slate-500" />
                <input type="text" placeholder="Search node or shipment..." className="bg-transparent text-sm outline-none w-48 text-slate-300" />
             </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-8">
               <div className="text-right">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Total Assets</p>
                  <p className="text-lg font-bold text-white">{state?.shipments.length}</p>
               </div>
               <div className="text-right">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Risk Alerts</p>
                  <p className="text-lg font-bold text-red-500">{state?.inventory.filter(i => i.status === 'Low Stock').length}</p>
               </div>
            </div>
            <div className="w-[1px] h-8 bg-white/10" />
            <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#bc13fe] rounded-full" />
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-white/10 flex items-center justify-center">
              <Settings size={18} className="text-slate-400" />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">
          {/* Welcome Title */}
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-4xl font-black tracking-tight mb-2">Command Center</h2>
              <p className="text-slate-500 font-medium">Monitoring global disruption signals and autonomous decision flow.</p>
            </div>
            <div className="bg-[#00f2ff]/10 px-4 py-2 rounded-lg border border-[#00f2ff]/20 flex items-center gap-2">
              <Activity size={16} className="text-[#00f2ff]" />
              <span className="text-xs font-bold text-[#00f2ff] tracking-wider uppercase">Live Neural Feed</span>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* Left Column (7/12) */}
            <div className="xl:col-span-7 space-y-8">
              <AgentConsole onStateUpdate={fetchState} />
              
              <div className="glass-card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Activity size={20} className="text-cyan-400" />
                    Autonomous Simulation Logs
                  </h3>
                  <button className="text-xs text-slate-500 hover:text-cyan-400 transition-colors uppercase font-bold tracking-widest">Clear Logs</button>
                </div>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                  {state?.logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-20">
                      <Cpu size={48} className="mb-4" />
                      <p className="italic font-medium">Neural engine idle. Waiting for ingestion...</p>
                    </div>
                  ) : (
                    state?.logs.map((log, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={i} 
                        className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5"
                      >
                        <span className="text-slate-600 font-mono text-xs mt-1">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <div>
                          <span className="inline-block px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-black text-[9px] uppercase tracking-tighter mr-3 border border-cyan-500/20">
                            {log.action}
                          </span>
                          <p className="text-sm text-slate-300 leading-relaxed font-medium mt-1">{log.details}</p>
                        </div>
                      </motion.div>
                    )).reverse()
                  )}
                </div>
              </div>
            </div>

            {/* Right Column (5/12) */}
            <div className="xl:col-span-5 space-y-8">
              <ShipmentTracker shipments={state?.shipments || []} />
              
              <div className="glass-card">
                <div className="flex items-center gap-2 mb-6">
                  <Package size={20} className="text-amber-400" />
                  <h3 className="text-lg font-bold">Node Inventory Risks</h3>
                </div>
                <div className="space-y-6">
                  {state?.inventory.map((item, i) => (
                    <div key={i} className="group cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">{item.item}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">Node: HAM-CENTRAL</p>
                        </div>
                        <div className="text-right">
                          <span className={`status-badge ${
                            item.status === 'Low Stock' ? 'status-low-stock' : 'status-in-transit'
                          }`}>
                            {item.status}
                          </span>
                          <p className="text-xs font-bold text-slate-400 mt-1">{item.stock} Units</p>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(item.stock / 500) * 100}%` }}
                          className={`h-full ${item.status === 'Low Stock' ? 'bg-red-500' : 'bg-[#00f2ff]'}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-6 py-3 border border-white/5 rounded-xl text-xs font-bold text-slate-400 hover:bg-white/5 hover:text-white transition-all uppercase tracking-[0.2em]">
                  View All Inventory
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const NavItem = ({ icon, label, active = false, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group ${
      active 
        ? 'bg-gradient-to-r from-cyan-500/10 to-transparent text-cyan-400 border-l-2 border-cyan-400 shadow-[10px_0_20px_rgba(0,242,255,0.02)]' 
        : 'text-slate-500 hover:bg-white/[0.03] hover:text-slate-300'
  }`}>
    <div className={`${active ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'} transition-colors`}>
      {icon}
    </div>
    <span className="font-bold text-sm hidden lg:block tracking-tight">{label}</span>
  </button>
);

export default App;
