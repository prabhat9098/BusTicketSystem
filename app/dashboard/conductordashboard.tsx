// ConductorDashboardScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, StyleSheet, Text, ScrollView, TouchableOpacity, Modal,
  FlatList, BackHandler, ToastAndroid, Alert, StatusBar
} from 'react-native';
import { Appbar, Button, Divider, Avatar } from 'react-native-paper';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { BASE_URL } from '../../app/constants/baseURL';

export default function ConductorDashboardScreen() {
  const navigation = useNavigation();

  const [companyName, setCompanyName] = useState('');
  const [conductor, setConductor] = useState<any>(null);
  const [points, setPoints] = useState<string[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [reverse, setReverse] = useState(false);
  const [filteredToPoints, setFilteredToPoints] = useState<string[]>([]);
  const [passengerCount, setPassengerCount] = useState(1);
  const [fare, setFare] = useState<number | null>(null);
  const [gstFare, setGstFare] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(moment().format('YYYY-MM-DD HH:mm:ss'));
  const [logoUrl, setLogoUrl] = useState('');
  const [fromModalVisible, setFromModalVisible] = useState(false);
  const [toModalVisible, setToModalVisible] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(moment().format('YYYY-MM-DD HH:mm:ss'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let lastPress = 0;
    const backAction = () => {
      const now = Date.now();
      if (now - lastPress < 2000) BackHandler.exitApp();
      else {
        ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
        lastPress = now;
      }
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
  const loadData = async () => {
    const token = await AsyncStorage.getItem('token');
    const company = await AsyncStorage.getItem('company_name');
    const condStr = await AsyncStorage.getItem('conductor');

    if (!condStr || !token) return Alert.alert('Error', 'Missing token or conductor');

    const cond = JSON.parse(condStr);
    setCompanyName(company || '');
    setConductor(cond);

    // ✅ Store logo URL separately
    if (cond.logo) {
      setLogoUrl(cond.logo);
    }

    const res = await axios.get(`${BASE_URL}/api/path/points-by-route?path_id=${cond.path}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setPoints(res.data.points || []);
  };
  loadData();
}, []);

  useEffect(() => {
    if (from && points.length) {
      const idx = points.indexOf(from);
      const filtered = reverse ? points.slice(0, idx).reverse() : points.slice(idx + 1);
      setFilteredToPoints(filtered);
    }
  }, [from, reverse, points]);

  useEffect(() => {
    if (fare && gstFare) {
      const newBase = fare * passengerCount;
      setGstFare(newBase * 1.05);
    }
  }, [passengerCount]);

  const calculateFare = async () => {
    if (!from || !to) return Alert.alert('Error', 'Please select From and To points');

    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.post(
        `${BASE_URL}/api/path/calculate-fare`,
        { path_id: conductor.path, from, to, journey: reverse ? 'down' : 'up' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const base = res.data.total_fare;
      setFare(base);
      setGstFare(base * passengerCount * 1.05);
    } catch (err) {
      Alert.alert('Error', 'Failed to calculate fare');
    }
  };

  const handlePrint = async () => {
  if (!fare || !gstFare) return Alert.alert('Error', 'Calculate fare first');

  const ticketNumber = `TID-${Math.floor(100000 + Math.random() * 900000)}`;

  try {
    let logo = logoUrl;
    if (!logo) {
      const conductorData = await AsyncStorage.getItem('conductor');
      if (conductorData) {
        const parsed = JSON.parse(conductorData);
        logo = parsed.logo || '';
      }
    }

    const html = `
      <html>
        <body style="font-family:monospace; max-width:280px; padding:10px; text-align:center;">
          ${logo ? `<img src="${logo}" alt="logo" style="max-width: 100px; margin-bottom: 8px;" />` : ''}
          <h2 style="margin: 4px 0;">${companyName}</h2>
          <hr style="margin: 6px 0;" />
          <p><strong>Ticket #:</strong> ${ticketNumber}</p>
          <p><strong>Bus No:</strong> ${conductor?.busnumber}</p>
          <p><strong>From:</strong> ${from}</p>
          <p><strong>To:</strong> ${to}</p>
          <p><strong>Passengers:</strong> ${passengerCount}</p>
          <p><strong>Fare:</strong> ₹${fare}</p>
          <p><strong>GST (5%):</strong> ₹${(fare * 0.05).toFixed(2)}</p>
          <p><strong>Total:</strong> ₹${gstFare?.toFixed(2)}</p>
          <p><strong>Time:</strong> ${currentTime}</p>
          <hr style="margin: 8px 0;" />
          <img src="https://api.qrserver.com/v1/create-qr-code/?data=${ticketNumber}&size=120x120" style="margin: 12px auto;" />
          <p style="margin-top: 16px;">-- Happy Journey --</p>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    await Print.printAsync({ uri });

    // ✅ Reset fields after successful print
    resetAfterPrint();

  } catch (err) {
    Alert.alert('Error', 'Failed to print ticket');
    console.error(err);
  }
};

const resetAfterPrint = () => {
  setFrom('');
  setTo('');
  setPassengerCount(1);
  setFare(null);
  setGstFare(null);
};




  const clearSelections = () => {
    setFrom('');
    setTo('');
    setFare(null);
    setGstFare(null);
  };

  const onReverse = () => {
    setReverse(!reverse);
    clearSelections();
  };

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <Appbar.Header style={{ paddingTop: 24, backgroundColor: 'white' }}>
        <Appbar.Action icon="menu" onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())} />
        <Appbar.Content title={`${companyName} Bus System`} />
        <Appbar.Action icon="account-circle" />
      </Appbar.Header>

      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Avatar.Text label={conductor?.name?.[0] || '?'} size={48} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.welcome}>Welcome, {conductor?.name}</Text>
            <Text style={styles.subtitle}>{currentTime}</Text>
          </View>
        </View>

        {/* From */}
        <TouchableOpacity style={styles.inputBox} onPress={() => setFromModalVisible(true)}>
          <Text style={{ color: from ? '#000' : '#888' }}>
            {from ? `From: ${from}` : 'Select From'}
          </Text>
          {from ? (
            <Ionicons name="close-circle" size={20} onPress={() => setFrom('')} />
          ) : null}
        </TouchableOpacity>

        {/* To */}
        <TouchableOpacity style={styles.inputBox} onPress={() => setToModalVisible(true)}>
          <Text style={{ color: to ? '#000' : '#888' }}>
            {to ? `To: ${to}` : 'Select To'}
          </Text>
          {to ? (
            <Ionicons name="close-circle" size={20} onPress={() => setTo('')} />
          ) : null}
        </TouchableOpacity>

        <Button icon="repeat" mode="outlined" style={styles.btn} onPress={onReverse}>
          Reverse Route
        </Button>

        {/* Passenger Count */}
        <View style={styles.counterRow}>
          <Button icon="minus" mode="outlined" onPress={() => setPassengerCount(Math.max(1, passengerCount - 1))} />
          <Text style={styles.count}>{passengerCount}</Text>
          <Button icon="plus" mode="outlined" onPress={() => setPassengerCount(passengerCount + 1)} />
        </View>

        <Button mode="contained" style={styles.btn} onPress={calculateFare}>
          Calculate Fare
        </Button>

        {gstFare && (
          <Text style={styles.total}>Total Fare (incl. GST): ₹{gstFare.toFixed(2)}</Text>
        )}

        <Button icon="printer" mode="contained" style={styles.btn} onPress={handlePrint}>
          Print Ticket
        </Button>
      </ScrollView>

      {/* From Modal */}
      <Modal visible={fromModalVisible} transparent animationType="fade" onRequestClose={() => setFromModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Select From</Text>
            <FlatList
              data={reverse ? [...points].reverse() : points}
              keyExtractor={(item, i) => `${item}_${i}`}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.routeOption} onPress={() => {
                  setFrom(item);
                  setTo('');
                  setFromModalVisible(false);
                }}>
                  <Text>{item}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <Divider />}
            />
            <Button onPress={() => setFromModalVisible(false)}>Cancel</Button>
          </View>
        </View>
      </Modal>

      {/* To Modal */}
      <Modal visible={toModalVisible} transparent animationType="fade" onRequestClose={() => setToModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Select To</Text>
            <FlatList
              data={filteredToPoints}
              keyExtractor={(item, i) => `${item}_${i}`}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.routeOption} onPress={() => {
                  setTo(item);
                  setToModalVisible(false);
                }}>
                  <Text>{item}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <Divider />}
            />
            <Button onPress={() => setToModalVisible(false)}>Cancel</Button>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  welcome: { fontSize: 18, fontWeight: 'bold' },
  subtitle: { color: 'gray' },
  inputBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
  },
  btn: { marginVertical: 10 },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12
  },
  count: { marginHorizontal: 20, fontSize: 18 },
  total: {
    fontSize: 18,
    textAlign: 'center',
    color: '#2e7d32',
    marginVertical: 10
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    maxHeight: '80%'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center'
  },
  routeOption: { padding: 12 }
});
