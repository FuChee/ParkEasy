import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { supabase } from '../lib/supabase';

export const signUpApi = createApi({
  reducerPath: 'signUpApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['SignUp'],
  endpoints: (builder) => ({
    signUp: builder.mutation({
      async queryFn({ name, email, password }) {
        try {
          const { data: existingUsers, error: emailCheckError } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('email', email.trim());

          if (emailCheckError) {
            console.error('Supabase email check error:', emailCheckError);
            return { error: emailCheckError };
          }

          if (existingUsers.length > 0) {
            return { error: { message: 'This email is already registered.' } };
          }

          const { data, error } = await supabase
            .from('profiles')
            .insert([{ name, email: email.trim(), password }]) 
            .select();

          if (error) {
            console.error('Supabase insert error:', error);
            return { error };
          }

          console.log('✅ Sign up successful:', data);
          return { data };
        } catch (err) {
          console.error('Unexpected error during sign up:', err);
          return { error: err };
        }
      },
      invalidatesTags: ['SignUp'],
    }),

    checkEmail: builder.query({
      async queryFn(email) {
        const { data, error } = await supabase
          .from('profiles') 
          .select('user_id')
          .eq('email', email.trim());

        if (error) return { error };
        return { data };
      },
    }),
  }),
});

export const { useSignUpMutation, useCheckEmailQuery, useLazyCheckEmailQuery} = signUpApi;