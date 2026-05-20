import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Modal,
} from 'react-native';
import axios from 'axios';

const { width, height } = Dimensions.get('window');

// ─── Theme ─────────────────────────────────────────────────────────────────
const C = {
  bg:       '#05060a',
  surface:  '#0a0b12',
  surfaceL: '#10121b',
  border:   'rgba(255,255,255,0.07)',
  cyan:     '#00f2ff',
  purple:   '#bc13fe',
  emerald:  '#10b981',
  amber:    '#f59e0b',
  red:      '#ef4444',
  text:     '#e2e8f0',
  textDim:  '#94a3b8',
  textMute: '#475569',
};

// ─── Auth Screen ─────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode]         = useState('login');
  const [serverUrl, setServerUrl] = useState('http://192.168.100.79:5000');
  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole]         = useState('Operator');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const submit = async () => {
    if (!username || !password) { setError('Username and password required'); return; }
    if (mode === 'register' && !email) { setError('Email required'); return; }
    setError('');
    setLoading(true);
    try {
      const base = serverUrl.replace(/\/$/, '');
      if (mode === 'register') {
        await axios.post(`${base}/api/auth/register`, { username, email, password, role });
      }
      const res = await axios.post(`${base}/api/auth/login`, { username, password });
      onAuth(res.data.token, res.data.user, base);
    } catch (err) {
      setError(err.response?.data?.error || 'Cannot reach server. Check IP in settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[s.flex1, { backgroundColor: C.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <KeyboardAvoidingView style={s.flex1} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.authScroll} keyboardShouldPersistTaps="handled">
          <Animated.View style={{ opacity: fadeAnim }}>

            {/* Logo */}
            <View style={s.authLogo}>
              <View style={s.logoIcon}>
                <Text style={s.logoIconText}>⚡</Text>
              </View>
              <Text style={s.authTitle}>ANTIGRAVITY</Text>
              <Text style={s.authSubtitle}>LOGISTICS OS · SECURE ACCESS</Text>
            </View>

            {/* Card */}
            <View style={s.authCard}>
              {/* Mode toggle */}
              <View style={s.modeRow}>
                {['login', 'register'].map(m => (
                  <TouchableOpacity
                    key={m}
                    style={[s.modeBtn, mode === m && s.modeBtnActive]}
                    onPress={() => { setMode(m); setError(''); }}
                  >
                    <Text style={[s.modeBtnText, mode === m && s.modeBtnTextActive]}>
                      {m === 'login' ? 'Sign In' : 'Register'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Fields */}
              <View style={s.field}>
                <Text style={s.fieldIcon}>👤</Text>
                <TextInput
                  style={s.fieldInput}
                  placeholder="Username"
                  placeholderTextColor={C.textMute}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>

              {mode === 'register' && (
                <>
                  <View style={s.field}>
                    <Text style={s.fieldIcon}>✉️</Text>
                    <TextInput
                      style={s.fieldInput}
                      placeholder="Email address"
                      placeholderTextColor={C.textMute}
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>

                  {/* Operational Role Selector */}
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ color: C.textDim, fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase' }}>
                      Operational Role
                    </Text>
                    <View style={s.modeRow}>
                      {['Operator', 'Director'].map(r => (
                        <TouchableOpacity
                          key={r}
                          style={[s.modeBtn, role === r && s.modeBtnActive]}
                          onPress={() => setRole(r)}
                        >
                          <Text style={[s.modeBtnText, role === r && s.modeBtnTextActive]}>
                            {r}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </>
              )}

              <View style={s.field}>
                <Text style={s.fieldIcon}>🔒</Text>
                <TextInput
                  style={[s.fieldInput, { flex: 1 }]}
                  placeholder="Password"
                  placeholderTextColor={C.textMute}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                />
                <TouchableOpacity onPress={() => setShowPass(p => !p)}>
                  <Text style={s.eyeBtn}>{showPass ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>

              {/* Error */}
              {!!error && (
                <View style={s.errorBox}>
                  <Text style={s.errorText}>⚠️  {error}</Text>
                </View>
              )}

              {/* Server config toggle */}
              <TouchableOpacity style={s.configBtn} onPress={() => setShowConfig(p => !p)}>
                <Text style={s.configBtnText}>⚙️  Server Settings {showConfig ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {showConfig && (
                <View style={s.field}>
                  <Text style={s.fieldIcon}>🌐</Text>
                  <TextInput
                    style={s.fieldInput}
                    placeholder="http://192.168.x.x:5000"
                    placeholderTextColor={C.textMute}
                    value={serverUrl}
                    onChangeText={setServerUrl}
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                </View>
              )}

              {/* Submit */}
              <TouchableOpacity style={s.authSubmitBtn} onPress={submit} disabled={loading}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.authSubmitText}>
                      {mode === 'login' ? '🔐  Access System' : '🚀  Create Account'}
                    </Text>
                }
              </TouchableOpacity>

              {/* Switch mode */}
              <TouchableOpacity onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
                <Text style={s.switchText}>
                  {mode === 'login' ? "Don't have an account? " : 'Already registered? '}
                  <Text style={{ color: C.cyan, fontWeight: '700' }}>
                    {mode === 'login' ? 'Register' : 'Sign in'}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={s.authFooter}>ANTIGRAVITY HACKATHON 2026</Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [token, setToken]       = useState('');
  const [user, setUser]         = useState(null);
  const [baseUrl, setBaseUrl]   = useState('http://192.168.100.79:5000');
  const [state, setState]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [activeTab, setActiveTab] = useState('FLEET');
  const [showProfile, setShowProfile] = useState(false);
  const [showDataManager, setShowDataManager] = useState(false);

  const handleAuth = (t, u, url) => {
    setToken(t);
    setUser(u);
    setBaseUrl(url);
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    setState(null);
    setShowProfile(false);
  };

  const fetchData = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/state`);
      setState(res.data);
      setError(null);
    } catch {
      setError('Cannot connect to Antigravity Node');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [token, baseUrl]);

  if (!token) return <AuthScreen onAuth={handleAuth} />;

  if (loading && !state) {
    return (
      <View style={s.loadingScreen}>
        <ActivityIndicator size="large" color={C.cyan} />
        <Text style={s.loadingText}>SYNCING WITH ANTIGRAVITY...</Text>
      </View>
    );
  }

  const TABS = [
    { id: 'FLEET',     label: 'Fleet',     icon: '🛰️'  },
    { id: 'INVENTORY', label: 'Stock',     icon: '📦'  },
    { id: 'AGENT',     label: 'Agent',     icon: '🧠'  },
    { id: 'NETWORK',   label: 'Network',   icon: '🌐'  },
    { id: 'LOGS',      label: 'Logs',      icon: '📜'  },
  ];

  return (
    <SafeAreaView style={[s.flex1, { backgroundColor: C.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* ── Header ── */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>ANTIGRAVITY</Text>
          <Text style={s.headerSub}>
            {user?.role === 'Director' ? 'Director Control Node' : 'Operator Request Node'}
          </Text>
        </View>
        <View style={s.headerRight}>
          {user?.role && (
            <View style={[
              s.badge, 
              { 
                borderColor: user.role === 'Director' ? C.purple + '40' : C.amber + '40', 
                backgroundColor: user.role === 'Director' ? C.purple + '15' : C.amber + '15',
                marginRight: 4
              }
            ]}>
              <Text style={[s.badgeText, { color: user.role === 'Director' ? C.purple : C.amber, fontSize: 8 }]}>
                {user.role.toUpperCase()}
              </Text>
            </View>
          )}
          <View style={[s.statusPill, { borderColor: error ? C.red : C.cyan }]}>
            <View style={[s.statusDot, { backgroundColor: error ? C.red : C.cyan }]} />
            <Text style={[s.statusText, { color: error ? C.red : C.cyan }]}>
              {error ? 'OFFLINE' : 'LIVE'}
            </Text>
          </View>
          <TouchableOpacity style={[s.avatarBtn, { marginRight: 4 }]} onPress={() => setShowDataManager(true)}>
            <Text style={{ fontSize: 14 }}>➕</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.avatarBtn} onPress={() => setShowProfile(true)}>
            <Text style={s.avatarText}>{user?.username?.[0]?.toUpperCase() || '?'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Stats Bar ── */}
      <View style={s.statsBar}>
        <StatChip label="ASSETS"      value={state?.shipments?.length ?? '—'} color={C.cyan}    />
        <View style={s.statsDivider} />
        <StatChip label="RISK ALERTS" value={state?.inventory?.filter(i => i.status === 'Low Stock').length ?? '—'} color={C.red} />
        <View style={s.statsDivider} />
        <StatChip label="LOGS"        value={state?.logs?.length ?? '—'}     color={C.amber}   />
        <View style={s.statsDivider} />
        <StatChip label="NOTIFS"      value={state?.notifications?.length ?? '—'} color={C.purple} />
      </View>

      {/* ── Content ── */}
      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'FLEET'     && <FleetTab     state={state} />}
        {activeTab === 'INVENTORY' && <InventoryTab state={state} />}
        {activeTab === 'AGENT'     && <AgentTab     state={state} user={user} baseUrl={baseUrl} onStateUpdate={fetchData} />}
        {activeTab === 'NETWORK'   && <NetworkTab   />}
        {activeTab === 'LOGS'      && <LogsTab      state={state} />}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Bottom Nav ── */}
      <View style={s.navbar}>
        {TABS.map(t => (
          <TouchableOpacity key={t.id} style={s.navBtn} onPress={() => setActiveTab(t.id)}>
            <Text style={[s.navIcon, activeTab === t.id && { opacity: 1 }]}>{t.icon}</Text>
            <Text style={[s.navLabel, activeTab === t.id && { color: C.cyan }]}>{t.label}</Text>
            {activeTab === t.id && <View style={s.navIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Profile Modal ── */}
      <Modal visible={showProfile} transparent animationType="fade" onRequestClose={() => setShowProfile(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setShowProfile(false)}>
          <View style={s.profileCard}>
            <View style={s.profileAvatar}>
              <Text style={s.profileAvatarText}>{user?.username?.[0]?.toUpperCase() || '?'}</Text>
            </View>
            <Text style={s.profileName}>{user?.username}</Text>
            <Text style={s.profileEmail}>{user?.email}</Text>
            {user?.role && (
              <View style={[
                s.badge, 
                { 
                  borderColor: user.role === 'Director' ? C.purple + '40' : C.amber + '40', 
                  backgroundColor: user.role === 'Director' ? C.purple + '15' : C.amber + '15',
                  marginBottom: 16,
                  paddingHorizontal: 12,
                  paddingVertical: 4
                }
              ]}>
                <Text style={[s.badgeText, { color: user.role === 'Director' ? C.purple : C.amber, fontSize: 10, letterSpacing: 1 }]}>
                  {user.role.toUpperCase()} NODE
                </Text>
              </View>
            )}
            <View style={s.profileDivider} />
            <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
              <Text style={s.logoutText}>🚪  Sign Out</Text>
            </TouchableOpacity>
          </View>

      </Modal>

      {/* ── Data Manager Modal ── */}
      <DataManagerModal 
        visible={showDataManager} 
        onClose={() => setShowDataManager(false)} 
        state={state} 
        baseUrl={baseUrl} 
        onRefresh={fetchData} 
      />
    </SafeAreaView>
  );
}

// ─── Stat Chip ───────────────────────────────────────────────────────────────
function StatChip({ label, value, color }) {
  return (
    <View style={s.statChip}>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Fleet Tab ───────────────────────────────────────────────────────────────
function FleetTab({ state }) {
  const priorityColor = (p) =>
    p === 'Critical' ? C.red : p === 'High' ? C.amber : C.cyan;

  return (
    <View style={s.tabContent}>
      <SectionHeader title="PRIORITY SHIPMENTS" icon="🛰️" />
      {state?.shipments?.map(ship => (
        <View key={ship.id} style={s.card}>
          <View style={s.cardRow}>
            <View>
              <Text style={s.cardId}>{ship.id}</Text>
              <Text style={s.cardItems}>{ship.items.join(', ')}</Text>
            </View>
            <View style={[s.badge, { borderColor: priorityColor(ship.priority) + '40', backgroundColor: priorityColor(ship.priority) + '15' }]}>
              <Text style={[s.badgeText, { color: priorityColor(ship.priority) }]}>
                {ship.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={s.routeRow}>
            <Text style={s.routePoint}>{ship.origin.split(',')[0]}</Text>
            <Text style={s.routeArrow}>  ──→  </Text>
            <Text style={s.routePoint}>{ship.destination.split(',')[0]}</Text>
          </View>

          <View style={s.cardFooter}>
            <View style={[s.priorityDot, { backgroundColor: priorityColor(ship.priority) }]} />
            <Text style={s.cardFooterText}>{ship.priority} Priority</Text>
            <Text style={s.cardEta}>  ·  ETA {ship.eta}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Inventory Tab ───────────────────────────────────────────────────────────
function InventoryTab({ state }) {
  return (
    <View style={s.tabContent}>
      <SectionHeader title="STOCK MONITORING" icon="📦" />
      {state?.inventory?.map((item, i) => {
        const pct    = Math.min((item.stock / 500) * 100, 100);
        const isLow  = item.status === 'Low Stock';
        return (
          <View key={i} style={s.card}>
            <View style={s.cardRow}>
              <View>
                <Text style={s.cardItems}>{item.item}</Text>
                <Text style={s.cardId}>Node: HAM-CENTRAL</Text>
              </View>
              <View style={[s.badge, { borderColor: (isLow ? C.red : C.cyan) + '40', backgroundColor: (isLow ? C.red : C.cyan) + '15' }]}>
                <Text style={[s.badgeText, { color: isLow ? C.red : C.cyan }]}>{item.status.toUpperCase()}</Text>
              </View>
            </View>

            <View style={s.stockBar}>
              {/* Critical marker at 20% */}
              <View style={[s.criticalMark, { left: '20%' }]} />
              <View style={[s.stockFill, {
                width: `${pct}%`,
                backgroundColor: isLow ? C.red : C.cyan,
              }]} />
            </View>

            <View style={s.stockLabels}>
              <Text style={s.stockLabel0}>0</Text>
              <Text style={s.stockLabelCrit}>100 CRITICAL</Text>
              <Text style={s.stockLabel500}>{item.stock} / 500</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ─── Network Tab ─────────────────────────────────────────────────────────────
function NetworkTab() {
  const nodes = [
    { name: 'Hamburg Terminal',    code: 'HAM-CENTRAL',  ping: '14ms',  bw: '1.8 GB/s', alerts: 1 },
    { name: 'Rotterdam Port',      code: 'ROT-DECK',     ping: '18ms',  bw: '2.4 GB/s', alerts: 0 },
    { name: 'Shanghai Transit Hub',code: 'SHG-PRIMARY',  ping: '108ms', bw: '4.2 GB/s', alerts: 0 },
    { name: 'New York Gate Hub',   code: 'NYC-EAST',     ping: '42ms',  bw: '3.1 GB/s', alerts: 0 },
    { name: 'Los Angeles Terminal',code: 'LAX-WEST',     ping: '58ms',  bw: '2.9 GB/s', alerts: 0 },
  ];
  return (
    <View style={s.tabContent}>
      <SectionHeader title="NEURAL NETWORK NODES" icon="🌐" />
      {nodes.map((n, i) => (
        <View key={i} style={s.card}>
          <View style={s.cardRow}>
            <View>
              <Text style={s.cardItems}>{n.name}</Text>
              <Text style={s.cardId}>{n.code}</Text>
            </View>
            <View style={[s.badge, { borderColor: C.emerald + '40', backgroundColor: C.emerald + '15' }]}>
              <Text style={[s.badgeText, { color: C.emerald }]}>ACTIVE</Text>
            </View>
          </View>
          <View style={s.nodeMetrics}>
            <NodeMetric label="LATENCY"   value={n.ping} />
            <NodeMetric label="BANDWIDTH" value={n.bw}   />
            <NodeMetric
              label="ALERTS"
              value={n.alerts > 0 ? `${n.alerts} WARN` : 'NOMINAL'}
              valueColor={n.alerts > 0 ? C.red : C.emerald}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

function NodeMetric({ label, value, valueColor }) {
  return (
    <View style={s.nodeMetric}>
      <Text style={s.nodeMetricLabel}>{label}</Text>
      <Text style={[s.nodeMetricValue, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  );
}

// ─── Agent Tab ────────────────────────────────────────────────────────────────
function AgentTab({ state, user, baseUrl, onStateUpdate }) {
  const trace = state?.activeTrace;
  const userRole = user?.role || 'Operator';
  const [runningChain, setRunningChain] = useState(false);
  const [executingStep, setExecutingStep] = useState(null);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  const requestApproval = async () => {
    setLoadingAction(true);
    try {
      await axios.post(`${baseUrl}/api/agent/request-approval`);
      onStateUpdate();
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAction(false);
    }
  };

  const approveTrace = async () => {
    setLoadingAction(true);
    try {
      await axios.post(`${baseUrl}/api/agent/approve`);
      onStateUpdate();
      runChainedExecution();
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAction(false);
    }
  };

  const rejectTrace = async () => {
    setLoadingAction(true);
    try {
      await axios.post(`${baseUrl}/api/reset`);
      onStateUpdate();
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAction(false);
    }
  };

  const runChainedExecution = async () => {
    if (!trace) return;
    setRunningChain(true);

    let updatedActions = [...trace.actions];
    let failureEncountered = false;

    for (let i = 0; i < updatedActions.length; i++) {
      if (failureEncountered) break;

      const action = updatedActions[i];
      setExecutingStep(action.id);

      await new Promise(resolve => setTimeout(resolve, 1200));

      try {
        const response = await axios.post(`${baseUrl}/api/agent/execute`, {
          actionId: action.id,
          simulateFailure
        });

        if (response.data.rolledBack) {
          failureEncountered = true;
        }
      } catch (error) {
        console.error('Action execution failed', error);
        failureEncountered = true;
      }
      onStateUpdate();
    }

    setExecutingStep(null);
    setRunningChain(false);
  };

  const actionBadgeColor = (a) =>
    a === 'ROLLBACK' || a === 'FAIL' ? C.red    :
    a === 'REORDER'  ? C.amber  :
    a === 'REROUTE'  ? C.purple :
    C.cyan;

  if (!trace) {
    return (
      <View style={s.tabContent}>
        <SectionHeader title="AGENT COGNITIVE WORKPLAN" icon="🧠" />
        <View style={s.emptyState}>
          <Text style={s.emptyIcon}>🧠</Text>
          <Text style={s.emptyText}>Neural engine idle. No active trace.</Text>
        </View>
      </View>
    );
  }
  const overallStatusText = () => {
    switch (trace.status) {
      case 'PENDING': return 'Pending Approval';
      case 'PENDING_APPROVAL': return 'Awaiting Director';
      case 'APPROVED': return 'Approved';
      case 'EXECUTING': return 'Executing Chain';
      case 'COMPLETED': return 'Completed';
      case 'FAILED': return 'Failed & Rolled Back';
      default: return trace.status || 'Active';
    }
  };

  const statusColor = () => {
    switch (trace.status) {
      case 'COMPLETED': return C.emerald;
      case 'FAILED': return C.red;
      case 'EXECUTING': return C.cyan;
      case 'PENDING_APPROVAL': return C.amber;
      default: return C.purple;
    }
  };

  return (
    <View style={s.tabContent}>
      <SectionHeader title="AGENT COGNITIVE WORKPLAN" icon="🧠" />

      {/* Header Card */}
      <View style={s.agentHeaderCard}>
        <Text style={s.agentHeaderTitle}>{trace.content}</Text>
        <Text style={s.agentHeaderSub}>Severity: {trace.impact?.severity || 'Low'}</Text>
        
        <View style={s.agentMetaRow}>
          <Text style={s.agentTime}>{new Date(trace.timestamp).toLocaleTimeString()}</Text>
          <View style={[s.badge, { borderColor: statusColor() + '40', backgroundColor: statusColor() + '15' }]}>
            <Text style={[s.badgeText, { color: statusColor() }]}>
              {overallStatusText().toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* Director/Operator Control Action Panel */}
      {trace.status === 'PENDING' && userRole === 'Operator' && (
        <View style={s.controlPanel}>
          <Text style={s.controlPanelTitle}>Approval Submission Required</Text>
          <Text style={s.controlPanelDesc}>
            This plan contains operations that exceed standard authorization limits. Escalate to an active Director node to approve and execute.
          </Text>
          <TouchableOpacity 
            style={[s.authSubmitBtn, { backgroundColor: C.amber, marginTop: 12 }]} 
            onPress={requestApproval}
            disabled={loadingAction}
          >
            {loadingAction ? <ActivityIndicator color="#000" /> : <Text style={s.btnText}>⚠️ Submit for Director Approval</Text>}
          </TouchableOpacity>
        </View>
      )}

      {trace.status === 'PENDING' && userRole === 'Director' && (
        <View style={[s.controlPanel, { borderColor: C.purple + '40', backgroundColor: C.purple + '05' }]}>
          <Text style={[s.controlPanelTitle, { color: C.purple }]}>Director Control Direct-Action</Text>
          <Text style={s.controlPanelDesc}>
            You hold bypass authorization credentials. You can trigger sequential execution of this logistics workplan directly.
          </Text>
          <TouchableOpacity 
            style={[s.authSubmitBtn, { backgroundColor: C.purple, marginTop: 12 }]} 
            onPress={runChainedExecution}
            disabled={runningChain}
          >
            {runningChain ? <ActivityIndicator color="#fff" /> : <Text style={[s.btnText, { color: '#fff' }]}>⚡ Execute Directly (Director)</Text>}
          </TouchableOpacity>
        </View>
      )}

      {trace.status === 'PENDING_APPROVAL' && userRole === 'Operator' && (
        <View style={s.controlPanel}>
          <Text style={s.controlPanelTitle}>Pending Director Action</Text>
          <Text style={s.controlPanelDesc}>
            Logistics workplan has been successfully escalated. Awaiting Director Node verification and secure key confirmation.
          </Text>
        </View>
      )}

      {trace.status === 'PENDING_APPROVAL' && userRole === 'Director' && (
        <View style={[s.controlPanel, { borderColor: C.emerald + '40', backgroundColor: C.emerald + '05' }]}>
          <Text style={[s.controlPanelTitle, { color: C.emerald }]}>Escalated: Action Required</Text>
          <Text style={s.controlPanelDesc}>
            Review the complete impact-mitigation plan and authorize chained execution.
          </Text>
          
          {/* Failure Simulation Toggle */}
          <TouchableOpacity 
            style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 12, gap: 8 }}
            onPress={() => setSimulateFailure(!simulateFailure)}
          >
            <View style={{ width: 16, height: 16, borderWidth: 1, borderColor: C.border, borderRadius: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: simulateFailure ? C.red : 'transparent' }}>
              {simulateFailure && <Text style={{ color: '#fff', fontSize: 9, fontWeight: 'bold' }}>✓</Text>}
            </View>
            <Text style={{ color: C.textDim, fontSize: 11 }}>Simulate Chain Failure & Rollback</Text>
          </TouchableOpacity>

          <View style={s.btnRow}>
            <TouchableOpacity 
              style={[s.btnPrimary, { backgroundColor: C.emerald }]} 
              onPress={approveTrace}
              disabled={loadingAction || runningChain}
            >
              {loadingAction || runningChain 
                ? <ActivityIndicator color="#000" />
                : <Text style={s.btnText}>🛡️ Approve & Execute</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity 
              style={s.btnDanger} 
              onPress={rejectTrace}
              disabled={loadingAction || runningChain}
            >
              <Text style={s.btnDangerText}>Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Action Stepper Checklist */}
      <View style={{ gap: 12 }}>
        {trace.actions?.map((action, index) => {
          const isSuccess = action.status === 'SUCCESS';
          const isRolledBack = action.status === 'ROLLED_BACK';
          const isExecuting = action.status === 'EXECUTING';

          const cardStyle = [
            s.stepCard,
            isSuccess && s.stepCardSuccess,
            isRolledBack && s.stepCardRolledBack,
            isExecuting && s.stepCardExecuting,
          ];

          const circleStyle = [
            s.stepCircle,
            isSuccess && s.stepCircleSuccess,
            isRolledBack && s.stepCircleRolledBack,
            isExecuting && s.stepCircleExecuting,
          ];

          const circleTextStyle = [
            s.stepCircleText,
            isSuccess && s.stepCircleTextSuccess,
            isRolledBack && s.stepCircleTextRolledBack,
            isExecuting && s.stepCircleTextExecuting,
          ];

          return (
            <View key={action.id} style={cardStyle}>
              <View style={s.stepRow}>
                {/* Step Circle */}
                <View style={circleStyle}>
                  <Text style={circleTextStyle}>{action.step}</Text>
                </View>

                {/* Step Content */}
                <View style={s.stepContent}>
                  <View style={s.stepBadges}>
                    <Text style={[s.stepBadge, { backgroundColor: actionBadgeColor(action.type) + '20', color: actionBadgeColor(action.type), borderColor: actionBadgeColor(action.type) + '40', borderWidth: 1 }]}>
                      {action.type}
                    </Text>
                    {action.cost > 0 && (
                      <Text style={[s.stepBadge, { backgroundColor: 'rgba(16,185,129,0.1)', color: C.emerald }]}>
                        ${action.cost}
                      </Text>
                    )}
                    {action.time && (
                      <Text style={[s.stepBadge, { backgroundColor: 'rgba(255,255,255,0.05)', color: C.textDim }]}>
                        {action.time}
                      </Text>
                    )}
                  </View>

                  <Text style={s.stepDesc}>{action.description}</Text>

                  {action.resultText && (
                    <Text style={s.stepResultText}>{action.resultText}</Text>
                  )}
                </View>

                {/* Status Indicator emoji */}
                <View style={{ alignSelf: 'center' }}>
                  {isSuccess && <Text style={{ fontSize: 18 }}>🟢</Text>}
                  {isRolledBack && <Text style={{ fontSize: 18 }}>🔄</Text>}
                  {isExecuting && <ActivityIndicator color={C.cyan} size="small" />}
                  {!isSuccess && !isRolledBack && !isExecuting && <Text style={{ fontSize: 14 }}>⚫</Text>}
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Logs Tab ────────────────────────────────────────────────────────────────
function LogsTab({ state }) {
  const logs = [...(state?.logs || [])].reverse();
  const actionColor = (a) =>
    a === 'ROLLBACK' ? C.red    :
    a === 'REORDER'  ? C.amber  :
    a === 'REROUTE'  ? C.purple :
    C.cyan;

  return (
    <View style={s.tabContent}>
      <SectionHeader title="AGENT REASONING LOGS" icon="📜" />
      {logs.length === 0 ? (
        <View style={s.emptyState}>
          <Text style={s.emptyIcon}>💤</Text>
          <Text style={s.emptyText}>Neural engine idle. No logs yet.</Text>
        </View>
      ) : (
        logs.map((log, i) => (
          <View key={i} style={[s.logCard, { borderLeftColor: actionColor(log.action) }]}>
            <View style={s.logHeader}>
              <View style={[s.logBadge, { backgroundColor: actionColor(log.action) + '20', borderColor: actionColor(log.action) + '40' }]}>
                <Text style={[s.logBadgeText, { color: actionColor(log.action) }]}>{log.action}</Text>
              </View>
              <Text style={s.logTime}>{new Date(log.timestamp).toLocaleTimeString()}</Text>
            </View>
            <Text style={s.logDetails}>{log.details}</Text>
          </View>
        ))
      )}
    </View>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────
function SectionHeader({ title, icon }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionIcon}>{icon}</Text>
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
  );
}

// ─── Data Manager Modal ──────────────────────────────────────────────────────
function DataManagerModal({ visible, onClose, state, baseUrl, onRefresh, fetchState }) {
  const [tab, setTab] = useState('SHIPMENTS');
  const [loading, setLoading] = useState(false);
  
  // Forms
  const [sId, setSId] = useState('');
  const [sOrigin, setSOrigin] = useState('');
  const [sDest, setSDest] = useState('');
  const [sItems, setSItems] = useState([]); // Array of objects { name, qty }
  const [sPriority, setSPriority] = useState('Medium');
  const [sEta, setSEta] = useState('');
  const [showInvDropdown, setShowInvDropdown] = useState(false);
  const [editingSId, setEditingSId] = useState(null);

  const toggleItem = (itemName) => {
    const exists = sItems.find(i => i.name === itemName);
    if (exists) {
      setSItems(sItems.filter(i => i.name !== itemName));
    } else {
      setSItems([...sItems, { name: itemName, qty: 1 }]);
    }
  };

  const updateItemQty = (itemName, qty) => {
    setSItems(sItems.map(i => i.name === itemName ? { ...i, qty: Math.max(1, parseInt(qty) || 1) } : i));
  };

  const addShipment = async () => {
    if (!sId || !sOrigin || !sDest || sItems.length === 0) return;
    setLoading(true);
    try {
      if (editingSId) {
        await axios.put(`${baseUrl}/api/shipments/${editingSId}`, {
          id: sId, origin: sOrigin, destination: sDest, items: sItems, priority: sPriority, eta: sEta
        });
      } else {
        await axios.post(`${baseUrl}/api/shipments`, {
          id: sId, origin: sOrigin, destination: sDest, items: sItems, priority: sPriority, eta: sEta
        });
      }
      setSId(''); setSOrigin(''); setSDest(''); setSItems([]); setSEta(''); setEditingSId(null);
      fetchState();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (s) => {
    setEditingSId(s.id);
    setSId(s.id);
    setSOrigin(s.origin);
    setSDest(s.destination);
    setSItems(Array.isArray(s.items) ? (typeof s.items[0] === 'string' ? s.items.map(name => ({ name, qty: 1 })) : s.items) : []);
    setSPriority(s.priority);
    setSEta(s.eta || '');
    setTab('SHIPMENTS');
  };

  const deleteShipment = async (id) => {
    try {
      await axios.delete(`${baseUrl}/api/shipments/${id}`);
      fetchState();
    } catch (e) { console.error(e); }
  };

  const [iName, setIName] = useState('');
  const [iStock, setIStock] = useState('');
  const [iReorder, setIReorder] = useState('');
  const [showInvDropdown, setShowInvDropdown] = useState(false);

  const addInventory = async () => {
    if (!iName || !iStock) return;
    setLoading(true);
    try {
      await axios.post(`${baseUrl}/api/inventory`, {
        item: iName,
        stock: Number(iStock),
        reorder_point: Number(iReorder) || undefined
      });
      setIName(''); setIStock(''); setIReorder('');
      onRefresh();
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const deleteInventory = async (item) => {
    try {
      await axios.delete(`${baseUrl}/api/inventory/${encodeURIComponent(item)}`);
      onRefresh();
    } catch (e) { console.error(e); }
  };

  const inputStyle = {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 13,
    marginBottom: 10
  };

  const labelStyle = {
    color: C.textDim,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase'
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={[s.header, { borderBottomWidth: 1 }]}>
          <Text style={s.headerTitle}>DATA MANAGER</Text>
          <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
            <Text style={{ color: C.cyan, fontWeight: '900' }}>CLOSE</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', backgroundColor: C.surfaceL, padding: 4 }}>
          {['SHIPMENTS', 'INVENTORY'].map(t => (
            <TouchableOpacity 
              key={t} 
              onPress={() => setTab(t)}
              style={{ flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: tab === t ? 'rgba(0,242,255,0.1)' : 'transparent', borderRadius: 10 }}
            >
              <Text style={{ color: tab === t ? C.cyan : C.textMute, fontWeight: '800', fontSize: 11 }}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {tab === 'SHIPMENTS' ? (
            <>
              <View style={[s.card, { backgroundColor: C.surface, marginBottom: 20 }]}>
                <Text style={[s.sectionTitle, { marginBottom: 12, color: C.cyan }]}>+ {editingSId ? 'EDIT SHIPMENT' : 'ADD NEW SHIPMENT'}</Text>
                
                <Text style={labelStyle}>Shipment ID</Text>
                <TextInput style={inputStyle} value={sId} onChangeText={setSId} placeholder="SH-100" placeholderTextColor={C.textMute} />
                
                <Text style={labelStyle}>Priority</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                  {['Low', 'Medium', 'High', 'Critical'].map(p => (
                    <TouchableOpacity 
                      key={p} 
                      onPress={() => setSPriority(p)}
                      style={{ paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, backgroundColor: sPriority === p ? C.cyan + '20' : 'transparent', borderWidth: 1, borderColor: sPriority === p ? C.cyan : C.border }}
                    >
                      <Text style={{ fontSize: 9, color: sPriority === p ? C.cyan : C.textMute, fontWeight: '900' }}>{p.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={labelStyle}>Origin</Text>
                <TextInput style={inputStyle} value={sOrigin} onChangeText={setSOrigin} placeholder="City, Country" placeholderTextColor={C.textMute} />
                
                <Text style={labelStyle}>Destination</Text>
                <TextInput style={inputStyle} value={sDest} onChangeText={setSDest} placeholder="City, Country" placeholderTextColor={C.textMute} />
                
                <Text style={labelStyle}>Select Items from Inventory</Text>
                <View style={{ marginBottom: 15 }}>
                  <TouchableOpacity 
                    onPress={() => setShowInvDropdown(!showInvDropdown)}
                    style={[inputStyle, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }]}
                  >
                    <Text style={{ color: sItems.length > 0 ? '#fff' : C.textMute, fontSize: 13 }}>
                      {sItems.length === 0 ? 'Choose items...' : `${sItems.length} item(s) selected`}
                    </Text>
                    <Text style={{ color: C.textMute, transform: [{ rotate: showInvDropdown ? '90deg' : '0deg' }] }}>▶</Text>
                  </TouchableOpacity>

                  {showInvDropdown && (
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 5, maxHeight: 150 }}>
                      <ScrollView nestedScrollEnabled={true}>
                        {state?.inventory?.length === 0 ? (
                          <Text style={{ color: C.textMute, fontSize: 11, padding: 10, textAlign: 'center' }}>No inventory items found</Text>
                        ) : (
                          state.inventory.map(i => (
                            <TouchableOpacity 
                              key={i.item} 
                              onPress={() => toggleItem(i.item)}
                              style={{ 
                                flexDirection: 'row', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                padding: 12, 
                                borderRadius: 8, 
                                backgroundColor: sItems.find(si => si.name === i.item) ? C.cyan + '10' : 'transparent' 
                              }}
                            >
                              <Text style={{ color: sItems.find(si => si.name === i.item) ? C.cyan : C.textDim, fontSize: 13, fontWeight: sItems.find(si => si.name === i.item) ? '700' : '400' }}>
                                {i.item}
                              </Text>
                              {sItems.find(si => si.name === i.item) && <Text style={{ color: C.cyan }}>✔</Text>}
                            </TouchableOpacity>
                          ))
                        )}
                      </ScrollView>
                    </View>
                  )}
                  
                  {sItems.length > 0 && (
                    <View style={{ marginTop: 15, padding: 12, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 12, borderWidth: 1, borderColor: C.border }}>
                      <Text style={[labelStyle, { marginBottom: 10 }]}>ITEMS & QUANTITIES</Text>
                      {sItems.map(si => (
                        <View key={si.name} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.03)', padding: 8, borderRadius: 8 }}>
                          <Text style={{ color: C.textDim, fontSize: 12, fontWeight: '700' }}>{si.name}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={{ color: C.textMute, fontSize: 9, fontWeight: '900' }}>QTY:</Text>
                            <TextInput 
                              style={{ width: 45, backgroundColor: 'rgba(0,0,0,0.3)', color: C.cyan, textAlign: 'center', borderRadius: 6, paddingVertical: 4, paddingHorizontal: 2, fontSize: 12, fontWeight: 'bold', borderWidth: 1, borderColor: C.border }}
                              keyboardType="numeric"
                              value={(si.qty || 1).toString()}
                              onChangeText={(v) => updateItemQty(si.name, v)}
                            />
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                <Text style={labelStyle}>ETA (YYYY-MM-DD)</Text>
                <TextInput style={inputStyle} value={sEta} onChangeText={setSEta} placeholder="2026-05-30" placeholderTextColor={C.textMute} />

                <TouchableOpacity 
                  style={[s.authSubmitBtn, { marginTop: 10, paddingVertical: 12 }]} 
                  onPress={addShipment}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="#000" /> : <Text style={s.authSubmitText}>ADD SHIPMENT</Text>}
                </TouchableOpacity>
              </View>

              <Text style={s.sectionTitle}>ACTIVE SHIPMENTS ({state?.shipments?.length})</Text>
              {state?.shipments?.map(ship => (
                <View key={ship.id} style={[s.card, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                  <View>
                    <Text style={{ color: C.cyan, fontWeight: '900', fontSize: 13 }}>{ship.id}</Text>
                    <Text style={{ color: C.textDim, fontSize: 11 }}>{ship.origin} → {ship.destination}</Text>
                  </View>
                  <TouchableOpacity onPress={() => deleteShipment(ship.id)} style={{ padding: 10 }}>
                    <Text style={{ fontSize: 18 }}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          ) : (
            <>
              <View style={[s.card, { backgroundColor: C.surface, marginBottom: 20 }]}>
                <Text style={[s.sectionTitle, { marginBottom: 12, color: C.cyan }]}>+ ADD NEW INVENTORY</Text>
                
                <Text style={labelStyle}>Item Name</Text>
                <TextInput style={inputStyle} value={iName} onChangeText={setIName} placeholder="Microchips" placeholderTextColor={C.textMute} />
                
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={labelStyle}>Stock</Text>
                    <TextInput style={inputStyle} value={iStock} onChangeText={setIStock} placeholder="500" keyboardType="numeric" placeholderTextColor={C.textMute} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={labelStyle}>Reorder Point</Text>
                    <TextInput style={inputStyle} value={iReorder} onChangeText={setIReorder} placeholder="100" keyboardType="numeric" placeholderTextColor={C.textMute} />
                  </View>
                </View>

                <TouchableOpacity 
                  style={[s.authSubmitBtn, { marginTop: 10, paddingVertical: 12 }]} 
                  onPress={addInventory}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="#000" /> : <Text style={s.authSubmitText}>ADD INVENTORY ITEM</Text>}
                </TouchableOpacity>
              </View>

              <Text style={s.sectionTitle}>CURRENT INVENTORY ({state?.inventory?.length})</Text>
              {state?.inventory?.map(inv => (
                <View key={inv.item} style={[s.card, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                  <View>
                    <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13 }}>{inv.item}</Text>
                    <Text style={{ color: C.textDim, fontSize: 11 }}>Stock: {inv.stock} | RP: {inv.reorder_point}</Text>
                  </View>
                  <TouchableOpacity onPress={() => deleteInventory(inv.item)} style={{ padding: 10 }}>
                    <Text style={{ fontSize: 18 }}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  flex1: { flex: 1 },

  // Auth
  authScroll:        { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  authLogo:          { alignItems: 'center', marginBottom: 32 },
  logoIcon:          { width: 72, height: 72, borderRadius: 22, backgroundColor: '#0d1117', borderWidth: 1, borderColor: C.cyan + '40', alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: C.cyan, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  logoIconText:      { fontSize: 32 },
  authTitle:         { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: 2 },
  authSubtitle:      { color: C.cyan, fontSize: 10, fontWeight: '700', letterSpacing: 3, marginTop: 4 },
  authCard:          { backgroundColor: C.surface, borderRadius: 24, borderWidth: 1, borderColor: C.border, padding: 24, shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 30, elevation: 15 },
  modeRow:           { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 4, marginBottom: 24 },
  modeBtn:           { flex: 1, paddingVertical: 12, borderRadius: 13, alignItems: 'center' },
  modeBtnActive:     { backgroundColor: 'rgba(0,242,255,0.1)', borderWidth: 1, borderColor: C.border },
  modeBtnText:       { color: C.textMute, fontWeight: '700', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
  modeBtnTextActive: { color: '#fff' },
  field:             { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 4, marginBottom: 12 },
  fieldIcon:         { fontSize: 16, marginRight: 10 },
  fieldInput:        { flex: 1, color: C.text, fontSize: 14, paddingVertical: 12 },
  eyeBtn:            { fontSize: 16, paddingLeft: 8 },
  errorBox:          { backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 12, padding: 12, marginBottom: 12 },
  errorText:         { color: C.red, fontSize: 12, fontWeight: '600' },
  configBtn:         { alignItems: 'center', paddingVertical: 10, marginBottom: 8 },
  configBtnText:     { color: C.textMute, fontSize: 12, fontWeight: '600' },
  authSubmitBtn:     { backgroundColor: C.cyan, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 16, marginTop: 4, shadowColor: C.cyan, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
  authSubmitText:    { color: '#000', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  authSubmitBtnM:    { backgroundColor: C.cyan, borderRadius: 14, paddingVertical: 12, alignItems: 'center', marginBottom: 10, shadowColor: C.cyan, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
  switchText:        { textAlign: 'center', color: C.textMute, fontSize: 12 },
  authFooter:        { textAlign: 'center', color: C.textMute, fontSize: 9, letterSpacing: 3, marginTop: 24 },

  // App shell
  loadingScreen:     { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText:       { color: C.cyan, fontSize: 10, letterSpacing: 3, fontWeight: '700' },

  // Header
  header:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle:       { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  headerSub:         { color: C.cyan, fontSize: 9, fontWeight: '700', letterSpacing: 2, marginTop: 2 },
  headerRight:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusPill:        { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, gap: 5 },
  statusDot:         { width: 6, height: 6, borderRadius: 3 },
  statusText:        { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  avatarBtn:         { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,242,255,0.15)', borderWidth: 1, borderColor: C.cyan + '40', alignItems: 'center', justifyContent: 'center' },
  avatarText:        { color: C.cyan, fontWeight: '900', fontSize: 14 },

  // Stats bar
  statsBar:          { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceL, borderBottomWidth: 1, borderBottomColor: C.border, paddingVertical: 10 },
  statChip:          { flex: 1, alignItems: 'center' },
  statValue:         { fontSize: 18, fontWeight: '900' },
  statLabel:         { color: C.textMute, fontSize: 7, fontWeight: '700', letterSpacing: 1, marginTop: 2 },
  statsDivider:      { width: 1, height: 28, backgroundColor: C.border },

  // Content
  content:           { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  tabContent:        { paddingTop: 12 },

  // Cards
  card:              { backgroundColor: C.surfaceL, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 12 },
  cardRow:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardId:            { color: C.textMute, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  cardItems:         { color: '#fff', fontSize: 15, fontWeight: '800' },
  badge:             { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText:         { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

  // Fleet
  routeRow:          { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  routePoint:        { color: C.textDim, fontSize: 12, fontWeight: '600' },
  routeArrow:        { color: C.textMute, fontSize: 12 },
  cardFooter:        { flexDirection: 'row', alignItems: 'center' },
  priorityDot:       { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  cardFooterText:    { color: C.textMute, fontSize: 10, fontWeight: '700' },
  cardEta:           { color: C.textMute, fontSize: 10 },

  // Inventory
  stockBar:          { height: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', marginBottom: 4, position: 'relative' },
  criticalMark:      { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(239,68,68,0.4)', zIndex: 2 },
  stockFill:         { height: '100%', borderRadius: 4 },
  stockLabels:       { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  stockLabel0:       { color: C.textMute, fontSize: 8 },
  stockLabelCrit:    { color: 'rgba(239,68,68,0.6)', fontSize: 8, fontWeight: '700' },
  stockLabel500:     { color: C.textMute, fontSize: 8 },

  // Network
  nodeMetrics:       { flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12, marginTop: 4 },
  nodeMetric:        { flex: 1, alignItems: 'center' },
  nodeMetricLabel:   { color: C.textMute, fontSize: 8, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  nodeMetricValue:   { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Logs
  logCard:           { borderLeftWidth: 2, paddingLeft: 14, marginBottom: 18 },
  logHeader:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  logBadge:          { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  logBadgeText:      { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  logTime:           { color: C.textMute, fontSize: 9 },
  logDetails:        { color: C.textDim, fontSize: 13, lineHeight: 19 },

  // Section header
  sectionHeader:     { flexDirection: 'row', alignItems: 'center', marginBottom: 14, marginTop: 4 },
  sectionIcon:       { fontSize: 16, marginRight: 8 },
  sectionTitle:      { color: C.textMute, fontSize: 10, fontWeight: '900', letterSpacing: 2 },

  // Empty state
  emptyState:        { alignItems: 'center', paddingVertical: 60 },
  emptyIcon:         { fontSize: 40, marginBottom: 12, opacity: 0.4 },
  emptyText:         { color: C.textMute, fontSize: 13, fontStyle: 'italic' },

  // Bottom nav
  navbar:            { flexDirection: 'row', backgroundColor: C.surfaceL, borderTopWidth: 1, borderTopColor: C.border, paddingBottom: Platform.OS === 'ios' ? 35 : 25, height: Platform.OS === 'ios' ? 95 : 85 },
  navBtn:            { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  navIcon:           { fontSize: 20, opacity: 0.4 },
  navLabel:          { fontSize: 9, color: C.textMute, marginTop: 3, fontWeight: '700', letterSpacing: 0.5 },
  navIndicator:      { position: 'absolute', top: 0, left: '30%', right: '30%', height: 2, backgroundColor: C.cyan, borderRadius: 1 },

  // Profile modal
  modalOverlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  profileCard:       { backgroundColor: C.surface, borderRadius: 24, borderWidth: 1, borderColor: C.border, padding: 28, width: width * 0.8, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.7, shadowRadius: 30, elevation: 20 },
  profileAvatar:     { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(0,242,255,0.15)', borderWidth: 2, borderColor: C.cyan + '50', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  profileAvatarText: { color: C.cyan, fontSize: 32, fontWeight: '900' },
  profileName:       { color: '#fff', fontSize: 18, fontWeight: '900', marginBottom: 4 },
  profileEmail:      { color: C.textMute, fontSize: 12, marginBottom: 20 },
  profileDivider:    { width: '100%', height: 1, backgroundColor: C.border, marginBottom: 16 },
  logoutBtn:         { paddingVertical: 14, paddingHorizontal: 24, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  logoutText:        { color: C.red, fontWeight: '800', fontSize: 14 },

  // Agent Tab Styles
  agentHeaderCard: { backgroundColor: C.surface, borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 18, marginBottom: 16 },
  agentHeaderTitle: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  agentHeaderSub: { color: C.purple, fontSize: 8, fontWeight: '700', letterSpacing: 2, marginTop: 4, textTransform: 'uppercase' },
  agentMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  agentTime: { color: C.textMute, fontSize: 10 },
  
  // Stepper/Actions
  stepCard: { padding: 14, borderRadius: 16, borderWidth: 1, borderColor: C.border, marginBottom: 12 },
  stepCardSuccess: { backgroundColor: 'rgba(16,185,129,0.04)', borderColor: 'rgba(16,185,129,0.25)' },
  stepCardRolledBack: { backgroundColor: 'rgba(245,158,11,0.04)', borderColor: 'rgba(245,158,11,0.25)' },
  stepCardExecuting: { backgroundColor: 'rgba(0,242,255,0.04)', borderColor: 'rgba(0,242,255,0.35)', shadowColor: C.cyan, shadowOpacity: 0.1, shadowRadius: 10 },
  
  stepRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#0a0b12', alignItems: 'center', justifyContent: 'center' },
  stepCircleSuccess: { borderColor: C.emerald, backgroundColor: 'rgba(16,185,129,0.15)' },
  stepCircleRolledBack: { borderColor: C.amber, backgroundColor: 'rgba(245,158,11,0.15)' },
  stepCircleExecuting: { borderColor: C.cyan, backgroundColor: 'rgba(0,242,255,0.15)' },
  stepCircleText: { fontSize: 11, fontWeight: '900', color: C.textMute },
  stepCircleTextSuccess: { color: C.emerald },
  stepCircleTextRolledBack: { color: C.amber },
  stepCircleTextExecuting: { color: C.cyan },
  
  stepContent: { flex: 1 },
  stepBadges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 6 },
  stepBadge: { fontSize: 8, fontWeight: '900', letterSpacing: 0.5, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, textTransform: 'uppercase' },
  
  stepDesc: { color: C.text, fontSize: 13, fontWeight: '700' },
  stepResultText: { color: C.textDim, fontSize: 11, fontStyle: 'italic', marginTop: 6, paddingLeft: 8, borderLeftWidth: 1.5, borderLeftColor: 'rgba(255,255,255,0.1)' },
  
  // Alert/Control Panel
  controlPanel: { padding: 14, borderRadius: 16, backgroundColor: 'rgba(245,158,11,0.04)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)', marginBottom: 16 },
  controlPanelTitle: { color: C.amber, fontSize: 12, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  controlPanelDesc: { color: C.textDim, fontSize: 10, marginTop: 4, lineHeight: 14 },
  
  // Buttons
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btnPrimary: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: C.cyan, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  btnText: { color: '#000', fontWeight: '900', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' },
  btnDanger: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', alignItems: 'center', justifyContent: 'center' },
  btnDangerText: { color: C.red, fontWeight: '800', fontSize: 12, letterSpacing: 1 },
});
