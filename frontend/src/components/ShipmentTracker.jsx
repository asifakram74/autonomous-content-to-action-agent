import React from 'react';
import { motion } from 'framer-motion';
import { Box, MapPin, Calendar, ArrowRight, ShieldCheck, Navigation } from 'lucide-react';

const ShipmentTracker = ({ shipments }) => {
  return (
    <div className="glass-card flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <Navigation size={20} className="text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-white">Asset Tracking</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Real-time Global Fleet</p>
          </div>
        </div>
        <div className="flex -space-x-1">
           <div className="w-2 h-2 rounded-full bg-[#00f2ff] shadow-[0_0_8px_rgba(0,242,255,0.5)]" />
        </div>
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {shipments.map((shipment, index) => (
          <motion.div
            key={shipment.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative"
          >
            {/* Connection Line */}
            {index !== shipments.length - 1 && (
              <div className="absolute left-[20px] top-[40px] w-[1px] h-[calc(100%+24px)] bg-white/5 z-0" />
            )}

            <div className="relative z-10 p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-white/5 shadow-inner">
                    <Box size={18} className="text-slate-400 group-hover:text-[#00f2ff] transition-colors" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 tracking-tighter uppercase mb-0.5">{shipment.id}</p>
                    <h3 className="text-sm font-bold text-slate-100 group-hover:text-white transition-colors">{shipment.items[0]}...</h3>
                  </div>
                </div>
                <span className={`status-badge ${
                  shipment.status === 'Rerouted' ? 'status-rerouted' : 'status-in-transit'
                }`}>
                  {shipment.status}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs font-medium text-slate-400 mb-5 pl-1">
                <div className="flex items-center gap-1.5 min-w-[100px]">
                  <MapPin size={12} className="text-slate-600" />
                  <span className="truncate">{shipment.origin.split(',')[0]}</span>
                </div>
                <div className="flex-1 flex items-center gap-2">
                   <div className="h-[1px] flex-1 bg-gradient-to-r from-white/5 via-white/20 to-white/5 relative">
                      <motion.div 
                        initial={{ left: '0%' }}
                        animate={{ left: '100%' }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-[#00f2ff] shadow-[0_0_8px_#00f2ff]"
                      />
                   </div>
                </div>
                <div className="flex items-center gap-1.5 min-w-[100px] justify-end">
                  <span className="text-cyan-400 truncate">{shipment.destination.split(',')[0]}</span>
                  <MapPin size={12} className="text-cyan-400" />
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <Calendar size={12} />
                  <span>Arrival: {shipment.eta}</span>
                </div>
                {shipment.priority === 'High' && (
                  <div className="flex items-center gap-1 text-[9px] font-black text-red-400 bg-red-400/5 px-2 py-0.5 rounded border border-red-400/10">
                    <ShieldCheck size={10} />
                    CRITICAL
                  </div>
                )}
              </div>
              
              {shipment.status === 'Rerouted' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mt-4 p-3 bg-purple-500/5 border border-purple-500/10 rounded-xl text-[11px] text-purple-300 italic flex gap-2"
                >
                  <Navigation size={12} className="mt-0.5 shrink-0" />
                  <span>Neural reroute via Rotterdam applied to avoid Hamburg strike disruption.</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ShipmentTracker;
