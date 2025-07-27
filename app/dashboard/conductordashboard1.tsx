// ConductorDashboardScreen.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { router } from "expo-router";
import moment from "moment";
import React, { useEffect, useState } from "react";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
//@ts-ignore
import { BluetoothEscposPrinter as ThermalPrinter } from 'react-native-bluetooth-escpos-printer';

import {
  Alert,
  BackHandler,
  FlatList,
  Modal,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { Appbar, Avatar, Button, Divider, TextInput } from "react-native-paper";
import { getStatusBarHeight } from "react-native-status-bar-height";
import {
  connectToPrinter,
  printTextToPrinter,
  requestBluetoothPermissions,
  scanDevices,
  getBase64FromImage
} from "../../bluetoothPrinterHelper";
import { BASE_URL } from "../constants/baseURL";
import { SafeAreaView } from "react-native-safe-area-context";
//@ts-ignore
import IMG1 from "../../assets/images/IMG1.jpeg";
//@ts-ignore
import IMG2 from "../../assets/images/IMG2.jpeg";

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
  const [baseFare, setBaseFare] = useState(0); // fare * passengers
  const [gstFare, setGstFare] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(
    moment().format("YYYY-MM-DD HH:mm:ss")
  );
  const [logoUrl, setLogoUrl] = useState("");
  const [fromModalVisible, setFromModalVisible] = useState(false);
  const [toModalVisible, setToModalVisible] = useState(false);

  const [btModalVisible, setBtModalVisible] = useState(false);
  const [btDevices, setBtDevices] = useState<any[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<any>(null);
  const [btLoading, setBtLoading] = useState(false);
  const [discount, setDiscount] = useState("");
  const [number, setNumber] = useState("");
  const [luggage, setLuggage] = useState("");
  const [gst, setGst] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(moment().format("YYYY-MM-DD HH:mm:ss"));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (fare !== null && fare > 0) {
      calculateLiveFare();
    }
  }, [passengerCount, discount, luggage, fare]);

  const calculateLiveFare = () => {
    if (fare === null) return;
    const totalBaseFare = (fare ?? 0) * passengerCount;

    let discountedFare = parseFloat(discount);
    let luggageFare = parseFloat(luggage) || 0;

    if (!isNaN(discountedFare) && discountedFare > totalBaseFare) {
      discountedFare = totalBaseFare;
    }

    const finalFare = !isNaN(discountedFare) ? discountedFare : totalBaseFare;

    const calculatedGst = finalFare * 0.05;
    const totalWithGst = finalFare + calculatedGst + luggageFare;

    setBaseFare(finalFare);
    setGst(calculatedGst);
    setTotal(totalWithGst);
  };

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
    const initBluetooth = async () => {
      try {
        const granted = await requestBluetoothPermissions();
        if (!granted)
          return Alert.alert("Permission Denied", "Bluetooth access required.");

        const storedPrinter = await AsyncStorage.getItem("selectedPrinter");
        if (storedPrinter) setSelectedPrinter(JSON.parse(storedPrinter));

        const devices = await scanDevices();
        setBtDevices(devices);
      } catch (err: any) {
        Alert.alert(
          "Bluetooth Init Error",
          err.message || "Failed to initialize Bluetooth"
        );
      }
    };

    initBluetooth();
  }, []);

  const reloadBluetoothDevices = async () => {
    try {
      setBtLoading(true);
      const granted = await requestBluetoothPermissions();
      if (!granted) throw new Error("Bluetooth permission denied");

      const devices = await scanDevices();
      setBtDevices(devices);
      ToastAndroid.show("Device list reloaded", ToastAndroid.SHORT);
    } catch (err: any) {
      Alert.alert("Scan Error", err.message || "Failed to scan devices");
    } finally {
      setBtLoading(false);
    }
  };

  const handlePrinterSelect = async (printer: any) => {
    setSelectedPrinter(printer);
    await AsyncStorage.setItem("selectedPrinter", JSON.stringify(printer));
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const company = await AsyncStorage.getItem("company_name");
        const condStr = await AsyncStorage.getItem("conductor");

        if (!condStr || !token)
          return Alert.alert("Error", "Missing token or conductor");

        const cond = JSON.parse(condStr);
        setCompanyName(company || "");
        setConductor(cond);
        if (cond.logo) setLogoUrl(cond.logo);

        const res = await axios.get(
          `${BASE_URL}/api/path/points-by-route?path_id=${cond.path_id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("cond:", cond.id);
        console.log("path_id1:", cond.path_id);
        console.log("✅ API Response (points):", res.data);

        setPoints(res.data.points || []);
      } catch (err: any) {
        console.error("❌ Error loading data:", err.message || err);
        Alert.alert("Error", "Failed to load dashboard data.");
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
    if (!from || !to) {
      Alert.alert("Error", "Please select From and To points");
      return;
    }

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
      console.log({
        path_id: conductor.path_id,
        from,
        to,
        journey: reverse ? "down" : "up",
      });

      const base = res.data.total_fare;
      const totalBaseFare = base * passengerCount;

      let discountedFare = parseFloat(discount);
      let luggageFare = parseFloat(luggage) || 0;

      // Validate discount
      if (!isNaN(discountedFare) && discountedFare > totalBaseFare) {
        Alert.alert(
          "Invalid Discount",
          "Discounted fare cannot exceed base fare"
        );
        return;
      }

      const finalFare = !isNaN(discountedFare) ? discountedFare : totalBaseFare;

      const calculatedGst = finalFare * 0.05; // 5% GST
      const totalWithGst = finalFare + calculatedGst + luggageFare;

      setFare(base);
      setBaseFare(finalFare);
      setGst(calculatedGst);
      setTotal(totalWithGst);
    } catch (err) {
      console.error(err);
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
  if (!fare || !total) return Alert.alert("Error", "Calculate fare first");

  const printerToUse = selectedPrinter;
  if (!printerToUse) {
    return Alert.alert("No Printer Selected", "Please select a printer first.");
  }

  try {
    const granted = await requestBluetoothPermissions();
    if (!granted) throw new Error("Bluetooth permission denied");

    await connectToPrinter(printerToUse.address);

    const ticketNumber = `TID-${Math.floor(100000 + Math.random() * 900000)}`;
    const gstAmount = fare * 0.05;
    const cgst = (fare * 0.025).toFixed(2);
    const igst = (fare * 0.025).toFixed(2);
    const luggageValue = parseFloat(luggage || "0");
    const discountValue = parseFloat(discount || "0");

    // Set GST and Logo Based on Company
    let gstNumber = "";
    // let logoImagePath = null;

    if (companyName === "Trisojoyee") {
      gstNumber = "19ANUPC9666P1ZQ";
      // logoImagePath = IMG2;
    } else if (companyName === "Pratima") {
      gstNumber = "19BSDPD3896H1Z";
      // logoImagePath = IMG1;
    }

    // Convert image to base64 and print logo (DISABLED)
    /*
    const logoBase64 = await getBase64FromImage(logoImagePath);
    await ThermalPrinter.printImageBase64(logoBase64, {
      width: 250,
      align: "center",
    });
    */

    const ticketText = `
      ${companyName} Bus Service
      GSTIN: ${gstNumber}
      -----------------------------
      Ticket #: ${ticketNumber}
      Bus No: ${conductor?.busnumber}
      From: ${from}
      To: ${to}
      Passengers: ${passengerCount}
      Mobile: ${number}
      Fare: Rs.${fare}
      CGST (2.5%): Rs.${cgst}
      IGST (2.5%): Rs.${igst}
      ${luggageValue > 0 ? `Luggage: Rs.${luggageValue.toFixed(2)}\n` : ""}
      ${discountValue > 0 ? `Discount: Rs.${discountValue.toFixed(2)}\n` : ""}
      Total: Rs.${total.toFixed(2)}
      Time: ${currentTime}
      -----------------------------
      Thank You & Happy Journey!
    `;

    // Fire API in background
    (async () => {
      try {
        const token = await AsyncStorage.getItem("token");

        const response = await axios.post(
          `${BASE_URL}/api/pdf/generate-ticket`,
          {
              company_name: companyName,
              bus_no: conductor?.busnumber || "",
              ticket_no: ticketNumber,
              from,
              to,
              mobile: number,
              discount: parseFloat(discount || "0"),
              luggage: parseFloat(luggage || "0"),
              fare: fare,
              count: passengerCount,
              total: total.toFixed(2),
              conductor_id: conductor?.id || "", // adjust key if different
            },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("API Ticket Response:", response.data);
      } catch (err) {
        console.error("API Ticket Error:", err.message || err);
      }
    })();
    

    await ThermalPrinter.printText(ticketText, {
      fontSize: 20,
      alignment: "left",
    });

    

    await ThermalPrinter.printNewLine();

    // Reset form fields but preserve reverse toggle
    if (typeof resetForm === "function") {
    resetForm();
  } else {
    console.warn("resetForm is not defined correctly");
  }
  } catch (error) {
    console.error(error);
    Alert.alert("Print Error", error.message || "Unknown error occurred.");
  }
};


  const loadBluetoothDevices = async () => {
    try {
      setBtLoading(true);
      const granted = await requestBluetoothPermissions();
      if (!granted) throw new Error("Bluetooth permission denied");

      const devices = await scanDevices();
      setBtDevices(devices);
    } catch (err: any) {
      Alert.alert("Bluetooth Error", err.message || "Failed to scan devices");
    } finally {
      setBtLoading(false);
    }
  };

 const resetForm = () => {
  console.log("Resetting form...");
  setFrom("");
  setTo("");
  setFilteredToPoints([]);
  setPassengerCount(1);
  setFare(null);
  setBaseFare(0);
  setGstFare(null);
  setNumber("");
  setLuggage("");
  setDiscount("");
  setGst(0);
  setTotal(0);
  // Keep reverse as is, do not reset
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
      <SafeAreaView style={styles.safeArea}>
        <Appbar.Header
          style={{
            paddingTop: statusBarHeight,
            backgroundColor: "white",
            elevation: 4, // adds shadow on Android
            shadowColor: "#000", // for iOS shadow
            alignItems: "center",
            top: -20,
          }}
        >
          <Appbar.Action
            icon="power"
            size={36}
            onPress={() => confirmLogout()}
          />

          <Appbar.Content
            title={`${companyName} Bus Service`}
            titleStyle={{
              textAlign: "center",
              fontSize: 18,
              fontWeight: "bold",
            }}
            style={{ alignItems: "center" }} // ensures title is centered
          />

          <Appbar.Action icon="account-circle" size={36} />
        </Appbar.Header>
      </SafeAreaView>

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
          mode="contained"
          style={[
            styles.btn,
            { backgroundColor: reverse ? "#199387ff" : "#1976d2" },
          ]}
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

        {/* Discount */}
        <TextInput
          style={styles.input}
          mode="outlined"
          label="Mobile Number"
          keyboardType="numeric"
          value={number}
          onChangeText={setNumber}
        />

        <View style={{ flexDirection: "row", gap: 8 }}>
          {/* Discount */}
          <TextInput
            style={{ flex: 1 }}
            mode="outlined"
            label="Discount (optional)"
            keyboardType="numeric"
            value={discount}
            onChangeText={setDiscount}
          />

          {/* Luggage */}
          <TextInput
            style={{ flex: 1 }}
            mode="outlined"
            label="Luggage Amount (optional)"
            keyboardType="numeric"
            value={luggage}
            onChangeText={setLuggage}
          />
        </View>

        <Button mode="contained" style={styles.btn} onPress={calculateFare}>
          Calculate Fare
        </Button>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginVertical: 8,
          }}
        >
          <Text style={styles.breakdown}>
            Base Fare: ₹ {baseFare.toFixed(2)}
          </Text>
          <Text style={styles.breakdown}>GST (5%): ₹ {gst.toFixed(2)}</Text>
          <Text style={styles.breakdown}>
            Luggage: ₹ {parseFloat(luggage || 0).toFixed(2)}
          </Text>
        </View>

        <Text style={styles.total}>Total Fare: ₹ {total.toFixed(2)}</Text>

        <Button
          icon="bluetooth"
          mode="outlined"
          onPress={() => setBtModalVisible(true)}
          style={styles.btn}
        >
          Select Bluetooth Printer
        </Button>

        {selectedPrinter?.name && (
          <Text
            style={{ textAlign: "center", color: "#2e7d32", marginBottom: 10 }}
          >
            Selected Printer: {selectedPrinter.name}
          </Text>
        )}

        <Button
          mode="contained"
          style={styles.btn}
          onPress={handlePrint}
          icon={({ size, color }) => (
            <Icon name="printer" size={30} color={color} /> // Change size here
          )}
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

      {/* Bluetooth Device Modal */}
      <Modal
        visible={btModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBtModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Bluetooth Printer</Text>
              <TouchableOpacity onPress={reloadBluetoothDevices}>
                <Ionicons name="refresh" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {btLoading ? (
              <Text>Scanning devices...</Text>
            ) : (
              <FlatList
                data={btDevices}
                keyExtractor={(item, i) => `${item.address}_${i}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={{
                      padding: 12,
                      backgroundColor:
                        selectedPrinter?.address === item.address
                          ? "#e0f7fa"
                          : "#fff",
                    }}
                    onPress={() => handlePrinterSelect(item)}
                  >
                    <Text>{item.name || "Unnamed Device"}</Text>
                    <Text style={{ fontSize: 12, color: "#555" }}>
                      {item.address}
                    </Text>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <Divider />}
              />
            )}
            <Button onPress={() => setBtModalVisible(false)}>Done</Button>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16, bottom: 15 },
  headerText: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
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
    marginBottom: 5,
  },
  btn: { marginVertical: 8 },
  counterRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
  },
  count: { marginHorizontal: 20, fontSize: 18 },
  total: {
    fontSize: 18,
    textAlign: "center",
    color: "#2e7d32",
    marginVertical: 10,
  },
  fareBox: {
    backgroundColor: "#f0f4ff",
    padding: 12,
    marginVertical: 10,
    borderRadius: 8,
  },
  label: {
    fontSize: 16,
    marginBottom: 4,
  },
  labelBold: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
  },
  input: {
    marginBottom: 10,
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
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  routeOption: { padding: 12 },
});
