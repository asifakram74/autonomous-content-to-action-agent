import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Package, Truck, Trash2, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';

const API = 'http://localhost:5000';

export default function DataManager({ shipments = [], inventory = [], onRefresh }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('shipments');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const [editingId, setEditingId] = useState(null);

  // Shipment form
  const [sf, setSf] = useState({ id: '', origin: '', destination: '', items: [], priority: 'Medium', eta: '' });
  // Inventory form
  const [inv, setInv] = useState({ item: '', stock: '', reorder_point: '' });

  const toggleItem = (itemName) => {
    setSf(prev => {
      const exists = prev.items.find(i => i.name === itemName);
      if (exists) {
        return { ...prev, items: prev.items.filter(i => i.name !== itemName) };
      } else {
        return { ...prev, items: [...prev.items, { name: itemName, qty: 1 }] };
      }
    });
  };

  const updateItemQty = (itemName, qty) => {
    setSf(prev => ({
      ...prev,
      items: prev.items.map(i => i.name === itemName ? { ...i, qty: Math.max(1, parseInt(qty) || 1) } : i)
    }));
  };

  const flash = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 3000);
  };

  const addShipment = async (e) => {
    e.preventDefault();
    if (sf.items.length === 0) return flash('Please select at least one item', 'error');
    setLoading(true);
    try {
      if (editingId) {
        await axios.put(`${API}/api/shipments/${editingId}`, sf);
        flash(`Shipment ${sf.id} updated successfully`);
      } else {
        await axios.post(`${API}/api/shipments`, sf);
        flash(`Shipment ${sf.id} added successfully`);
      }
      setSf({ id: '', origin: '', destination: '', items: [], priority: 'Medium', eta: '' });
      setEditingId(null);
      onRefresh();
    } catch (err) {
      flash(err.response?.data?.error || 'Failed to save shipment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setSf({
      id: s.id,
      origin: s.origin,
      destination: s.destination,
      items: Array.isArray(s.items) ? (typeof s.items[0] === 'string' ? s.items.map(name => ({ name, qty: 1 })) : s.items) : [],
      priority: s.priority,
      eta: s.eta || ''
    });
    setTab('shipments');
  };

  const deleteShipment = async (id) => {
    try {
      await axios.delete(`${API}/api/shipments/${id}`);
      flash(`Shipment ${id} removed`);
      onRefresh();
    } catch (err) {
      flash(err.response?.data?.error || 'Delete failed', 'error');
    }
  };

  const addInventory = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/api/inventory`, {
        item: inv.item,
        stock: Number(inv.stock),
        reorder_point: Number(inv.reorder_point) || undefined,
      });
      flash(`"${inv.item}" added to inventory`);
      setInv({ item: '', stock: '', reorder_point: '' });
      onRefresh();
    } catch (err) {
      flash(err.response?.data?.error || 'Failed to add item', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteInventory = async (item) => {
    try {
      await axios.delete(`${API}/api/inventory/${encodeURIComponent(item)}`);
      flash(`"${item}" removed from inventory`);
      onRefresh();
    } catch (err) {
      flash(err.response?.data?.error || 'Delete failed', 'error');
    }
  };

  const inputCls = "w-full bg-white/[0.04] border border-white/8 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-500/50 focus:bg-white/[0.06] transition-all [&_option]:bg-[#0a0b12] [&_option]:text-slate-200";
  const labelCls = "text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00f2ff]/10 to-[#bc13fe]/10 border border-white/10 text-cyan-400 hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all text-sm font-bold"
      >
        <Plus size={16} />
        Add Data
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl max-h-[85vh] bg-[#0a0b12] border border-white/10 rounded-3xl shadow-[0_30px_80px_rgba(0,0,0,0.7)] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">Data Manager</h2>
                  <p className="text-[11px] text-slate-500 font-medium mt-1">Add real shipments and inventory for the AI agent to analyze</p>
                </div>
                <button onClick={() => setOpen(false)} className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all">
                  <X size={20} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex bg-white/[0.02] mx-6 mt-4 rounded-xl p-1 gap-1">
                {[
                  { id: 'shipments', label: 'Shipments', icon: <Truck size={14} /> },
                  { id: 'inventory', label: 'Inventory', icon: <Package size={14} /> },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                      tab === t.id
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              {/* Flash message */}
              <AnimatePresence>
                {msg.text && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`mx-6 mt-3 flex items-center gap-2 p-3 rounded-xl text-xs font-medium border ${
                      msg.type === 'error'
                        ? 'bg-red-500/10 border-red-500/20 text-red-400'
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {msg.type === 'error' ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                    {msg.text}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {tab === 'shipments' && (
                  <>
                    {/* Add Shipment Form */}
                    <form onSubmit={addShipment} className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] space-y-4">
                      <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                        <Plus size={14} className="text-cyan-400" /> New Shipment
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelCls}>Shipment ID</label>
                          <input className={inputCls} placeholder="SH-004" value={sf.id} onChange={e => setSf(p => ({ ...p, id: e.target.value }))} required disabled={!!editingId} />
                        </div>
                        <div>
                          <label className={labelCls}>Priority</label>
                          <select className={inputCls} value={sf.priority} onChange={e => setSf(p => ({ ...p, priority: e.target.value }))}>
                            {['Low', 'Medium', 'High', 'Critical'].map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>Origin</label>
                          <input className={inputCls} placeholder="Dubai, UAE" value={sf.origin} onChange={e => setSf(p => ({ ...p, origin: e.target.value }))} required />
                        </div>
                        <div>
                          <label className={labelCls}>Destination</label>
                          <input className={inputCls} placeholder="London, UK" value={sf.destination} onChange={e => setSf(p => ({ ...p, destination: e.target.value }))} required />
                        </div>
                        <div className="col-span-2 relative">
                          <label className={labelCls}>Select Items from Inventory</label>
                          <div className="relative group">
                            <button
                              type="button"
                              onClick={() => {
                                const el = document.getElementById('inv-dropdown');
                                el.classList.toggle('hidden');
                              }}
                              className={`${inputCls} flex items-center justify-between group-hover:border-cyan-500/30`}
                            >
                              <span className="truncate text-slate-400">
                                {sf.items.length === 0 ? 'Choose items...' : `${sf.items.length} item(s) selected`}
                              </span>
                              <ChevronRight size={14} className="text-slate-500 transform rotate-90" />
                            </button>
                            
                            <div 
                              id="inv-dropdown"
                              className="hidden absolute top-[calc(100%+8px)] left-0 right-0 bg-[#0d0e16] border border-white/10 rounded-2xl shadow-2xl z-50 p-2 max-h-[200px] overflow-y-auto custom-scrollbar"
                            >
                              {inventory.length === 0 ? (
                                <p className="text-[10px] text-slate-600 italic p-4 text-center">No inventory items found.</p>
                              ) : (
                                inventory.map(i => (
                                  <div
                                    key={i.item}
                                    onClick={() => toggleItem(i.item)}
                                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                                      sf.items.find(si => si.name === i.item) 
                                        ? 'bg-cyan-500/10 text-cyan-400' 
                                        : 'hover:bg-white/5 text-slate-400'
                                    }`}
                                  >
                                    <span className="text-xs font-bold">{i.item}</span>
                                    {sf.items.find(si => si.name === i.item) && <CheckCircle2 size={14} />}
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                          {sf.items.length > 0 && (
                            <div className="space-y-2 mt-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                              <label className={labelCls}>Selected Items & Quantities</label>
                              <div className="grid grid-cols-1 gap-2">
                                {sf.items.map(si => (
                                  <div key={si.name} className="flex items-center justify-between bg-white/[0.03] p-2 rounded-xl border border-white/5">
                                    <span className="text-xs font-bold text-slate-300">{si.name}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-slate-500 uppercase font-black">Qty:</span>
                                      <input 
                                        type="number" 
                                        value={si.qty} 
                                        onChange={(e) => updateItemQty(si.name, e.target.value)}
                                        className="w-16 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-cyan-400 outline-none focus:border-cyan-500/50"
                                        min="1"
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="col-span-2">
                          <label className={labelCls}>ETA</label>
                          <input className={inputCls} type="date" value={sf.eta} onChange={e => setSf(p => ({ ...p, eta: e.target.value }))} />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00c8d4] to-[#bc13fe] text-white text-xs font-black uppercase tracking-wider hover:shadow-[0_0_20px_rgba(0,242,255,0.2)] transition-all disabled:opacity-50"
                        >
                          {loading ? 'Saving…' : (editingId ? 'Update Shipment' : 'Add Shipment')}
                        </button>
                        {editingId && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(null);
                              setSf({ id: '', origin: '', destination: '', items: [], priority: 'Medium', eta: '' });
                            }}
                            className="px-6 py-2.5 rounded-xl bg-white/5 text-slate-400 text-xs font-black uppercase hover:bg-white/10 transition-all"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>

                    {/* Shipments List */}
                    <div className="space-y-2">
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Shipments ({shipments.length})</h3>
                      {shipments.length === 0 ? (
                        <p className="text-xs text-slate-600 italic py-4 text-center">No shipments in system. Add one above.</p>
                      ) : (
                        shipments.map(s => (
                          <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group">
                            <div className="flex items-center gap-4">
                              <span className="text-xs font-black text-cyan-400 font-mono">{s.id}</span>
                              <span className="text-xs text-slate-400">{s.origin} → {s.destination}</span>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                                s.priority === 'Critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                s.priority === 'High' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                              }`}>{s.priority}</span>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              <button
                                onClick={() => startEdit(s)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                              >
                                <Plus size={14} className="rotate-45" /> {/* Just using an icon for edit or similar */}
                              </button>
                              <button
                                onClick={() => deleteShipment(s.id)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}

                {tab === 'inventory' && (
                  <>
                    {/* Add Inventory Form */}
                    <form onSubmit={addInventory} className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] space-y-4">
                      <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                        <Plus size={14} className="text-cyan-400" /> New Inventory Item
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className={labelCls}>Item Name</label>
                          <input className={inputCls} placeholder="CPU Processors" value={inv.item} onChange={e => setInv(p => ({ ...p, item: e.target.value }))} required />
                        </div>
                        <div>
                          <label className={labelCls}>Stock Quantity</label>
                          <input className={inputCls} type="number" placeholder="500" value={inv.stock} onChange={e => setInv(p => ({ ...p, stock: e.target.value }))} required />
                        </div>
                        <div>
                          <label className={labelCls}>Reorder Point</label>
                          <input className={inputCls} type="number" placeholder="200" value={inv.reorder_point} onChange={e => setInv(p => ({ ...p, reorder_point: e.target.value }))} />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00c8d4] to-[#bc13fe] text-white text-xs font-black uppercase tracking-wider hover:shadow-[0_0_20px_rgba(0,242,255,0.2)] transition-all disabled:opacity-50"
                      >
                        {loading ? 'Adding…' : 'Add Item'}
                      </button>
                    </form>

                    {/* Inventory List */}
                    <div className="space-y-2">
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Inventory Items ({inventory.length})</h3>
                      {inventory.length === 0 ? (
                        <p className="text-xs text-slate-600 italic py-4 text-center">No inventory items. Add one above.</p>
                      ) : (
                        inventory.map(i => (
                          <div key={i.item} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group">
                            <div className="flex items-center gap-4">
                              <span className="text-xs font-bold text-slate-200">{i.item}</span>
                              <span className="text-xs text-slate-500 font-mono">{i.stock} units</span>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                                i.status === 'Low Stock' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              }`}>{i.status}</span>
                            </div>
                            <button
                              onClick={() => deleteInventory(i.item)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
