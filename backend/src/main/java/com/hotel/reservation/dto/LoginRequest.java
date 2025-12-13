package com.hotel.reservation.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * DTO for login request.
 *
 * @author Hotel Reservation Team
 * @version 1.0
 */
@Data
public class LoginRequest {

    /**
     * User's email address
     */
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    /**
     * User's password
     */
    @NotBlank(message = "Password is required")
    private String password;
}
