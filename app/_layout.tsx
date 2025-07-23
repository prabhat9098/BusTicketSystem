import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { Provider as PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { theme } from './theme/colors';

export default function RootLayout() {
  return (
     <GestureHandlerRootView style={{ flex: 1 }}>
    <PaperProvider theme={theme}>
      <SafeAreaView style={styles.container}>
        <RootLayoutNav />
      </SafeAreaView>
    </PaperProvider>
    </GestureHandlerRootView>
  );
}

export const routes = {
  index: "/index",
  loginAdmin: "/login/admin",
  loginConductor: "/login/conductor",
  adminDashboard: "/dashboard/admindashboard",
  conductorDashboard: "/dashboard/conductordashboard1",
  addConductor: "/admin/add-conductor",
  viewConductor: "/admin/view-conductor",
  addBus: "/admin/add-bus",
  addRoutes: "/admin/add-routes",
  viewRoutes: "/admin/view-routes",
  addFare: "/admin/add-fare",
  conductorAnalysis: "/admin/conductoranalysis",
} as const;



function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name={routes.index} />
      <Stack.Screen name={routes.loginAdmin} />
      <Stack.Screen name={routes.adminDashboard} />
      <Stack.Screen name={routes.conductorDashboard} />
      <Stack.Screen name={routes.loginConductor} />

      <Stack.Screen name={routes.addConductor} options={{ headerShown: true, title: 'Add Conductor' }} />
      <Stack.Screen name={routes.viewConductor} options={{ headerShown: true, title: 'View Conductor' }} />
      <Stack.Screen name={routes.addBus} options={{ headerShown: true, title: 'Add Bus' }} />
      <Stack.Screen name={routes.addRoutes} options={{ headerShown: true, title: 'Add Routes' }} />
      <Stack.Screen name={routes.viewRoutes} options={{ headerShown: true, title: 'View Routes' }} />
      <Stack.Screen name={routes.addFare} options={{ headerShown: true, title: 'Add Fare' }} />
      <Stack.Screen name={routes.conductorAnalysis} options={{ headerShown: true, title: 'Conductor Reports' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0,
    paddingBottom:10, // consistent space from top for all screens
    backgroundColor: '#fff',
  },
});
