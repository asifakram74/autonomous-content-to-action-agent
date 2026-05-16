import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import axios from 'axios';

const { width } = Dimensions.get('window');
const BACKEND_URL = 'http://192.168.100.79:5000'; 

export default function App() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('FLEET'); // FLEET, INVENTORY, LOGS

  const fetchData = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/state`);
      setState(response.data);
      setError(null);
    } catch (err) {
      setError('Cannot connect to Antigravity Node');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !state) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00f2ff" />
        <Text style={styles.loadingText}>SYNCING WITH ANTIGRAVITY...</Text>
      </View>
    );
  }

  const renderContent = () => {
    switch(activeTab) {
      case 'FLEET':
        return (
          <View>
            <Text style={styles.sectionTitle}>PRIORITY SHIPMENTS</Text>
            {state?.shipments?.map((shipment) => (
              <View key={shipment.id} style={styles.shipmentCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.shipmentId}>{shipment.id}</Text>
                  <View style={[styles.badge, shipment.status === 'Rerouted' ? styles.badgeRerouted : styles.badgeNormal]}>
                    <Text style={styles.badgeText}>{shipment.status.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.shipmentItems}>{shipment.items.join(', ')}</Text>
                <View style={styles.locationRow}>
                  <Text style={styles.location}>{shipment.origin.split(',')[0]}</Text>
                  <Text style={styles.arrow}>→</Text>
                  <Text style={styles.location}>{shipment.destination.split(',')[0]}</Text>
                </View>
                <Text style={styles.etaText}>ETA: {shipment.eta}</Text>
              </View>
            ))}
          </View>
        );
      case 'INVENTORY':
        return (
          <View>
            <Text style={styles.sectionTitle}>STOCK MONITORING</Text>
            {state?.inventory?.map((item) => (
              <View key={item.id} style={styles.inventoryCard}>
                <View style={styles.inventoryInfo}>
                  <Text style={styles.itemName}>{item.item}</Text>
                  <Text style={styles.itemLocation}>{item.location}</Text>
                </View>
                <View style={styles.stockInfo}>
                  <Text style={[styles.stockValue, item.stock < 100 ? {color: '#ff5757'} : {color: '#00f2ff'}]}>{item.stock}</Text>
                  <Text style={styles.stockLabel}>UNITS</Text>
                </View>
              </View>
            ))}
          </View>
        );
      case 'LOGS':
        return (
          <View>
            <Text style={styles.sectionTitle}>AGENT REASONING LOGS</Text>
            {state?.logs?.slice().reverse().map((log, i) => (
              <View key={i} style={styles.logCard}>
                <Text style={styles.logType}>[{log.action}]</Text>
                <Text style={styles.logDetails}>{log.details}</Text>
                <Text style={styles.logTime}>{new Date(log.timestamp).toLocaleTimeString()}</Text>
              </View>
            ))}
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>ANTIGRAVITY</Text>
          <Text style={styles.headerSubtitle}>Operator Approval Node</Text>
        </View>
        <View style={styles.statusDotContainer}>
          <View style={[styles.statusDot, { backgroundColor: error ? '#ff5757' : '#00f2ff' }]} />
          <Text style={[styles.statusText, { color: error ? '#ff5757' : '#00f2ff' }]}>
            {error ? 'OFFLINE' : 'SECURE'}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {renderContent()}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.navbar}>
        <NavButton label="FLEET" icon="🛰️" active={activeTab === 'FLEET'} onPress={() => setActiveTab('FLEET')} />
        <NavButton label="INVENTORY" icon="📦" active={activeTab === 'INVENTORY'} onPress={() => setActiveTab('INVENTORY')} />
        <NavButton label="LOGS" icon="📜" active={activeTab === 'LOGS'} onPress={() => setActiveTab('LOGS')} />
      </View>
    </SafeAreaView>
  );
}

const NavButton = ({ label, icon, active, onPress }) => (
  <TouchableOpacity style={styles.navButton} onPress={onPress}>
    <Text style={[styles.navIcon, active && styles.navIconActive]}>{icon}</Text>
    <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05060a' },
  loadingContainer: { flex: 1, backgroundColor: '#05060a', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#00f2ff', marginTop: 20, fontSize: 10, letterSpacing: 2 },
  header: { padding: 20, paddingTop: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  headerSubtitle: { color: '#00f2ff', fontSize: 10, fontWeight: '600' },
  statusDotContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.05)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 8, fontWeight: '800' },
  content: { flex: 1, padding: 20 },
  sectionTitle: { color: '#475569', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 20 },
  shipmentCard: { backgroundColor: 'rgba(16, 18, 27, 0.7)', borderRadius: 20, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  shipmentId: { color: '#475569', fontSize: 10, fontWeight: 'bold' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeNormal: { backgroundColor: 'rgba(0, 242, 255, 0.1)' },
  badgeRerouted: { backgroundColor: 'rgba(188, 19, 254, 0.1)' },
  badgeText: { fontSize: 8, fontWeight: 'bold', color: '#00f2ff' },
  shipmentItems: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  location: { color: '#94a3b8', fontSize: 12 },
  arrow: { color: '#334155', marginHorizontal: 8 },
  etaText: { color: '#475569', fontSize: 10 },
  inventoryCard: { backgroundColor: 'rgba(16, 18, 27, 0.7)', borderRadius: 15, padding: 15, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  itemLocation: { color: '#475569', fontSize: 10 },
  stockInfo: { alignItems: 'flex-end' },
  stockValue: { fontSize: 18, fontWeight: 'bold' },
  stockLabel: { color: '#475569', fontSize: 8 },
  logCard: { borderLeftWidth: 2, borderLeftColor: '#bc13fe', paddingLeft: 15, marginBottom: 25 },
  logType: { color: '#bc13fe', fontSize: 9, fontWeight: 'bold', marginBottom: 4 },
  logDetails: { color: '#94a3b8', fontSize: 12 },
  logTime: { color: '#334155', fontSize: 9, marginTop: 4 },
  navbar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, backgroundColor: '#10121b', flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingBottom: 15 },
  navButton: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navIcon: { fontSize: 18, opacity: 0.5 },
  navIconActive: { opacity: 1 },
  navLabel: { fontSize: 8, color: '#475569', marginTop: 4, fontWeight: 'bold' },
  navLabelActive: { color: '#00f2ff' }
});
