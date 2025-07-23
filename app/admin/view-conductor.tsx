// ViewConductor.tsx
import React, { useEffect, useState } from 'react';
import {
  View, FlatList, StyleSheet, SafeAreaView, ActivityIndicator, Alert,TouchableOpacity , Modal, TextInput, ScrollView
} from 'react-native';
import {
  Text, Card, Avatar, Button, IconButton, useTheme
} from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../app/constants/baseURL';
import CustomSnackbar from '../../app/constants/CustomSnackbar';
import { Ionicons } from '@expo/vector-icons';

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
  const [showPassword, setShowPassword] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentConductor, setCurrentConductor] = useState<Conductor | null>(null);

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
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.conductors) setConductors(res.data.conductors);
      else showSnackbar('No conductors found', 'error');
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

  const handleDelete = async (id: string) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this conductor?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            await axios.delete(`${BASE_URL}/api/conductor/delete?id=${id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            showSnackbar("Conductor deleted", "success");
            fetchConductors();
          } catch (err: any) {
            showSnackbar("Delete failed", "error");
          }
        }
      }
    ]);
  };

  const handleEditSubmit = async () => {
    if (!currentConductor) return;
    console.log("Updating conductor ID:", currentConductor?._id);
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.patch(`${BASE_URL}/api/conductor/update?id=${currentConductor._id}`, currentConductor, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showSnackbar("Updated successfully", "success");
      setEditModalVisible(false);
      fetchConductors();
    } catch (err) {
  console.error("Update error:", err?.response?.data || err.message);
  showSnackbar("Update failed", "error");
}

  };

  const renderItem = ({ item }: { item: Conductor }) => (
    <Card style={styles.card} elevation={3}>
      <Card.Title
        title={item.name}
        subtitle={`Route: ${item.path?.route_name || 'N/A'}`}
        left={() => <Avatar.Text label={item.name[0]} size={40} />}
        right={() => (
          <View style={{ flexDirection: 'row' }}>
            <IconButton icon="pencil" onPress={() => { setCurrentConductor(item); setEditModalVisible(true); }} />
            <IconButton icon="delete" onPress={() => handleDelete(item._id)} />
          </View>
        )}
      />
      <Card.Content>
        <Text style={styles.field}><Text style={styles.label}>Bus Name:</Text> {item.busname}</Text>
        <Text style={styles.field}><Text style={styles.label}>Bus Number:</Text> {item.busnumber}</Text>
        <Text style={styles.field}><Text style={styles.label}>Mobile:</Text> {item.number}</Text>
        <Text style={styles.field}><Text style={styles.label}>Password:</Text> {item.password}</Text>
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

      {/* ✅ Edit Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
  <View style={styles.modalOverlay}>
    <View style={styles.modalBox}>
      <ScrollView>
        <Text style={styles.modalTitle}>Edit Conductor</Text>

        <TextInput
          placeholder="Name"
          style={styles.input}
          value={currentConductor?.name}
          onChangeText={(text) =>
            setCurrentConductor({ ...currentConductor!, name: text })
          }
        />
        <TextInput
          placeholder="Bus Name"
          style={styles.input}
          value={currentConductor?.busname}
          onChangeText={(text) =>
            setCurrentConductor({ ...currentConductor!, busname: text })
          }
        />
        <TextInput
          placeholder="Bus Number"
          style={styles.input}
          value={currentConductor?.busnumber}
          onChangeText={(text) =>
            setCurrentConductor({ ...currentConductor!, busnumber: text })
          }
        />

        {/* Password field with toggle */}
        <View style={{ position: 'relative' }}>
          <TextInput
            placeholder="Password"
            style={styles.input}
            secureTextEntry={!showPassword}
            value={currentConductor?.password}
            onChangeText={(text) =>
              setCurrentConductor({ ...currentConductor!, password: text })
            }
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: 12,
              top: 18,
              zIndex: 1,
            }}
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color="#555"
            />
          </TouchableOpacity>
        </View>

        {/* Buttons with full text visible */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 16,
          }}
        >
          <Button
            style={{ flex: 1, marginRight: 8 }}
            mode="outlined"
            onPress={() => setEditModalVisible(false)}
          >
            Cancel
          </Button>
          <Button
            style={{ flex: 1, marginLeft: 8 }}
            mode="contained"
            onPress={handleEditSubmit}
          >
            Update
          </Button>
        </View>
      </ScrollView>
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
  card: { marginBottom: 12, borderRadius: 10 },
  label: { fontWeight: '600', color: '#555' },
  field: { fontSize: 14, marginVertical: 2 },

  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalBox: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
});
