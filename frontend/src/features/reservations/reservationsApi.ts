import { apiSlice } from '../../services/api';
import type {
  Reservation,
  CreateReservationRequest,
  UpdateReservationRequest,
} from '../../types';

export const reservationsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getReservations: builder.query<Reservation[], Record<string, any> | void>({
      query: (params) => ({
        url: '/reservations',
        params,
      }),
      providesTags: ['Reservation'],
    }),
    getReservationById: builder.query<Reservation, string>({
      query: (id) => `/reservations/${id}`,
      providesTags: (result, error, id) => [{ type: 'Reservation', id }],
    }),
    getUserReservations: builder.query<Reservation[], void>({
      query: () => '/reservations/my-reservations',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Reservation' as const, id })),
              { type: 'Reservation' as const, id: 'LIST' },
            ]
          : [{ type: 'Reservation' as const, id: 'LIST' }],
      keepUnusedDataFor: 0, // Don't cache - always refetch
    }),
    createReservation: builder.mutation<Reservation, CreateReservationRequest>({
      query: (reservationData) => ({
        url: '/reservations',
        method: 'POST',
        body: reservationData,
      }),
      invalidatesTags: [{ type: 'Reservation', id: 'LIST' }, 'Room'],
    }),
    updateReservation: builder.mutation<Reservation, UpdateReservationRequest>({
      query: ({ id, ...reservationData }) => ({
        url: `/reservations/${id}`,
        method: 'PUT',
        body: reservationData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Reservation', id },
        { type: 'Reservation', id: 'LIST' },
        'Room',
      ],
    }),
    cancelReservation: builder.mutation<Reservation, string>({
      query: (id) => ({
        url: `/reservations/${id}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Reservation', id },
        { type: 'Reservation', id: 'LIST' },
        'Room',
      ],
    }),
  }),
});

export const {
  useGetReservationsQuery,
  useGetReservationByIdQuery,
  useGetUserReservationsQuery,
  useCreateReservationMutation,
  useUpdateReservationMutation,
  useCancelReservationMutation,
} = reservationsApi;
