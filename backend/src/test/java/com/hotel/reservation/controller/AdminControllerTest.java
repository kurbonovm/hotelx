package com.hotel.reservation.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hotel.reservation.model.Reservation;
import com.hotel.reservation.model.Room;
import com.hotel.reservation.model.User;
import com.hotel.reservation.repository.ReservationRepository;
import com.hotel.reservation.repository.RoomRepository;
import com.hotel.reservation.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private RoomRepository roomRepository;

    @MockBean
    private ReservationRepository reservationRepository;

    @MockBean
    private com.hotel.reservation.repository.PaymentRepository paymentRepository;

    private User testUser;
    private Room testRoom;
    private Reservation testReservation;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId("user123");
        testUser.setFirstName("John");
        testUser.setLastName("Doe");
        testUser.setEmail("john@example.com");
        testUser.setPhoneNumber("123-456-7890");
        testUser.setRoles(Set.of(User.Role.GUEST));
        testUser.setEnabled(true);

        testRoom = new Room();
        testRoom.setId("room123");
        testRoom.setType(Room.RoomType.DELUXE);
        testRoom.setTotalRooms(10);
        testRoom.setPricePerNight(new BigDecimal("150.00"));

        testReservation = new Reservation();
        testReservation.setId("res123");
        testReservation.setUser(testUser);
        testReservation.setRoom(testRoom);
        testReservation.setStatus(Reservation.ReservationStatus.CONFIRMED);
        testReservation.setTotalAmount(new BigDecimal("300.00"));
        testReservation.setCreatedAt(LocalDateTime.now());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getDashboardOverview_Success() throws Exception {
        when(roomRepository.findAll()).thenReturn(Arrays.asList(testRoom));
        when(reservationRepository.countByStatus(Reservation.ReservationStatus.CONFIRMED)).thenReturn(5L);
        when(reservationRepository.countByStatus(Reservation.ReservationStatus.CHECKED_IN)).thenReturn(3L);
        when(reservationRepository.findByStatus(Reservation.ReservationStatus.CONFIRMED))
                .thenReturn(new ArrayList<>(Arrays.asList(testReservation)));
        when(reservationRepository.findByStatus(Reservation.ReservationStatus.CHECKED_IN))
                .thenReturn(new ArrayList<>(Arrays.asList(testReservation)));
        when(userRepository.count()).thenReturn(100L);
        when(reservationRepository.findByCreatedAtBetween(any(), any()))
                .thenReturn(Arrays.asList(testReservation));

        mockMvc.perform(get("/api/admin/dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRooms").exists())
                .andExpect(jsonPath("$.availableRooms").exists())
                .andExpect(jsonPath("$.occupancyRate").exists())
                .andExpect(jsonPath("$.activeReservations").value(8))
                .andExpect(jsonPath("$.totalUsers").value(100))
                .andExpect(jsonPath("$.monthlyRevenue").exists());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void getDashboardOverview_AsManager_Success() throws Exception {
        when(roomRepository.findAll()).thenReturn(Arrays.asList(testRoom));
        when(reservationRepository.countByStatus(any())).thenReturn(0L);
        when(reservationRepository.findByStatus(any())).thenReturn(Collections.emptyList());
        when(userRepository.count()).thenReturn(50L);
        when(reservationRepository.findByCreatedAtBetween(any(), any())).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/admin/dashboard"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "USER")
    void getDashboardOverview_AsUser_Forbidden() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getAllUsers_Success() throws Exception {
        when(userRepository.findAll()).thenReturn(Arrays.asList(testUser));

        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("user123"))
                .andExpect(jsonPath("$[0].email").value("john@example.com"))
                .andExpect(jsonPath("$[0].firstName").value("John"))
                .andExpect(jsonPath("$[0].lastName").value("Doe"));
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void getAllUsers_AsManager_Success() throws Exception {
        when(userRepository.findAll()).thenReturn(Arrays.asList(testUser));

        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getUserById_Success() throws Exception {
        when(userRepository.findById("user123")).thenReturn(Optional.of(testUser));

        mockMvc.perform(get("/api/admin/users/user123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("user123"))
                .andExpect(jsonPath("$.email").value("john@example.com"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getUserById_NotFound() throws Exception {
        when(userRepository.findById("invalid")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/admin/users/invalid"))
                .andExpect(status().isInternalServerError());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateUserStatus_Success() throws Exception {
        when(userRepository.findById("user123")).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        Map<String, Boolean> request = new HashMap<>();
        request.put("enabled", false);

        mockMvc.perform(put("/api/admin/users/user123/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("user123"));

        verify(userRepository).save(argThat(user -> !user.isEnabled()));
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void updateUserStatus_AsManager_Forbidden() throws Exception {
        Map<String, Boolean> request = new HashMap<>();
        request.put("enabled", false);

        mockMvc.perform(put("/api/admin/users/user123/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteUser_Success() throws Exception {
        doNothing().when(userRepository).deleteById("user123");

        mockMvc.perform(delete("/api/admin/users/user123"))
                .andExpect(status().isNoContent());

        verify(userRepository).deleteById("user123");
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getAllRooms_Success() throws Exception {
        when(roomRepository.findAll()).thenReturn(Arrays.asList(testRoom));

        mockMvc.perform(get("/api/admin/rooms"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("room123"))
                .andExpect(jsonPath("$[0].type").value("DELUXE"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getRoomStatistics_Success() throws Exception {
        when(roomRepository.findAll()).thenReturn(Arrays.asList(testRoom));
        when(reservationRepository.findByStatus(Reservation.ReservationStatus.CONFIRMED))
                .thenReturn(Arrays.asList(testReservation));
        when(reservationRepository.findByStatus(Reservation.ReservationStatus.CHECKED_IN))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/admin/rooms/statistics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRooms").value(10))
                .andExpect(jsonPath("$.occupiedRooms").value(1))
                .andExpect(jsonPath("$.availableRooms").value(9))
                .andExpect(jsonPath("$.occupancyRate").exists())
                .andExpect(jsonPath("$.roomsByType").exists());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getAllReservations_Success() throws Exception {
        when(reservationRepository.findAll()).thenReturn(Arrays.asList(testReservation));

        mockMvc.perform(get("/api/admin/reservations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("res123"))
                .andExpect(jsonPath("$[0].status").value("CONFIRMED"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getReservationsByDateRange_Success() throws Exception {
        LocalDate startDate = LocalDate.now();
        LocalDate endDate = LocalDate.now().plusDays(7);

        when(reservationRepository.findByCheckInDateBetween(startDate, endDate))
                .thenReturn(Arrays.asList(testReservation));

        mockMvc.perform(get("/api/admin/reservations/date-range")
                        .param("startDate", startDate.toString())
                        .param("endDate", endDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("res123"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateReservationStatus_Success() throws Exception {
        when(reservationRepository.findById("res123")).thenReturn(Optional.of(testReservation));
        when(reservationRepository.save(any(Reservation.class))).thenReturn(testReservation);

        Map<String, String> request = new HashMap<>();
        request.put("status", "CHECKED_IN");

        mockMvc.perform(put("/api/admin/reservations/res123/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("res123"));

        verify(reservationRepository).save(argThat(res ->
            res.getStatus() == Reservation.ReservationStatus.CHECKED_IN));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getReservationStatistics_Success() throws Exception {
        when(reservationRepository.findAll()).thenReturn(Arrays.asList(testReservation));

        mockMvc.perform(get("/api/admin/reservations/statistics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalReservations").value(1))
                .andExpect(jsonPath("$.reservationsByStatus").exists())
                .andExpect(jsonPath("$.totalRevenue").exists());
    }
}
