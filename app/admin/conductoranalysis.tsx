// app/admin/conductoranalysis.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Modal,
  FlatList,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  Button,
  Card,
  Avatar,
  Divider,
  useTheme,
} from "react-native-paper";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../constants/baseURL";
import CustomSnackbar from "../constants/CustomSnackbar";

type Conductor = {
  _id: string;
  name: string;
};

type DailySummary = {
  date: string;
  totalIncome: number;
  totalTickets: number;
};



export default function ConductorAnalysisScreen() {
  const { colors } = useTheme();
  const [conductors, setConductors] = useState<Conductor[]>([]);
  const [selectedConductor, setSelectedConductor] = useState<Conductor | null>(null);
  const [dailySummary, setDailySummary] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarType, setSnackbarType] = useState<"success" | "error">("success");
  const [modalVisible, setModalVisible] = useState(false);
  const [month, setMonth] = useState<string>('');


  const showSnackbar = (msg: string, type: "success" | "error" = "success") => {
    setSnackbarMsg(msg);
    setSnackbarType(type);
    setSnackbarVisible(true);
    setTimeout(() => setSnackbarVisible(false), 2500);
  };

  useEffect(() => {
    fetchConductors();
  }, []);

  const fetchConductors = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await axios.get(`${BASE_URL}/api/conductor/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConductors(res.data.conductors || []);
    } catch {
      showSnackbar("Failed to load conductors", "error");
    }
  };

  const fetchReport = async (id: string) => {
  try {
    setLoading(true);
    const token = await AsyncStorage.getItem("token");
    const res = await axios.get(`${BASE_URL}/api/admin/conductor-ticket?conductor_id=${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setDailySummary(res.data.dailySummary || []);
    setMonth(res.data.month || '');
    showSnackbar("Report loaded", "success");
  } catch {
    showSnackbar("Failed to fetch report", "error");
  } finally {
    setLoading(false);
  }
};


  const handleConductorSelect = (conductor: Conductor) => {
    setSelectedConductor(conductor);
    setModalVisible(false);
    fetchReport(conductor._id);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      

      {/* Custom Dropdown Modal Trigger */}
      <Button
        mode="outlined"
        style={styles.dropdownBtn}
        onPress={() => setModalVisible(true)}
      >
        {selectedConductor?.name || "Select Conductor"}
      </Button>

      {selectedConductor && month !== '' && (
  <Text style={styles.monthLabel}>
    Report for Month: <Text style={{ fontWeight: 'bold' }}>{month}</Text>
  </Text>
)}


      

      {/* Modal Dropdown */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Conductor</Text>
            <FlatList
              data={conductors}
              keyExtractor={(item) => item._id}
              ItemSeparatorComponent={() => <Divider />}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => handleConductorSelect(item)}
                >
                  <Text>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
            <Button onPress={() => setModalVisible(false)} style={{ marginTop: 10 }}>
              Cancel
            </Button>
          </View>
        </View>
      </Modal>

      {/* Summary */}
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 30 }} />
      ) : (
        <View style={styles.summaryContainer}>
          {dailySummary.length === 0 && selectedConductor ? (
            <Text style={styles.noData}>No report found for {selectedConductor.name}</Text>
          ) : (
            dailySummary.map((entry, idx) => (
              <Card key={idx} style={styles.card}>
                <Card.Title
                  title={entry.date}
                  subtitle={`Tickets: ${entry.totalTickets}`}
                  left={() => (
                    <Avatar.Icon
                      icon="calendar"
                      size={40}
                      style={{ backgroundColor: "#e3f2fd" }}
                      color={colors.primary}
                    />
                  )}
                />
                <Card.Content>
                  <Text style={styles.income}>Income: ₹{entry.totalIncome}</Text>
                </Card.Content>
              </Card>
            ))
          )}
        </View>
      )}

      <CustomSnackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        message={snackbarMsg}
        type={snackbarType}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingTop: Platform.OS === "android" ? 50 : 20,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  dropdownBtn: {
    marginBottom: 20,
    alignSelf: "center",
    width: "100%",
  },
  summaryContainer: {
    marginTop: 10,
  },
  noData: {
    textAlign: "center",
    color: "#888",
    fontSize: 16,
    marginTop: 30,
  },
  card: {
    marginBottom: 12,
    borderRadius: 10,
  },
  income: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 6,
    color: "#2e7d32",
  },
  monthLabel: {
  fontSize: 16,
  textAlign: 'center',
  color: '#333',
  marginBottom: 10,
  marginTop: -10,
},

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },
  modalContainer: {
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
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
});
