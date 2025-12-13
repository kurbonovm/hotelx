package com.hotel.reservation.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * DTO for user registration request.
 *
 * @author Hotel Reservation Team
 * @version 1.0
 */
@Data
public class RegisterRequest {

    /**
     * User's first name
     */
    @NotBlank(message = "First name is required")
    private String firstName;

    /**
     * User's last name
     */
    @NotBlank(message = "Last name is required")
    private String lastName;

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
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    /**
     * User's phone number
     */
    @NotBlank(message = "Phone number is required")
    private String phoneNumber;
}
