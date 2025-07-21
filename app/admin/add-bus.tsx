import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Snackbar,
  useTheme,
  HelperText,
  Provider,
} from 'react-native-paper';
import axios from 'axios';

export default function AddBus() {
  const { colors } = useTheme();

  const [busName, setBusName] = useState('');
  const [busNumber, setBusNumber] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');

  const handleSubmit = async () => {
    if (!busName || !busNumber) {
      setSnackbarMsg('Please fill all required fields');
      setSnackbarVisible(true);
      return;
    }

    const payload = {
      busname: busName,
      busnumber: busNumber,
    };

    try {
      // Replace this with your actual backend endpoint
      await axios.post('https://your-api-url.com/api/add-bus', payload);
      setSnackbarMsg('Bus added successfully!');
      setSnackbarVisible(true);
      setBusName('');
      setBusNumber('');
    } catch (error) {
      console.error(error);
      setSnackbarMsg('Error adding bus. Try again.');
      setSnackbarVisible(true);
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
           

            <TextInput
              label="Bus Name"
              value={busName}
              mode="outlined"
              onChangeText={setBusName}
              style={styles.input}
            />

            <TextInput
              label="Bus Number"
              value={busNumber}
              mode="outlined"
              onChangeText={setBusNumber}
              style={styles.input}
              placeholder="e.g. WB-12A-1234"
            />
            <HelperText type="error" visible={!!busNumber && busNumber.length < 6}>
              Bus number seems too short.
            </HelperText>

            <Button
              mode="contained"
              onPress={handleSubmit}
              style={{ marginTop: 20 }}
            >
              Submit
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={2500}
        >
          {snackbarMsg}
        </Snackbar>
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
});
