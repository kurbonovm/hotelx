package com.hotel.reservation.controller;

import com.hotel.reservation.dto.AuthResponse;
import com.hotel.reservation.dto.LoginRequest;
import com.hotel.reservation.dto.RegisterRequest;
import com.hotel.reservation.dto.UserDto;
import com.hotel.reservation.model.User;
import com.hotel.reservation.repository.UserRepository;
import com.hotel.reservation.security.UserPrincipal;
import com.hotel.reservation.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for authentication endpoints.
 * Handles user registration, login, and profile management.
 *
 * @author Hotel Reservation Team
 * @version 1.0
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    /**
     * Register a new user.
     *
     * @param registerRequest registration details
     * @return authentication response with JWT token
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest registerRequest) {
        AuthResponse response = authService.register(registerRequest);
        return ResponseEntity.ok(response);
    }

    /**
     * Authenticate user login.
     *
     * @param loginRequest login credentials
     * @return authentication response with JWT token
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        AuthResponse response = authService.login(loginRequest);
        return ResponseEntity.ok(response);
    }

    /**
     * Get current authenticated user.
     *
     * @param userPrincipal authenticated user principal
     * @return user DTO
     */
    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new org.springframework.security.core.AuthenticationException("User not authenticated") {};
        }

        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserDto userDto = mapToUserDto(user);
        return ResponseEntity.ok(userDto);
    }

    /**
     * Update user profile.
     *
     * @param userPrincipal authenticated user principal
     * @param userDto updated user details
     * @return updated user DTO
     */
    @PutMapping("/profile")
    public ResponseEntity<UserDto> updateProfile(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody UserDto userDto) {

        if (userPrincipal == null) {
            throw new org.springframework.security.core.AuthenticationException("User not authenticated") {};
        }

        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setFirstName(userDto.getFirstName());
        user.setLastName(userDto.getLastName());
        user.setPhoneNumber(userDto.getPhoneNumber());

        User updatedUser = userRepository.save(user);
        return ResponseEntity.ok(mapToUserDto(updatedUser));
    }

    /**
     * Map User entity to UserDto.
     *
     * @param user user entity
     * @return user DTO
     */
    private UserDto mapToUserDto(User user) {
        UserDto userDto = new UserDto();
        userDto.setId(user.getId());
        userDto.setFirstName(user.getFirstName());
        userDto.setLastName(user.getLastName());
        userDto.setEmail(user.getEmail());
        userDto.setPhoneNumber(user.getPhoneNumber());
        userDto.setRoles(user.getRoles());
        userDto.setAvatar(user.getAvatar());
        userDto.setProvider(user.getProvider());
        userDto.setEnabled(user.isEnabled());
        return userDto;
    }
}
