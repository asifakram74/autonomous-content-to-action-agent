import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, Sparkles, AlertCircle, ChevronRight, CheckCircle2, Play, Cpu, Zap, 
  Search, FileText, Mail, FileSpreadsheet, BarChart2, Radio, PlayCircle, 
  ShieldAlert, ArrowRight, ShieldCheck, RefreshCw, XCircle
} from 'lucide-react';
import axios from 'axios';

const AgentConsole = ({ onStateUpdate, userRole, activeTrace }) => {
  const [sources, setSources] = useState([
    {
      id: 'src-1',
      name: 'Warehouse CSV',
      type: 'CSV Spreadsheet',
      content: 'SKU: Microchips - Stock: 500 units, Reorder Point: 200, Last Synced: 2 days ago.',
      credibility: 80,
      recency: '2 days ago',
      icon: <FileSpreadsheet size={16} className="text-emerald-400" />
    },
    {
      id: 'src-2',
      name: 'Sales Dashboard',
      type: 'Database Table',
      content: 'SKU: Microchips - Real-time Stock: 150 units, Status: Low Stock. Synced: 1 hour ago.',
      credibility: 95,
      recency: '1 hour ago',
      icon: <BarChart2 size={16} className="text-cyan-400" />
    },
    {
      id: 'src-3',
      name: 'Supplier Email',
      type: 'Corporate Mail',
      content: 'From: TSMC Logistics. Re: Emergency Microchip Supply. Global transit warnings for shipment SH-001.',
      credibility: 90,
      recency: '3 hours ago',
      icon: <Mail size={16} className="text-purple-400" />
    },
    {
      id: 'src-4',
      name: 'Assembly Feedback',
      type: 'Customer Complaints',
      content: 'BMW Group complains: Downstream automotive production stalling due to parts supply shortage.',
      credibility: 85,
      recency: '4 hours ago',
      icon: <FileText size={16} className="text-amber-400" />
    },
    {
      id: 'src-5',
      name: 'Port News Feed',
      type: 'Real-time API Feed',
      content: 'FLASH: Docks in Hamburg blocked due to emergency labor strikes. Active routes face major bottlenecks.',
      credibility: 88,
      recency: '10 mins ago',
      icon: <Radio size={16} className="text-red-400" />
    }
  ]);

  const [activeSourceId, setActiveSourceId] = useState('src-1');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [forceConstraintViolation, setForceConstraintViolation] = useState(false);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [trace, setTrace] = useState(null);
  const [executingStep, setExecutingStep] = useState(null);
  const [runningChain, setRunningChain] = useState(false);
  const [metrics, setMetrics] = useState({
    latency: 'N/A',
    apiCost: 'N/A',
    roi: 'N/A',
    stability: 'Idle'
  });

  // Sync internal trace state with polled database activeTrace prop
  useEffect(() => {
    if (activeTrace) {
      setTrace(activeTrace);
      // Synchronize metrics based on activeTrace status
      if (activeTrace.status === 'COMPLETED') {
        setMetrics(prev => ({ ...prev, stability: 'Completed successfully' }));
      } else if (activeTrace.status === 'FAILED') {
        setMetrics(prev => ({
          ...prev,
          stability: 'Rolled Back (Safe)',
          roi: '+$0 (Production Preserved)'
        }));
      } else if (activeTrace.status === 'PENDING_APPROVAL') {
        setMetrics(prev => ({ ...prev, stability: 'Pending Approval' }));
      } else if (activeTrace.status === 'APPROVED') {
        setMetrics(prev => ({ ...prev, stability: 'Approved & Ready' }));
      }
    } else {
      setTrace(null);
    }
  }, [activeTrace]);

  const loadStressTest = (type) => {
    if (type === 'contradiction') {
      setForceConstraintViolation(false);
      setSimulateFailure(false);
      setSources(prev => prev.map(s => {
        if (s.id === 'src-1') return { ...s, content: 'SKU: Microchips - Stock: 500 units. Stale data.' };
        if (s.id === 'src-2') return { ...s, content: 'SKU: Microchips - Stock: 150 units. High priority stockout warning!' };
        return s;
      }));
    } else if (type === 'constraint') {
      setForceConstraintViolation(true);
      setSimulateFailure(false);
    } else if (type === 'failure') {
      setSimulateFailure(true);
      setForceConstraintViolation(false);
    }
  };

  const processContent = async () => {
    setIsProcessing(true);
    const startTime = Date.now();
    try {
      const response = await axios.post('http://localhost:5000/api/agent/process', {
        sources: sources.map(({ icon, ...rest }) => rest),
        content: 'Stress Ingestion Bundle Run',
        simulateFailure,
        forceConstraintViolation
      });
      
      const traceData = response.data;
      setTrace(traceData);
      onStateUpdate();
      
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      setMetrics({
        latency: `${elapsed}s`,
        apiCost: forceConstraintViolation ? '$0.028' : '$0.021',
        roi: '+$42,500 (7d ETA saved)',
        stability: 'Analyzed & Safe'
      });
    } catch (error) {
      console.error('Processing failed', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const requestApproval = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/agent/request-approval');
      setTrace(res.data.trace);
      onStateUpdate();
    } catch (e) {
      console.error('Request approval failed', e);
    }
  };

  const approveTrace = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/agent/approve');
      setTrace(res.data.trace);
      onStateUpdate();
      // Auto-trigger sequential execution
      runChainedExecution();
    } catch (e) {
      console.error('Approval failed', e);
    }
  };

  const rejectTrace = async () => {
    try {
      await axios.post('http://localhost:5000/api/reset');
      setTrace(null);
      onStateUpdate();
    } catch (e) {
      console.error('Rejection/reset failed', e);
    }
  };

  const runChainedExecution = async () => {
    if (!trace) return;
    setRunningChain(true);
    setMetrics(prev => ({ ...prev, stability: 'Executing...' }));

    let updatedActions = [...trace.actions];
    let failureEncountered = false;

    for (let i = 0; i < updatedActions.length; i++) {
      if (failureEncountered) break;

      const action = updatedActions[i];
      setExecutingStep(action.id);
      
      // Update UI indicator
      updatedActions = updatedActions.map(a => a.id === action.id ? { ...a, status: 'EXECUTING' } : a);
      setTrace(prev => ({ ...prev, actions: updatedActions }));

      await new Promise(resolve => setTimeout(resolve, 1200));

      try {
        const response = await axios.post('http://localhost:5000/api/agent/execute', {
          actionId: action.id,
          simulateFailure
        });

        const traceFromBackend = response.data.trace;
        if (traceFromBackend) {
          setTrace(traceFromBackend);
          updatedActions = traceFromBackend.actions;
        }

        if (response.data.rolledBack) {
          failureEncountered = true;
          setMetrics(prev => ({
            ...prev,
            stability: 'Rolled Back (Safe)',
            roi: '+$0 (Production Preserved)'
          }));
        } else {
          if (response.data.result.includes('Enforced') || response.data.result.includes('budget')) {
            setMetrics(prev => ({
              ...prev,
              roi: '+$47,500 (Budget Optimised)'
            }));
          }
        }
      } catch (error) {
        console.error('Action failed', error);
        failureEncountered = true;
        updatedActions = updatedActions.map(a => a.id === action.id ? { ...a, status: 'FAILED' } : a);
        setMetrics(prev => ({ ...prev, stability: 'Unchecked Failure' }));
      }

      onStateUpdate();
    }

    setExecutingStep(null);
    setRunningChain(false);
    if (!failureEncountered) {
      setMetrics(prev => ({ ...prev, stability: 'Completed successfully' }));
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Redesigned Multi-Source Ingestion Widget */}
      <div className="glass-card relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <Cpu size={120} />
        </div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_15px_rgba(0,242,255,0.1)]">
              <Terminal size={20} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-100">Multi-Source Neural Ingestion</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Google Antigravity Content Engine</p>
            </div>
          </div>
        </div>

        {/* Quick Stress Test Presets Redesign */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div 
            onClick={() => loadStressTest('contradiction')}
            className="test-preset-card group/preset"
          >
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-black uppercase text-cyan-400 tracking-wider flex items-center gap-1.5">
                <span>📊</span> Metric Contradiction
              </h4>
              <span className="text-[9px] font-bold text-cyan-400/70 bg-cyan-500/5 px-2 py-0.5 rounded border border-cyan-500/10">Scorer Test</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Injects conflicting inventory data (CSV vs Live DB) to verify agent ranking logic.
            </p>
          </div>

          <div 
            onClick={() => loadStressTest('constraint')}
            className={`test-preset-card group/preset ${forceConstraintViolation ? 'active' : ''}`}
          >
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                <span>⚠️</span> Constraint Stress
              </h4>
              <span className="text-[9px] font-bold text-amber-400/70 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">Policy Test</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Forces an emergency reorder exceeding the $5,000 budget cap to trigger adjustment.
            </p>
          </div>

          <div 
            onClick={() => loadStressTest('failure')}
            className={`test-preset-card group/preset ${simulateFailure ? 'active' : ''}`}
          >
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-black uppercase text-red-400 tracking-wider flex items-center gap-1.5">
                <span>🔥</span> Failure Rollback
              </h4>
              <span className="text-[9px] font-bold text-red-400/70 bg-red-500/5 px-2 py-0.5 rounded border border-red-500/10">Resilience Test</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Simulates an API connection timeout on Step 3 to trigger transactional rollback.
            </p>
          </div>
        </div>

        {/* Split Source Ingest Grid */}
        <div className="split-workspace mb-6">
          {/* Left panel: Source List */}
          <div className="flex flex-col gap-2.5 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
            {sources.map((src) => (
              <div
                key={src.id}
                onClick={() => setActiveSourceId(src.id)}
                className={`source-item ${activeSourceId === src.id ? 'active' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide truncate max-w-[150px]">{src.name}</span>
                  {src.icon}
                </div>
                <p className="text-[11px] text-slate-400 truncate leading-relaxed">
                  {src.content}
                </p>
                <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono mt-1 pt-1 border-t border-white/5">
                  <span>Credibility: {src.credibility}%</span>
                  <span>{src.recency}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Right panel: Editor Code Frame */}
          {(() => {
            const activeSrc = sources.find(s => s.id === activeSourceId) || sources[0];
            return (
              <div className="editor-frame">
                <div className="editor-header">
                  <div className="flex items-center gap-2">
                    <span className="live-indicator">LIVE FEED</span>
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">{activeSrc.name} &mdash; {activeSrc.type}</h4>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Cred: {activeSrc.credibility}%</span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Age: {activeSrc.recency}</span>
                  </div>
                </div>
                <div className="editor-body">
                  <div className="editor-gutter">
                    {activeSrc.content.split('\n').map((_, index) => (
                      <div key={index}>{String(index + 1).padStart(2, '0')}</div>
                    ))}
                  </div>
                  <textarea
                    className="editor-textarea"
                    value={activeSrc.content}
                    onChange={(e) => {
                      const text = e.target.value;
                      setSources(prev => prev.map(s => s.id === activeSrc.id ? { ...s, content: text } : s));
                    }}
                  />
                </div>
              </div>
            );
          })()}
        </div>

        {/* Action Panel bottom redesign */}
        <div className="flex flex-col lg:flex-row gap-6 items-center justify-between mt-6 pt-6 border-t border-white/5">
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="flex-1 flex items-center justify-between gap-4 p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:border-red-500/20 transition-all">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Simulate API Failure</span>
                <span className="text-[9px] text-slate-500">Trigger rollback on timeout</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={simulateFailure} 
                  onChange={(e) => setSimulateFailure(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500/30 peer-checked:after:bg-red-500 border border-white/5"></div>
              </label>
            </div>

            <div className="flex-1 flex items-center justify-between gap-4 p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:border-amber-500/20 transition-all">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Force Budget Limit</span>
                <span className="text-[9px] text-slate-500">Exceed maximum limits ($5K)</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={forceConstraintViolation} 
                  onChange={(e) => setForceConstraintViolation(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500/30 peer-checked:after:bg-amber-500 border border-white/5"></div>
              </label>
            </div>
          </div>

          <button 
            className="btn-primary flex items-center justify-center gap-3 w-full lg:w-auto px-8 py-3.5 shadow-[0_4px_20px_rgba(0,242,255,0.15)] shrink-0"
            onClick={processContent}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : <Sparkles size={18} />}
            <span className="uppercase tracking-wider text-xs font-black">Initiate Multi-Source Analysis</span>
          </button>
        </div>
      </div>

      {/* Redesigned 4-Phase Orchestration Pipeline */}
      <AnimatePresence>
        {trace && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 xl:grid-cols-12 gap-8"
          >
            {/* Left Box - Linear Stages Pipeline */}
            <div className="xl:col-span-8 glass-card border-l-4 border-l-[#bc13fe] bg-gradient-to-br from-[#10121b] to-[#1a1c2e]/50">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 pb-4 border-b border-white/5 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#bc13fe]/10 border border-[#bc13fe]/20 flex items-center justify-center">
                    <Zap size={20} className="text-[#bc13fe]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight text-slate-100">Antigravity Trace & Chained Decisions</h3>
                    <p className="text-[10px] text-[#bc13fe] font-bold uppercase tracking-widest">Orchestration Workplan Enabled</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-xs font-mono text-slate-400 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                    {new Date(trace.timestamp).toLocaleTimeString()}
                  </span>
                  
                  {trace.status === 'PENDING' && userRole === 'Operator' && (
                    <button 
                      onClick={requestApproval}
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.3)] flex items-center gap-2"
                    >
                      <ShieldAlert size={14} />
                      Submit for Director Approval
                    </button>
                  )}

                  {trace.status === 'PENDING' && userRole === 'Director' && (
                    <button 
                      onClick={runChainedExecution}
                      className="px-4 py-2 bg-gradient-to-r from-[#00f2ff] to-[#bc13fe] hover:brightness-110 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg flex items-center gap-2 animate-pulse"
                    >
                      <PlayCircle size={14} />
                      Execute Directly (Director)
                    </button>
                  )}

                  {trace.status === 'PENDING_APPROVAL' && userRole === 'Operator' && (
                    <span className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                      Pending Director Approval
                    </span>
                  )}

                  {trace.status === 'PENDING_APPROVAL' && userRole === 'Director' && (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={approveTrace}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:brightness-110 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center gap-2"
                      >
                        <ShieldCheck size={14} />
                        Approve & Execute Plan
                      </button>
                      <button 
                        onClick={rejectTrace}
                        className="px-4 py-2 bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-500/20 text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-colors"
                      >
                        <XCircle size={14} />
                        Reject
                      </button>
                    </div>
                  )}

                  {trace.status === 'APPROVED' && (
                    <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      Approved
                    </span>
                  )}

                  {trace.status === 'EXECUTING' && (
                    <span className="px-3.5 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                      <div className="w-3 h-3 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                      Executing Chained Flow
                    </span>
                  )}

                  {trace.status === 'COMPLETED' && (
                    <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 size={14} />
                      Completed
                    </span>
                  )}

                  {trace.status === 'FAILED' && (
                    <span className="px-3.5 py-1.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                      <XCircle size={14} />
                      Failed & Rolled Back
                    </span>
                  )}
                </div>
              </div>

              {trace.status === 'PENDING_APPROVAL' && (
                <div className="mb-8 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
                      <ShieldAlert className="text-amber-500" size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-amber-500 uppercase tracking-wider">Escalated: Director Authorization Required</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        This plan exceeds basic Operator clearance. {userRole === 'Director' ? 'Review decision steps below and click Approve to execute.' : 'Awaiting confirmation from an authorized Director node.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-10">
                {/* Stage 1: Ingestion & Resolution */}
                <TraceStep 
                  num="01" 
                  title="Signal Cleanse & Conflict Resolution" 
                  subtitle="Stage 1: Multi-Source Resolution"
                  icon={<Search size={14} className="text-cyan-400" />}
                >
                  {trace.contradictions && trace.contradictions.length > 0 ? (
                    <div className="bg-cyan-500/5 border border-cyan-500/10 p-5 rounded-2xl flex flex-col gap-4">
                      {trace.contradictions.map((c, idx) => (
                        <div key={idx} className="flex flex-col gap-2.5">
                          <div className="flex items-center gap-2">
                            <ShieldAlert size={14} className="text-amber-500" />
                            <h5 className="text-xs font-bold text-amber-500 uppercase tracking-wider">Conflict Identified: {c.metric}</h5>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
                            <div className="p-3 rounded-lg bg-red-950/20 border border-red-500/10 text-slate-400">
                              <span className="text-[8px] font-bold text-red-400 uppercase block mb-1">Stale Source ({c.stale_source})</span>
                              Stale stock data level reported.
                            </div>
                            <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/10 text-slate-300">
                              <span className="text-[8px] font-bold text-emerald-400 uppercase block mb-1">Fresh Source ({c.fresh_source})</span>
                              Real-time stock level resolved.
                            </div>
                          </div>

                          <p className="text-slate-300 text-xs leading-relaxed font-medium bg-white/[0.02] p-3 rounded-lg border border-white/5">
                            {c.resolution}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-2xl flex items-center gap-3">
                      <ShieldCheck className="text-emerald-400 shrink-0" size={20} />
                      <div>
                        <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wide">No Contradictions Detected</h5>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          All ingested source streams reports align correctly. Verification logs cleared.
                        </p>
                      </div>
                    </div>
                  )}
                </TraceStep>

                {/* Stage 2: Semantic Insights */}
                <TraceStep 
                  num="02" 
                  title="Cognitive Pattern Recognition" 
                  subtitle="Stage 2: Semantic Insights"
                  content={trace.insight} 
                  icon={<Sparkles size={14} className="text-purple-400" />}
                />

                {/* Stage 3: Risk & Threat Evaluation */}
                <TraceStep 
                  num="03" 
                  title="Strategic Downstream Threat Analysis" 
                  subtitle="Stage 3: Impact Assessment"
                  icon={<AlertCircle size={14} className="text-red-400" />}
                >
                  <div className="bg-slate-900/40 border border-white/5 p-5 rounded-2xl flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Calculated Risk Index</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        trace.impact?.severity === 'Critical' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                        trace.impact?.severity === 'High' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                        trace.impact?.severity === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>{trace.impact?.severity || 'Low'} Severity</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden relative">
                      <div className={`h-full ${
                        trace.impact?.severity === 'Critical' ? 'bg-red-500' :
                        trace.impact?.severity === 'High' ? 'bg-orange-500' :
                        trace.impact?.severity === 'Medium' ? 'bg-amber-500' :
                        'bg-emerald-500'
                      }`} style={{ width: 
                        trace.impact?.severity === 'Critical' ? '95%' :
                        trace.impact?.severity === 'High' ? '75%' :
                        trace.impact?.severity === 'Medium' ? '45%' :
                        '15%'
                      }} />
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed font-medium">{trace.impact?.description}</p>
                    {trace.impact?.affected_assets?.length > 0 && (
                      <div className="flex items-center gap-2 pt-2.5 border-t border-white/5">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Affected Asset Nodes:</span>
                        <div className="flex gap-2">
                          {trace.impact.affected_assets.map(asset => (
                            <span key={asset} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 font-mono text-[10px] font-bold">{asset}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TraceStep>

                {/* Stage 4: Orchestrated Action Plan */}
                <TraceStep 
                  num="04" 
                  title="Operational Chained Execution" 
                  subtitle="Stage 4: Execution Workplan"
                  icon={<CheckCircle2 size={14} className="text-emerald-400" />}
                  isLast
                >
                  <div className="space-y-4">
                    {trace.actions?.map((action, index) => (
                      <div 
                        key={action.id} 
                        className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden ${
                          action.status === 'SUCCESS' ? 'bg-emerald-500/5 border-emerald-500/20' :
                          action.status === 'ROLLED_BACK' ? 'bg-amber-500/5 border-amber-500/20' :
                          action.status === 'EXECUTING' ? 'bg-cyan-500/5 border-cyan-500/30 shadow-[0_0_15px_rgba(0,242,255,0.05)]' :
                          'bg-white/[0.02] border-white/5'
                        }`}
                      >
                        {/* Connecting Line between sequential steps */}
                        {index !== trace.actions.length - 1 && (
                          <div className="absolute left-[30px] top-[48px] w-[1px] h-[30px] bg-white/5 hidden md:block" />
                        )}

                        <div className="flex items-center gap-4">
                          {/* Step Number Circle */}
                          <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${
                            action.status === 'SUCCESS' ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10' :
                            action.status === 'ROLLED_BACK' ? 'border-amber-500 text-amber-400 bg-amber-500/10' :
                            action.status === 'EXECUTING' ? 'border-cyan-400 text-cyan-400 bg-cyan-400/10 animate-pulse' :
                            'border-white/10 text-slate-500 bg-slate-950'
                          }`}>
                            {action.step}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-slate-400">{action.type}</span>
                              {action.cost > 0 && (
                                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                                  action.cost > 5000 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400'
                                }`}>
                                  Cost: ${action.cost}
                                </span>
                              )}
                              {action.time && <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400">Duration: {action.time}</span>}
                            </div>
                            <p className="font-bold text-slate-200 text-sm">{action.description}</p>
                            
                            {/* Visual execution result text */}
                            {action.resultText && (
                              <p className="text-xs text-slate-400 italic mt-2 pl-2 border-l-2 border-white/10 font-medium">
                                {action.resultText}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Visual Status Indicator */}
                        <div className="flex items-center gap-3 self-end md:self-auto">
                          {action.status === 'SUCCESS' && <CheckCircle2 className="text-emerald-500" size={24} />}
                          {action.status === 'ROLLED_BACK' && <RefreshCw className="text-amber-500 animate-spin" style={{ animationDuration: '4s' }} size={22} />}
                          {action.status === 'EXECUTING' && <div className="w-5 h-5 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />}
                          {action.status === 'PENDING' && <span className="w-3 h-3 rounded-full bg-slate-800 border border-slate-700" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </TraceStep>
              </div>
            </div>

            {/* Right Box - Metrics HUD & Logs */}
            <div className="xl:col-span-4 space-y-8 flex flex-col h-full">
              {/* Metrics HUD */}
              <div className="glass-card bg-[#0b0c10] border-l-4 border-l-cyan-400">
                <h3 className="text-md font-black flex items-center gap-2 mb-6">
                  <ShieldCheck size={18} className="text-cyan-400" />
                  Neural Orchestration HUD
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <HUDCard title="Ingestion Latency" value={metrics.latency} desc="Agent Reasoning speed" />
                  <HUDCard title="Token Call Cost" value={metrics.apiCost} desc="Gemini pricing equivalent" />
                  <HUDCard title="Mitigation ROI" value={metrics.roi} desc="SLA breach savings" />
                  <HUDCard title="Stability Rating" value={metrics.stability} desc="Failover resilience" />
                </div>
              </div>

              {/* Conflict Flow Explanation */}
              <div className="glass-card flex-1 bg-white/[0.01]">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-4">Google Antigravity Verification Protocol</h4>
                <div className="space-y-4 text-xs leading-relaxed text-slate-400">
                  <p>
                    <strong>1. Credibility Scorer:</strong> Cross-references files (Warehouse spreadsheet vs. Live Dashboard). Automatically rejects stale timestamp reports to keep supply levels 100% accurate.
                  </p>
                  <p>
                    <strong>2. Sequential Stepper:</strong> Generates a full 5-step transactional workflow, processing steps chronologically. 
                  </p>
                  <p>
                    <strong>3. Constraint Check:</strong> Compares mitigation cost against maximum parameters. Safely adapts over-budget recommendations.
                  </p>
                  <p>
                    <strong>4. Failover Recovery:</strong> If mid-execution API calls timeout, safe state rollback ensures zero database inconsistencies.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const HUDCard = ({ title, value, desc }) => (
  <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl flex flex-col gap-1.5 hover:bg-white/[0.04] transition-colors">
    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none">{title}</span>
    <span className="text-md font-black text-slate-100 leading-none">{value}</span>
    <span className="text-[9px] text-slate-600 leading-none mt-1">{desc}</span>
  </div>
);

const TraceStep = ({ num, title, subtitle, content, icon, children, isLast }) => (
  <div className="flex gap-6">
    <div className="flex flex-col items-center">
      <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative z-10 shadow-xl">
        <span className="text-xs font-black text-[#00f2ff]">{num}</span>
      </div>
      {!isLast && <div className="w-[1px] h-full bg-gradient-to-b from-white/10 to-transparent my-2" />}
    </div>
    <div className={`flex-1 ${!isLast ? 'pb-10' : ''}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">{subtitle}</span>
      </div>
      <h4 className="text-md font-black text-slate-100 mb-3 tracking-tight">{title}</h4>
      {content && <p className="text-slate-400 text-sm leading-relaxed font-medium bg-white/[0.01] border border-white/5 p-4 rounded-xl">{content}</p>}
      {children}
    </div>
  </div>
);

export default AgentConsole;
