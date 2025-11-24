import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { supabase } from '../lib/supabase';

export const parkingApi = createApi({
  reducerPath: 'parkingApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  tagTypes: ['Parking'],
  endpoints: (builder) => ({

    saveParkingSlot: builder.mutation({
      async queryFn({ userId, slotLevel, slotNumber, latitude, longitude, elevation }) {
        try {
          const { error } = await supabase.from('parking_records').insert([
            {
              user_id: userId,
              level: slotLevel,
              slot_number: slotNumber,
              latitude,
              longitude,
              elevation,
            },
          ]);
          if (error) throw error;
          return { data: 'success' };
        } catch (error) {
          return { error: { message: error.message } };
        }
      },
      invalidatesTags: ['Parking'],
    }),


    getParkingRecords: builder.query({
      async queryFn(userId) {
        try {
          const { data, error } = await supabase
            .from('parking_records')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
          if (error) throw error;
          return { data };
        } catch (error) {
          return { error: { message: error.message } };
        }
      },
      providesTags: ['Parking'],
    }),


    deleteParkingRecord: builder.mutation({
      async queryFn(id) {
        try {
          const { error } = await supabase.from('parking_records').delete().eq('id', id);
          if (error) throw error;
          return { data: 'success' };
        } catch (error) {
          return { error: { message: error.message } };
        }
      },
      invalidatesTags: ['Parking'],
    }),
    updateLeaveTime: builder.mutation({
      async queryFn(id) {
        try {
          const { error } = await supabase
            .from('parking_records')
            .update({ left_at: new Date().toISOString() })
            .eq('id', id);
          if (error) throw error;
          return { data: { success: true } };
        } catch (err) {
          return { error: err.message };
        }
      },
      invalidatesTags: ['Parking'],
    }),

    
    getDailySchedule: builder.query({
      async queryFn(user_id) {
        try {
          const today = new Date();
          const startOfDay = new Date(today.setHours(0, 0, 0, 0));
          const endOfDay = new Date(today.setHours(23, 59, 59, 999));

          const { data, error } = await supabase
            .from('parking_records')
            .select('*')
            .eq('user_id', user_id)
            .gte('created_at', startOfDay.toISOString())
            .lte('created_at', endOfDay.toISOString())
            .order('created_at', { ascending: true });

          if (error) throw error;

          return { data };
        } catch (err) {
          return { error: err };
        }
      },
    }),
  }),
});

export const {
  useSaveParkingSlotMutation,
  useGetParkingRecordsQuery,
  useDeleteParkingRecordMutation,
  useUpdateLeaveTimeMutation,
} = parkingApi;