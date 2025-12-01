import React, { useContext, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList, 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../context/UserContext';
import { useGetParkingRecordsQuery } from '../features/parkingApi';

export default function StatsScreen() {
    const { user } = useContext(UserContext);
    const { data: parkingRecords, isLoading } = useGetParkingRecordsQuery(user?.id);
    const navigation = useNavigation();

    const completedRecords = useMemo(() => {
        return parkingRecords?.filter(record => record.left_at) || [];
    }, [parkingRecords]);

    const renderRecord = ({ item }) => {
        const createdDate = new Date(item.created_at);
        const leftDate = new Date(item.left_at);

        return (
            <TouchableOpacity
                style={styles.recentCard}
                onPress={() => navigation.navigate('ParkingDetail', { record: item })}
            >
                <View style={styles.recentTitle}>
                    <Text style={styles.recentDate}>{createdDate.toLocaleDateString()}</Text>
                    <Text style={styles.recentTime}>
                        {createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {leftDate ? leftDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </Text>
                </View>
                <Text style={styles.recentSlot}>Level {item.level} - {item.slot_number}</Text>
            </TouchableOpacity>
        );
    };

    const renderHeader = () => (
        <View style={styles.titleContainer}>
            <Text style={styles.title}>Parking History</Text>
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.centered}>
            <Text style={styles.noParking}>No recent parking records.</Text>
        </View>
    );

    if (isLoading) {
        return (
            <View style={[styles.container, styles.loadingCenter]}>
                 <ActivityIndicator size="large" color="#000" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={completedRecords}
                keyExtractor={(item) => item.id.toString()} 
                renderItem={renderRecord}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={renderEmpty}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }} 
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingTop: 16,
        flex: 1,
    },
    loadingCenter: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    centered: {
        marginTop: 100,
        alignItems: 'center',
    },
    noParking: {
        fontSize: 16, 
        color: '#555' 
    },
    titleContainer: {
        marginTop: 80,
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
    },
    recentCard: {
        backgroundColor: '#D2EBD3',
        borderRadius: 20,
        marginVertical: 8,
        overflow: 'hidden',
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
        paddingVertical: 8,
    },
    recentDate: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
    },
    recentTime: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
    },
    recentSlot: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
        textAlign: 'center',
        paddingVertical: 30,
    },
});