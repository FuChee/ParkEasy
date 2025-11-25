import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Background from '../assets/Background';
import logo from '../assets/logo.png';

export default function FirstScreen({ navigation }) {
    return (
        <Background>
            <View style={styles.container}>
                {/* Logo Image */}
                <Image source={logo} style={styles.image} />

                {/* Title */}
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>WELCOME</Text>
                </View>

                {/* Description */}
                <View style={styles.descContainer}>
                    <Text style={styles.desc}>This app is the simplest way to save your parking lot</Text>
                </View>

                {/* Button */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.buttonText}>Next</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Background>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
    },
    image: {
        position: 'absolute',
        top: 222,         
        alignSelf: 'center', 
        width: 220,
        height: 220,
        resizeMode: 'contain',
    },
    titleContainer: {
        position: 'absolute',
        top: 567,          
        width: '100%',     
        alignItems: 'center', 
    },
    title: {
        fontWeight: 'bold',
        fontSize: 32,
    },
    descContainer: {
        position: 'absolute',
        top: 619,
        width: '100%',     
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
        width: '100%',      
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
        fontWeight: '600', 
    },
});