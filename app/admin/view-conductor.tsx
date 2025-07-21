import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import {
  Text,
  Card,
  Avatar,
  useTheme,
} from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../app/constants/baseURL';
import CustomSnackbar from '../../app/constants/CustomSnackbar';

type Conductor = {
  _id: string;
  name: string;
  busname: string;
  busnumber: string;
  number: string;
  password: string;
  path: {
    route_name: string;
  };
};

export default function ViewConductor() {
  const { colors } = useTheme();
  const [conductors, setConductors] = useState<Conductor[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');

  const showSnackbar = (msg: string, type: 'success' | 'error' = 'success') => {
    setSnackbarMsg(msg);
    setSnackbarType(type);
    setSnackbarVisible(true);
    setTimeout(() => setSnackbarVisible(false), 2500);
  };

  const fetchConductors = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${BASE_URL}/api/conductor/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data?.conductors) {
        setConductors(res.data.conductors);
      } else {
        showSnackbar('No conductors found', 'error');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to fetch conductors';
      showSnackbar(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConductors();
  }, []);

  const renderItem = ({ item }: { item: Conductor }) => (
    <Card style={styles.card} elevation={3}>
      <Card.Title
        title={item.name}
        subtitle={`Route: ${item.path?.route_name || 'N/A'}`}
        left={() => <Avatar.Text label={item.name[0]} size={40} />}
      />
      <Card.Content>
        <Text style={styles.field}>
          <Text style={styles.label}>Bus Name:</Text> {item.busname}
        </Text>
        <Text style={styles.field}>
          <Text style={styles.label}>Bus Number:</Text> {item.busnumber}
        </Text>
        <Text style={styles.field}>
          <Text style={styles.label}>Mobile:</Text> {item.number}
        </Text>
        <Text style={styles.field}>
          <Text style={styles.label}>Password:</Text> {item.password}
        </Text>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Conductors List</Text>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={conductors}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      <CustomSnackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        message={snackbarMsg}
        type={snackbarType}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  card: {
    marginBottom: 12,
    borderRadius: 10,
  },
  label: {
    fontWeight: '600',
    color: '#555',
  },
  field: {
    fontSize: 14,
    marginVertical: 2,
  },
});
