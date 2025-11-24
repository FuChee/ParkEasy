//./src/screens/FirstScreen.js
import {View, Text, Image, TouchableOpacity, StyleSheet} from 'react-native';
import Background from '../assets/Background';
import logo from '../assets/logo.png';

export default function FirstScreen({navigation}){
    return(
        <Background>
            <View style={styles.logo}>
                <Image source={logo} style={styles.image}></Image>
            </View>
            <View style={styles.titleContainer}>
                <Text style={styles.title}>WELCOME</Text>
            </View>
            <View style={styles.descContainer}>
                <Text style={styles.desc}>This app is the simplest way to save your parking lot</Text>
            </View>
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={()=>navigation.navigate('Login')}>
                    <Text style={styles.buttonText}>Next</Text>
                </TouchableOpacity>
            </View>
        </Background>
    );
}

const styles = StyleSheet.create({
    logo: {
        alignItems: 'center',
        padding: 70,
    },
    image: {
        position: 'absolute',
        left: 55,
        top: 222,
        width: 293,
        height: 293,
        resizeMode: 'contain',
    },
    titleContainer: {
        position: 'absolute',
        left: 124,
        top: 567,
    },
    title: {
        fontWeight: 'bold',
        fontSize: 32,
    },
    descContainer: {
        position: 'absolute',
        top: 619,
        left: 0,
        right: 0,             
        alignItems: 'center', 
        },
    desc: {
        textAlign: 'center',
        width: 250,           
        fontSize: 16,
    },
    buttonContainer: {
        position: 'absolute',
        top: 700, 
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    button: {
        backgroundColor: '#1C4A1E',
        borderRadius: 20,
        width: 250,
        height: 65,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'medium',
    },
});