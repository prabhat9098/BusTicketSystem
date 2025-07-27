import {
  View,
  Image,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { TextInput, Button, useTheme } from "react-native-paper";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import axios from "axios";
import { routes } from "./_layout";
import { themeColors } from "../app/theme/colors";
import { BASE_URL } from "../app/constants/baseURL";
import CustomSnackbar from "../app/constants/CustomSnackbar"; // ✅ import your reusable Snackbar
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function WelcomeScreen() {
  const [phone, setPhone] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarType, setSnackbarType] = useState<"success" | "error">(
    "success"
  );
  const router = useRouter();
  const { colors } = useTheme();

  const showSnackbar = (message: string, type: "success" | "error") => {
    setSnackbarMsg(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const userType = await AsyncStorage.getItem("type"); // should be 'admin' or 'conductor'
        console.log(token,userType);
        if (userType === "admin") {
          router.replace(routes.adminDashboard);
        } else if (userType === "conductor") {
          router.replace(routes.conductorDashboard);
        }
      } catch (err) {
        console.log("Login check failed", err);
      }
    };

    checkLoginStatus();
  }, []);

  const handleContinue = async () => {
    if (!phone || phone.length !== 10 || !/^[0-9]{10}$/.test(phone)) {
      showSnackbar("Please enter a valid 10-digit mobile number.", "error");
      return;
    }

    try {
      const res = await axios.get(
        `${BASE_URL}/api/auth/check-number?number=${phone}`
      );
      const { type, message, data } = res.data;

      const welcomeText =
        type === "admin"
          ? "Welcome to Admin Login"
          : type === "conductor"
          ? "Welcome to Conductor Login"
          : "Unknown user type.";

      showSnackbar(welcomeText, "success");

      if (type === "admin") {
        router.push({
          pathname: "/login/admin",
          params: {
            phone,
            name: data.name,
            logo: data.logo,
            company: data.company_name,
          },
        });
      } else if (type === "conductor") {
        router.push(`/login/conductor?phone=${phone}`);
      }
    } catch (error: any) {
      Alert.alert("API failed:", error?.message);
      showSnackbar("Failed to verify number.", "error");
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flexFull}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={styles.flexFull}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Image
              source={require("../assets/images/welcome.jpg")}
              style={styles.image}
            />
            <Text style={styles.title}>Welcome to Bus Management</Text>
            <Text style={styles.subtitle}>
              Manage your fleet with ease and control
            </Text>

            <TextInput
              label="Enter Mobile Number"
              value={phone}
              onChangeText={setPhone}
              mode="outlined"
              keyboardType="numeric"
              maxLength={10}
              style={styles.input}
            />

            <Button
              mode="contained"
              onPress={handleContinue}
              style={styles.button}
            >
              Continue
            </Button>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* ✅ Use shared Custom Snackbar */}
      <CustomSnackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        message={snackbarMsg}
        type={snackbarType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  flexFull: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: themeColors.background,
  },
  image: {
    width: "100%",
    height: 350,
    top: 50,
    resizeMode: "contain",
    alignSelf: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 20,
    color: "lightgray",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "gray",
    marginBottom: 10,
    textAlign: "center",
  },
  input: {
    backgroundColor: themeColors.background,
  },
  button: {
    marginTop: 30,
  },
});
