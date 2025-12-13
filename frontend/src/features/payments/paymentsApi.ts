import { apiSlice } from '../../services/api';
import type {
  Transaction,
  CreatePaymentIntentRequest,
  ConfirmPaymentRequest,
  PaymentIntentResponse,
  RefundRequest,
} from '../../types';

export const paymentsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createPaymentIntent: builder.mutation<PaymentIntentResponse, CreatePaymentIntentRequest>({
      query: (paymentData) => ({
        url: '/payments/create-intent',
        method: 'POST',
        body: paymentData,
      }),
    }),
    confirmPayment: builder.mutation<Transaction, ConfirmPaymentRequest>({
      query: (paymentData) => ({
        url: '/payments/confirm',
        method: 'POST',
        body: paymentData,
      }),
      invalidatesTags: ['Payment', { type: 'Reservation', id: 'LIST' }],
    }),
    getPaymentHistory: builder.query<Transaction[], void>({
      query: () => '/payments/history',
      providesTags: ['Payment'],
    }),
    getAllPayments: builder.query<Transaction[], void>({
      query: () => '/payments/all',
      providesTags: ['Payment'],
    }),
    getPaymentById: builder.query<Transaction, string>({
      query: (id) => `/payments/${id}`,
      providesTags: (result, error, id) => [{ type: 'Payment', id }],
    }),
    processRefund: builder.mutation<Transaction, RefundRequest>({
      query: ({ paymentId, amount }) => ({
        url: `/payments/${paymentId}/refund`,
        method: 'POST',
        body: { amount },
      }),
      invalidatesTags: ['Payment'],
    }),
  }),
});

export const {
  useCreatePaymentIntentMutation,
  useConfirmPaymentMutation,
  useGetPaymentHistoryQuery,
  useGetAllPaymentsQuery,
  useGetPaymentByIdQuery,
  useProcessRefundMutation,
} = paymentsApi;
