import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, Sparkles, AlertCircle, ChevronRight, CheckCircle2, Play, Cpu, Zap, 
  Search, FileText, Mail, FileSpreadsheet, BarChart2, Radio, PlayCircle, 
  ShieldAlert, ArrowRight, ShieldCheck, RefreshCw, XCircle
} from 'lucide-react';
import axios from 'axios';

const AgentConsole = ({ onStateUpdate }) => {
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
        sources,
        content: 'Stress Ingestion Bundle Run',
        simulateFailure,
        forceConstraintViolation
      });
      
      const traceData = response.data;
      // Inject local step execution states
      traceData.actions = traceData.actions.map(action => ({
        ...action,
        status: 'PENDING',
        resultText: ''
      }));

      setTrace(traceData);
      
      // Calculate realistic mock metrics based on scenario
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
      
      // Update status to EXECUTING
      updatedActions = updatedActions.map(a => a.id === action.id ? { ...a, status: 'EXECUTING' } : a);
      setTrace(prev => ({ ...prev, actions: updatedActions }));

      // Artificial small delay for visual stepper feel
      await new Promise(resolve => setTimeout(resolve, 1200));

      try {
        const response = await axios.post('http://localhost:5000/api/agent/execute', {
          actionId: action.id,
          trace,
          simulateFailure
        });

        if (response.data.rolledBack) {
          // Failure and Rollback executed successfully
          failureEncountered = true;
          updatedActions = updatedActions.map(a => {
            if (a.step <= action.step) {
              return { ...a, status: 'ROLLED_BACK', resultText: 'Rolled Back to Safe State' };
            }
            return { ...a, status: 'PENDING' };
          });
          setMetrics(prev => ({
            ...prev,
            stability: 'Rolled Back (Safe)',
            roi: '+$0 (Production Preserved)'
          }));
        } else {
          // Success
          updatedActions = updatedActions.map(a => a.id === action.id ? { 
            ...a, 
            status: 'SUCCESS', 
            resultText: response.data.result,
            cost: response.data.result.includes('adjusted') ? trace.actions[i].cost - 1500 : a.cost
          } : a);
          
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

      setTrace(prev => ({ ...prev, actions: updatedActions }));
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
      {/* 5-Source Multi-Ingestion Panel */}
      <div className="glass-card relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
           <Cpu size={120} />
        </div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <Terminal size={20} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Multi-Source Neural Ingestion</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Google Antigravity Content Engine</p>
            </div>
          </div>
          
          {/* Quick Stress Test Presets */}
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => loadStressTest('contradiction')}
              className="px-3 py-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 text-[10px] font-bold uppercase tracking-wider text-cyan-400 transition-colors"
            >
              📊 Metric Contradiction Test
            </button>
            <button 
              onClick={() => loadStressTest('constraint')}
              className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-colors ${
                forceConstraintViolation 
                  ? 'border-amber-500 bg-amber-500/20 text-amber-400' 
                  : 'border-white/10 hover:bg-white/5 text-slate-400'
              }`}
            >
              ⚠️ Constraint Stress Test
            </button>
            <button 
              onClick={() => loadStressTest('failure')}
              className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-colors ${
                simulateFailure 
                  ? 'border-red-500 bg-red-500/20 text-red-400' 
                  : 'border-white/10 hover:bg-white/5 text-slate-400'
              }`}
            >
              🔥 Failure Rollback Test
            </button>
          </div>
        </div>

        {/* 5 Ingested Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {sources.map((src, i) => (
            <div key={src.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-3 relative group/card hover:border-white/10 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{src.type}</span>
                {src.icon}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200 mb-1">{src.name}</h4>
                <textarea
                  className="bg-transparent text-[11px] text-slate-400 outline-none w-full h-[60px] resize-none border-b border-transparent focus:border-white/10 transition-colors py-1 leading-relaxed"
                  value={src.content}
                  onChange={(e) => {
                    const text = e.target.value;
                    setSources(prev => prev.map(s => s.id === src.id ? { ...s, content: text } : s));
                  }}
                />
              </div>
              <div className="flex justify-between items-center text-[9px] text-slate-500 pt-2 border-t border-white/5 font-mono">
                <span>Rel: {src.credibility}%</span>
                <span>{src.recency}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mt-6 pt-6 border-t border-white/5">
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={simulateFailure} 
                onChange={(e) => setSimulateFailure(e.target.checked)}
                className="rounded border-white/20 bg-slate-900 text-red-500 focus:ring-0 focus:ring-offset-0"
              />
              <span className="text-[11px] font-bold text-slate-400 group-hover:text-red-400 transition-colors uppercase tracking-wider">Simulate API Failure on Step 3</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={forceConstraintViolation} 
                onChange={(e) => setForceConstraintViolation(e.target.checked)}
                className="rounded border-white/20 bg-slate-900 text-amber-500 focus:ring-0 focus:ring-offset-0"
              />
              <span className="text-[11px] font-bold text-slate-400 group-hover:text-amber-400 transition-colors uppercase tracking-wider">Trigger Budget Constraint violation ($6,000)</span>
            </label>
          </div>
          <button 
            className="btn-primary flex items-center gap-3 w-full lg:w-auto"
            onClick={processContent}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : <Sparkles size={18} />}
            <span className="uppercase tracking-tighter text-sm">Initiate Multi-Source Analysis</span>
          </button>
        </div>
      </div>

      {/* Reasoning Trace Section */}
      <AnimatePresence>
        {trace && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 xl:grid-cols-12 gap-8"
          >
            {/* Left Box - Steps & Stepper */}
            <div className="xl:col-span-8 glass-card border-l-4 border-l-[#bc13fe] bg-gradient-to-br from-[#10121b] to-[#1a1c2e]/50">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#bc13fe]/10 border border-[#bc13fe]/20 flex items-center justify-center">
                    <Zap size={20} className="text-[#bc13fe]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight">Antigravity Trace & Chained Decisions</h3>
                    <p className="text-[10px] text-[#bc13fe] font-bold uppercase tracking-widest">Orchestration Workplan Enabled</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono text-slate-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">{new Date(trace.timestamp).toLocaleTimeString()}</span>
                  {!runningChain && (
                    <button 
                      onClick={runChainedExecution}
                      className="px-4 py-2 bg-gradient-to-br from-[#00f2ff] to-[#bc13fe] hover:brightness-110 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg flex items-center gap-2"
                    >
                      <PlayCircle size={14} />
                      Run Chained Execution
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-8">
                {/* Step 1: Ingestion & Resolution Report */}
                {trace.contradictions && trace.contradictions.length > 0 && (
                  <TraceStep 
                    num="01" 
                    title="Contradiction & Signal Resolution" 
                    subtitle="Data Cleansing & Noise Filtering"
                    icon={<Search size={14} className="text-cyan-400" />}
                  >
                    <div className="bg-cyan-500/5 border border-cyan-500/10 p-5 rounded-2xl flex flex-col gap-3">
                      {trace.contradictions.map((c, idx) => (
                        <div key={idx} className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <ShieldAlert size={14} className="text-amber-500" />
                            <h5 className="text-xs font-bold text-amber-500 uppercase tracking-wider">Conflict Identified on {c.metric}</h5>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                            <span className="text-red-400 line-through">Stale Source: {c.stale_source}</span> <br/>
                            <span className="text-emerald-400 font-bold">Verified Fresh Source: {c.fresh_source}</span>
                          </p>
                          <p className="text-slate-300 text-xs leading-relaxed font-medium mt-1 bg-white/[0.02] p-3 rounded-lg border border-white/5">
                            {c.resolution}
                          </p>
                        </div>
                      ))}
                    </div>
                  </TraceStep>
                )}

                {/* Step 2: Insight */}
                <TraceStep 
                  num="02" 
                  title="Cognitive Pattern Recognition" 
                  subtitle="Insight Extraction"
                  content={trace.insight} 
                  icon={<Sparkles size={14} className="text-purple-400" />}
                />

                {/* Step 3: Strategic Impact */}
                <TraceStep 
                  num="03" 
                  title="Strategic Business Impact" 
                  subtitle="Downstream Threat Analysis"
                  icon={<AlertCircle size={14} className="text-red-400" />}
                >
                  <div className="bg-red-500/5 border border-red-500/10 p-5 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-red-500 pulse" />
                      <p className="text-red-400 text-[10px] font-black uppercase tracking-widest">{trace.impact?.severity} Threat Level</p>
                    </div>
                    <p className="text-slate-300 text-sm font-medium leading-relaxed">{trace.impact?.description}</p>
                    {trace.impact?.affected_assets?.length > 0 && (
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Affected Node:</span>
                        <span className="px-2 py-0.5 rounded bg-red-500/15 border border-red-500/20 text-red-400 font-mono text-[10px] font-bold">{trace.impact.affected_assets[0]}</span>
                      </div>
                    )}
                  </div>
                </TraceStep>

                {/* Step 4: Interconnected Chrono-Stepper Actions */}
                <TraceStep 
                  num="04" 
                  title="Operational Chained Stepper" 
                  subtitle="Sequential Workflow Pipeline"
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
                                  Cost Implication: ${action.cost}
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
