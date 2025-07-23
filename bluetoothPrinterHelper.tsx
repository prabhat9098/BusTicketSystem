import { BluetoothEscposPrinter, BluetoothManager } from 'react-native-bluetooth-escpos-printer';
import { PermissionsAndroid, Platform } from 'react-native';

export const requestBluetoothPermissions = async () => {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);
    return Object.values(granted).every(status => status === PermissionsAndroid.RESULTS.GRANTED);
  }
  return true;
};

export const listBluetoothDevices = async (): Promise<any[]> => {
  try {
    return await BluetoothManager.scanDevices();
  } catch (e) {
    throw e;
  }
};

export const connectToPrinter = async (macAddress: string) => {
  try {
    await BluetoothManager.connect(macAddress);
    return true;
  } catch (e) {
    throw e;
  }
};

export const printTicket = async (ticketText: string) => {
  await BluetoothEscposPrinter.printText(ticketText + '\r\n\r\n', {});
};
