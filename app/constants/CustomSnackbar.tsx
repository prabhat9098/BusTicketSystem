// components/CustomSnackbar.tsx
import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { Snackbar, Text } from 'react-native-paper';

const { width } = Dimensions.get('window');

type Props = {
  visible: boolean;
  onDismiss: () => void;
  message: string;
  type?: 'success' | 'error';
};

export default function CustomSnackbar({ visible, onDismiss, message, type = 'success' }: Props) {
  return (
    <View style={styles.snackbarContainer}>
      <Snackbar
        visible={visible}
        onDismiss={onDismiss}
        duration={2500}
        style={[styles.snackbar, type === 'success' ? styles.success : styles.error]}
      >
        <Text style={styles.snackbarText}>{message}</Text>
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  snackbarContainer: {
    position: 'absolute',
    top: 100,
    width,
    alignItems: 'center',
    zIndex: 999,
  },
  snackbar: {
    borderRadius: 8,
    marginHorizontal: 20,
    width: '90%',
  },
  snackbarText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  success: {
    backgroundColor: '#4CAF50',
  },
  error: {
    backgroundColor: '#F44336',
  },
});
