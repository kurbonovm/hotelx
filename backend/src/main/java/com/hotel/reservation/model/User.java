package com.hotel.reservation.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * User entity representing a user in the system.
 * Users can be guests, managers, or administrators.
 *
 * @author Hotel Reservation Team
 * @version 1.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {

    /**
     * Unique identifier for the user
     */
    @Id
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
     * User's email address (unique)
     */
    @Indexed(unique = true)
    private String email;

    /**
     * User's hashed password
     */
    private String password;

    /**
     * User's phone number
     */
    private String phoneNumber;

    /**
     * User's roles (GUEST, MANAGER, ADMIN)
     */
    private Set<Role> roles = new HashSet<>();

    /**
     * OAuth2 provider (google, facebook, null for local auth)
     */
    private String provider;

    /**
     * OAuth2 provider user ID
     */
    private String providerId;

    /**
     * User's profile image URL
     */
    private String avatar;

    /**
     * Whether the account is enabled
     */
    private boolean enabled = true;

    /**
     * Account creation timestamp
     */
    @CreatedDate
    private LocalDateTime createdAt;

    /**
     * Account last modification timestamp
     */
    @LastModifiedDate
    private LocalDateTime updatedAt;

    /**
     * User roles enum
     */
    public enum Role {
        GUEST,
        MANAGER,
        ADMIN
    }
}
