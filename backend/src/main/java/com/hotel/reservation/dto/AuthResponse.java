package com.hotel.reservation.dto;

import com.hotel.reservation.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for authentication response containing JWT token and user info.
 *
 * @author Hotel Reservation Team
 * @version 1.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    /**
     * JWT authentication token
     */
    private String token;

    /**
     * Token type (Bearer)
     */
    private String type = "Bearer";

    /**
     * User information
     */
    private UserDto user;

    /**
     * Constructor with token and user
     *
     * @param token JWT token
     * @param user user data transfer object
     */
    public AuthResponse(String token, UserDto user) {
        this.token = token;
        this.user = user;
    }
}
