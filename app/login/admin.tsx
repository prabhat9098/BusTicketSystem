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
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themeColors } from '../../app/theme/colors';
import { BASE_URL } from '../../app/constants/baseURL';
import CustomSnackbar from '../../app/constants/CustomSnackbar';

import IMG1 from '../../assets/images/IMG1.jpeg';
import IMG2 from '../../assets/images/IMG2.jpeg';
import DefaultLogo from '../../assets/images/d.png';

export default function AdminLoginScreen() {
  const router = useRouter();
  const { phone, name, logo, company } = useLocalSearchParams();
  const [password, setPassword] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');

  const showSnackbar = (msg: string, type: 'success' | 'error' = 'success') => {
    setSnackbarMsg(msg);
    setSnackbarType(type);
    setSnackbarVisible(true);
    setTimeout(() => setSnackbarVisible(false), 2500);
  };

  const handleLogin = async () => {
    if (!password) {
      showSnackbar('Please enter password', 'error');
      return;
    }

    try {
      const res = await axios.post(`${BASE_URL}/api/admin/login?number=${phone}`, { password });
      const { token, admin } = res.data;

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('admin', 'admin');
      await AsyncStorage.setItem('type', 'admin');
      await AsyncStorage.setItem('admin', JSON.stringify(admin));

      showSnackbar('Login Successful', 'success');

      setTimeout(() => {
        router.push({
          pathname: '/dashboard/admindashboard',
          params: {
            id: admin.id,
            name: admin.name,
            number: admin.number,
            company_name: company,
            logo: logo,
          },
        });
      }, 1000);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed';
      showSnackbar(msg, 'error');
    }
  };

  // Determine which image to show
  const getLogoImage = () => {
    const nameLower = (company || name || '').toString().toLowerCase();

    if (nameLower.includes('pratima')) return IMG1;
    if (nameLower.includes('trisojoyee')) return IMG2;
    return DefaultLogo;
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flexFull}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={styles.flexFull}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Company-specific Logo */}
            <Image source={getLogoImage()} style={styles.logo} />

            {/* Company Name */}
            {company && <Text style={styles.companyText}>{company}</Text>}

            {/* Admin Name */}
            {name && <Text style={styles.welcomeText}>Welcome, {name}</Text>}

            <TextInput
              label="Mobile Number"
              value={String(phone)}
              disabled
              mode="outlined"
            />
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              mode="outlined"
              style={styles.input}
            />
            <Button mode="contained" onPress={handleLogin} style={styles.button}>
              Login
            </Button>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <CustomSnackbar
        visible={snackbarVisible}
        message={snackbarMsg}
        type={snackbarType}
        onDismiss={() => setSnackbarVisible(false)}
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
    justifyContent: 'center',
    padding: 20,
    backgroundColor: themeColors.background,
  },
  logo: {
    width: 200,
    height: 100,
    borderRadius:10, // <- extra curve for IMG1
    alignSelf: 'center',
    marginBottom: 12,
  },
  companyText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#444',
  },
  welcomeText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#555',
  },
  input: {
    marginTop: 10,
    backgroundColor: themeColors.background,
  },
  button: {
    marginTop: 20,
  },
});
