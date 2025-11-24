// ./src/screens/SplashScreen.js
import React, { useContext, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { UserContext } from '../context/UserContext';

export default function SplashScreen({ navigation }) {
  const { user, loading } = useContext(UserContext);

  useEffect(() => {
    if (!loading) {
      if (user) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'First' }], 
        });
      }
    }
  }, [user, loading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0BA467" />
    </View>
  );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
});