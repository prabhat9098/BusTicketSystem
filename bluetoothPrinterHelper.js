import { PermissionsAndroid, Platform } from "react-native";
import {
  BluetoothEscposPrinter,
  BluetoothManager,
} from "react-native-bluetooth-escpos-printer";

import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";

export const getBase64FromImage = async (imageAsset) => {
  const asset = Asset.fromModule(imageAsset);
  await asset.downloadAsync();

  const uri = asset.localUri || asset.uri;

  if (!uri || !uri.startsWith("file://")) {
    throw new Error("Asset URI is not a file URI: " + uri);
  }

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return base64;
};

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

export const scanDevices = async () => {
  let enabled = await BluetoothManager.isBluetoothEnabled();
  if (!enabled) {
    const enabledDevices = await BluetoothManager.enableBluetooth();
    if (enabledDevices) {
      enabled = true;
    } else {
      throw new Error("Bluetooth could not be enabled");
    }
  }

  const result = await BluetoothManager.scanDevices();
  const parsed = JSON.parse(result);
  return [...(parsed?.paired || []), ...(parsed?.found || [])];
};

export const connectToPrinter = async (macAddress) => {
  return await BluetoothManager.connect(macAddress);
};

export const printTextToPrinter = async (text) => {
  await BluetoothEscposPrinter.printText(text + "\r\n\r\n", {});
};

// import { PermissionsAndroid, Platform } from "react-native";
// import {
//   BluetoothEscposPrinter,
//   BluetoothManager,
// } from "react-native-bluetooth-escpos-printer";

// export const requestBluetoothPermissions = async () => {
//   if (Platform.OS === "android") {
//     const granted = await PermissionsAndroid.requestMultiple([
//       PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
//       PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
//       PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//     ]);
//     return Object.values(granted).every(
//       (status) => status === PermissionsAndroid.RESULTS.GRANTED
//     );
//   }
//   return true;
// };

// export const listBluetoothDevices = async () => {
//   try {
//     return await BluetoothManager.scanDevices();
//   } catch (e) {
//     throw e;
//   }
// };

// export const connectToPrinter = async (macAddress) => {
//   try {
//     await BluetoothManager.connect(macAddress);
//     return true;
//   } catch (e) {
//     throw e;
//   }
// };

// export const printTicketCustom = (address, ticketText) => {
//   scanDevices();
//   BluetoothManager.connect(address).then(
//     async () => {
//       await BluetoothEscposPrinter.printText(ticketText + "\r\n\r\n", {});
//     },
//     (err) => {
//       console.log("Connection error:", err);
//     }
//   );
// };

// export const scanDevices = () => {
//     // setLoading(true); // ✅ Start loading spinner

//     BluetoothManager.isBluetoothEnabled().then(
//       enabled => {
//         if (enabled) {
//           BluetoothManager.scanDevices().then(
//             s => {
//               const paired = JSON.parse(s).paired || [];
//               const found = JSON.parse(s).found || [];
//               const allDevices = [...paired, ...found];
//              console.log(allDevices);
//             },
//             err => {
//               console.log('Scan error:', err);
//               Alert.alert('Scan Error', JSON.stringify(err));
//               // setLoading(false); // ✅ Stop loading on error
//             },
//           );
//         } else {
//           Alert.alert('Bluetooth Disabled', 'Please enable Bluetooth first.');
//           // setLoading(false);
//         }
//       },
//       err => {
//         Alert.alert('Bluetooth Error', err);
//         // setLoading(false);
//       },
//     );
//   };
