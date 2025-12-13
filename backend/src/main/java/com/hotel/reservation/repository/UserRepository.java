package com.hotel.reservation.repository;

import com.hotel.reservation.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository interface for User entity.
 * Provides database operations for user management.
 *
 * @author Hotel Reservation Team
 * @version 1.0
 */
@Repository
public interface UserRepository extends MongoRepository<User, String> {

    /**
     * Find a user by email address.
     *
     * @param email the email address to search for
     * @return Optional containing the user if found
     */
    Optional<User> findByEmail(String email);

    /**
     * Find a user by OAuth2 provider and provider ID.
     *
     * @param provider the OAuth2 provider (google, facebook)
     * @param providerId the provider's user ID
     * @return Optional containing the user if found
     */
    Optional<User> findByProviderAndProviderId(String provider, String providerId);

    /**
     * Check if a user exists with the given email.
     *
     * @param email the email address to check
     * @return true if a user exists with this email
     */
    boolean existsByEmail(String email);
}
