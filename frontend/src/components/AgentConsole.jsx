import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Sparkles, AlertCircle, ChevronRight, CheckCircle2, Play, Cpu, Zap, Search } from 'lucide-react';
import axios from 'axios';

const AgentConsole = ({ onStateUpdate }) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [trace, setTrace] = useState(null);
  const [executingAction, setExecutingAction] = useState(null);

  const processContent = async () => {
    if (!input) return;
    setIsProcessing(true);
    try {
      const response = await axios.post('http://localhost:5000/api/agent/process', { content: input });
      setTrace(response.data);
    } catch (error) {
      console.error('Processing failed', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const executeAction = async (actionId) => {
    setExecutingAction(actionId);
    try {
      await axios.post('http://localhost:5000/api/agent/execute', { actionId, trace });
      setTrace(prev => ({
        ...prev,
        actions: prev.actions.map(a => a.id === actionId ? { ...a, executed: true } : a)
      }));
      onStateUpdate();
    } catch (error) {
      console.error('Execution failed', error);
    } finally {
      setExecutingAction(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Ingestion Section */}
      <div className="glass-card relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
           <Cpu size={120} />
        </div>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <Terminal size={20} className="text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">Intelligence Ingestion</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Antigravity Neural Node-01</p>
          </div>
        </div>

        <textarea
          className="input-glow min-h-[160px] resize-none text-slate-200 placeholder:text-slate-600 font-medium"
          placeholder="Paste news article, port report, or logistics update here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-4">
             <div className="flex -space-x-2">
                {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full bg-slate-800 border-2 border-[#10121b]" />)}
             </div>
             <span className="text-[10px] text-slate-500 font-bold uppercase">3 Models Active</span>
          </div>
          <button 
            className="btn-primary flex items-center gap-3"
            onClick={processContent}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : <Sparkles size={18} />}
            <span className="uppercase tracking-tighter text-sm">Initiate Analysis</span>
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
            className="glass-card border-l-4 border-l-[#bc13fe] bg-gradient-to-br from-[#10121b] to-[#1a1c2e]/50"
          >
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#bc13fe]/10 border border-[#bc13fe]/20 flex items-center justify-center">
                  <Zap size={20} className="text-[#bc13fe]" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">Reasoning Trace</h3>
                  <p className="text-[10px] text-[#bc13fe] font-bold uppercase tracking-widest">Decision Matrix Hash: {Math.random().toString(16).substring(2, 8).toUpperCase()}</p>
                </div>
              </div>
              <span className="text-xs font-mono text-slate-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">{new Date(trace.timestamp).toLocaleTimeString()}</span>
            </div>

            <div className="space-y-8">
              {/* Step 1: Insight */}
              <TraceStep 
                num="01" 
                title="Pattern Recognition" 
                subtitle="Insight Extraction"
                content={trace?.insight} 
                icon={<Search size={14} className="text-cyan-400" />}
              />

              {/* Step 2: Impact */}
              <TraceStep 
                num="02" 
                title="Strategic Impact" 
                subtitle="Downstream analysis"
                icon={<AlertCircle size={14} className="text-red-400" />}
              >
                <div className="bg-red-500/5 border border-red-500/10 p-5 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 pulse" />
                    <p className="text-red-400 text-[10px] font-black uppercase tracking-widest">{trace?.impact?.severity} Severity Detected</p>
                  </div>
                  <p className="text-slate-300 text-sm font-medium leading-relaxed">{trace?.impact?.description}</p>
                </div>
              </TraceStep>

              {/* Step 3: Actions */}
              <TraceStep 
                num="03" 
                title="Action Synthesis" 
                subtitle="Proposed counter-measures"
                icon={<CheckCircle2 size={14} className="text-emerald-400" />}
                isLast
              >
                <div className="space-y-3">
                  {trace?.actions?.map((action) => (
                    <motion.div 
                      whileHover={{ x: 5 }}
                      key={action.id} 
                      className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl flex items-center justify-between group/action hover:bg-white/[0.04] transition-all"
                    >
                      <div className="flex-1 mr-4">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter bg-white/5 px-2 py-0.5 rounded">Action: {action.type}</span>
                          {action.time_saved && <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter bg-emerald-400/5 px-2 py-0.5 rounded border border-emerald-400/10">Est. Savings: {action.time_saved}</span>}
                        </div>
                        <p className="font-bold text-slate-200 text-sm">{action.description}</p>
                      </div>
                      <button
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                          action.executed 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-gradient-to-br from-[#00f2ff] to-[#bc13fe] text-white shadow-[0_4px_10px_rgba(0,242,255,0.2)] hover:scale-110 active:scale-95'
                        }`}
                        onClick={() => !action.executed && executeAction(action.id)}
                        disabled={executingAction === action.id || action.executed}
                      >
                        {action.executed ? <CheckCircle2 size={24} /> : (
                          executingAction === action.id ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play size={24} fill="currentColor" />
                        )}
                      </button>
                    </motion.div>
                  ))}
                </div>
              </TraceStep>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

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
      {content && <p className="text-slate-400 text-sm leading-relaxed font-medium">{content}</p>}
      {children}
    </div>
  </div>
);

export default AgentConsole;
