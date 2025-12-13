package com.hotel.reservation.repository;

import com.hotel.reservation.model.Room;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

/**
 * Repository interface for Room entity.
 * Provides database operations for room management.
 *
 * @author Hotel Reservation Team
 * @version 1.0
 */
@Repository
public interface RoomRepository extends MongoRepository<Room, String> {

    /**
     * Find rooms by type.
     *
     * @param type the room type to search for
     * @return list of rooms matching the type
     */
    List<Room> findByType(Room.RoomType type);

    /**
     * Find available rooms.
     *
     * @param available the availability status
     * @return list of available rooms
     */
    List<Room> findByAvailable(boolean available);

    /**
     * Find rooms by type and availability.
     *
     * @param type the room type
     * @param available the availability status
     * @return list of rooms matching the criteria
     */
    List<Room> findByTypeAndAvailable(Room.RoomType type, boolean available);

    /**
     * Find rooms within a price range.
     *
     * @param minPrice minimum price per night
     * @param maxPrice maximum price per night
     * @return list of rooms within the price range
     */
    List<Room> findByPricePerNightBetween(BigDecimal minPrice, BigDecimal maxPrice);

    /**
     * Find rooms with minimum capacity.
     *
     * @param capacity minimum number of guests
     * @return list of rooms with at least the specified capacity
     */
    List<Room> findByCapacityGreaterThanEqual(int capacity);

    /**
     * Count rooms by availability.
     *
     * @param available the availability status
     * @return count of rooms with the specified availability
     */
    long countByAvailable(boolean available);
}
