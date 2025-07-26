// ConductorDashboardScreen.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { router } from "expo-router";
import moment from "moment";
import React, { useEffect, useState } from "react";
import {
  Alert,
  BackHandler,
  FlatList,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { Appbar, Avatar, Button, Divider } from "react-native-paper";
import { getStatusBarHeight } from "react-native-status-bar-height";
import {
  printTicketCustom,
  requestBluetoothPermissions,
} from "../../bluetoothPrinterHelper";
import { BASE_URL } from "../constants/baseURL";

export default function ConductorDashboard() {
  const navigation = useNavigation();
  const statusBarHeight = getStatusBarHeight();
  const [companyName, setCompanyName] = useState("");
  const [conductor, setConductor] = useState<any>(null);
  const [points, setPoints] = useState<string[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reverse, setReverse] = useState(false);
  const [filteredToPoints, setFilteredToPoints] = useState<string[]>([]);
  const [passengerCount, setPassengerCount] = useState(1);
  const [fare, setFare] = useState<number | null>(null);
  const [gstFare, setGstFare] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(
    moment().format("YYYY-MM-DD HH:mm:ss")
  );
  const [logoUrl, setLogoUrl] = useState("");
  const [fromModalVisible, setFromModalVisible] = useState(false);
  const [toModalVisible, setToModalVisible] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(moment().format("YYYY-MM-DD HH:mm:ss"));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let lastPress = 0;
    const backAction = () => {
      const now = Date.now();
      if (now - lastPress < 2000) BackHandler.exitApp();
      else {
        ToastAndroid.show("Press back again to exit", ToastAndroid.SHORT);
        lastPress = now;
      }
      return true;
    };
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const token = await AsyncStorage.getItem("token");
      const company = await AsyncStorage.getItem("company_name");
      const condStr = await AsyncStorage.getItem("conductor");

      if (!condStr || !token)
        return Alert.alert("Error", "Missing token or conductor");

      const cond = JSON.parse(condStr);
      setCompanyName(company || "");
      setConductor(cond);

      if (cond.logo) setLogoUrl(cond.logo);

      try {
        const res = await axios.get(
          `${BASE_URL}/api/path/points-by-route?path_id=${cond.path_id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("cond:", cond);
        console.log("path_id:", cond.path);

        console.log("✅ API Response (points):", res.data);
        setPoints(res.data.points || []);
      } catch (err: any) {
        console.error("❌ API Error loading points:", err.message || err);
        Alert.alert("Error", "Failed to load route points.");
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (from && points.length) {
      const idx = points.indexOf(from);
      const filtered = reverse
        ? points.slice(0, idx).reverse()
        : points.slice(idx + 1);
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
    if (!from || !to)
      return Alert.alert("Error", "Please select From and To points");

    try {
      const token = await AsyncStorage.getItem("token");
      const res = await axios.post(
        `${BASE_URL}/api/path/calculate-fare`,
        {
          path_id: conductor.path_id,
          from,
          to,
          journey: reverse ? "down" : "up",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const base = res.data.total_fare;
      setFare(base);
      setGstFare(base * passengerCount * 1.05);
    } catch (err) {
      Alert.alert("Error", "Failed to calculate fare");
    }
  };

  const confirmLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", onPress: handleLogout },
    ]);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear(); // clears all async storage
      router.replace("/"); // sends user to the root screen: app/index.js
    } catch (error) {
      Alert.alert("Logout Failed", "Could not clear session data.");
      console.error("Logout error:", error);
    }
  };

  const handlePrint = async () => {
    if (!fare || !gstFare) return Alert.alert("Error", "Calculate fare first");

    try {
      const granted = await requestBluetoothPermissions();
      if (!granted)
        return Alert.alert(
          "Permission Denied",
          "Bluetooth permission is required"
        );

      // const devices = await listBluetoothDevices();
      // const paired = JSON.parse(devices.found || "[]");
      // if (!paired.length) return Alert.alert("No Devices", "No paired printers found");

      // const printer = paired[0]; // You can allow selection too
      // await connectToPrinter("04:7F:0E:2E:E2:3D");

      const ticketNumber = `TID-${Math.floor(100000 + Math.random() * 900000)}`;
      const ticketText = `
*** ${companyName} ***
Ticket #: ${ticketNumber}
Bus No: ${conductor?.busnumber}
From: ${from}
To: ${to}
Passengers: ${passengerCount}
Fare: ₹${fare}
GST (5%): ₹${(fare * 0.05).toFixed(2)}
Total: ₹${gstFare.toFixed(2)}
Time: ${currentTime}
--- Happy Journey ---
    `;

      await printTicketCustom("04:7F:0E:2E:E2:3D", ticketText);
      resetAfterPrint();
    } catch (error: any) {
      Alert.alert("Print Error", error.message || "Could not print");
      console.error("Bluetooth Print Error:", error);
    }
  };

  const resetAfterPrint = () => {
    setFrom("");
    setTo("");
    setPassengerCount(1);
    setFare(null);
    setGstFare(null);
  };

  const clearSelections = () => {
    setFrom("");
    setTo("");
    setFare(null);
    setGstFare(null);
  };

  const onReverse = () => {
    setReverse(!reverse);
    clearSelections();
  };

  return (
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
      <Appbar.Header
        style={{
          paddingTop: statusBarHeight,
          backgroundColor: "white",
          alignItems: "center",
        }}
      >
        <Appbar.Action icon="power" size={36} onPress={confirmLogout} />
        <Appbar.Content
          title={`${companyName} Bus System`}
          titleStyle={{ textAlign: "center" }}
        />
        <Appbar.Action icon="account-circle" size={36} />
      </Appbar.Header>

      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Avatar.Text label={conductor?.name?.[0] || "?"} size={48} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.welcome}>Welcome, {conductor?.name}</Text>
            <Text style={styles.subtitle}>{currentTime}</Text>
          </View>
        </View>

        {/* ✅ Assigned Route Display */}
        {conductor?.route_name && (
          <View style={{ alignItems: "center", paddingHorizontal: 16 }}>
            <Text
              style={styles.routeText}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              Assigned Route: {conductor.route_name}
            </Text>
          </View>
        )}

        {/* From */}
        <TouchableOpacity
          style={styles.inputBox}
          onPress={() => setFromModalVisible(true)}
        >
          <Text style={{ color: from ? "#000" : "#888" }}>
            {from ? `From: ${from}` : "Select From"}
          </Text>
          {from ? (
            <Ionicons
              name="close-circle"
              size={20}
              onPress={() => setFrom("")}
            />
          ) : null}
        </TouchableOpacity>

        {/* To */}
        <TouchableOpacity
          style={styles.inputBox}
          onPress={() => setToModalVisible(true)}
        >
          <Text style={{ color: to ? "#000" : "#888" }}>
            {to ? `To: ${to}` : "Select To"}
          </Text>
          {to ? (
            <Ionicons name="close-circle" size={20} onPress={() => setTo("")} />
          ) : null}
        </TouchableOpacity>

        <Button
          icon="repeat"
          mode="outlined"
          style={styles.btn}
          onPress={onReverse}
        >
          Reverse Route
        </Button>

        <View style={styles.counterRow}>
          <Button
            icon="minus"
            mode="outlined"
            onPress={() => setPassengerCount(Math.max(1, passengerCount - 1))}
          />
          <Text style={styles.count}>{passengerCount}</Text>
          <Button
            icon="plus"
            mode="outlined"
            onPress={() => setPassengerCount(passengerCount + 1)}
          />
        </View>

        <Button mode="contained" style={styles.btn} onPress={calculateFare}>
          Calculate Fare
        </Button>

        {gstFare && (
          <Text style={styles.total}>
            Total Fare (incl. GST): ₹{gstFare.toFixed(2)}
          </Text>
        )}

        <Button
          icon="printer"
          mode="contained"
          style={styles.btn}
          onPress={handlePrint}
        >
          Print Ticket
        </Button>
      </ScrollView>

      {/* From Modal */}
      <Modal
        visible={fromModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFromModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Select From</Text>
            <FlatList
              data={reverse ? [...points].reverse() : points}
              keyExtractor={(item, i) => `${item}_${i}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.routeOption}
                  onPress={() => {
                    setFrom(item);
                    setTo("");
                    setFromModalVisible(false);
                  }}
                >
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
      <Modal
        visible={toModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setToModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Select To</Text>
            <FlatList
              data={filteredToPoints}
              keyExtractor={(item, i) => `${item}_${i}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.routeOption}
                  onPress={() => {
                    setTo(item);
                    setToModalVisible(false);
                  }}
                >
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
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  welcome: { fontSize: 18, fontWeight: "bold" },
  subtitle: { color: "gray" },
  inputBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
  },
  btn: { marginVertical: 10 },
  counterRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 12,
  },
  count: { marginHorizontal: 20, fontSize: 18 },
  total: {
    fontSize: 18,
    textAlign: "center",
    color: "#2e7d32",
    marginVertical: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  routeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },

  routeOption: { padding: 12 },
});
