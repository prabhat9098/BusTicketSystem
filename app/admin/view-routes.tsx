import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  Text,
  Card,
  useTheme,
  Avatar,
  ActivityIndicator,
  Button,
  Divider,
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
  const [modalVisible, setModalVisible] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<RouteItem | null>(null);
  const [editedName, setEditedName] = useState('');
  const [editedPoints, setEditedPoints] = useState<string>('');
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
    } catch (err: any) {
      showSnackbar(err.response?.data?.message || 'Failed to fetch routes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleDelete = async (id: string) => {
    Alert.alert('Delete', 'Are you sure you want to delete this route?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            await axios.delete(`${BASE_URL}/api/path/delete?id=${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            setRoutes((prev) => prev.filter((r) => r._id !== id));
            showSnackbar('Route deleted', 'success');
          } catch (err: any) {
            showSnackbar('Delete failed', 'error');
          }
        },
      },
    ]);
  };

  const openEditModal = (route: RouteItem) => {
    setCurrentRoute(route);
    setEditedName(route.route_name);
    setEditedPoints(route.points.join(', '));
    setModalVisible(true);
  };

  const handleUpdate = async () => {
    if (!editedName || !editedPoints) {
      showSnackbar('Route name and points are required', 'error');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const updatedPoints = editedPoints.split(',').map((p) => p.trim());

      await axios.patch(`${BASE_URL}/api/path/update?id=${currentRoute?._id}`, {
        route_name: editedName,
        points: updatedPoints,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showSnackbar('Route updated', 'success');
      setModalVisible(false);
      fetchRoutes(); // reload updated list
    } catch (err: any) {
      showSnackbar(err.response?.data?.message || 'Update failed', 'error');
    }
  };

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
      <Card.Actions style={{ justifyContent: 'space-between' }}>
        <Button onPress={() => openEditModal(item)}>Edit</Button>
        <Button onPress={() => handleDelete(item._id)} textColor="red">Delete</Button>
      </Card.Actions>
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

      {/* Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Edit Route</Text>
            <TextInput
              placeholder="Route Name"
              value={editedName}
              onChangeText={setEditedName}
              style={styles.input}
            />
            <TextInput
              placeholder="Points (comma separated)"
              value={editedPoints}
              onChangeText={setEditedPoints}
              style={styles.input}
              multiline
            />
            <View style={styles.modalButtons}>
              <Button onPress={() => setModalVisible(false)}>Cancel</Button>
              <Button onPress={handleUpdate}>Update</Button>
            </View>
          </View>
        </View>
      </Modal>

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
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  card: { marginBottom: 14, borderRadius: 10 },
  label: { fontWeight: '600', marginBottom: 4 },
  pointList: { paddingLeft: 10, paddingTop: 4 },
  pointText: { fontSize: 14, color: '#444', marginVertical: 2 },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
});
