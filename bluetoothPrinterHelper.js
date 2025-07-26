import { PermissionsAndroid, Platform } from "react-native";
import {
  BluetoothEscposPrinter,
  BluetoothManager,
} from "react-native-bluetooth-escpos-printer";

export const requestBluetoothPermissions = async () => {
  if (Platform.OS === "android") {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);
    return Object.values(granted).every(
      (status) => status === PermissionsAndroid.RESULTS.GRANTED
    );
  }
  return true;
};

export const listBluetoothDevices = async () => {
  try {
    return await BluetoothManager.scanDevices();
  } catch (e) {
    throw e;
  }
};

export const connectToPrinter = async (macAddress) => {
  try {
    await BluetoothManager.connect(macAddress);
    return true;
  } catch (e) {
    throw e;
  }
};

export const printTicketCustom = (address, ticketText) => {
  BluetoothManager.connect(address).then(
    async () => {
      await BluetoothEscposPrinter.printText(ticketText + "\r\n\r\n", {});
    },
    (err) => {
      console.log("Connection error:", err);
    }
  );
};
