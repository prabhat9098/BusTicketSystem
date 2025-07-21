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

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login/admin" />
      <Stack.Screen name="login/conductor" />
      <Stack.Screen name="admin/add-conductor" options={{ headerShown: true, title: 'Add Conductor'}}/>
      <Stack.Screen name="admin/view-conductor" options={{ headerShown: true, title: 'View Conductor'}}/>
      <Stack.Screen name="admin/add-bus" options={{ headerShown: true, title: 'Add Bus' }}/>
      <Stack.Screen name="admin/add-routes" options={{ headerShown: true, title: 'Add Routes' }}/>
      <Stack.Screen name="admin/view-routes" options={{ headerShown: true, title: 'View Routes' }}/>
      <Stack.Screen name="admin/add-fare" options={{ headerShown: true, title: 'Add Fare' }}/> 
      <Stack.Screen name="dashboard" options={{ headerShown: false }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0,
    paddingBottom:50, // consistent space from top for all screens
    backgroundColor: '#fff',
  },
});
