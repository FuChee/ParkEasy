import React, { useContext, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList, 
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../context/UserContext';
import { useGetParkingRecordsQuery } from '../features/parkingApi';

export default function StatsScreen() {
    const { user } = useContext(UserContext);
    const { data: parkingRecords, isLoading } = useGetParkingRecordsQuery(user?.id);
    const navigation = useNavigation();

    const ITEMS_PER_PAGE = 20;
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
    const listRef = useRef(null);
    const [showTopBtn, setShowTopBtn] = useState(false);

    const completedRecords = useMemo(() => {
        return (
            parkingRecords
            ?.filter(record => record.left_at)
            .slice(0, visibleCount) || []
        );
    }, [parkingRecords, visibleCount]);

    const renderFooter = () => {
        if (!parkingRecords) return null;

        const totalCompleted = parkingRecords.filter(r => r.left_at).length;

        if (visibleCount >= totalCompleted) return null;

        return (
            <TouchableOpacity
                style={styles.loadMoreBtn}
                activeOpacity={0.75}
                onPress={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}
            >
                <Ionicons name="chevron-down" size={20} color="#fff" />
                <Text style={styles.loadMoreText}>
                    Load more ({totalCompleted - visibleCount})
                </Text>
            </TouchableOpacity>
        );
    };

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
    const handleScroll = (event) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        setShowTopBtn(offsetY > 300);
    };

    return (
        <View style={styles.container}>
            <FlatList
                ref={listRef}
                data={completedRecords}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderRecord}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={renderEmpty}
                ListFooterComponent={renderFooter}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    { paddingBottom: 20 },
                    completedRecords.length === 0 && { flex: 1 }
                ]}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            />
            {showTopBtn && (
                <TouchableOpacity
                    style={styles.topButton}
                    onPress={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })}
                >
                    <Text style={styles.topButtonText}>↑ Top</Text>
                </TouchableOpacity>
            )}
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
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
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
    loadMoreBtn: {
        marginTop: 20,
        paddingVertical: 14,
        paddingHorizontal: 28,
        alignItems: 'center',
        alignSelf: 'center',
        backgroundColor: '#1C4A1E',
        borderRadius: 28,
        flexDirection: 'row',
        justifyContent: 'center',
        minWidth: 160,

        // subtle shadow
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 6,
        elevation: 5,
    },
    loadMoreText: {
        marginLeft: 6,
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },
    topButton: {
        position: 'absolute',
        right: 20,
        bottom: 30,
        backgroundColor: '#1C4A1E',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 30,
        elevation: 4,
    },
    topButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
});