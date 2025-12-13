package com.hotel.reservation.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hotel.reservation.model.Payment;
import com.hotel.reservation.model.Reservation;
import com.hotel.reservation.model.Room;
import com.hotel.reservation.model.User;
import com.hotel.reservation.security.UserPrincipal;
import com.hotel.reservation.service.PaymentService;
import com.hotel.reservation.service.ReservationService;
import com.stripe.exception.StripeException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class PaymentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PaymentService paymentService;

    @MockBean
    private ReservationService reservationService;

    @MockBean
    private com.hotel.reservation.repository.PaymentRepository paymentRepository;

    @MockBean
    private com.hotel.reservation.repository.ReservationRepository reservationRepository;

    @MockBean
    private com.hotel.reservation.repository.RoomRepository roomRepository;

    @MockBean
    private com.hotel.reservation.repository.UserRepository userRepository;

    private User testUser;
    private Room testRoom;
    private Reservation testReservation;
    private Payment testPayment;
    private UserPrincipal userPrincipal;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId("user123");
        testUser.setFirstName("John");
        testUser.setLastName("Doe");
        testUser.setEmail("john@example.com");
        testUser.setRoles(Set.of(User.Role.GUEST));

        testRoom = new Room();
        testRoom.setId("room123");
        testRoom.setType(Room.RoomType.DELUXE);
        testRoom.setPricePerNight(new BigDecimal("150.00"));

        testReservation = new Reservation();
        testReservation.setId("res123");
        testReservation.setUser(testUser);
        testReservation.setRoom(testRoom);
        testReservation.setCheckInDate(LocalDate.now().plusDays(1));
        testReservation.setCheckOutDate(LocalDate.now().plusDays(3));
        testReservation.setTotalAmount(new BigDecimal("300.00"));

        testPayment = new Payment();
        testPayment.setId("payment123");
        testPayment.setUser(testUser);
        testPayment.setReservation(testReservation);
        testPayment.setAmount(new BigDecimal("300.00"));
        testPayment.setStripePaymentIntentId("pi_test123");
        testPayment.setStripeClientSecret("secret_test123");
        testPayment.setStatus(Payment.PaymentStatus.PENDING);

        userPrincipal = new UserPrincipal(
                testUser.getId(),
                testUser.getEmail(),
                "password",
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_GUEST")),
                true
        );
    }

    @Test
    void createPaymentIntent_Success() throws Exception {
        when(reservationService.getReservationById("res123")).thenReturn(testReservation);
        when(paymentService.createPaymentIntent(any(Reservation.class))).thenReturn(testPayment);

        Map<String, String> paymentData = new HashMap<>();
        paymentData.put("reservationId", "res123");

        mockMvc.perform(post("/api/payments/create-intent")
                        .with(user(userPrincipal))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(paymentData)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentId").value("payment123"))
                .andExpect(jsonPath("$.paymentIntentId").value("pi_test123"))
                .andExpect(jsonPath("$.clientSecret").value("secret_test123"));

        verify(reservationService).getReservationById("res123");
        verify(paymentService).createPaymentIntent(any(Reservation.class));
    }

    @Test
    void createPaymentIntent_OtherUserReservation_Forbidden() throws Exception {
        User otherUser = new User();
        otherUser.setId("otherUser");
        testReservation.setUser(otherUser);

        when(reservationService.getReservationById("res123")).thenReturn(testReservation);

        Map<String, String> paymentData = new HashMap<>();
        paymentData.put("reservationId", "res123");

        mockMvc.perform(post("/api/payments/create-intent")
                        .with(user(userPrincipal))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(paymentData)))
                .andExpect(status().isForbidden());

        verify(paymentService, never()).createPaymentIntent(any(Reservation.class));
    }

    @Test
    void createPaymentIntent_StripeError_ThrowsException() throws Exception {
        when(reservationService.getReservationById("res123")).thenReturn(testReservation);
        when(paymentService.createPaymentIntent(any(Reservation.class)))
                .thenThrow(new StripeException("Stripe error", "request_id", "code", 400) {});

        Map<String, String> paymentData = new HashMap<>();
        paymentData.put("reservationId", "res123");

        mockMvc.perform(post("/api/payments/create-intent")
                        .with(user(userPrincipal))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(paymentData)))
                .andExpect(status().isInternalServerError());
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = "USER")
    void confirmPayment_Success() throws Exception {
        testPayment.setStatus(Payment.PaymentStatus.SUCCEEDED);
        when(paymentService.confirmPayment("pi_test123")).thenReturn(testPayment);

        Map<String, String> confirmData = new HashMap<>();
        confirmData.put("paymentIntentId", "pi_test123");

        mockMvc.perform(post("/api/payments/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(confirmData)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("payment123"))
                .andExpect(jsonPath("$.status").value("SUCCEEDED"));

        verify(paymentService).confirmPayment("pi_test123");
    }

    @Test
    void getPaymentHistory_Success() throws Exception {
        when(paymentService.getUserPaymentHistory("user123"))
                .thenReturn(Arrays.asList(testPayment));

        mockMvc.perform(get("/api/payments/history")
                        .with(user(userPrincipal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("payment123"))
                .andExpect(jsonPath("$[0].amount").value(300.00));

        verify(paymentService).getUserPaymentHistory("user123");
    }

    @Test
    void getPaymentHistory_EmptyList() throws Exception {
        when(paymentService.getUserPaymentHistory("user123"))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/payments/history")
                        .with(user(userPrincipal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getAllPayments_AsAdmin_Success() throws Exception {
        when(paymentService.getAllPayments()).thenReturn(Arrays.asList(testPayment));

        mockMvc.perform(get("/api/payments/all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("payment123"));

        verify(paymentService).getAllPayments();
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void getAllPayments_AsManager_Success() throws Exception {
        when(paymentService.getAllPayments()).thenReturn(Arrays.asList(testPayment));

        mockMvc.perform(get("/api/payments/all"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "USER")
    void getAllPayments_AsUser_Forbidden() throws Exception {
        mockMvc.perform(get("/api/payments/all"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getPaymentById_OwnPayment_Success() throws Exception {
        when(paymentService.getPaymentById("payment123")).thenReturn(testPayment);

        mockMvc.perform(get("/api/payments/payment123")
                        .with(user(userPrincipal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("payment123"));

        verify(paymentService).getPaymentById("payment123");
    }

    @Test
    void getPaymentById_OtherUserPayment_Forbidden() throws Exception {
        User otherUser = new User();
        otherUser.setId("otherUser");
        testPayment.setUser(otherUser);

        when(paymentService.getPaymentById("payment123")).thenReturn(testPayment);

        mockMvc.perform(get("/api/payments/payment123")
                        .with(user(userPrincipal)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getPaymentById_AsAdmin_Success() throws Exception {
        User otherUser = new User();
        otherUser.setId("otherUser");
        testPayment.setUser(otherUser);

        when(paymentService.getPaymentById("payment123")).thenReturn(testPayment);

        mockMvc.perform(get("/api/payments/payment123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("payment123"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void processRefund_Success() throws Exception {
        testPayment.setStatus(Payment.PaymentStatus.REFUNDED);
        when(paymentService.processRefund(eq("payment123"), any(BigDecimal.class), anyString()))
                .thenReturn(testPayment);

        Map<String, Object> refundData = new HashMap<>();
        refundData.put("amount", 300.00);
        refundData.put("reason", "Customer request");

        mockMvc.perform(post("/api/payments/payment123/refund")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refundData)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("payment123"))
                .andExpect(jsonPath("$.status").value("REFUNDED"));

        verify(paymentService).processRefund(
                eq("payment123"),
                any(BigDecimal.class),
                eq("Customer request")
        );
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void processRefund_WithoutReason_UsesDefault() throws Exception {
        when(paymentService.processRefund(eq("payment123"), any(BigDecimal.class), anyString()))
                .thenReturn(testPayment);

        Map<String, Object> refundData = new HashMap<>();
        refundData.put("amount", 300.00);

        mockMvc.perform(post("/api/payments/payment123/refund")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refundData)))
                .andExpect(status().isOk());

        verify(paymentService).processRefund(
                eq("payment123"),
                any(BigDecimal.class),
                eq("Customer request")
        );
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void processRefund_AsManager_Success() throws Exception {
        when(paymentService.processRefund(eq("payment123"), any(BigDecimal.class), anyString()))
                .thenReturn(testPayment);

        Map<String, Object> refundData = new HashMap<>();
        refundData.put("amount", 300.00);
        refundData.put("reason", "Manager approved");

        mockMvc.perform(post("/api/payments/payment123/refund")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refundData)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "USER")
    void processRefund_AsUser_Forbidden() throws Exception {
        Map<String, Object> refundData = new HashMap<>();
        refundData.put("amount", 300.00);

        mockMvc.perform(post("/api/payments/payment123/refund")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refundData)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void processRefund_StripeError_ThrowsException() throws Exception {
        when(paymentService.processRefund(eq("payment123"), any(BigDecimal.class), anyString()))
                .thenThrow(new StripeException("Refund failed", "request_id", "code", 400) {});

        Map<String, Object> refundData = new HashMap<>();
        refundData.put("amount", 300.00);

        mockMvc.perform(post("/api/payments/payment123/refund")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refundData)))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void handleStripeWebhook_Success() throws Exception {
        String payload = "{\"type\":\"payment_intent.succeeded\"}";
        String signature = "test_signature";

        mockMvc.perform(post("/api/payments/webhook")
                        .content(payload)
                        .header("Stripe-Signature", signature))
                .andExpect(status().isOk())
                .andExpect(content().string("Webhook received"));
    }
}
