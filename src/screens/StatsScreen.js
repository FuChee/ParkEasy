import React, { useContext, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { UserContext } from '../context/UserContext';
import { useGetParkingStatsQuery } from '../features/statsApi';
import { supabase } from '../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function StatsScreen(){
    const { user } = useContext(UserContext);
    const {
        data: statsData,
        isLoading,
        refetch,
        error,
    } = useGetParkingStatsQuery(user?.id);

    useEffect(() => {
        if (!user?.id) return;

        const channel = supabase
        .channel('parking-records-updates')
        .on(
            'postgres_changes',
            {
            event: '*',
            schema: 'public',
            table: 'parking_records',
            filter: `user_id=eq.${user.id}`,
            },
            () => refetch()
        )
        .subscribe();

        return () => {
        supabase.removeChannel(channel);
        };
    }, [user?.id, refetch]);

    useFocusEffect(
        useCallback(() => {
        refetch();
        }, [refetch])
    );

    const formatDuration = (totalMinutes) => {
        const days = Math.floor(totalMinutes / 1440);
        const hours = Math.floor((totalMinutes % 1440) / 60);
        const minutes = Math.floor(totalMinutes % 60);
        let result = '';
        if (days > 0) result += `${days}d `;
        if (hours > 0) result += `${hours}h `;
        if (minutes > 0 || result === '') result += `${minutes}m`;
        return result.trim();
    };

    if (isLoading) {
        return (
        <View style={styles.centered}>
            <ActivityIndicator size="large" color="#9E8F67" />
        </View>
        );
    }

    if (error) {
        return (
        <View style={styles.centered}>
            <Ionicons name="alert-circle-outline" size={50} color="#C2B490" />
            <Text style={styles.emptyText}>Error loading statistics</Text>
            <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
        </View>
        );
    }

    if (!statsData) {
        return (
        <View style={styles.centered}>
            <Text style={styles.loadingText}>No parking data available.</Text>
        </View>
        );
    }

    const totalSessions = statsData.history?.filter((rec) => rec.left_at).length || 0;
    const averageDuration =
        totalSessions > 0 ? statsData.totalDuration / totalSessions : 0;

    const topSlots = Object.entries(statsData.slotCount || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
    const today = new Date();

    const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',   
    month: 'short',   
    day: 'numeric',   
    });

    return (
    <View style={{ paddingHorizontal: 16, paddingTop: 16, flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false}>

            <View style={styles.titleContainer}>
                <Text style={styles.screenTitle}>Your Parking Stats</Text>
                <Text style={styles.date}>{formattedDate}</Text>
            </View>

            {isLoading ? (
                <View style={styles.centered}>
                <ActivityIndicator size="large" color="#9E8F67" />
                <Text style={styles.tipText}>Loading your stats...</Text>
                </View>
            ) : error ? (
                <View style={styles.centered}>
                <Ionicons name="alert-circle-outline" size={50} color="#C2B490" />
                <Text style={styles.emptyText}>Error loading statistics</Text>
                <TouchableOpacity style={styles.retryButton} onPress={refetch}>
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
                </View>
            ) : !statsData ? (
                <View style={styles.centered}>
                <Text style={styles.loadingText}>No parking data available.</Text>
                </View>
            ) : (
                <>
                <View style={styles.totalCard}>
                    <Text style={styles.title}>Total Parking Duration</Text>
                    <View style={styles.centerSection}>
                    <Text style={{ fontSize: 36, fontWeight: 'bold', marginTop: 12 }}>
                        {statsData.totalDuration > 0 ? formatDuration(statsData.totalDuration) : 'No data'}
                    </Text>
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={styles.card1}>
                        <Text style={styles.title}>Preferred Time</Text>
                        <View style={styles.centerSection}>
                            <Text style={styles.infoValue}>
                            {statsData.preferredTimeRange &&
                            statsData.preferredTimeRange.trim() !== '' &&
                            statsData.preferredTimeRange.toLowerCase() !== 'no data yet'
                                ? statsData.preferredTimeRange.replace(/\s*[-–]\s*/, '\n-\n')
                                : 'No data available'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.card2}>
                        <Text style={styles.title}>Preferred Slot</Text>
                        <View style={styles.centerSection}>
                            <Text style={styles.infoValue}>
                            {statsData.preferredSlot &&
                            statsData.preferredSlot.trim() !== '' &&
                            statsData.preferredSlot.toLowerCase() !== 'no data'
                                ? statsData.preferredSlot.replace(' - ', '\n-\n') 
                                : 'No data available'}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={styles.card1}>
                        <Text style={styles.title}>Average Duration</Text>
                        <View style={styles.centerSection}>
                            <Text style={styles.infoValue}>{averageDuration > 0 ? formatDuration(averageDuration) : 'No data'}</Text>
                        </View>
                    </View>

                    <View style={styles.card2}>
                        <Text style={styles.title}>Total Parking</Text>
                        <View style={styles.centerSection}>
                            <Text style={{ fontSize: 36, fontWeight: 'bold', marginTop: 12 }}>{totalSessions}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.freqCard}>
                    <Text style={styles.label}>Top 3 Frequently Used Slots</Text>
                    {topSlots.length === 0 ? (
                    <Text style={{fontSize: 16, fontWeight: 'bold', marginTop: 12, textAlign: 'center'}}>No slot data available.</Text>
                    ) : (
                    topSlots.map(([slot, count], index) => {
                        const max = Math.max(...Object.values(statsData.slotCount || {}));
                        const widthPercent = (count / max) * 100;
                        return (
                        <View key={slot} style={styles.slotItem}>
                            <View style={styles.slotHeader}>
                            <Text style={styles.rank}>{index + 1}.</Text>
                            <Text style={styles.slotText}>{slot}</Text>
                            <Text style={styles.count}>{count}×</Text>
                            </View>
                            <View style={styles.barContainer}>
                            <View style={[styles.barFill, { width: `${widthPercent}%` }]} />
                            </View>
                        </View>
                        );
                    })
                    )}
                </View>
                </>
            )}
        </ScrollView>
    </View>
);
}

const styles = StyleSheet.create({
    titleContainer: {
        marginTop: 80,
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    screenTitle:{
        fontSize: 24,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    date: {
        fontSize: 13,
        fontWeight: 'bold',
        marginTop: 12,
    },
    totalCard: {
        backgroundColor: '#D2EBD3',
        height: 150,
        padding: 20,
        borderRadius: 20,
        marginTop: 20,
    },
    centerSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    row:{
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    card1: {
        flex: 1,                  
        backgroundColor: '#D2EBD3',
        height: 150,
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        marginRight: 6,           
    },

    card2: {
        flex: 1,
        backgroundColor: '#D2EBD3',
        height: 150,
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        marginLeft: 6,            
    },
  title: {
    fontSize: 16,
    fontWeight: '700',

  },
  infoLabel: {
    fontSize: 17,
    fontWeight: '600',
  },
  infoValue: {

    fontSize: 22,
    fontWeight: '800',
    marginTop: 6,
    textAlign: 'center',
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
    color: '#333',
  },
  slotItem: {
    marginBottom: 14,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rank: {
    color: '#0BA467',
    fontWeight: '700',
    marginRight: 6,
    fontSize: 16,
  },
  slotText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  count: {
    color: '#666',
    fontSize: 15,
    fontWeight: '500',
  },
  barContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#C8D6C9',
    borderRadius: 5,
    marginTop: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#043A24',
    borderRadius: 5,
    opacity: 0.9,
  },
  noDataText: {
    color: '#8B8575',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  tipText: {
    textAlign: 'center',
    color: '#7A7463',
    fontSize: 13,
    marginTop: 10,
    marginBottom: 50,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  retryButton: {
    backgroundColor: '#0BA467',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 14,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
  },
  emptyText: {
    color: '#555',
    fontSize: 16,
    marginTop: 10,
  },
  loadingText: {
    color: '#5A5648',
    fontSize: 16,
  },
  freqCard: {
    backgroundColor: '#D2EBD3',
    borderRadius: 16,
    padding: 20,
    marginTop: 10,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
  },
});