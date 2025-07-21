import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  SafeAreaView,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Text,
  Card,
  useTheme,
  Avatar,
  ActivityIndicator,
} from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../app/constants/baseURL';
import CustomSnackbar from '../../app/constants/CustomSnackbar';

type RouteItem = {
  _id: string;
  route_name: string;
  points: string[];
};

export default function ViewRoutes() {
  const { colors } = useTheme();
  const [routes, setRoutes] = useState<RouteItem[]>([]);
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

  const fetchRoutes = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${BASE_URL}/api/path/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (Array.isArray(res.data)) {
        setRoutes(res.data);
      } else {
        showSnackbar('Unexpected response from server', 'error');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to fetch routes';
      showSnackbar(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const renderItem = ({ item }: { item: RouteItem }) => (
    <Card style={styles.card} elevation={3}>
      <Card.Title
        title={item.route_name}
        subtitle={`Total Points: ${item.points.length}`}
        left={() => <Avatar.Text label={item.route_name[0]} size={40} />}
      />
      <Card.Content>
        <Text style={styles.label}>Points:</Text>
        <View style={styles.pointList}>
          {item.points.map((point, index) => (
            <Text key={index} style={styles.pointText}>
              • {point}
            </Text>
          ))}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>All Bus Routes</Text>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={routes}
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
    marginBottom: 14,
    borderRadius: 10,
  },
  label: {
    fontWeight: '600',
    marginBottom: 4,
  },
  pointList: {
    paddingLeft: 10,
    paddingTop: 4,
  },
  pointText: {
    fontSize: 14,
    color: '#444',
    marginVertical: 2,
  },
});
