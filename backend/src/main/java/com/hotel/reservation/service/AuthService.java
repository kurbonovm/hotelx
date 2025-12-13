package com.hotel.reservation.service;

import com.hotel.reservation.dto.AuthResponse;
import com.hotel.reservation.dto.LoginRequest;
import com.hotel.reservation.dto.RegisterRequest;
import com.hotel.reservation.dto.UserDto;
import com.hotel.reservation.model.User;
import com.hotel.reservation.repository.UserRepository;
import com.hotel.reservation.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Set;

/**
 * Service class for authentication operations.
 * Handles user registration, login, and token generation.
 *
 * @author Hotel Reservation Team
 * @version 1.0
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    /**
     * Register a new user.
     *
     * @param registerRequest registration details
     * @return authentication response with token
     * @throws RuntimeException if email already exists
     */
    public AuthResponse register(RegisterRequest registerRequest) {
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new RuntimeException("Email already in use");
        }

        User user = new User();
        user.setFirstName(registerRequest.getFirstName());
        user.setLastName(registerRequest.getLastName());
        user.setEmail(registerRequest.getEmail());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setPhoneNumber(registerRequest.getPhoneNumber());

        Set<User.Role> roles = new HashSet<>();
        roles.add(User.Role.GUEST);
        user.setRoles(roles);
        user.setEnabled(true);

        User savedUser = userRepository.save(user);

        String token = tokenProvider.generateTokenFromUserId(savedUser.getId());
        UserDto userDto = mapToUserDto(savedUser);

        return new AuthResponse(token, userDto);
    }

    /**
     * Authenticate user login.
     *
     * @param loginRequest login credentials
     * @return authentication response with token
     */
    public AuthResponse login(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);

        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserDto userDto = mapToUserDto(user);

        return new AuthResponse(token, userDto);
    }

    /**
     * Map User entity to UserDto.
     *
     * @param user the user entity
     * @return UserDto
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
