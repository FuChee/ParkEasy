//./src/screens/ProfileScreen.js
import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { UserContext } from '../context/UserContext';
import { useChangePasswordMutation } from '../profile/profileApi';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, setUser } = useContext(UserContext);
  const [changePassword] = useChangePasswordMutation();
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordSheet, setShowPasswordSheet] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('user'); 
      setUser(null); 
      navigation.reset({
        index: 0,
        routes: [{ name: 'First' }], 
      });
    } catch (err) {
      console.log('Error clearing user data', err);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0]?.toUpperCase())
      .join('');
  };

  const handlePasswordSave = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill all fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    try {
      await changePassword({
        user_id: user.id,
        password: newPassword,
      }).unwrap();

      setUser({ ...user, password: newPassword });

      Alert.alert(
        'Success',
        'Profile updated successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowPasswordSheet(false);

              
              setNewPassword('');
              setConfirmPassword('');
            }
          }
        ],
        { cancelable: false }
      );

    } catch (err) {
      console.error('Error updating profile:', err);
      Alert.alert('Error', 'Failed to update profile.');
    }
  };


  const PasswordSheet = () => (
    <Modal
      visible={showPasswordSheet}
      animationType="slide"
      transparent
      onRequestClose={() => setShowPasswordSheet(false)}
    >
      <View style={styles.sheetOverlay}>
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setShowPasswordSheet(false)}
        />

        <View style={styles.sheetContainer}>
          <View style={styles.sheetHandle}></View>

          <Text style={styles.sheetTitle}>Change Password</Text>

          <View style={styles.sheetInputWrapper}>
            <TextInput
              style={styles.sheetInput}
              placeholder="New Password"
              secureTextEntry={!showNewPassword}
              value={newPassword}
              onChangeText={setNewPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowNewPassword(prev => !prev)}>
              <Ionicons
                name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#888"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.sheetInputWrapper}>
            <TextInput
              style={styles.sheetInput}
              placeholder="Confirm Password"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(prev => !prev)}>
              <Ionicons
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#888"
              />
            </TouchableOpacity>
          </View>


          <TouchableOpacity style={styles.sheetButton} onPress={handlePasswordSave}>
            <Text style={styles.sheetButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 16, flex: 1 }}>
      <View style={styles.titleContainer}>
        <Text style={styles.screenTitle}>Profile</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
        </View>
        <Text style={styles.userName}>{user?.name || 'User'}</Text>
        <Text style={styles.infoText}>{user?.email}</Text>
      </View>

      <View style={{ marginTop: 20 }}>
        <TouchableOpacity
          style={styles.editRow}
          onPress={() => navigation.navigate('EditProfileScreen')}
        >
          <View style={styles.rowLeft}>
            <Ionicons name="create-outline" size={20} color="#000" />
            <Text style={styles.editText}>Edit Profile</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={{ marginTop: 20 }}>
        <TouchableOpacity
          style={styles.editRow}
          onPress={() => setShowPasswordSheet(true)}
        >
          <View style={styles.rowLeft}>
            <Ionicons name="lock-closed-outline" size={20} color="#000" />
            <Text style={styles.editText}>Change Password</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      {PasswordSheet()}
    </View>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    marginTop: 80,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },

  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },

  profileCard: {
    alignItems: 'center',
    marginBottom: 25,
  },

  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F5F8F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 6,
  },

  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#000',
  },

  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
  },

  infoText: {
    fontSize: 16,
    color: '#3B3B3B',
  },

  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginTop: 8,
  },

  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 50,
  },

  editText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },

  sheetContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },

  sheetHandle: {
    width: 60,
    height: 5,
    backgroundColor: '#ccc',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 15,
  },

  sheetTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: '#000',
  },

  sheetInput: {
    borderWidth: 1,
    borderColor: '#C8D4C4',
    backgroundColor: '#FAFAFA',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },

  sheetButton: {
    backgroundColor: '#1C4A1E',
    paddingVertical: 14,
    borderRadius: 20,
    marginTop: 10,
  },

  sheetButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },

  sheetInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C8D4C4',
    backgroundColor: '#FAFAFA',
    borderRadius: 20,
    paddingHorizontal: 12,
    marginBottom: 15,
  },

  sheetInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
    color: '#000',
  },
});