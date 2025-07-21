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

export default function ConductorLoginScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams();
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
    const res = await axios.post(`${BASE_URL}/api/conductor/login?number=${phone}`, {
      password: password,
    });

    if (!res.data?.token || !res.data?.conductor) {
      throw new Error('Invalid response from server');
    }

    const { token, conductor } = res.data;

    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('conductor', JSON.stringify(conductor));

    showSnackbar('Login Successful', 'success');

    setTimeout(() => {
      router.push({
        pathname: '/dashboard/conductordashboard',
        params: {
          id: conductor.id,
          name: conductor.name,
          number: conductor.number,
          busname: conductor.busname,
          busnumber: conductor.busnumber,
          path_id: conductor.path,
          company_name: conductor.company_name,
          logo: conductor.logo,
        },
      });
    }, 1000);
  } catch (err: any) {
    const msg = err.response?.data?.message || 'Login failed';
    showSnackbar(msg, 'error');
  }
};


  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flexFull}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={styles.flexFull}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled">
            <Image
              source={require('../../assets/images/conductor.jpg')}
              style={styles.image}
            />
            <Text style={styles.title}>Conductor Portal</Text>

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
    justifyContent: 'center',
    padding: 20,
    backgroundColor: themeColors.background,
  },
  image: {
    width: '100%',
    height: 350,
    resizeMode: 'cover',
    alignSelf: 'center',
    borderRadius: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 20,
    textAlign: 'center',
    color: 'black',
  },
  input: {
    marginTop: 10,
    backgroundColor: themeColors.background,
  },
  button: {
    marginTop: 20,
  },
});
