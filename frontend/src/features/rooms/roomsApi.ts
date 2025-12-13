import { apiSlice } from '../../services/api';
import type {
  Room,
  RoomQueryParams,
  AvailableRoomsQuery,
  CreateRoomRequest,
  UpdateRoomRequest,
} from '../../types';

export const roomsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRooms: builder.query<Room[], RoomQueryParams | void>({
      query: (params) => ({
        url: '/rooms',
        params,
      }),
      providesTags: ['Room'],
    }),
    getRoomById: builder.query<Room, string>({
      query: (id) => `/rooms/${id}`,
      providesTags: (result, error, id) => [{ type: 'Room', id }],
    }),
    getAvailableRooms: builder.query<Room[], AvailableRoomsQuery>({
      query: ({ startDate, endDate, guests }) => ({
        url: '/rooms/available',
        params: { startDate, endDate, guests },
      }),
      providesTags: ['Room'],
    }),
    createRoom: builder.mutation<Room, CreateRoomRequest>({
      query: (roomData) => ({
        url: '/rooms',
        method: 'POST',
        body: roomData,
      }),
      invalidatesTags: ['Room'],
    }),
    updateRoom: builder.mutation<Room, UpdateRoomRequest>({
      query: ({ id, ...roomData }) => ({
        url: `/rooms/${id}`,
        method: 'PUT',
        body: roomData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Room', id }],
    }),
    deleteRoom: builder.mutation<void, string>({
      query: (id) => ({
        url: `/rooms/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Room'],
    }),
  }),
});

export const {
  useGetRoomsQuery,
  useGetRoomByIdQuery,
  useGetAvailableRoomsQuery,
  useCreateRoomMutation,
  useUpdateRoomMutation,
  useDeleteRoomMutation,
} = roomsApi;
