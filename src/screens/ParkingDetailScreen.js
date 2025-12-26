import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function ParkingDetailScreen({ route, navigation }) {
  const { record } = route.params;
  const formatDateTime = (datetime, startDate) => {
    if (!datetime) return 'N/A';

    const dt = new Date(datetime);
    const start = new Date(startDate);

    const isSameDay =
      dt.getFullYear() === start.getFullYear() &&
      dt.getMonth() === start.getMonth() &&
      dt.getDate() === start.getDate();

    const dtTimeStr = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dtDateStr = dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    return isSameDay ? dtTimeStr : `${dtDateStr} ${dtTimeStr}`;
  };
  const getDuration = (start, end) => {
    if (!start) return null;

    const startTime = new Date(start);
    const endTime = end ? new Date(end) : new Date(); 
    
    let diffMs = endTime - startTime;

    if (diffMs < 0) {
      diffMs = 0;
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let durationStr = '';
    if (days > 0) durationStr += `${days} day${days > 1 ? 's' : ''} `;
    if (hours > 0) durationStr += `${hours} hr${hours > 1 ? 's' : ''} `;
    if (minutes > 0) durationStr += `${minutes} min `;
    

    durationStr += `${seconds} sec`; 

    return durationStr.trim();
  };

  return (
    <View style={{ padding: 16 }}>
      <TouchableOpacity style={styles.backContainer} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#000" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.titleContainer}>
        <Text style={styles.title}>Details</Text>
        <Text style={styles.date}>
          {new Date(record.created_at).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Your parking:</Text>

        <View style={styles.centerSection}>
          <Text style={styles.location}>Level {record.level} - {record.slot_number}</Text>
        </View>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Parked since:</Text>
          <Text style={styles.detailValue}>
            {new Date(record.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Leave at:</Text>
          <View style={{ alignItems: 'flex-end' }}>
            {record.left_at && new Date(record.left_at).toDateString() !== new Date(record.created_at).toDateString() ? (
              <Text style={styles.detailValue}>
                {new Date(record.left_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            ) : null}
            <Text style={styles.detailValue}>
              {new Date(record.left_at || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Duration:</Text>
          <Text style={styles.detailValue}>
            {getDuration(record.created_at, record.left_at) || 'N/A'}
          </Text>
        </View>
      </View>
    </View>
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
  titleContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 40,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#D2EBD3',
    borderRadius: 20,
    padding: 24,
    marginVertical: 16,
    height: 200, 
  },
  infoLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000',
  },
  completeCard: {
    position: 'absolute',
    top: 16,
    right: 16,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#074374',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  completeLabel: {
    color: '#fff',
    fontWeight: '600',
  },
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  location: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 24,
  },
  bottomSection: {
    marginTop: 20,
    paddingHorizontal: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 20,
    color: '#000',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0BA467', 
  },
});