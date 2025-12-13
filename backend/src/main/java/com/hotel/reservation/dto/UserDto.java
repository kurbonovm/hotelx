package com.hotel.reservation.dto;

import com.hotel.reservation.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

/**
 * DTO for User entity to expose user information without sensitive data.
 *
 * @author Hotel Reservation Team
 * @version 1.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {

    /**
     * User's unique identifier
     */
    private String id;

    /**
     * User's first name
     */
    private String firstName;

    /**
     * User's last name
     */
    private String lastName;

    /**
     * User's email address
     */
    private String email;

    /**
     * User's phone number
     */
    private String phoneNumber;

    /**
     * User's roles
     */
    private Set<User.Role> roles;

    /**
     * User's avatar/profile image URL
     */
    private String avatar;

    /**
     * OAuth2 provider (if applicable)
     */
    private String provider;

    /**
     * User's account status (enabled/disabled)
     */
    private boolean enabled;
}
