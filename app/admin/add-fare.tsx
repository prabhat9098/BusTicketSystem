import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  IconButton,
  Avatar,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL } from '../../app/constants/baseURL';
import CustomSnackbar from '../../app/constants/CustomSnackbar';

type RouteItem = {
  _id: string;
  route_name: string;
  points: string[];
};

type FareItem = {
  id: string;
  amount: string;
};

export default function AddFare() {
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteItem | null>(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [fares, setFares] = useState<FareItem[]>([]);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');

  const showSnackbar = (msg: string, type: 'success' | 'error' = 'success') => {
    setSnackbarMsg(msg);
    setSnackbarType(type);
    setSnackbarVisible(true);
    setTimeout(() => setSnackbarVisible(false), 2500);
  };

  const fetchRoutes = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${BASE_URL}/api/path/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setRoutes(res.data || []);
    } catch (err) {
      showSnackbar('Failed to load routes', 'error');
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleRouteSelect = (route: RouteItem) => {
    setSelectedRoute(route);
    setDropdownVisible(false);
    const segmentCount = route.points.length - 1;
    const fareInputs = Array.from({ length: segmentCount }, (_, i) => ({
      id: `${i}`,
      amount: '',
    }));
    setFares(fareInputs);
  };

  const handleDelete = (id: string) => {
    const updated = fares.filter((fare) => fare.id !== id);
    setFares(updated);
  };

  const handleSave = async () => {
    if (!selectedRoute) {
      showSnackbar('Please select a route first', 'error');
      return;
    }

    const fareValues = fares.map((f) => f.amount.trim());
    if (fareValues.some((val) => val === '')) {
      showSnackbar('Please fill all fare values', 'error');
      return;
    }

    const numericFares = fareValues.map(Number);
    if (numericFares.some(isNaN)) {
      showSnackbar('All fares must be valid numbers', 'error');
      return;
    }

    const payload = {
      path_id: selectedRoute._id,
      fares: numericFares,
    };

    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(`${BASE_URL}/api/fare/create`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      showSnackbar('Fare submitted successfully!', 'success');
      setSelectedRoute(null);
      setFares([]);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to submit fare';
      showSnackbar(msg, 'error');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Route Dropdown */}
          <TouchableOpacity onPress={() => setDropdownVisible(!dropdownVisible)}>
            <TextInput
              label="Select Route"
              mode="outlined"
              editable={false}
              value={selectedRoute ? selectedRoute.route_name : ''}
              style={styles.input}
              right={<TextInput.Icon icon="chevron-down" onPress={() => setDropdownVisible(!dropdownVisible)} />}
            />
          </TouchableOpacity>

          {dropdownVisible && (
            <FlatList
              data={routes}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleRouteSelect(item)}
                  style={styles.dropdownItem}
                >
                  <Text>{item.route_name}</Text>
                </TouchableOpacity>
              )}
            />
          )}

          {selectedRoute && (
            <>
              <Text style={styles.info}>
                Route Points: {selectedRoute.points.length} | Segments to fill: {selectedRoute.points.length - 1}
              </Text>

              {fares.map((item, index) => (
                <View key={item.id} style={styles.fareItem}>
                  <Avatar.Text label={`${index + 1}`} size={36} style={{ marginRight: 12 }} />
                  <TextInput
                    placeholder="Fare (INR)"
                    mode="outlined"
                    keyboardType="numeric"
                    value={item.amount}
                    onChangeText={(text) => {
                      const updated = [...fares];
                      updated[index].amount = text;
                      setFares(updated);
                    }}
                    style={{ flex: 1, marginRight: 8 }}
                  />
                  <IconButton icon="delete" onPress={() => handleDelete(item.id)} />
                </View>
              ))}
            </>
          )}

          <Button mode="contained" onPress={handleSave} style={{ marginTop: 20 }}>
            Submit Fare
          </Button>
        </ScrollView>

        <CustomSnackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          message={snackbarMsg}
          type={snackbarType}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    paddingBottom: 100,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  info: {
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
    color: 'gray',
  },
  fareItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: '#f2f2f2',
  },
});
