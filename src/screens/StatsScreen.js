import React, { useContext, useEffect, useCallback, useState } from 'react';
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

export default function StatsScreen() {
  const { user } = useContext(UserContext);
  const { data: statsData, isLoading, refetch, error } =
    useGetParkingStatsQuery(user?.id);

  const [filter, setFilter] = useState('7d');


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

  const filterHistoryByRange = (history) => {
    const now = new Date();

    return history.filter((rec) => {
      if (!rec.left_at) return false;
      const date = new Date(rec.left_at);

      if (filter === 'today') {
        return date.toDateString() === now.toDateString();
      }

      if (filter === '7d') {
        return now - date <= 7 * 24 * 60 * 60 * 1000;
      }

      if (filter === '30d') {
        return now - date <= 30 * 24 * 60 * 60 * 1000;
      }

      return true;
    });
  };

  const calculatePreferred = (records) => {
    const timeSlotCount = {};
    const slotCount = {};

    records.forEach((rec) => {
      if (!rec.created_at) return;

      const created = new Date(rec.created_at);
      const hour = created.getHours();
      const minute = created.getMinutes();
      const halfHour = minute < 30 ? 0 : 30;
      const timeKey = `${hour}:${halfHour}`;

      const slotKey = `Level ${rec.level} - Slot ${rec.slot_number}`;

      timeSlotCount[timeKey] = (timeSlotCount[timeKey] || 0) + 1;
      slotCount[slotKey] = (slotCount[slotKey] || 0) + 1;
    });

    const preferredTimeKey = Object.keys(timeSlotCount).reduce(
      (a, b) => (timeSlotCount[a] > timeSlotCount[b] ? a : b),
      null
    );

    const preferredSlot = Object.keys(slotCount).reduce(
      (a, b) => (slotCount[a] > slotCount[b] ? a : b),
      null
    );

    let preferredTimeRange = 'No data';

    if (preferredTimeKey) {
      const [h, m] = preferredTimeKey.split(':').map(Number);
      const start = new Date();
      start.setHours(h, m, 0);
      const end = new Date(start);
      end.setMinutes(start.getMinutes() + 30);

      preferredTimeRange = `${start.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })} – ${end.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    }

    return { preferredTimeRange, preferredSlot };
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


  const filteredHistory = filterHistoryByRange(statsData.history || []);
  const { preferredTimeRange, preferredSlot } =
    calculatePreferred(filteredHistory);

  const totalSessions = filteredHistory.length;

  const totalDuration = filteredHistory.reduce((sum, rec) => {
    if (!rec.created_at || !rec.left_at) return sum;
    const start = new Date(rec.created_at);
    const end = new Date(rec.left_at);
    return sum + (end - start) / (1000 * 60);
  }, 0);

  const averageDuration =
    totalSessions > 0 ? totalDuration / totalSessions : 0;

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

        <View style={{ flexDirection: 'row', marginBottom: 10 }}>
          {['today', '7d', '30d'].map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 12,
                backgroundColor: filter === f ? '#0BA467' : '#E5E5E5',
                marginRight: 8,
              }}
            >
              <Text
                style={{
                  color: filter === f ? '#fff' : '#000',
                  fontWeight: '700',
                  fontSize: 12,
                }}
              >
                {f.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.totalCard}>
          <Text style={styles.title}>Total Parking Duration</Text>
          <View style={styles.centerSection}>
            <Text style={{ fontSize: 36, fontWeight: 'bold', marginTop: 12 }}>
              {totalDuration > 0 ? formatDuration(totalDuration) : 'No data'}
            </Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.card1}>
            <Text style={styles.title}>Preferred Time</Text>
            <View style={styles.centerSection}>
              <Text style={styles.infoValue}>{preferredTimeRange}</Text>
            </View>
          </View>

          <View style={styles.card2}>
            <Text style={styles.title}>Preferred Slot</Text>
            <View style={styles.centerSection}>
              <Text style={styles.infoValue}>
                {preferredSlot || 'No data'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.card1}>
            <Text style={styles.title}>Average Duration</Text>
            <View style={styles.centerSection}>
              <Text style={styles.infoValue}>
                {averageDuration > 0
                  ? formatDuration(averageDuration)
                  : 'No data'}
              </Text>
            </View>
          </View>

          <View style={styles.card2}>
            <Text style={styles.title}>Total Parking</Text>
            <View style={styles.centerSection}>
              <Text style={{ fontSize: 36, fontWeight: 'bold' }}>
                {totalSessions}
              </Text>
            </View>
          </View>
        </View>
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
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
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
  row: {
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
  infoValue: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 6,
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
});