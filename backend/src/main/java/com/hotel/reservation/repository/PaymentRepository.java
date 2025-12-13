package com.hotel.reservation.repository;

import com.hotel.reservation.model.Payment;
import com.hotel.reservation.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for Payment entity.
 * Provides database operations for payment management.
 *
 * @author Hotel Reservation Team
 * @version 1.0
 */
@Repository
public interface PaymentRepository extends MongoRepository<Payment, String> {

    /**
     * Find all payments for a specific user.
     *
     * @param user the user to search for
     * @return list of payments for the user
     */
    List<Payment> findByUser(User user);

    /**
     * Find all payments for a specific user by user ID.
     *
     * @param userId the user ID to search for
     * @return list of payments for the user
     */
    List<Payment> findByUserId(String userId);

    /**
     * Find payments by status.
     *
     * @param status the payment status
     * @return list of payments with the specified status
     */
    List<Payment> findByStatus(Payment.PaymentStatus status);

    /**
     * Find payment by Stripe payment intent ID.
     *
     * @param paymentIntentId the Stripe payment intent ID
     * @return Optional containing the payment if found
     */
    Optional<Payment> findByStripePaymentIntentId(String paymentIntentId);

    /**
     * Find payment by reservation ID.
     *
     * @param reservationId the reservation ID
     * @return Optional containing the payment if found
     */
    Optional<Payment> findByReservationId(String reservationId);
}
