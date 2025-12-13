package com.hotel.reservation.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Reservation entity representing a hotel room reservation.
 * Contains booking details, guest information, and payment status.
 *
 * @author Hotel Reservation Team
 * @version 1.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "reservations")
public class Reservation {

    /**
     * Unique identifier for the reservation
     */
    @Id
    private String id;

    /**
     * Reference to the user who made the reservation
     */
    @DBRef
    private User user;

    /**
     * Reference to the reserved room
     */
    @DBRef
    private Room room;

    /**
     * Check-in date
     */
    private LocalDate checkInDate;

    /**
     * Check-out date
     */
    private LocalDate checkOutDate;

    /**
     * Number of guests for this reservation
     */
    private int numberOfGuests;

    /**
     * Total amount for the reservation
     */
    private BigDecimal totalAmount;

    /**
     * Current status of the reservation
     */
    private ReservationStatus status = ReservationStatus.PENDING;

    /**
     * Special requests or notes from the guest
     */
    private String specialRequests;

    /**
     * Payment ID associated with this reservation
     */
    private String paymentId;

    /**
     * Confirmation email sent flag
     */
    private boolean confirmationEmailSent = false;

    /**
     * Reservation creation timestamp
     */
    @CreatedDate
    private LocalDateTime createdAt;

    /**
     * Reservation last modification timestamp
     */
    @LastModifiedDate
    private LocalDateTime updatedAt;

    /**
     * Cancellation reason (if cancelled)
     */
    private String cancellationReason;

    /**
     * Cancellation timestamp
     */
    private LocalDateTime cancelledAt;

    /**
     * Reservation status enumeration
     */
    public enum ReservationStatus {
        PENDING,
        CONFIRMED,
        CHECKED_IN,
        CHECKED_OUT,
        CANCELLED
    }
}
