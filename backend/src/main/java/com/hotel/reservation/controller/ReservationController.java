package com.hotel.reservation.controller;

import com.hotel.reservation.model.Reservation;
import com.hotel.reservation.model.User;
import com.hotel.reservation.repository.UserRepository;
import com.hotel.reservation.security.UserPrincipal;
import com.hotel.reservation.service.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * REST controller for reservation management endpoints.
 * Handles reservation CRUD operations with authorization.
 *
 * @author Hotel Reservation Team
 * @version 1.0
 */
@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;
    private final UserRepository userRepository;

    /**
     * Get all reservations (Admin/Manager only).
     *
     * @return list of all reservations
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<Reservation>> getAllReservations() {
        List<Reservation> reservations = reservationService.getAllReservations();
        return ResponseEntity.ok(reservations);
    }

    /**
     * Get user's own reservations.
     *
     * @param userPrincipal authenticated user
     * @return list of user's reservations
     */
    @GetMapping("/my-reservations")
    public ResponseEntity<List<Reservation>> getUserReservations(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<Reservation> reservations = reservationService.getUserReservations(userPrincipal.getId());
        return ResponseEntity.ok(reservations);
    }

    /**
     * Get reservation by ID.
     *
     * @param id reservation ID
     * @param userPrincipal authenticated user
     * @return reservation entity
     */
    @GetMapping("/{id}")
    public ResponseEntity<Reservation> getReservationById(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        Reservation reservation = reservationService.getReservationById(id);

        // Check if user is admin/manager from security context
        org.springframework.security.core.Authentication authentication =
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();

        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") ||
                        a.getAuthority().equals("ROLE_MANAGER"));

        boolean isOwner = false;
        if (userPrincipal != null && reservation.getUser() != null) {
            String userId = userPrincipal.getId();
            if (userId != null) {
                isOwner = userId.equals(reservation.getUser().getId());
            }
        }

        if (!isAdmin && !isOwner) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(reservation);
    }

    /**
     * Create a new reservation.
     *
     * @param userPrincipal authenticated user
     * @param reservationData reservation details
     * @return created reservation
     */
    @PostMapping
    public ResponseEntity<Reservation> createReservation(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody Map<String, Object> reservationData) {

        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String roomId = (String) reservationData.get("roomId");
        LocalDate checkInDate = LocalDate.parse((String) reservationData.get("checkInDate"));
        LocalDate checkOutDate = LocalDate.parse((String) reservationData.get("checkOutDate"));
        int numberOfGuests = (int) reservationData.get("numberOfGuests");
        String specialRequests = (String) reservationData.getOrDefault("specialRequests", "");

        Reservation reservation = reservationService.createReservation(
                user, roomId, checkInDate, checkOutDate, numberOfGuests, specialRequests);

        return ResponseEntity.status(HttpStatus.CREATED).body(reservation);
    }

    /**
     * Update a reservation.
     *
     * @param id reservation ID
     * @param userPrincipal authenticated user
     * @param reservationData updated reservation details
     * @return updated reservation
     */
    @PutMapping("/{id}")
    public ResponseEntity<Reservation> updateReservation(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody Map<String, Object> reservationData) {

        Reservation existing = reservationService.getReservationById(id);

        if (!existing.getUser().getId().equals(userPrincipal.getId()) &&
                !userPrincipal.getAuthorities().stream()
                        .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") ||
                                a.getAuthority().equals("ROLE_MANAGER"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        LocalDate checkInDate = LocalDate.parse((String) reservationData.get("checkInDate"));
        LocalDate checkOutDate = LocalDate.parse((String) reservationData.get("checkOutDate"));
        int numberOfGuests = (int) reservationData.get("numberOfGuests");

        Reservation updated = reservationService.updateReservation(id, checkInDate, checkOutDate, numberOfGuests);
        return ResponseEntity.ok(updated);
    }

    /**
     * Cancel a reservation.
     *
     * @param id reservation ID
     * @param userPrincipal authenticated user
     * @param cancellationData cancellation details
     * @return cancelled reservation
     */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<Reservation> cancelReservation(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody(required = false) Map<String, String> cancellationData) {

        Reservation existing = reservationService.getReservationById(id);

        if (!existing.getUser().getId().equals(userPrincipal.getId()) &&
                !userPrincipal.getAuthorities().stream()
                        .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") ||
                                a.getAuthority().equals("ROLE_MANAGER"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        String reason = cancellationData != null ?
                cancellationData.getOrDefault("reason", "User requested cancellation") :
                "User requested cancellation";

        Reservation cancelled = reservationService.cancelReservation(id, reason);
        return ResponseEntity.ok(cancelled);
    }

    /**
     * Get reservations by date range (Admin/Manager only).
     *
     * @param startDate start date
     * @param endDate end date
     * @return list of reservations in date range
     */
    @GetMapping("/date-range")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<Reservation>> getReservationsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        List<Reservation> reservations = reservationService.getReservationsByDateRange(startDate, endDate);
        return ResponseEntity.ok(reservations);
    }
}
