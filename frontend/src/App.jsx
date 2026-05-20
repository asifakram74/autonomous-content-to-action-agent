import React, { useState, useEffect, useRef } from 'react';
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
  Search,
  Globe,
  Settings,
  LogOut,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import AgentConsole from './components/AgentConsole';
import ShipmentTracker from './components/ShipmentTracker';
import DataManager from './components/DataManager';

const API = 'http://localhost:5000';

// ─── Auth Screen ────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'Operator' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (mode === 'register') {
        await axios.post(`${API}/api/auth/register`, form);
        setSuccess('Account created! Signing you in…');
        // auto-login after register
        const res = await axios.post(`${API}/api/auth/login`, {
          username: form.username,
          password: form.password,
        });
        onAuth(res.data.token, res.data.user);
      } else {
        const res = await axios.post(`${API}/api/auth/login`, {
          username: form.username,
          password: form.password,
        });
        onAuth(res.data.token, res.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Connection failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#05060a] flex items-center justify-center relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#00f2ff]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#bc13fe]/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-[#00f2ff] to-[#bc13fe] rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(0,242,255,0.25)] mb-4">
            <Cpu size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-white">ANTIGRAVITY</h1>
          <p className="text-[11px] text-cyan-400 font-bold tracking-[0.3em] mt-1">LOGISTICS OS · SECURE ACCESS</p>
        </div>

        {/* Card */}
        <div className="bg-[#0a0b12]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
          {/* Mode toggle */}
          <div className="flex bg-white/[0.04] rounded-2xl p-1 mb-8">
            {['login', 'register'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all duration-300 ${mode === m
                    ? 'bg-gradient-to-r from-[#00f2ff]/20 to-[#bc13fe]/20 text-white border border-white/10 shadow-inner'
                    : 'text-slate-500 hover:text-slate-300'
                  }`}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {/* Username */}
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Username"
                value={form.username}
                onChange={e => update('username', e.target.value)}
                required
                className="w-full bg-white/[0.04] border border-white/8 rounded-xl pl-11 pr-4 py-3.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-500/50 focus:bg-white/[0.06] focus:shadow-[0_0_20px_rgba(0,242,255,0.05)] transition-all"
              />
            </div>

            {/* Email (register only) */}
            <AnimatePresence>
              {mode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="relative overflow-hidden space-y-4"
                >
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      placeholder="Email address"
                      value={form.email}
                      onChange={e => update('email', e.target.value)}
                      required={mode === 'register'}
                      className="w-full bg-white/[0.04] border border-white/8 rounded-xl pl-11 pr-4 py-3.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-500/50 focus:bg-white/[0.06] transition-all"
                    />
                  </div>

                  {/* Role Selector (register only) */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Operational Role</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Operator', 'Director'].map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => update('role', r)}
                          className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all duration-300 ${form.role === r
                              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                              : 'bg-white/[0.02] text-slate-400 border-white/5 hover:border-white/10'
                            }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Password */}
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Password"
                value={form.password}
                onChange={e => update('password', e.target.value)}
                required
                className="w-full bg-white/[0.04] border border-white/8 rounded-xl pl-11 pr-12 py-3.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-500/50 focus:bg-white/[0.06] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Error / Success */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium"
                >
                  <AlertTriangle size={14} className="shrink-0" />
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium"
                >
                  <CheckCircle2 size={14} className="shrink-0" />
                  {success}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-wider bg-gradient-to-r from-[#00c8d4] to-[#bc13fe] text-white shadow-[0_0_30px_rgba(0,242,255,0.2)] hover:shadow-[0_0_40px_rgba(0,242,255,0.35)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck size={16} />
                  {mode === 'login' ? 'Access System' : 'Create Account'}
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[11px] text-slate-600 mt-6">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors"
            >
              {mode === 'login' ? 'Register here' : 'Sign in'}
            </button>
          </p>
        </div>

        <p className="text-center text-[10px] text-slate-700 mt-6 font-mono tracking-widest">
          ANTIGRAVITY HACKATHON 2026 · SECURE NODE ACCESS
        </p>
      </motion.div>
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────────────────────────
function App() {
  const [token, setToken] = useState(() => localStorage.getItem('ag_token') || '');
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ag_user') || 'null'); } catch { return null; }
  });

  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef(null);

  const handleAuth = (t, u) => {
    localStorage.setItem('ag_token', t);
    localStorage.setItem('ag_user', JSON.stringify(u));
    setToken(t);
    setUser(u);
  };

  const handleLogout = () => {
    localStorage.removeItem('ag_token');
    localStorage.removeItem('ag_user');
    setToken('');
    setUser(null);
    setShowProfile(false);
    setState(null);
  };

  const fetchState = async () => {
    try {
      const response = await axios.get(`${API}/api/state`);
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
      await axios.post(`${API}/api/reset`);
      fetchState();
    } catch (error) {
      console.error('Reset failed', error);
    }
  };

  const clearLogs = async () => {
    try {
      await axios.post(`${API}/api/logs/clear`);
      setState(prev => ({ ...prev, logs: [] }));
    } catch (error) {
      console.error('Failed to clear logs', error);
    }
  };

  const clearNotifications = async () => {
    try {
      await axios.post(`${API}/api/notifications/clear`);
      setState(prev => ({ ...prev, notifications: [] }));
    } catch (error) {
      console.error('Failed to clear notifications', error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchState();
      const interval = setInterval(fetchState, 3000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [token]);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!token) return <AuthScreen onAuth={handleAuth} />;

  const filteredShipments = state?.shipments.filter(s =>
    s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.items.some(item => {
      const val = typeof item === 'object' ? (item?.name || '') : (item || '');
      return val.toString().toLowerCase().includes(searchQuery.toLowerCase());
    })
  ) || [];

  const filteredLogs = state?.logs.filter(log =>
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.details.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // ── Dashboard ──
  const renderDashboardView = () => (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      <div className="xl:col-span-7 space-y-6">
        <AgentConsole onStateUpdate={fetchState} userRole={user?.role} activeTrace={state?.activeTrace} />
        <div className="glass-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Activity size={20} className="text-cyan-400" />
              Autonomous Simulation Logs
            </h3>
            <button onClick={clearLogs} className="text-xs text-slate-500 hover:text-cyan-400 transition-colors uppercase font-bold tracking-widest">
              Clear Logs
            </button>
          </div>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
            {filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-20">
                <Cpu size={48} className="mb-4" />
                <p className="italic font-medium">Neural engine idle. Waiting for ingestion...</p>
              </div>
            ) : (
              [...filteredLogs].reverse().map((log, i) => (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i}
                  className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.03] transition-all"
                >
                  <span className="text-slate-600 font-mono text-xs mt-1 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <div>
                    <span className={`inline-block px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-tighter mr-3 border ${log.action === 'ROLLBACK' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        log.action === 'REORDER' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          log.action === 'REROUTE' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                            'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                      }`}>
                      {log.action}
                    </span>
                    <p className="text-sm text-slate-300 leading-relaxed font-medium mt-1">{log.details}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="xl:col-span-5 space-y-6">
        <ShipmentTracker shipments={filteredShipments} />
        <div className="glass-card">
          <div className="flex items-center gap-2 mb-6">
            <Package size={20} className="text-amber-400" />
            <h3 className="text-lg font-bold">Node Inventory Risks</h3>
          </div>
          <div className="space-y-6">
            {state?.inventory.map((item, i) => (
              <div key={i} className="group cursor-pointer p-4 rounded-2xl border border-white/5 bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.02] transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">{item.item}</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Node: HAM-CENTRAL</p>
                  </div>
                  <div className="text-right">
                    <span className={`status-badge ${item.status === 'Low Stock' ? 'status-low-stock' : 'status-in-transit'}`}>
                      {item.status}
                    </span>
                    <p className="text-xs font-bold text-slate-400 mt-1">{item.stock} / 500 Units</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden relative">
                    <div className="absolute left-[20%] top-0 bottom-0 w-[1px] bg-red-500/40 z-10" />
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.stock / 500) * 100}%` }}
                      className={`h-full ${item.status === 'Low Stock' ? 'bg-gradient-to-r from-red-600 to-red-500' : 'bg-gradient-to-r from-[#00f2ff]/60 to-[#00f2ff]'}`}
                    />
                  </div>
                  <div className="flex justify-between text-[8px] text-slate-600 font-mono">
                    <span>0</span>
                    <span className="text-red-500/60 font-bold">100 (CRITICAL)</span>
                    <span>500</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ── Network ──
  const renderNetworkView = () => (
    <div className="space-y-8">
      <div className="glass-card">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Globe size={20} className="text-cyan-400 animate-pulse" />
          Neural Logistics Network Nodes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[
            { name: 'Hamburg Terminal Node', code: 'HAM-CENTRAL', ping: '14ms', throughput: '1.8 GB/s', capacity: 'Normal', alerts: 1 },
            { name: 'Rotterdam Shipping Port', code: 'ROT-DECK', ping: '18ms', throughput: '2.4 GB/s', capacity: 'Normal', alerts: 0 },
            { name: 'Shanghai Transit Hub', code: 'SHG-PRIMARY', ping: '108ms', throughput: '4.2 GB/s', capacity: 'High Traffic', alerts: 0 },
            { name: 'New York Gate Hub', code: 'NYC-EAST', ping: '42ms', throughput: '3.1 GB/s', capacity: 'Normal', alerts: 0 },
            { name: 'Los Angeles Terminal', code: 'LAX-WEST', ping: '58ms', throughput: '2.9 GB/s', capacity: 'Normal', alerts: 0 },
          ].map((node, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="group p-5 rounded-2xl border border-white/5 bg-white/[0.01] hover:border-cyan-500/20 hover:bg-white/[0.02] hover:shadow-[0_0_20px_rgba(0,242,255,0.03)] transition-all flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">{node.name}</h4>
                  <span className="text-[9px] font-mono text-slate-500">{node.code}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-wider">Active</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] font-mono border-t border-white/5 pt-4">
                <div>
                  <span className="text-slate-500 block text-[8px] uppercase">Latency</span>
                  <span className="text-slate-200 font-bold">{node.ping}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[8px] uppercase">Bandwidth</span>
                  <span className="text-slate-200 font-bold">{node.throughput}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[8px] uppercase">Alert State</span>
                  <span className={node.alerts > 0 ? 'text-red-400 font-bold animate-pulse' : 'text-slate-400 font-bold'}>
                    {node.alerts > 0 ? `${node.alerts} Warning` : 'Nominal'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Analytics ──
  const renderAnalyticsView = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Neural Decision Speed', value: '1.25s', desc: 'Average LLM inference delay', color: 'text-purple-400' },
          { label: 'Breach Avoidance ROI', value: '+$148,200', desc: 'SLA contract penalty savings', color: 'text-cyan-400' },
          { label: 'Mitigation Rate', value: '100%', desc: 'Successful recovery validations', color: 'text-emerald-400' },
          { label: 'Conflict Resolutions', value: `${state?.logs.filter(l => l.action === 'DIAGNOSE').length || 0}`, desc: 'Self-resolved stale metrics', color: 'text-amber-400' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="glass-card">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{stat.label}</span>
            <h4 className={`text-3xl font-black mt-1 ${stat.color}`}>{stat.value}</h4>
            <p className="text-[9px] text-slate-500 mt-1.5 font-medium">{stat.desc}</p>
          </motion.div>
        ))}
      </div>
      <div className="glass-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">Risk Probability & Neural Confidence Trends</h3>
          <span className="text-[10px] text-slate-400 font-mono">Last 12 Simulation Cycles</span>
        </div>
        <div className="h-64 flex items-end justify-between gap-3 pt-6">
          {[25, 40, 15, 75, 50, 90, 65, 35, 60, 85, 20, 70].map((val, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-[#00f2ff]/10 hover:bg-[#00f2ff]/20 border-t border-[#00f2ff]/30 rounded-t relative group transition-colors" style={{ height: `${val}%` }}>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-950 border border-white/10 px-2 py-0.5 rounded text-[9px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-mono">
                  Level: {val}%
                </div>
              </div>
              <span className="text-[9px] font-mono text-slate-600">C{idx + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Logs ──
  const renderLogsView = () => (
    <div className="glass-card">
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/5">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Activity size={20} className="text-cyan-400" />
          Autonomous Log Terminal
        </h3>
        <button onClick={clearLogs} className="text-xs text-slate-500 hover:text-cyan-400 transition-colors uppercase font-bold tracking-widest">
          Clear Logs
        </button>
      </div>
      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-20">
            <Cpu size={48} className="mb-4 animate-pulse" />
            <p className="italic font-medium">No logs found matching your query.</p>
          </div>
        ) : (
          [...filteredLogs].reverse().map((log, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.03] transition-all">
              <span className="text-slate-500 font-mono text-xs mt-1 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
              <div>
                <span className={`inline-block px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-tighter mr-3 border ${log.action === 'ROLLBACK' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    log.action === 'REORDER' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      log.action === 'REROUTE' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                        'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                  }`}>
                  {log.action}
                </span>
                <p className="text-sm text-slate-300 leading-relaxed font-medium mt-1">{log.details}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

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

  const tabs = [
    { id: 'dashboard', label: 'Command Center', icon: <LayoutDashboard size={20} /> },
    { id: 'network', label: 'Global Network', icon: <Globe size={20} /> },
    { id: 'analytics', label: 'Impact Analytics', icon: <BarChart3 size={20} /> },
    { id: 'logs', label: 'Operation Logs', icon: <Activity size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-[#05060a] text-white flex overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="w-20 lg:w-72 border-r border-white/5 bg-[#08090d] flex flex-col p-6 h-screen sticky top-0">
        <div className="flex items-center gap-4 mb-12 px-2">
          <div className="w-10 h-10 bg-gradient-to-br from-[#00f2ff] to-[#bc13fe] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.2)] shrink-0">
            <Cpu className="text-white" size={22} />
          </div>
          <div className="hidden lg:block">
            <h1 className="text-lg font-black tracking-tighter leading-none">ANTIGRAVITY</h1>
            <p className="text-[10px] text-cyan-400 font-bold tracking-[0.2em] mt-1">LOGISTICS OS</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          {tabs.map(t => (
            <NavItem key={t.id} icon={t.icon} label={t.label} active={activeTab === t.id} onClick={() => setActiveTab(t.id)} />
          ))}
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

      {/* ── Main Panel ── */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto custom-scrollbar">
        {/* Header */}
        <header className="h-20 border-b border-white/5 bg-[#05060a]/80 backdrop-blur-md flex items-center justify-between p-8 sticky top-0 z-50">
          {/* Search */}
          <div className="flex items-center gap-3 bg-white/5 rounded-2xl px-4 py-2.5 border border-white/5 focus-within:border-cyan-500/40 focus-within:bg-white/[0.07] focus-within:shadow-[0_0_15px_rgba(0,242,255,0.05)] transition-all">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search logs, shipments..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm outline-none w-56 text-slate-200 placeholder-slate-500"
            />
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-8">
              <div className="text-right">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Total Assets</p>
                <p className="text-lg font-bold text-white">{state?.shipments.length ?? '—'}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Risk Alerts</p>
                <p className="text-lg font-bold text-red-500">{state?.inventory.filter(i => i.status === 'Low Stock').length ?? '—'}</p>
              </div>
            </div>

            <div className="w-[1px] h-8 bg-white/10" />

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => { setShowNotifications(p => !p); setShowProfile(false); }}
                className="relative p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                <Bell size={18} />
                {state?.notifications?.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#bc13fe] rounded-full shadow-[0_0_8px_#bc13fe] animate-pulse" />
                )}
              </button>
              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-80 bg-[#0a0b10] border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] rounded-2xl z-50 p-4"
                    >
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Alerts Feed</span>
                        {state?.notifications?.length > 0 && (
                          <button onClick={clearNotifications} className="text-[9px] font-black text-cyan-400 hover:text-cyan-300 uppercase tracking-wider">Clear All</button>
                        )}
                      </div>
                      <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                        {(!state?.notifications || state.notifications.length === 0) ? (
                          <p className="text-xs text-slate-500 italic py-6 text-center">No alerts in system log.</p>
                        ) : (
                          [...state.notifications].reverse().map((n, idx) => (
                            <div key={idx} className="p-2.5 rounded-xl bg-white/[0.01] border border-white/5 text-[11px]">
                              <div className="flex justify-between items-center mb-1 text-slate-500 font-mono text-[8px]">
                                <span>{new Date(n.timestamp).toLocaleTimeString()}</span>
                                <span className={`px-1.5 rounded font-bold uppercase ${n.status === 'Alert' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'}`}>{n.status}</span>
                              </div>
                              <p className="text-slate-300">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile / Logout */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => { setShowProfile(p => !p); setShowNotifications(false); }}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00f2ff]/20 to-[#bc13fe]/20 border border-white/10 flex items-center justify-center cursor-pointer hover:border-cyan-500/40 transition-all text-sm font-black text-cyan-400 uppercase"
              >
                {user?.username?.[0] || <Settings size={18} className="text-slate-400" />}
              </button>
              <AnimatePresence>
                {showProfile && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-64 bg-[#0a0b10] border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] rounded-2xl z-50 p-4"
                  >
                    <div className="flex items-center gap-3 pb-4 mb-4 border-b border-white/5">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00f2ff]/30 to-[#bc13fe]/30 flex items-center justify-center font-black text-cyan-400 uppercase text-lg border border-white/10">
                        {user?.username?.[0] || '?'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-200 text-sm flex items-center gap-2">
                          {user?.username}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate max-w-[140px] mt-0.5">{user?.email}</p>
                        <p>
                          <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${user?.role === 'Director' ? 'bg-[#bc13fe]/20 text-[#bc13fe] border border-[#bc13fe]/30' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            }`}>{user?.role || 'Operator'}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all text-sm font-bold group"
                    >
                      <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-4xl font-black tracking-tight mb-2">
                {tabs.find(t => t.id === activeTab)?.label}
              </h2>
              <p className="text-slate-500 font-medium">
                {activeTab === 'dashboard' ? 'Monitoring global disruption signals and autonomous decision flow.' :
                  activeTab === 'network' ? 'Real-time diagnostic metrics and throughput states across routing stations.' :
                    activeTab === 'analytics' ? 'Decision confidence intervals, ROI summaries, and breach probability logs.' :
                      'Complete history of log ingestions, mitigations, and execution recovery runs.'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <DataManager shipments={state?.shipments || []} inventory={state?.inventory || []} onRefresh={fetchState} />
              <div className="bg-[#00f2ff]/10 px-4 py-2 rounded-lg border border-[#00f2ff]/20 flex items-center gap-2">
                <Activity size={16} className="text-[#00f2ff]" />
                <span className="text-xs font-bold text-[#00f2ff] tracking-wider uppercase">Live Neural Feed</span>
              </div>
            </div>
          </div>

          {activeTab === 'dashboard' && renderDashboardView()}
          {activeTab === 'network' && renderNetworkView()}
          {activeTab === 'analytics' && renderAnalyticsView()}
          {activeTab === 'logs' && renderLogsView()}
        </div>
      </main>
    </div>
  );
}

// ─── Nav Item ────────────────────────────────────────────────────────────────
const NavItem = ({ icon, label, active = false, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group ${active
        ? 'bg-gradient-to-r from-cyan-500/10 to-transparent text-cyan-400 border-l-2 border-cyan-400'
        : 'text-slate-500 hover:bg-white/[0.03] hover:text-slate-300'
      }`}
  >
    <div className={`${active ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'} transition-colors`}>
      {icon}
    </div>
    <span className="font-bold text-sm hidden lg:block tracking-tight">{label}</span>
  </button>
);

export default App;
