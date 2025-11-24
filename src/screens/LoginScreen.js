// ./src/screens/LoginScreen.js
import React, { useState, useContext } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLoginMutation } from '../profile/loginApi';
import { UserContext } from '../context/UserContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Background from '../assets/Background';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [login, { isLoading }] = useLoginMutation();
  const { setUser } = useContext(UserContext);

  const handleLogin = async () => {
  if (!email.trim() || !password.trim()) {
    Alert.alert('Error', 'Please fill in all fields');
    return;
  }

  try {
    const user = await login({ email, password }).unwrap();
    setUser(user);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }], 
    });
  } catch (err) {
    if (err.status === 'FETCH_ERROR' || err.message?.includes('Network')) {
      Alert.alert('Network Error', 'Unable to connect. Please check your internet.');
    } else {
      Alert.alert('Error', 'Invalid email or password');
    }
  }
};
  return (
    <Background>
      <TouchableOpacity style={styles.backContainer} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#000" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.formContainer}>
        <Text style={styles.title}>Login</Text>
        
        <View style={styles.inputWrapper}>
          <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
          <TextInput
            style={styles.inputBox}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor="#888"
            autoCapitalize="none" 
          />
        </View>

        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
          <TextInput
            style={styles.inputBox}
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            placeholderTextColor="#888"
            secureTextEntry={!showPassword}
            autoCapitalize="none" 
          />
          <TouchableOpacity onPress={() => setShowPassword(prev => !prev)}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#888"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          {isLoading ? (
              <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.signupLink}>Sign up now</Text>
          </TouchableOpacity>
        </View>
      </View>
      
    </Background>
  );
}

const styles = StyleSheet.create({
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
  formContainer: {
    flex: 1,                
    justifyContent: 'center', 
    alignItems: 'center',     
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 300,
    borderBottomWidth: 1,
    borderColor: '#000',       
    paddingHorizontal: 0,     
    marginVertical: 24,          
  },
  inputIcon: {
    marginRight: 8,
  },
  inputBox: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#000',
    paddingVertical: 8,       
  },
  loginButton: {
    backgroundColor: '#1C4A1E',
    paddingVertical: 12,
    borderRadius: 20,
    width: 300,
    alignItems: 'center',
    marginTop: 16,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupContainer: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'center', 
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
    color: '#333',
  },
  signupLink: {
    color: '#1C4A1E',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});