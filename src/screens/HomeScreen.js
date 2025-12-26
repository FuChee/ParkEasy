//./src/screens/HomeScreen.js
import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  ScrollView,
  Modal,
  TextInput,
  Animated,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../context/UserContext';
import { useSaveParkingSlotMutation, useGetParkingRecordsQuery, useUpdateLeaveTimeMutation } from '../features/parkingApi';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DropDownPicker from 'react-native-dropdown-picker';
import { supabase } from '../lib/supabase';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import PushNotification from 'react-native-push-notification';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HomeScreen() {
  const { user } = useContext(UserContext);
  const navigation = useNavigation();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('manual'); 
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [refreshing, setRefreshing] = useState(false);
  
  // Data States
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [slots, setSlots] = useState([]);
  const [location, setLocation] = useState(null);
  const [updating, setUpdating] = useState(false); 
  const [hasShownLocationWarning, setHasShownLocationWarning] = useState(false);
  
  // Form States
  const [slotNumber, setSlotNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Dropdown States
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [level, setLevel] = useState([
    { label: 'G', value: 'G' },
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4', value: '4' },
    { label: '5', value: '5' },
  ]);

  const cardOpacity = useRef(new Animated.Value(1)).current;
  const cardTranslate = useRef(new Animated.Value(0)).current;
  const modalAnim = useRef(new Animated.Value(300)).current;

  const watchId = useRef(null);

  const [saveParkingSlot] = useSaveParkingSlotMutation();
  const { data: parkingRecords, isLoading, refetch } = useGetParkingRecordsQuery(user?.id);
  const [updateLeaveTime] = useUpdateLeaveTimeMutation();

  const activeRecord = parkingRecords?.find(r => r.left_at === null) || null;
  const completedRecords = parkingRecords?.filter(r => r.left_at !== null) || [];
  const recentTwo = completedRecords.slice(0, 3);

  const [prevActiveRecord, setPrevActiveRecord] = useState(activeRecord);

  useEffect(() => {
    if (activeRecord !== prevActiveRecord) {
      Animated.parallel([
        Animated.timing(cardOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(cardTranslate, { toValue: 20, duration: 200, useNativeDriver: true }),
      ]).start(() => {
        setPrevActiveRecord(activeRecord);
        cardTranslate.setValue(20);
        Animated.parallel([
          Animated.timing(cardOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(cardTranslate, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start();
      });
    }
  }, [activeRecord]);

  useEffect(() => {
    if (!activeRecord) return;
    if (prevActiveRecord?.id !== activeRecord.id) {
      const leaveTime = predictLeaveTime(activeRecord.created_at);
      schedulePredictedLeaveNotification(leaveTime);
      console.log("Scheduled leave notification for active parking:", activeRecord.id);
    }
  }, [activeRecord]);

  useEffect(() => {
    if (!activeRecord?.created_at) {
      setElapsedTime('00:00:00');
      return;
    }

    const startTime = new Date(activeRecord.created_at);
    if (isNaN(startTime.getTime())) {
      setElapsedTime('00:00:00');
      return;
    }

    const interval = setInterval(() => {
      const diff = Math.floor((new Date() - startTime) / 1000);
      const hours = String(Math.floor(diff / 3600)).padStart(2, '0');
      const minutes = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
      const seconds = String(diff % 60).padStart(2, '0');
      setElapsedTime(`${hours}:${minutes}:${seconds}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeRecord]);

  useEffect(() => {
    fetchParkingSlots();
    detectCurrentLocation();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refetch();
      fetchParkingSlots();
      detectCurrentLocation();
    });
    return unsubscribe;
  }, [navigation]);


  const fetchParkingSlots = async () => {
    try {
      setLoadingSlots(true);
      const { data, error } = await supabase.from('parking_slots').select('*');
      if (error) throw error;
      setSlots(data || []);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load parking slots.');
    } finally {
      setLoadingSlots(false);
    }
  };

  const findNearestSlot = (currentLat, currentLong, currentAlt) => {
    if (!slots || slots.length === 0) return null;

    let nearest = null;
    let minDistance = Infinity;

    const useElevation = currentAlt && currentAlt !== 0;

    slots.forEach((s) => {

      const latDiffMeters = (s.latitude - currentLat) * 111000;
      const lonDiffMeters = (s.longitude - currentLong) * 111000;

      let totalDistanceSq = (latDiffMeters * latDiffMeters) + (lonDiffMeters * lonDiffMeters);


      if (useElevation) {
         const altDiff = (s.elevation - currentAlt); 
         totalDistanceSq += (altDiff * altDiff); 
      }

      if (totalDistanceSq < minDistance) {
        minDistance = totalDistanceSq;
        nearest = s;
      }
    });

    return nearest;
  };
  
  const slot = location ? findNearestSlot(location.latitude, location.longitude, location.elevation) : null;

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'Parking Finder needs access to your location',
          buttonPositive: 'OK',
          buttonNegative: 'Cancel',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const detectCurrentLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return Alert.alert('Permission Denied', 'Location access is required.');
    
    setRefreshing(true);
    setUpdating(true);  

    Geolocation.getCurrentPosition(
      ({ coords }) => {
        // 1. Get 'accuracy' from the coordinates object
        const { latitude, longitude, altitude, accuracy } = coords;
        console.log("Location detected:", latitude, longitude, "Accuracy:", accuracy);
        
        // 2. Check if accuracy is poor (greater than 20 meters)
        // AND check if we have already warned the user to avoid spamming them.
        if (accuracy > 20 && !hasShownLocationWarning) {
            Alert.alert(
                "Improve Location Accuracy", 
                "Your GPS signal is weak. Please turn on Wi-Fi and Bluetooth to improve accuracy inside the parking building.",
                [
                    { text: "OK", onPress: () => console.log("User acknowledged warning") }
                ]
            );
            setHasShownLocationWarning(true); // Mark as shown so we don't show it again immediately
        }

        setLocation({ latitude, longitude, elevation: altitude ?? 0 });
        
        setRefreshing(false);
        setUpdating(false);
      },
      error => {
        console.warn('Geolocation Error:', error);
        Alert.alert('GPS Error', 'Could not fetch location. Please try again.');
        setRefreshing(false);
        setUpdating(false);
      },
      // 3. Optional: Reduced 'timeout' slightly to fail faster if signal is dead
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const handleLeave = async () => {
    if (!user || !activeRecord) return Alert.alert('Error', 'No active parking record found.');
    try {
      await updateLeaveTime(activeRecord.id).unwrap();
      setElapsedTime('00:00:00');
      setIsConfirmed(false);
      Alert.alert('Parking ended', 'You have successfully left this parking spot.');
      refetch();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to update leave time. Please try again.');
    }
  };

  const handleAddPress = () => {
    if (!location || !slot) return Alert.alert('Location not found', 'Please wait for your GPS to update.');
    setModalMode('auto');
    setValue(slot.level);
    setSlotNumber(slot.slot_number.toString());
    setModalVisible(true);
    modalAnim.setValue(300);
    Animated.timing(modalAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
  };

  const handleManualPress = () => {
    setModalMode('manual');
    setValue(null);
    setSlotNumber('');
    setModalVisible(true);
    modalAnim.setValue(300);
    Animated.timing(modalAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
  };

  const predictLeaveTime = (createdAt) => {
    if (!createdAt) return new Date(); 

    const date = new Date(createdAt);
    if (isNaN(date.getTime())) return new Date();

    const hour = date.getHours();
    const minute = date.getMinutes();
    const totalMinutes = hour * 60 + minute;

    // Work schedule 
    const t8am = 8 * 60;
    const t845am = 8 * 60 + 45;
    const t930am = 9 * 60 + 30;

    const leaveTime = new Date(date); 

    if (totalMinutes <= t8am) {
      leaveTime.setHours(17, 0, 0, 0);
    } else if (totalMinutes <= t845am) {
      leaveTime.setHours(17, 45, 0, 0);
    } else if (totalMinutes <= t930am) {
      leaveTime.setHours(18, 30, 0, 0);
    } else {
      leaveTime.setHours(18, 30, 0, 0);
    }

    return leaveTime;
  };


  const schedulePredictedLeaveNotification = (leaveTime) => {
    if (!(leaveTime instanceof Date) || isNaN(leaveTime.getTime())) return;

    if (Platform.OS === 'ios') {
      PushNotificationIOS.requestPermissions();

      PushNotificationIOS.addNotificationRequest({
        id: `predicted-leave-${Date.now()}`,
        title: "Parking Reminder",
        body: "It's almost your expected leave time.",
        fireDate: leaveTime.toISOString(),
        sound: "default",
        attachments: [
          {
            id: 'logo',
            url: 'bundle://logo.png',
            type: 'image'
          }
        ]
      });
    } else {
      // Android
      PushNotification.localNotificationSchedule({
        channelId: "default-channel-id",
        title: "Parking Reminder",
        message: "It's almost your expected leave time.",
        date: leaveTime,
        allowWhileIdle: true,
        smallIcon: "ic_launcher", 
      });
    }
  };

  const onParkingAdded = (record) => {
    const createdAt = record.created_at; 
    const predictedLeave = predictLeaveTime(createdAt);
    schedulePredictedLeaveNotification(predictedLeave);
  };

  const saveSlotNumber = async () => {
    if (!value || !slotNumber.trim()) return Alert.alert('Error', 'Please select level and fill in slot number.');
    try {
      setSaving(true);
      const savedRecord = await saveParkingSlot({
        userId: user?.id,
        slotLevel: value,
        slotNumber,
        latitude: location?.latitude,
        longitude: location?.longitude,
        elevation: location?.elevation,
      }).unwrap();
      
      setIsConfirmed(true);
      Alert.alert('Saved Successfully', `Your parking at Level ${value}, Slot ${slotNumber} has been saved.`);
      setModalVisible(false);
      setSlotNumber('');
      setValue(null);
      refetch();

      // Schedule notification
      onParkingAdded(savedRecord);

    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to save slot. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setRefreshing(true);
    try {
      await fetchParkingSlots();
      refetch();
      await detectCurrentLocation();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}>

        <View style={styles.titleContainer}>
          <Text style={styles.greeting}>Hi {user?.name || 'user'}</Text>
          <Text style={styles.desc}>
            Park <Text style={{ color: '#1C4A1E' }}>smarter</Text> everyday
          </Text>
        </View>

        <Animated.View style={{ opacity: cardOpacity, transform: [{ translateY: cardTranslate }] }}>
          {!activeRecord ? (
            <View style={styles.mainCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.mCardTitle}>Your current parking:</Text>
                <TouchableOpacity onPress={handleRefresh}>
                  {refreshing ? <ActivityIndicator size={24} color="#000" /> : <Ionicons name="refresh" size={24} color="#000" />}
                </TouchableOpacity>
              </View>
              <View style={styles.centerSection}>
                <Text style={styles.location}>{slot ? `Level ${slot.level} - ${slot.slot_number}` : 'Scanning...'}</Text>
                <TouchableOpacity style={styles.button} onPress={handleAddPress}>
                  <Text style={styles.buttonText}>Confirm Parking</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inlineText}>
                <Text style={styles.signupText}>Not correct? </Text>
                <TouchableOpacity onPress={handleManualPress}>
                  <Text style={styles.signupLink}>Select slot manually</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.onGoingCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.mCardTitle}>Your parking today:</Text>
              </View>
              <View style={styles.centerSection}>
                <Text style={styles.location}>
                  Level {activeRecord.level} - Slot {activeRecord.slot_number}
                </Text>
                <Text style={styles.createdAt}>
                  Created at: {new Date(activeRecord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text style={styles.elapsedTime}>Duration: {elapsedTime}</Text>
                <TouchableOpacity style={styles.leaveButton} onPress={handleLeave}>
                  <Text style={styles.buttonText}>Leave</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>

        <TouchableOpacity style={styles.bottomTitle} onPress={() => navigation.navigate('Parking')}>
          <Text style={styles.bottomWord}>Recent Parking</Text>
          <Ionicons name="chevron-forward-outline" size={24} color="#000" />
        </TouchableOpacity>

        {isLoading ? (
          <ActivityIndicator size="large" color="#000" />
        ) : recentTwo.length > 0 ? (
          recentTwo.map(record => {
            const createdDate = new Date(record.created_at);
            const leftDate = record.left_at ? new Date(record.left_at) : null;
            const formattedDate = createdDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

            return (
              <TouchableOpacity key={record.id} style={styles.recentCard} onPress={() =>
                navigation.navigate('Parking', { screen: 'ParkingDetail', params: { record } })
              }>
                <View style={styles.recentTitle}>
                  <Text style={styles.recentDate}>{formattedDate}</Text>
                  <Text style={styles.recentTime}>
                    {createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {leftDate ? leftDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                  </Text>
                </View>
                <Text style={styles.recentSlot}>
                  Level {record.level} - Slot {record.slot_number}
                </Text>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.centered}>
            <Text style={styles.noParking}>No recent parking records.</Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Animated.View style={[styles.modalBox, { transform: [{ translateY: modalAnim }] }]}>
            <Text style={styles.modalTitle}>Add Parking Slot</Text>

            <View style={{ marginBottom: 16, width: '100%', zIndex: 2000 }}>
              <Text style={styles.dropdownLabel}>Select Level</Text>
              <DropDownPicker
                open={open}
                value={value}
                items={level}
                setOpen={setOpen}
                setValue={setValue}
                setItems={setLevel}
                placeholder="Choose a level"
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                listMode="SCROLLVIEW"
              />
            </View>

            <View style={{ marginBottom: 16, width: '100%', zIndex: 1000 }}>
              <Text style={styles.inputLabel}>Enter Slot Number</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 3"
                value={slotNumber}
                onChangeText={setSlotNumber}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity style={styles.modalButton} onPress={saveSlotNumber}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noParking: {
    fontSize: 16, 
    color: '#555' 
  },
  container: { 
    flex: 1, 
    paddingHorizontal: 16, 
    paddingTop: 16 
  },
  titleContainer: { 
    marginTop: 80, 
    alignItems: 'flex-start' 
  },
  greeting: { 
    fontSize: 24, 
    fontWeight: '500', 
    color: '#000' 
  },
  desc: { 
    fontSize: 32, 
    fontWeight: '500', 
    marginTop: 10 
  },
  mCardTitle: { 
    fontSize: 18, 
    fontWeight: '500', 
    color: '#000' 
  },
  location: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    marginTop: 20, 
    marginBottom: 24 
  },
  elapsedTime: { 
    fontSize: 20,           
    fontWeight: 'bold',      
    color: '#1C4A1E',      
    marginBottom: 12        
  },
  createdAt: {
    fontSize: 16,
    color: '#000',
    marginBottom: 12
  },
  signupText: { 
    fontSize: 16, 
    color: '#000' 
  },
  signupLink: { 
    fontSize: 16, 
    color: '#1C4A1E', 
    textDecorationLine: 'underline' 
  },
  bottomWord: { 
    fontSize: 24, 
    fontWeight: 'bold' 
  },
  recentDate: { 
    fontSize: 16, 
    fontWeight: '500', 
    color: '#000' 
  },
  recentTime: { 
    fontSize: 16, 
    fontWeight: '500', 
    color: '#000' 
  },
  recentSlot: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#000', 
    textAlign: 'center', 
    paddingVertical: 30,
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 12 
  },
  cancelText: { 
    color: '#1C4A1E', 
    fontWeight: 'bold' 
  },
  mainCard: { 
    backgroundColor: '#D2EBD3', 
    borderRadius: 20, 
    padding: 20, 
    marginTop: 20, 
    width: '100%', 
    height: 250 
  },
  onGoingCard: { 
    backgroundColor: '#D2EBD3', 
    borderRadius: 20, 
    padding: 20, 
    marginTop: 20, 
    width: '100%', 
    height: 260 
  },
  cardHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: 10 
  },
  centerSection: { 
    alignItems: 'center'
  },
  recentCard: {
    backgroundColor: '#D2EBD3',
    borderRadius: 20,
    marginHorizontal: 8,
    marginVertical: 8,
    overflow: 'hidden',
    elevation: 3, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, 
    shadowRadius: 4,
  },
  recentTitle: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    width: '100%', 
    backgroundColor: '#F2F9F3', 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    borderWidth: 1, 
    borderColor: '#1C4A1E', 
    paddingHorizontal: 20, 
    paddingVertical: 8 
  },
  button: { 
    backgroundColor: '#1C4A1E', 
    width: 200, 
    paddingVertical: 12, 
    borderRadius: 20, 
    alignItems: 'center', 
    marginBottom: 8 
  },
  leaveButton:{
    backgroundColor: '#1C4A1E', 
    width: 200, 
    paddingVertical: 12, 
    borderRadius: 20, 
    alignItems: 'center', 
    marginBottom: 24,
  },
  buttonText: { 
    fontSize: 16, 
    color: '#fff' 
  },
  modalButton: { 
    backgroundColor: '#1C4A1E', 
    paddingVertical: 12, 
    borderRadius: 10, 
    width: '100%', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  cancelButton: { 
    paddingVertical: 10 
  },
  inlineText: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 20 
  },
  bottomTitle: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 24, 
    marginBottom: 20 
  },
  modalContainer: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modalBox: { 
    backgroundColor: '#fff', 
    padding: 24, 
    borderRadius: 20, 
    width: '85%', 
    alignItems: 'center' 
  },
  dropdown: { 
    width: '100%', 
    marginBottom: 12 
  },
  dropdownContainer: { 
    width: '100%' 
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 10, 
    width: '100%',
    paddingVertical: 12,     
    paddingHorizontal: 12,
    marginBottom: 12,
    fontSize: 16,              
    color: '#000',              
  },
  dropdownLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    textAlign: 'left',
    width: '100%'
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    textAlign: 'left',
    width: '100%'
  },
});