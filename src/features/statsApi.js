import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { supabase } from '../lib/supabase';

export const statsApi = createApi({
  reducerPath: 'statsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  endpoints: (builder) => ({

    getParkingStats: builder.query({
      async queryFn(user_id) {
        try {
          const { data, error } = await supabase
            .from('parking_records')
            .select('*')
            .eq('user_id', user_id)
            .order('created_at', { ascending: false });

          if (error) throw error;

          let totalDuration = 0;
          const slotCount = {};
          const timeSlotCount = {}; 

          data.forEach((rec) => {
            const created = new Date(rec.created_at);

            const hour = created.getHours();
            const minute = created.getMinutes();
            const halfHour = minute < 30 ? 0 : 30;
            const timeKey = `${hour}:${halfHour}`;

            const slotKey = `Level ${rec.level} - Slot ${rec.slot_number}`;

            if (!timeSlotCount[timeKey]) timeSlotCount[timeKey] = {};
            timeSlotCount[timeKey][slotKey] =
              (timeSlotCount[timeKey][slotKey] || 0) + 1;

            slotCount[slotKey] = (slotCount[slotKey] || 0) + 1;

            if (rec.left_at) {
              const start = new Date(rec.created_at);
              const end = new Date(rec.left_at);
              totalDuration += (end - start) / 1000 / 60;
            }
          });

          let preferredTimeKey = null;
          let maxCount = 0;

          for (const key in timeSlotCount) {
            const totalAtTime = Object.values(timeSlotCount[key]).reduce(
              (a, b) => a + b,
              0
            );

            if (totalAtTime > maxCount) {
              maxCount = totalAtTime;
              preferredTimeKey = key;
            }
          }

          let preferredSlot = 'No data';
          if (preferredTimeKey) {
            const slotStats = timeSlotCount[preferredTimeKey];
            preferredSlot = Object.keys(slotStats).reduce((a, b) =>
              slotStats[a] > slotStats[b] ? a : b
            );
          }

          let preferredTimeRange = 'No data yet';

          if (preferredTimeKey) {
            const [hour, minute] = preferredTimeKey.split(':').map(Number);

            const start = new Date();
            start.setHours(hour, minute, 0);

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

          return {
            data: {
              totalDuration,         
              slotCount,
              preferredTimeRange,
              preferredSlot,
              history: data,
            },
          };
        } catch (err) {
          return { error: err };
        }
      },
    }),

  }),
});

export const { useGetParkingStatsQuery } = statsApi;