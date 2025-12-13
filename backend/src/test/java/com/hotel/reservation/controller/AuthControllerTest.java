package com.hotel.reservation.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hotel.reservation.dto.AuthResponse;
import com.hotel.reservation.dto.LoginRequest;
import com.hotel.reservation.dto.RegisterRequest;
import com.hotel.reservation.dto.UserDto;
import com.hotel.reservation.model.User;
import com.hotel.reservation.repository.UserRepository;
import com.hotel.reservation.security.UserPrincipal;
import com.hotel.reservation.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.Optional;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private com.hotel.reservation.repository.PaymentRepository paymentRepository;

    @MockBean
    private com.hotel.reservation.repository.ReservationRepository reservationRepository;

    @MockBean
    private com.hotel.reservation.repository.RoomRepository roomRepository;

    private User testUser;
    private UserPrincipal userPrincipal;
    private AuthResponse authResponse;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId("user123");
        testUser.setFirstName("John");
        testUser.setLastName("Doe");
        testUser.setEmail("john@example.com");
        testUser.setPassword("hashedPassword");
        testUser.setPhoneNumber("123-456-7890");
        testUser.setRoles(Set.of(User.Role.GUEST));
        testUser.setEnabled(true);

        userPrincipal = new UserPrincipal(
                testUser.getId(),
                testUser.getEmail(),
                testUser.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_GUEST")),
                true
        );

        UserDto userDto = new UserDto();
        userDto.setId(testUser.getId());
        userDto.setEmail(testUser.getEmail());
        userDto.setFirstName(testUser.getFirstName());
        userDto.setLastName(testUser.getLastName());
        userDto.setRoles(testUser.getRoles());
        userDto.setEnabled(testUser.isEnabled());

        authResponse = new AuthResponse("jwt-token-here", userDto);
    }

    @Test
    void register_Success() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setFirstName("John");
        registerRequest.setLastName("Doe");
        registerRequest.setEmail("john@example.com");
        registerRequest.setPassword("password123");
        registerRequest.setPhoneNumber("123-456-7890");

        when(authService.register(any(RegisterRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token-here"))
                .andExpect(jsonPath("$.user.email").value("john@example.com"))
                .andExpect(jsonPath("$.user.firstName").value("John"))
                .andExpect(jsonPath("$.user.lastName").value("Doe"));

        verify(authService).register(any(RegisterRequest.class));
    }

    @Test
    void register_InvalidData_BadRequest() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest();
        // Missing required fields

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_DuplicateEmail_Conflict() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setFirstName("John");
        registerRequest.setLastName("Doe");
        registerRequest.setEmail("john@example.com");
        registerRequest.setPassword("password123");
        registerRequest.setPhoneNumber("1234567890");

        when(authService.register(any(RegisterRequest.class)))
                .thenThrow(new RuntimeException("Email already exists"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void login_Success() throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("john@example.com");
        loginRequest.setPassword("password123");

        when(authService.login(any(LoginRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token-here"))
                .andExpect(jsonPath("$.user.email").value("john@example.com"));

        verify(authService).login(any(LoginRequest.class));
    }

    @Test
    void login_InvalidCredentials_Unauthorized() throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("john@example.com");
        loginRequest.setPassword("wrongpassword");

        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new RuntimeException("Invalid credentials"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void login_MissingFields_BadRequest() throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        // Missing email and password

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getCurrentUser_Success() throws Exception {
        when(userRepository.findById("user123")).thenReturn(Optional.of(testUser));

        mockMvc.perform(get("/api/auth/me")
                        .with(user(userPrincipal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("user123"))
                .andExpect(jsonPath("$.email").value("john@example.com"))
                .andExpect(jsonPath("$.firstName").value("John"))
                .andExpect(jsonPath("$.lastName").value("Doe"))
                .andExpect(jsonPath("$.phoneNumber").value("123-456-7890"))
                .andExpect(jsonPath("$.enabled").value(true));

        verify(userRepository).findById("user123");
    }

    @Test
    void getCurrentUser_UserNotFound() throws Exception {
        when(userRepository.findById("user123")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/auth/me")
                        .with(user(userPrincipal)))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void getCurrentUser_Unauthenticated_Unauthorized() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void updateProfile_Success() throws Exception {
        when(userRepository.findById("user123")).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        UserDto updateDto = new UserDto();
        updateDto.setFirstName("Jane");
        updateDto.setLastName("Smith");
        updateDto.setPhoneNumber("987-654-3210");

        mockMvc.perform(put("/api/auth/profile")
                        .with(user(userPrincipal))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("user123"));

        verify(userRepository).save(argThat(user ->
                user.getFirstName().equals("Jane") &&
                user.getLastName().equals("Smith") &&
                user.getPhoneNumber().equals("987-654-3210")
        ));
    }

    @Test
    void updateProfile_UserNotFound() throws Exception {
        when(userRepository.findById("user123")).thenReturn(Optional.empty());

        UserDto updateDto = new UserDto();
        updateDto.setFirstName("Jane");
        updateDto.setLastName("Smith");

        mockMvc.perform(put("/api/auth/profile")
                        .with(user(userPrincipal))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void updateProfile_Unauthenticated_Unauthorized() throws Exception {
        UserDto updateDto = new UserDto();
        updateDto.setFirstName("Jane");

        mockMvc.perform(put("/api/auth/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isUnauthorized());
    }
}
