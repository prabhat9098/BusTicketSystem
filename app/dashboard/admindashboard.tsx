import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Platform,
} from 'react-native';
import {
  Avatar,
  Card,
  Text,
  Button,
  IconButton,
  useTheme,
} from 'react-native-paper';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';

const screenWidth = Dimensions.get('window').width;

export default function AdminDashboard() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const router = useRouter();

  const cards = [
    { title: 'Total Conductors', value: 42, icon: 'account-group', color: '#e0f7fa' },
    { title: 'Today Active Conductors', value: 18, icon: 'account-check', color: '#fff3e0' },
    { title: "Today's Sales", value: '₹ 8,200', icon: 'cash', color: '#e8f5e9' },
    { title: 'Monthly Sales', value: '₹ 1,72,000', icon: 'currency-inr', color: '#f3e5f5' },
    { title: 'Total Buses', value: 20, icon: 'bus', color: '#e1f5fe' },
    { title: 'Active Buses Today', value: 15, icon: 'bus-clock', color: '#fffde7' },
    { title: 'Conductors on Leave', value: 3, icon: 'account-off', color: '#fce4ec' },
  ];

  const actions = [
    { label: 'Add Conductor', icon: 'plus', route: '/admin/add-conductor' },
    { label: 'View Conductor', icon: 'account', route: '/admin/view-conductor' },
    { label: 'Add Routes', icon: 'plus', route: '/admin/add-routes' },
    { label: 'View Routes', icon: 'map', route: '/admin/view-routes' },
    { label: 'Add Route Fare', icon: 'currency-inr', route: '/admin/add-fare' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <IconButton icon="menu" size={24} onPress={() => navigation.dispatch(DrawerActions.openDrawer())} />
          <Text style={styles.headerText}>Admin Dashboard</Text>
          <Avatar.Icon size={36} icon="account-circle" />
        </View>

        {/* Statistic Cards */}
        <View style={styles.cardGrid}>
          {cards.map((card, index) => (
            <Card key={index} style={styles.card}>
              <View style={styles.cardContent}>
                <Avatar.Icon
                  icon={card.icon}
                  size={40}
                  style={{ backgroundColor: card.color, marginRight: 10 }}
                  color={colors.primary}
                />
                <View style={{ flexShrink: 1 }}>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <Text style={styles.cardValue}>{card.value}</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonGrid}>
  {actions.map((action, i) => (
    <View key={i} style={styles.buttonWrapper}>
      <Button
        mode="contained"
        icon={action.icon} // use icon name directly
        contentStyle={styles.buttonContent} // control icon + label alignment
        labelStyle={styles.buttonLabel}
        style={styles.squareButton}
        onPress={() => router.push(action.route as any)}
      >
        {action.label}
      </Button>
    </View>
  ))}
</View>


      </ScrollView>

      {/* Bottom Tabs */}
      <View style={styles.bottomTabs}>
        <IconButton icon="home" />
        <IconButton icon="account" />
        <IconButton icon="cog" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    paddingTop: Platform.OS === 'android' ? 50 : 0,
    paddingBottom: 0, // extra space to avoid tab bar overlapping
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: (screenWidth - 48) / 2,
    marginBottom: 16,
    elevation: 3,
    borderRadius: 12,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    flexWrap: 'wrap',
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  buttonWrapper: {
    width: (screenWidth - 52) / 2,
    marginBottom: 12,
  },
  squareButton: {
  borderRadius: 12,
  justifyContent: 'flex-start', // ensure left-aligned
},

buttonContent: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'flex-start',
  height: 60, // taller button
},

buttonLabel: {
  fontSize: 13,
  marginLeft: 10, // space between icon and label
  textAlign: 'left',
},


  bottomTabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    
    borderTopWidth: 0.5,
    borderTopColor: '#ccc',
    backgroundColor: '#fff',
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 0 : 16,
    left: 0,
    right: 0,
  },
});
