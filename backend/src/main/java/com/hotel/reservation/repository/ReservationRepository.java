package com.hotel.reservation.repository;

import com.hotel.reservation.model.Reservation;
import com.hotel.reservation.model.Room;
import com.hotel.reservation.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * Repository interface for Reservation entity.
 * Provides database operations for reservation management.
 *
 * @author Hotel Reservation Team
 * @version 1.0
 */
@Repository
public interface ReservationRepository extends MongoRepository<Reservation, String> {

    /**
     * Find all reservations for a specific user.
     *
     * @param user the user to search for
     * @return list of reservations for the user
     */
    List<Reservation> findByUser(User user);

    /**
     * Find all reservations for a specific user by user ID.
     *
     * @param userId the user ID to search for
     * @return list of reservations for the user
     */
    List<Reservation> findByUserId(String userId);

    /**
     * Find all reservations for a specific room.
     *
     * @param room the room to search for
     * @return list of reservations for the room
     */
    List<Reservation> findByRoom(Room room);

    /**
     * Find reservations by status.
     *
     * @param status the reservation status
     * @return list of reservations with the specified status
     */
    List<Reservation> findByStatus(Reservation.ReservationStatus status);

    /**
     * Find overlapping reservations for a room.
     * This is critical for preventing overbooking.
     *
     * @param roomId the room ID
     * @param checkInDate the check-in date
     * @param checkOutDate the check-out date
     * @return list of overlapping reservations
     */
    @Query("{ 'room.$id': ?0, " +
           "'status': { $in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] }, " +
           "$or: [" +
           "  { 'checkInDate': { $lt: ?2 }, 'checkOutDate': { $gt: ?1 } }, " +
           "  { 'checkInDate': { $gte: ?1, $lt: ?2 } }, " +
           "  { 'checkOutDate': { $gt: ?1, $lte: ?2 } }" +
           "]}")
    List<Reservation> findOverlappingReservations(String roomId, LocalDate checkInDate, LocalDate checkOutDate);

    /**
     * Find reservations by date range.
     *
     * @param startDate start date of the range
     * @param endDate end date of the range
     * @return list of reservations within the date range
     */
    @Query("{ $or: [" +
           "  { 'checkInDate': { $gte: ?0, $lte: ?1 } }, " +
           "  { 'checkOutDate': { $gte: ?0, $lte: ?1 } }, " +
           "  { 'checkInDate': { $lte: ?0 }, 'checkOutDate': { $gte: ?1 } }" +
           "]}")
    List<Reservation> findByDateRange(LocalDate startDate, LocalDate endDate);

    /**
     * Count reservations by status.
     *
     * @param status the reservation status
     * @return count of reservations with the specified status
     */
    long countByStatus(Reservation.ReservationStatus status);

    /**
     * Find reservations by check-in date range.
     *
     * @param startDate start date
     * @param endDate end date
     * @return list of reservations with check-in dates within the range
     */
    List<Reservation> findByCheckInDateBetween(LocalDate startDate, LocalDate endDate);

    /**
     * Find reservations created between dates.
     *
     * @param startDateTime start date time
     * @param endDateTime end date time
     * @return list of reservations created within the date range
     */
    List<Reservation> findByCreatedAtBetween(java.time.LocalDateTime startDateTime, java.time.LocalDateTime endDateTime);
}
