package com.hotel.reservation.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hotel.reservation.model.Reservation;
import com.hotel.reservation.model.Room;
import com.hotel.reservation.model.User;
import com.hotel.reservation.repository.UserRepository;
import com.hotel.reservation.security.UserPrincipal;
import com.hotel.reservation.service.ReservationService;
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
class ReservationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ReservationService reservationService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private com.hotel.reservation.repository.PaymentRepository paymentRepository;

    @MockBean
    private com.hotel.reservation.repository.ReservationRepository reservationRepository;

    @MockBean
    private com.hotel.reservation.repository.RoomRepository roomRepository;

    private User testUser;
    private Room testRoom;
    private Reservation testReservation;
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
        testReservation.setNumberOfGuests(2);
        testReservation.setStatus(Reservation.ReservationStatus.CONFIRMED);
        testReservation.setTotalAmount(new BigDecimal("300.00"));

        userPrincipal = new UserPrincipal(
                testUser.getId(),
                testUser.getEmail(),
                "password",
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_GUEST")),
                true
        );
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getAllReservations_AsAdmin_Success() throws Exception {
        when(reservationService.getAllReservations()).thenReturn(Arrays.asList(testReservation));

        mockMvc.perform(get("/api/reservations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("res123"))
                .andExpect(jsonPath("$[0].status").value("CONFIRMED"));

        verify(reservationService).getAllReservations();
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void getAllReservations_AsManager_Success() throws Exception {
        when(reservationService.getAllReservations()).thenReturn(Arrays.asList(testReservation));

        mockMvc.perform(get("/api/reservations"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "USER")
    void getAllReservations_AsUser_Forbidden() throws Exception {
        mockMvc.perform(get("/api/reservations"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getUserReservations_Success() throws Exception {
        when(reservationService.getUserReservations("user123"))
                .thenReturn(Arrays.asList(testReservation));

        mockMvc.perform(get("/api/reservations/my-reservations")
                        .with(user(userPrincipal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("res123"))
                .andExpect(jsonPath("$[0].user.id").value("user123"));

        verify(reservationService).getUserReservations("user123");
    }

    @Test
    void getUserReservations_EmptyList() throws Exception {
        when(reservationService.getUserReservations("user123"))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/reservations/my-reservations")
                        .with(user(userPrincipal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void getReservationById_OwnReservation_Success() throws Exception {
        when(reservationService.getReservationById("res123")).thenReturn(testReservation);

        mockMvc.perform(get("/api/reservations/res123")
                        .with(user(userPrincipal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("res123"));
    }

    @Test
    void getReservationById_OtherUserReservation_Forbidden() throws Exception {
        User otherUser = new User();
        otherUser.setId("otherUser");
        testReservation.setUser(otherUser);

        when(reservationService.getReservationById("res123")).thenReturn(testReservation);

        mockMvc.perform(get("/api/reservations/res123")
                        .with(user(userPrincipal)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getReservationById_AsAdmin_Success() throws Exception {
        User otherUser = new User();
        otherUser.setId("otherUser");
        testReservation.setUser(otherUser);

        when(reservationService.getReservationById("res123")).thenReturn(testReservation);

        mockMvc.perform(get("/api/reservations/res123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("res123"));
    }

    @Test
    void createReservation_Success() throws Exception {
        when(userRepository.findById("user123")).thenReturn(Optional.of(testUser));
        when(reservationService.createReservation(
                any(User.class),
                eq("room123"),
                any(LocalDate.class),
                any(LocalDate.class),
                eq(2),
                anyString()
        )).thenReturn(testReservation);

        Map<String, Object> reservationData = new HashMap<>();
        reservationData.put("roomId", "room123");
        reservationData.put("checkInDate", LocalDate.now().plusDays(1).toString());
        reservationData.put("checkOutDate", LocalDate.now().plusDays(3).toString());
        reservationData.put("numberOfGuests", 2);
        reservationData.put("specialRequests", "Late checkout");

        mockMvc.perform(post("/api/reservations")
                        .with(user(userPrincipal))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reservationData)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("res123"))
                .andExpect(jsonPath("$.status").value("CONFIRMED"));

        verify(reservationService).createReservation(
                any(User.class),
                eq("room123"),
                any(LocalDate.class),
                any(LocalDate.class),
                eq(2),
                eq("Late checkout")
        );
    }

    @Test
    void createReservation_WithoutSpecialRequests_Success() throws Exception {
        when(userRepository.findById("user123")).thenReturn(Optional.of(testUser));
        when(reservationService.createReservation(
                any(User.class),
                anyString(),
                any(LocalDate.class),
                any(LocalDate.class),
                anyInt(),
                anyString()
        )).thenReturn(testReservation);

        Map<String, Object> reservationData = new HashMap<>();
        reservationData.put("roomId", "room123");
        reservationData.put("checkInDate", LocalDate.now().plusDays(1).toString());
        reservationData.put("checkOutDate", LocalDate.now().plusDays(3).toString());
        reservationData.put("numberOfGuests", 2);

        mockMvc.perform(post("/api/reservations")
                        .with(user(userPrincipal))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reservationData)))
                .andExpect(status().isCreated());
    }

    @Test
    void updateReservation_OwnReservation_Success() throws Exception {
        when(reservationService.getReservationById("res123")).thenReturn(testReservation);
        when(reservationService.updateReservation(
                eq("res123"),
                any(LocalDate.class),
                any(LocalDate.class),
                anyInt()
        )).thenReturn(testReservation);

        Map<String, Object> updateData = new HashMap<>();
        updateData.put("checkInDate", LocalDate.now().plusDays(2).toString());
        updateData.put("checkOutDate", LocalDate.now().plusDays(4).toString());
        updateData.put("numberOfGuests", 3);

        mockMvc.perform(put("/api/reservations/res123")
                        .with(user(userPrincipal))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateData)))
                .andExpect(status().isOk());

        verify(reservationService).updateReservation(
                eq("res123"),
                any(LocalDate.class),
                any(LocalDate.class),
                eq(3)
        );
    }

    @Test
    void updateReservation_OtherUserReservation_Forbidden() throws Exception {
        User otherUser = new User();
        otherUser.setId("otherUser");
        testReservation.setUser(otherUser);

        when(reservationService.getReservationById("res123")).thenReturn(testReservation);

        Map<String, Object> updateData = new HashMap<>();
        updateData.put("checkInDate", LocalDate.now().plusDays(2).toString());
        updateData.put("checkOutDate", LocalDate.now().plusDays(4).toString());
        updateData.put("numberOfGuests", 3);

        mockMvc.perform(put("/api/reservations/res123")
                        .with(user(userPrincipal))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateData)))
                .andExpect(status().isForbidden());
    }

    @Test
    void cancelReservation_OwnReservation_Success() throws Exception {
        when(reservationService.getReservationById("res123")).thenReturn(testReservation);
        when(reservationService.cancelReservation("res123", "Changed plans"))
                .thenReturn(testReservation);

        Map<String, String> cancellationData = new HashMap<>();
        cancellationData.put("reason", "Changed plans");

        mockMvc.perform(post("/api/reservations/res123/cancel")
                        .with(user(userPrincipal))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cancellationData)))
                .andExpect(status().isOk());

        verify(reservationService).cancelReservation("res123", "Changed plans");
    }

    @Test
    void cancelReservation_WithoutReason_UsesDefault() throws Exception {
        when(reservationService.getReservationById("res123")).thenReturn(testReservation);
        when(reservationService.cancelReservation("res123", "User requested cancellation"))
                .thenReturn(testReservation);

        mockMvc.perform(post("/api/reservations/res123/cancel")
                        .with(user(userPrincipal)))
                .andExpect(status().isOk());

        verify(reservationService).cancelReservation("res123", "User requested cancellation");
    }

    @Test
    void cancelReservation_OtherUserReservation_Forbidden() throws Exception {
        User otherUser = new User();
        otherUser.setId("otherUser");
        testReservation.setUser(otherUser);

        when(reservationService.getReservationById("res123")).thenReturn(testReservation);

        mockMvc.perform(post("/api/reservations/res123/cancel")
                        .with(user(userPrincipal)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getReservationsByDateRange_AsAdmin_Success() throws Exception {
        LocalDate startDate = LocalDate.now();
        LocalDate endDate = LocalDate.now().plusDays(7);

        when(reservationService.getReservationsByDateRange(startDate, endDate))
                .thenReturn(Arrays.asList(testReservation));

        mockMvc.perform(get("/api/reservations/date-range")
                        .param("startDate", startDate.toString())
                        .param("endDate", endDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("res123"));

        verify(reservationService).getReservationsByDateRange(startDate, endDate);
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void getReservationsByDateRange_AsManager_Success() throws Exception {
        LocalDate startDate = LocalDate.now();
        LocalDate endDate = LocalDate.now().plusDays(7);

        when(reservationService.getReservationsByDateRange(startDate, endDate))
                .thenReturn(Arrays.asList(testReservation));

        mockMvc.perform(get("/api/reservations/date-range")
                        .param("startDate", startDate.toString())
                        .param("endDate", endDate.toString()))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "USER")
    void getReservationsByDateRange_AsUser_Forbidden() throws Exception {
        mockMvc.perform(get("/api/reservations/date-range")
                        .param("startDate", LocalDate.now().toString())
                        .param("endDate", LocalDate.now().plusDays(7).toString()))
                .andExpect(status().isForbidden());
    }
}
