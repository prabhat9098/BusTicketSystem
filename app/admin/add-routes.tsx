import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Text,
  TouchableOpacity,
} from 'react-native';
import {
  TextInput,
  Button,
  IconButton,
  Avatar,
} from 'react-native-paper';
import DraggableFlatList from 'react-native-draggable-flatlist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL } from '../../app/constants/baseURL';
import CustomSnackbar from '../../app/constants/CustomSnackbar';

type PointItem = {
  id: string;
  label: string;
};

export default function AddRoutes() {
  const [routeName, setRouteName] = useState('');
  const [points, setPoints] = useState<PointItem[]>([]);
  const [newPoint, setNewPoint] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');

  const showSnackbar = (msg: string, type: 'success' | 'error' = 'success') => {
    setSnackbarMsg(msg);
    setSnackbarType(type);
    setSnackbarVisible(true);
    setTimeout(() => setSnackbarVisible(false), 2500);
  };

  const generateId = () =>
    `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

  const addPoint = () => {
    if (!newPoint.trim()) {
      showSnackbar('Point name cannot be empty', 'error');
      return;
    }
    const newItem: PointItem = {
      id: generateId(),
      label: newPoint.trim(),
    };
    setPoints([...points, newItem]);
    setNewPoint('');
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Point', 'Are you sure you want to delete this point?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updated = points.filter((point) => point.id !== id);
          setPoints(updated);
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (!routeName || points.length < 2) {
      showSnackbar('Route name and at least 2 points are required', 'error');
      return;
    }

    const payload = {
      route_name: routeName,
      points: points.map((p) => p.label),
    };

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        showSnackbar('Authorization token not found', 'error');
        return;
      }

      await axios.post(`${BASE_URL}/api/path/create`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      showSnackbar('Route saved successfully!', 'success');
      setRouteName('');
      setPoints([]);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to save route';
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
       

        <TextInput
          label="Route Name"
          value={routeName}
          mode="outlined"
          onChangeText={setRouteName}
          style={styles.input}
        />

        <View style={styles.newPointRow}>
          <TextInput
            label="New Point"
            value={newPoint}
            onChangeText={setNewPoint}
            style={[styles.input, { flex: 1 }]}
            mode="outlined"
          />
          <IconButton icon="plus" size={28} onPress={addPoint} />
        </View>

        <DraggableFlatList
          data={points}
          keyExtractor={(item) => item.id}
          onDragEnd={({ data }) => setPoints(data)}
          renderItem={({ item, index, drag, isActive }) => (
            <TouchableOpacity
              onLongPress={drag}
              disabled={isActive}
              style={[
                styles.pointItem,
                { backgroundColor: isActive ? '#e0e0e0' : '#f2f2f2' },
              ]}
            >
              <Avatar.Text
                label={`${index + 1}`}
                size={36}
                style={{ marginRight: 12 }}
              />
              <Text style={{ flex: 1 }}>{item.label}</Text>
              <IconButton icon="delete" onPress={() => handleDelete(item.id)} />
              <IconButton icon="drag" />
            </TouchableOpacity>
          )}
        />

        <Button mode="contained" onPress={handleSave} style={{ marginTop: 20 }}>
          Save Route
        </Button>

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
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  newPointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
});
