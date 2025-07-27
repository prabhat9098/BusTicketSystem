import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import {
  Avatar,
  Card,
  Text,
  Button,
  IconButton,
  useTheme,
} from 'react-native-paper';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL } from '../../app/constants/baseURL';
import CustomSnackbar from '../../app/constants/CustomSnackbar';

const screenWidth = Dimensions.get('window').width;

export default function AdminDashboard() {
  const { colors } = useTheme();
  const [stats, setStats] = useState<any>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');
  const [loading, setLoading] = useState(true);

  const showSnackbar = (msg: string, type: 'success' | 'error' = 'success') => {
    setSnackbarMsg(msg);
    setSnackbarType(type);
    setSnackbarVisible(true);
    setTimeout(() => setSnackbarVisible(false), 2500);
  };

  const confirmLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", onPress: handleLogout },
    ]);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      router.replace("/");
    } catch (error) {
      Alert.alert("Logout Failed", "Could not clear session data.");
      console.error("Logout error:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert("Error", "Missing token, please login again");
        router.replace("/");
        return;
      }

      const res = await axios.get(`${BASE_URL}/api/admin/dashboard-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (err: any) {
      showSnackbar("Failed to fetch dashboard stats", 'error');
      console.error(err?.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Check session and fetch data
  useEffect(() => {
    const loadData = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const type = await AsyncStorage.getItem("type");

        if (!token || type !== "admin") {
          Alert.alert("Session Expired", "Please login again");
          router.replace("/");
          return;
        }
        await fetchStats();
      } catch (err) {
        console.error("Error loading admin session:", err);
        router.replace("/");
      }
    };

    loadData();
  }, []);

  const computedCards = stats ? [
    { title: 'Total Conductors', value: stats.totalConductors, icon: 'account-group', color: '#e0f7fa' },
    { title: 'Today Active Conductors', value: stats.activeConductorsToday, icon: 'account-check', color: '#fff3e0' },
    { title: "Today's Sales", value: `₹ ${stats.totalIncomeToday}`, icon: 'cash', color: '#e8f5e9' },
    { title: 'Monthly Sales', value: `₹ ${stats.monthlyIncome}`, icon: 'currency-inr', color: '#f3e5f5' },
    { title: 'Total Buses', value: stats.totalBuses || stats.totalConductors, icon: 'bus', color: '#e1f5fe' },
    { title: 'Active Buses Today', value: stats.activeBusesToday || stats.activeConductorsToday, icon: 'bus-clock', color: '#fffde7' },
    {
      title: 'Conductors on Leave',
      value: stats.totalConductors - stats.activeConductorsToday,
      icon: 'account-off',
      color: '#fce4ec'
    },
  ] : [];

  const actions = [
    { label: 'Add Conductor', icon: 'plus', route: '/admin/add-conductor' },
    { label: 'View Conductor', icon: 'account', route: '/admin/view-conductor' },
    { label: 'Add Routes', icon: 'plus', route: '/admin/add-routes' },
    { label: 'View Routes', icon: 'map', route: '/admin/view-routes' },
    { label: 'Add Route Fare', icon: 'currency-inr', route: '/admin/add-fare' },
    { label: 'Analytics Report', icon: 'chart-line', route: '/admin/conductoranalysis' },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ textAlign: "center", marginTop: 50 }}>Loading Admin Dashboard...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <IconButton icon="power" size={36} onPress={confirmLogout} />
          <Text style={styles.headerText}>Admin Dashboard</Text>
          <Avatar.Icon size={36} icon="account-circle" />
        </View>

        {/* Statistic Cards */}
        <View style={styles.cardGrid}>
          {computedCards.map((card, index) => (
            <Card key={index} style={styles.card}>
              <View style={styles.cardContent}>
                <Avatar.Icon
                  icon={card.icon}
                  size={40}
                  style={{ backgroundColor: card.color, marginRight: 10 }}
                  color={colors.primary}
                />
                <View style={{ flexShrink: 1 }}>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <Text style={styles.cardValue}>{card.value}</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonGrid}>
          {actions.map((action, i) => (
            <View key={i} style={styles.buttonWrapper}>
              <Button
                mode="contained"
                icon={action.icon}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
                style={styles.squareButton}
                onPress={() => router.push(action.route)}
              >
                {action.label}
              </Button>
            </View>
          ))}
        </View>

        <CustomSnackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          message={snackbarMsg}
          type={snackbarType}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: {
    paddingTop: Platform.OS === 'android' ? 10 : 10,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerText: { fontSize: 20, fontWeight: 'bold' },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: (screenWidth - 48) / 2,
    marginBottom: 16,
    elevation: 3,
    borderRadius: 12,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  buttonWrapper: {
    width: (screenWidth - 52) / 2,
    marginBottom: 12,
  },
  squareButton: {
    borderRadius: 12,
    justifyContent: 'flex-start',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: 60,
  },
  buttonLabel: {
    fontSize: 13,
    marginLeft: 10,
    textAlign: 'left',
  },
});
