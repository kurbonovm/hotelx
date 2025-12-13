import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../types';

// Add type declarations for ImportMetaEnv and ImportMeta
interface ImportMetaEnv {
  VITE_API_URL?: string;
}

interface ImportMeta {
  env: ImportMetaEnv;
}

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Room', 'Reservation', 'User', 'Payment', 'Admin'],
  endpoints: () => ({}),
});
