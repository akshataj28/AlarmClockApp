import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Platform } from 'react-native';
import { Button, List, Switch, FAB, Dialog, Portal, Provider as PaperProvider } from 'react-native-paper';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';

// Define Alarm type
interface Alarm {
  id: string;       // Notification ID
  time: string;     // Time in HH:MM format
  active: boolean;  // Is alarm active
}

function App() {
  const [alarms, setAlarms] = useState<Alarm[]>([]); // List of alarms
  const [date, setDate] = useState<Date>(new Date()); // Alarm time picker state
  const [visible, setVisible] = useState(false); // Dialog visibility

  // Request permissions for notifications
  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to send notifications is required!');
      } else {
        console.log("Permission granted!");
      }
    };
    requestPermissions();
  }, []);

  // Set notification handler to customize notification behavior
  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        console.log("Notification received:", notification);
        return {
          shouldShowAlert: true,
          shouldPlaySound: true, // Ensure sound plays
          shouldSetBadge: false, // Set to true if you want to update the badge
        };
      },
    });
  }, []);

  // Schedule a notification with 24-hour time format
  const scheduleAlarm = async (time: Date) => {
    // Set the trigger time (use a specific Date object)
    const triggerDate = new Date(time);
  
    // Schedule the notification at the trigger time
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Alarm',
        body: `It's time! Alarm set for ${triggerDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`,
        sound: 'default', // This ensures the default notification sound will play
      },
     
      trigger: {
          type: 'calendar',
          hour: time.getHours(),
          minute: time.getMinutes(),
          second: time.getSeconds(),
          repeats: true, // Set to true to repeat the alarm daily or based on any desired repetition schedule

        // Set the absolute date and time for when the alarm should go off
        // type: 'time', // This sets the type of trigger to be time-based
        // hour: triggerDate.getHours(),
        // minute: triggerDate.getMinutes(),
        // second: triggerDate.getSeconds(),
        // repeats: false,      
        date: time},
    });
  
    const newAlarm: Alarm = {
      id: notificationId,
      time: triggerDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }), // 24-hour format
      active: true,
    };
  
    // Add the new alarm to the state
    setAlarms((prev) => [...prev, newAlarm]);
  };
  
  // Toggle alarm active state
  const toggleAlarm = async (id: string) => {
    setAlarms((prev) =>
      prev.map((alarm) =>
        alarm.id === id ? { ...alarm, active: !alarm.active } : alarm
      )
    );
  };

  // Remove an alarm
  const removeAlarm = async (id: string) => {
    await Notifications.cancelScheduledNotificationAsync(id);
    setAlarms((prev) => prev.filter((alarm) => alarm.id !== id));
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={alarms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <List.Item
            title={item.time}
            description={item.active ? 'Active' : 'Inactive'}
            left={() => (
              <Switch
                value={item.active}
                onValueChange={() => toggleAlarm(item.id)}
              />
            )}
            right={() => (
              <Button onPress={() => removeAlarm(item.id)} compact>
                Remove
              </Button>
            )}
            style={styles.alarmItem}
          />
        )}
      />
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => setVisible(true)}
      />
      <Portal>
        <Dialog visible={visible} onDismiss={() => setVisible(false)}>
          <Dialog.Title>Set Alarm</Dialog.Title>
          <Dialog.Content>
            {Platform.OS === 'ios' ? (
              <DateTimePicker
                value={date}
                mode="time"
                display="spinner"
                onChange={(event, selectedDate) =>
                  setDate(selectedDate || date)
                }
              />
            ) : (
              <DateTimePicker
                value={date}
                mode="time"
                onChange={(event, selectedDate) =>
                  setDate(selectedDate || date)
                }
              />
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setVisible(false)}>Cancel</Button>
            <Button
              onPress={() => {
                scheduleAlarm(date);
                setVisible(false);
              }}
            >
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: '#fff',
  },
  fab: {
    position: 'absolute',
    margin: 20,
    right: 0,
    bottom: 0,
  },
  alarmItem: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    elevation: 2,
  },
});

export default function Main() {
  return (
    <PaperProvider>
      <App />
    </PaperProvider>
  );
}
