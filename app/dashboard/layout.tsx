// app/dashboard/layout.tsx
import { Drawer } from 'expo-router/drawer';

export default function DashboardLayout() {
  return (
    <Drawer screenOptions={{ headerShown: false }}>
      <Drawer.Screen name="admindashboard" options={{ title: 'Admin Dashboard' }} />
      <Drawer.Screen name="conductordashboard" options={{ title: 'Conductor Dashboard' }} />
    </Drawer>
  );
}
