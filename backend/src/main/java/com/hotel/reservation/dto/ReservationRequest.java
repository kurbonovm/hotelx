package com.hotel.reservation.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

/**
 * DTO for reservation creation request.
 *
 * @author Hotel Reservation Team
 * @version 1.0
 */
@Data
public class ReservationRequest {

    /**
     * Room ID for the reservation
     */
    @NotBlank(message = "Room ID is required")
    private String roomId;

    /**
     * Check-in date
     */
    @NotNull(message = "Check-in date is required")
    @Future(message = "Check-in date must be in the future")
    private LocalDate checkInDate;

    /**
     * Check-out date
     */
    @NotNull(message = "Check-out date is required")
    @Future(message = "Check-out date must be in the future")
    private LocalDate checkOutDate;

    /**
     * Number of guests
     */
    @Min(value = 1, message = "At least one guest is required")
    private int numberOfGuests;

    /**
     * Special requests or notes
     */
    private String specialRequests;
}
