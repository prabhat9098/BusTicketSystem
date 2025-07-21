import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  FlatList,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import {
  Avatar,
  Button,
  Text,
  TextInput,
  useTheme,
  HelperText,
  Provider,
  Divider,
} from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../app/constants/baseURL';
import CustomSnackbar from '../../app/constants/CustomSnackbar';

export default function AddConductor() {
  const { colors } = useTheme();

  const [name, setName] = useState('');
  const [busname, setBusname] = useState('');
  const [busnumber, setBusnumber] = useState('');
  const [pathId, setPathId] = useState('');
  const [routename, setRoutename] = useState('');
  const [number, setNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmpassword, setConfirmpassword] = useState('');

  const [routes, setRoutes] = useState<{ name: string; id: string }[]>([]);
  const [routeModalVisible, setRouteModalVisible] = useState(false);

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');

  // Fetch route list from API
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await axios.get(`${BASE_URL}/api/path/all`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const mappedRoutes = res.data.map((route: any) => ({
          name: route.route_name,
          id: route._id,
        }));
        setRoutes(mappedRoutes);
      } catch (err) {
        console.error('Failed to load routes:', err);
        showSnackbar('Failed to load route list', 'error');
      }
    };

    fetchRoutes();
  }, []);

  const showSnackbar = (msg: string, type: 'success' | 'error' = 'success') => {
    setSnackbarMsg(msg);
    setSnackbarType(type);
    setSnackbarVisible(true);
    setTimeout(() => setSnackbarVisible(false), 2500);
  };

  const handleSubmit = async () => {
    if (!name || !busname || !busnumber || !routename || !number || !password || !confirmpassword) {
      showSnackbar('Please fill all required fields', 'error');
      return;
    }

    if (!/^[0-9]{10}$/.test(number)) {
      showSnackbar('Enter a valid 10-digit mobile number', 'error');
      return;
    }

    if (password !== confirmpassword) {
      showSnackbar('Passwords do not match', 'error');
      return;
    }

    const payload = {
      name,
      busname,
      busnumber,
      number,
      password,
      confirmpassword,
      path_id: pathId,
    };

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        showSnackbar('Authorization token not found.', 'error');
        return;
      }

      await axios.post(`${BASE_URL}/api/conductor/create`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      showSnackbar('Conductor added successfully!', 'success');
      setName('');
      setBusname('');
      setBusnumber('');
      setRoutename('');
      setNumber('');
      setPassword('');
      setConfirmpassword('');
      setPathId('');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error adding conductor. Try again.';
      showSnackbar(msg, 'error');
    }
  };

  return (
    <Provider>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.avatarContainer}>
              <Avatar.Text
                size={100}
                label={name ? name[0].toUpperCase() : '?'}
                style={styles.avatarFallback}
              />
            </View>

            <TextInput label="Conductor Name" value={name} mode="outlined" onChangeText={setName} style={styles.input} />
            <TextInput label="Bus Name" value={busname} mode="outlined" onChangeText={setBusname} style={styles.input} />
            <TextInput label="Bus Number" value={busnumber} mode="outlined" onChangeText={setBusnumber} style={styles.input} />

            {/* Assign Route Dropdown */}
            <TouchableOpacity onPress={() => setRouteModalVisible(true)}>
              <TextInput
                label="Assign Route"
                value={routename}
                mode="outlined"
                editable={false}
                style={styles.input}
                pointerEvents="none"
                right={<TextInput.Icon icon="chevron-down" onPress={() => setRouteModalVisible(true)} />}
              />
            </TouchableOpacity>

            {/* Route Modal */}
            <Modal
              visible={routeModalVisible}
              animationType="fade"
              transparent
              onRequestClose={() => setRouteModalVisible(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                  <Text style={styles.modalTitle}>Select a Route</Text>
                  <FlatList
                    data={routes}
                    keyExtractor={(item) => item.id}
                    ItemSeparatorComponent={() => <Divider />}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => {
                          setRoutename(item.name);
                          setPathId(item.id);
                          setRouteModalVisible(false);
                        }}
                        style={styles.routeOption}
                      >
                        <Text>{item.name}</Text>
                      </TouchableOpacity>
                    )}
                  />
                  <Button onPress={() => setRouteModalVisible(false)} style={{ marginTop: 10 }}>
                    Cancel
                  </Button>
                </View>
              </View>
            </Modal>

            <TextInput
              label="Mobile Number"
              value={number}
              mode="outlined"
              keyboardType="numeric"
              maxLength={10}
              onChangeText={setNumber}
              style={styles.input}
            />
            <HelperText type="error" visible={number.length > 0 && number.length !== 10}>
              Mobile number must be 10 digits.
            </HelperText>

            <TextInput label="Password" value={password} mode="outlined" onChangeText={setPassword} secureTextEntry style={styles.input} />
            <TextInput label="Confirm Password" value={confirmpassword} mode="outlined" onChangeText={setConfirmpassword} secureTextEntry style={styles.input} />

            <Button mode="contained" onPress={handleSubmit} style={{ marginTop: 20 }}>
              Submit
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>

        <CustomSnackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          message={snackbarMsg}
          type={snackbarType}
        />
      </SafeAreaView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    padding: 20,
    paddingBottom: 80,
    backgroundColor: '#fff',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarFallback: {
    backgroundColor: '#ccc',
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 8,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  routeOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
});
