import React, { useContext, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { UserContext } from '../context/UserContext';
import { useUpdateProfileMutation } from '../profile/profileApi';
import { useLazyCheckEmailQuery } from '../profile/signUpApi';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { user, setUser } = useContext(UserContext);

  const [editedName, setEditedName] = useState(user?.name || '');
  const [editedEmail, setEditedEmail] = useState(user?.email || '');
  const [isEditing, setIsEditing] = useState(false);

  const [updateProfile] = useUpdateProfileMutation();
  const [checkEmail] = useLazyCheckEmailQuery(); 

  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);

  const handleSave = async () => {
    if (!editedName.trim() || !editedEmail.trim()) {
      Alert.alert('Error', 'Name and email cannot be empty.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editedEmail.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      const { data: existingUsers, error } = await checkEmail(editedEmail.trim());

      if (error) {
        console.error("Email check error:", error);
        Alert.alert('Error', 'Something went wrong while checking email.');
        return;
      }

      if (existingUsers.length > 0 && existingUsers[0].user_id !== user.id) {
        Alert.alert('Error', 'This email is already used by another account.');
        return;
      }

      await updateProfile({ user_id: user.id, name: editedName, email: editedEmail }).unwrap();
      setUser({ ...user, name: editedName, email: editedEmail });

      Alert.alert('Success', 'Profile updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);

    } catch (err) {
      console.error('Error updating profile:', err);
      Alert.alert('Error', 'Failed to update profile.');
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0]?.toUpperCase())
      .join('');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backContainer} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#000" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.titleContainer}>
        <Text style={styles.screenTitle}>Edit Profile</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
        </View>
      </View>

      <View style={styles.infoBlock}>
        <View style={styles.inputWrapper}>
          <Ionicons name="person-outline" size={20} color="#888" />
          <TextInput
            ref={nameInputRef}
            style={styles.inputText}
            value={editedName}
            onChangeText={setEditedName}
            editable={true}  
            placeholder="Enter your name"
            autoCapitalize="none"
            onFocus={() => setIsEditing(true)} 
          />
        </View>
      </View>

      <View style={styles.infoBlock}>
        <View style={styles.inputWrapper}>
          <Ionicons name="mail-outline" size={20} color="#888" />
          <TextInput
            ref={emailInputRef}
            style={styles.inputText}
            value={editedEmail}
            onChangeText={setEditedEmail}
            editable={true} 
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            onFocus={() => setIsEditing(true)}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
  },

  backContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: 62,
    left: 16,
  },
  backText: {
    fontSize: 16,
    marginLeft: 8,
  },

  titleContainer: {
    marginTop: 100,
    marginBottom: 20,
    alignItems: 'center',
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
  infoBlock: {
    marginTop: 15,
    marginBottom: 10,
    marginHorizontal: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C8D4C4',
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#3B3B3B',
  },

  button: {
    backgroundColor: '#1C4A1E',
    alignItems: 'center',
    marginHorizontal: 70,
    paddingVertical: 16,
    borderRadius: 20,
    marginTop: 100,
  },
  buttonText: {
    color: '#FAFAFA',
    fontWeight: 'bold',
    fontSize: 16,
  },
});