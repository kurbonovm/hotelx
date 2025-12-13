package com.hotel.reservation.service;

import com.hotel.reservation.model.Reservation;
import com.hotel.reservation.model.Room;
import com.hotel.reservation.model.User;
import com.hotel.reservation.repository.ReservationRepository;
import com.hotel.reservation.repository.RoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service class for reservation management.
 * Handles booking, cancellation, and modification with overbooking prevention.
 *
 * @author Hotel Reservation Team
 * @version 1.0
 */
@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final RoomRepository roomRepository;
    private final RoomService roomService;
    private final com.hotel.reservation.repository.PaymentRepository paymentRepository;
    private final com.hotel.reservation.service.PaymentService paymentService;

    public ReservationService(ReservationRepository reservationRepository,
                              RoomRepository roomRepository,
                              RoomService roomService,
                              @org.springframework.context.annotation.Lazy com.hotel.reservation.repository.PaymentRepository paymentRepository,
                              @org.springframework.context.annotation.Lazy com.hotel.reservation.service.PaymentService paymentService) {
        this.reservationRepository = reservationRepository;
        this.roomRepository = roomRepository;
        this.roomService = roomService;
        this.paymentRepository = paymentRepository;
        this.paymentService = paymentService;
    }

    /**
     * Get all reservations.
     *
     * @return list of all reservations
     */
    public List<Reservation> getAllReservations() {
        return reservationRepository.findAll();
    }

    /**
     * Get reservation by ID.
     *
     * @param id reservation ID
     * @return reservation entity
     * @throws RuntimeException if reservation not found
     */
    public Reservation getReservationById(String id) {
        return reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reservation not found with id: " + id));
    }

    /**
     * Get all reservations for a user.
     *
     * @param userId user ID
     * @return list of user's reservations
     */
    public List<Reservation> getUserReservations(String userId) {
        return reservationRepository.findByUserId(userId);
    }

    /**
     * Create a new reservation with overbooking prevention.
     * Uses pessimistic locking to ensure atomic updates.
     *
     * @param user the user making the reservation
     * @param roomId room ID
     * @param checkInDate check-in date
     * @param checkOutDate check-out date
     * @param numberOfGuests number of guests
     * @param specialRequests special requests
     * @return created reservation
     * @throws RuntimeException if room is not available or capacity exceeded
     */
    @Transactional
    public synchronized Reservation createReservation(
            User user,
            String roomId,
            LocalDate checkInDate,
            LocalDate checkOutDate,
            int numberOfGuests,
            String specialRequests) {

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        if (numberOfGuests > room.getCapacity()) {
            throw new RuntimeException("Number of guests exceeds room capacity");
        }

        if (!roomService.isRoomAvailable(roomId, checkInDate, checkOutDate)) {
            throw new RuntimeException("Room is not available for the selected dates");
        }

        long numberOfNights = ChronoUnit.DAYS.between(checkInDate, checkOutDate);
        BigDecimal totalAmount = room.getPricePerNight()
                .multiply(BigDecimal.valueOf(numberOfNights));

        Reservation reservation = new Reservation();
        reservation.setUser(user);
        reservation.setRoom(room);
        reservation.setCheckInDate(checkInDate);
        reservation.setCheckOutDate(checkOutDate);
        reservation.setNumberOfGuests(numberOfGuests);
        reservation.setTotalAmount(totalAmount);
        reservation.setSpecialRequests(specialRequests);
        reservation.setStatus(Reservation.ReservationStatus.PENDING);

        return reservationRepository.save(reservation);
    }

    /**
     * Update an existing reservation.
     *
     * @param id reservation ID
     * @param checkInDate new check-in date
     * @param checkOutDate new check-out date
     * @param numberOfGuests new number of guests
     * @return updated reservation
     * @throws RuntimeException if reservation not found or room not available
     */
    @Transactional
    public synchronized Reservation updateReservation(
            String id,
            LocalDate checkInDate,
            LocalDate checkOutDate,
            int numberOfGuests) {

        Reservation reservation = getReservationById(id);

        if (reservation.getStatus() == Reservation.ReservationStatus.CANCELLED) {
            throw new RuntimeException("Cannot modify cancelled reservation");
        }

        Room room = reservation.getRoom();

        if (numberOfGuests > room.getCapacity()) {
            throw new RuntimeException("Number of guests exceeds room capacity");
        }

        List<?> overlappingReservations = reservationRepository
                .findOverlappingReservations(room.getId(), checkInDate, checkOutDate)
                .stream()
                .filter(r -> !r.getId().equals(id))
                .collect(Collectors.toList());

        if (!overlappingReservations.isEmpty()) {
            throw new RuntimeException("Room is not available for the selected dates");
        }

        long numberOfNights = ChronoUnit.DAYS.between(checkInDate, checkOutDate);
        BigDecimal totalAmount = room.getPricePerNight()
                .multiply(BigDecimal.valueOf(numberOfNights));

        reservation.setCheckInDate(checkInDate);
        reservation.setCheckOutDate(checkOutDate);
        reservation.setNumberOfGuests(numberOfGuests);
        reservation.setTotalAmount(totalAmount);

        return reservationRepository.save(reservation);
    }

    /**
     * Cancel a reservation.
     *
     * @param id reservation ID
     * @param reason cancellation reason
     * @return cancelled reservation
     * @throws RuntimeException if reservation not found or already cancelled
     */
    @Transactional
    public Reservation cancelReservation(String id, String reason) {
        Reservation reservation = getReservationById(id);

        if (reservation.getStatus() == Reservation.ReservationStatus.CANCELLED) {
            throw new RuntimeException("Reservation is already cancelled");
        }

        if (reservation.getStatus() == Reservation.ReservationStatus.CHECKED_OUT) {
            throw new RuntimeException("Cannot cancel completed reservation");
        }

        reservation.setStatus(Reservation.ReservationStatus.CANCELLED);
        reservation.setCancellationReason(reason);
        reservation.setCancelledAt(java.time.LocalDateTime.now());

        // Refund payment on Stripe if exists
        paymentRepository.findByReservationId(id).ifPresent(payment -> {
            if (payment.getStatus() == com.hotel.reservation.model.Payment.PaymentStatus.SUCCEEDED) {
                try {
                    paymentService.processRefund(payment.getId(), payment.getAmount(), reason);
                } catch (com.stripe.exception.StripeException e) {
                    // Log error, but do not block cancellation
                    System.err.println("Stripe refund failed: " + e.getMessage());
                }
            }
        });

        return reservationRepository.save(reservation);
    }

    /**
     * Confirm a reservation (after payment).
     *
     * @param id reservation ID
     * @return confirmed reservation
     */
    @Transactional
    public Reservation confirmReservation(String id) {
        Reservation reservation = getReservationById(id);
        reservation.setStatus(Reservation.ReservationStatus.CONFIRMED);
        return reservationRepository.save(reservation);
    }

    /**
     * Get reservations by date range.
     *
     * @param startDate start date
     * @param endDate end date
     * @return list of reservations in date range
     */
    public List<Reservation> getReservationsByDateRange(LocalDate startDate, LocalDate endDate) {
        return reservationRepository.findByDateRange(startDate, endDate);
    }
}
