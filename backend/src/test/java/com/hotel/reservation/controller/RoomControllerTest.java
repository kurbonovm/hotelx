package com.hotel.reservation.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hotel.reservation.model.Room;
import com.hotel.reservation.service.RoomService;
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
import java.util.Arrays;
import java.util.Collections;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class RoomControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RoomService roomService;

    @MockBean
    private com.hotel.reservation.repository.PaymentRepository paymentRepository;

    @MockBean
    private com.hotel.reservation.repository.ReservationRepository reservationRepository;

    @MockBean
    private com.hotel.reservation.repository.RoomRepository roomRepository;

    @MockBean
    private com.hotel.reservation.repository.UserRepository userRepository;

    private Room testRoom;

    @BeforeEach
    void setUp() {
        testRoom = new Room();
        testRoom.setId("room123");
        testRoom.setType(Room.RoomType.DELUXE);
        testRoom.setTotalRooms(10);
        testRoom.setPricePerNight(new BigDecimal("150.00"));
        testRoom.setDescription("Luxurious deluxe room");
        testRoom.setAmenities(Arrays.asList("WiFi", "TV", "Mini Bar"));
        testRoom.setCapacity(2);
    }

    @Test
    void getAllRooms_NoFilters_Success() throws Exception {
        when(roomService.getAllRooms()).thenReturn(Arrays.asList(testRoom));

        mockMvc.perform(get("/api/rooms"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("room123"))
                .andExpect(jsonPath("$[0].type").value("DELUXE"))
                .andExpect(jsonPath("$[0].pricePerNight").value(150.00));

        verify(roomService).getAllRooms();
        verify(roomService, never()).filterRooms(any(), any(), any());
    }

    @Test
    void getAllRooms_WithTypeFilter_Success() throws Exception {
        when(roomService.filterRooms(eq(Room.RoomType.DELUXE), isNull(), isNull()))
                .thenReturn(Arrays.asList(testRoom));

        mockMvc.perform(get("/api/rooms")
                        .param("type", "DELUXE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type").value("DELUXE"));

        verify(roomService).filterRooms(eq(Room.RoomType.DELUXE), isNull(), isNull());
    }

    @Test
    void getAllRooms_WithPriceFilters_Success() throws Exception {
        BigDecimal minPrice = new BigDecimal("100.00");
        BigDecimal maxPrice = new BigDecimal("200.00");

        when(roomService.filterRooms(isNull(), eq(minPrice), eq(maxPrice)))
                .thenReturn(Arrays.asList(testRoom));

        mockMvc.perform(get("/api/rooms")
                        .param("minPrice", "100.00")
                        .param("maxPrice", "200.00"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("room123"));

        verify(roomService).filterRooms(isNull(), eq(minPrice), eq(maxPrice));
    }

    @Test
    void getAllRooms_WithAllFilters_Success() throws Exception {
        BigDecimal minPrice = new BigDecimal("100.00");
        BigDecimal maxPrice = new BigDecimal("200.00");

        when(roomService.filterRooms(eq(Room.RoomType.DELUXE), eq(minPrice), eq(maxPrice)))
                .thenReturn(Arrays.asList(testRoom));

        mockMvc.perform(get("/api/rooms")
                        .param("type", "DELUXE")
                        .param("minPrice", "100.00")
                        .param("maxPrice", "200.00"))
                .andExpect(status().isOk());

        verify(roomService).filterRooms(eq(Room.RoomType.DELUXE), eq(minPrice), eq(maxPrice));
    }

    @Test
    void getRoomById_Success() throws Exception {
        when(roomService.getRoomById("room123")).thenReturn(testRoom);

        mockMvc.perform(get("/api/rooms/room123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("room123"))
                .andExpect(jsonPath("$.type").value("DELUXE"))
                .andExpect(jsonPath("$.description").value("Luxurious deluxe room"));
    }

    @Test
    void getRoomById_NotFound() throws Exception {
        when(roomService.getRoomById("invalid"))
                .thenThrow(new RuntimeException("Room not found"));

        mockMvc.perform(get("/api/rooms/invalid"))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void getAvailableRooms_Success() throws Exception {
        LocalDate checkIn = LocalDate.now().plusDays(1);
        LocalDate checkOut = LocalDate.now().plusDays(3);

        when(roomService.getAvailableRooms(checkIn, checkOut, 2))
                .thenReturn(Arrays.asList(testRoom));

        mockMvc.perform(get("/api/rooms/available")
                        .param("checkInDate", checkIn.toString())
                        .param("checkOutDate", checkOut.toString())
                        .param("guests", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("room123"));

        verify(roomService).getAvailableRooms(checkIn, checkOut, 2);
    }

    @Test
    void getAvailableRooms_NoRoomsAvailable() throws Exception {
        LocalDate checkIn = LocalDate.now().plusDays(1);
        LocalDate checkOut = LocalDate.now().plusDays(3);

        when(roomService.getAvailableRooms(checkIn, checkOut, 2))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/rooms/available")
                        .param("checkInDate", checkIn.toString())
                        .param("checkOutDate", checkOut.toString())
                        .param("guests", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createRoom_AsAdmin_Success() throws Exception {
        when(roomService.createRoom(any(Room.class))).thenReturn(testRoom);

        mockMvc.perform(post("/api/rooms")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testRoom)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("room123"))
                .andExpect(jsonPath("$.type").value("DELUXE"));

        verify(roomService).createRoom(any(Room.class));
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void createRoom_AsManager_Success() throws Exception {
        when(roomService.createRoom(any(Room.class))).thenReturn(testRoom);

        mockMvc.perform(post("/api/rooms")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testRoom)))
                .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(roles = "USER")
    void createRoom_AsUser_Forbidden() throws Exception {
        mockMvc.perform(post("/api/rooms")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testRoom)))
                .andExpect(status().isForbidden());
    }

    @Test
    void createRoom_Unauthenticated_Unauthorized() throws Exception {
        mockMvc.perform(post("/api/rooms")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testRoom)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateRoom_Success() throws Exception {
        Room updatedRoom = new Room();
        updatedRoom.setId("room123");
        updatedRoom.setType(Room.RoomType.DELUXE);
        updatedRoom.setPricePerNight(new BigDecimal("180.00"));

        when(roomService.updateRoom(eq("room123"), any(Room.class))).thenReturn(updatedRoom);

        mockMvc.perform(put("/api/rooms/room123")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatedRoom)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("room123"))
                .andExpect(jsonPath("$.pricePerNight").value(180.00));

        verify(roomService).updateRoom(eq("room123"), any(Room.class));
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void updateRoom_AsManager_Success() throws Exception {
        when(roomService.updateRoom(eq("room123"), any(Room.class))).thenReturn(testRoom);

        mockMvc.perform(put("/api/rooms/room123")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testRoom)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "USER")
    void updateRoom_AsUser_Forbidden() throws Exception {
        mockMvc.perform(put("/api/rooms/room123")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testRoom)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteRoom_Success() throws Exception {
        doNothing().when(roomService).deleteRoom("room123");

        mockMvc.perform(delete("/api/rooms/room123"))
                .andExpect(status().isNoContent());

        verify(roomService).deleteRoom("room123");
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void deleteRoom_AsManager_Success() throws Exception {
        doNothing().when(roomService).deleteRoom("room123");

        mockMvc.perform(delete("/api/rooms/room123"))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(roles = "USER")
    void deleteRoom_AsUser_Forbidden() throws Exception {
        mockMvc.perform(delete("/api/rooms/room123"))
                .andExpect(status().isForbidden());
    }
}
