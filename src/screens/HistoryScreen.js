import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../context/UserContext';
import { useGetParkingRecordsQuery } from '../features/parkingApi';

export default function StatsScreen(){
    const { user } = useContext(UserContext);
    const { data: parkingRecords, isLoading, refetch } = useGetParkingRecordsQuery(user?.id);
    const completedRecords = parkingRecords?.filter(record => record.left_at) || [];
    const navigation = useNavigation();
    return(
        <View style={{ paddingHorizontal: 16, paddingTop: 16, flex: 1 }}>
            <ScrollView showsVerticalScrollIndicator={false} > 
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>Parking History</Text>
                </View>
                {isLoading ? (
                        <ActivityIndicator size="large" color="#000" />
                    ) : completedRecords.length > 0 ? (
                        completedRecords.map(record => {
                            const createdDate = new Date(record.created_at);
                            const leftDate = new Date(record.left_at);
                            return (
                                <TouchableOpacity
                                    key={record.id}
                                    style={styles.recentCard}
                                    onPress={() => navigation.navigate('ParkingDetail', { record })}
                                >
                                    <View style={styles.recentTitle}>
                                        <Text style={styles.recentDate}>{createdDate.toLocaleDateString()}</Text>
                                        <Text style={styles.recentTime}>
                                            {createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                                            {leftDate ? leftDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                        </Text>
                                    </View>
                                    <Text style={styles.recentSlot}>Level {record.level} - {record.slot_number}</Text>
                                </TouchableOpacity>
                            );
                        })
                    ) : (
                        <View style={[styles.centered, { flex: 1 }]}>
                            <Text style={styles.noParking}>No recent parking records.</Text>
                        </View>
                    )}
                
            </ScrollView>

        </View>
    )
}

const styles = StyleSheet.create({
    centered: {
        marginTop: 280,
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