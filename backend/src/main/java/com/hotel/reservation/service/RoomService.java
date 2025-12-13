package com.hotel.reservation.service;

import com.hotel.reservation.model.Room;
import com.hotel.reservation.repository.RoomRepository;
import com.hotel.reservation.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service class for room management operations.
 * Handles CRUD operations and room availability checks.
 *
 * @author Hotel Reservation Team
 * @version 1.0
 */
@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final ReservationRepository reservationRepository;

    /**
     * Get all rooms.
     *
     * @return list of all rooms
     */
    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }

    /**
     * Get room by ID.
     *
     * @param id room ID
     * @return room entity
     * @throws RuntimeException if room not found
     */
    public Room getRoomById(String id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Room not found with id: " + id));
    }

    /**
     * Get available rooms for specific dates.
     *
     * @param checkInDate check-in date
     * @param checkOutDate check-out date
     * @param guests number of guests
     * @return list of available rooms
     */
    public List<Room> getAvailableRooms(LocalDate checkInDate, LocalDate checkOutDate, int guests) {
        List<Room> allRooms = roomRepository.findByCapacityGreaterThanEqual(guests);

        return allRooms.stream()
                .filter(room -> isRoomAvailable(room.getId(), checkInDate, checkOutDate))
                .collect(Collectors.toList());
    }

    /**
     * Check if a room is available for specific dates.
     *
     * @param roomId room ID
     * @param checkInDate check-in date
     * @param checkOutDate check-out date
     * @return true if room is available
     */
    public boolean isRoomAvailable(String roomId, LocalDate checkInDate, LocalDate checkOutDate) {
        List<?> overlappingReservations = reservationRepository
                .findOverlappingReservations(roomId, checkInDate, checkOutDate);
        return overlappingReservations.isEmpty();
    }

    /**
     * Create a new room.
     *
     * @param room room entity
     * @return created room
     */
    @Transactional
    public Room createRoom(Room room) {
        return roomRepository.save(room);
    }

    /**
     * Update an existing room.
     *
     * @param id room ID
     * @param roomDetails updated room details
     * @return updated room
     * @throws RuntimeException if room not found
     */
    @Transactional
    public Room updateRoom(String id, Room roomDetails) {
        Room room = getRoomById(id);

        room.setName(roomDetails.getName());
        room.setType(roomDetails.getType());
        room.setDescription(roomDetails.getDescription());
        room.setPricePerNight(roomDetails.getPricePerNight());
        room.setCapacity(roomDetails.getCapacity());
        room.setAmenities(roomDetails.getAmenities());
        room.setImageUrl(roomDetails.getImageUrl());
        room.setAdditionalImages(roomDetails.getAdditionalImages());
        room.setAvailable(roomDetails.isAvailable());
        room.setFloorNumber(roomDetails.getFloorNumber());
        room.setSize(roomDetails.getSize());

        return roomRepository.save(room);
    }

    /**
     * Delete a room.
     *
     * @param id room ID
     * @throws RuntimeException if room not found
     */
    @Transactional
    public void deleteRoom(String id) {
        Room room = getRoomById(id);
        roomRepository.delete(room);
    }

    /**
     * Filter rooms by criteria.
     *
     * @param type room type (optional)
     * @param minPrice minimum price (optional)
     * @param maxPrice maximum price (optional)
     * @return list of filtered rooms
     */
    public List<Room> filterRooms(Room.RoomType type, BigDecimal minPrice, BigDecimal maxPrice) {
        // Start with all available rooms or rooms of specific type
        List<Room> rooms;
        if (type != null) {
            rooms = roomRepository.findByTypeAndAvailable(type, true);
        } else {
            rooms = roomRepository.findByAvailable(true);
        }

        // Apply price filters
        return rooms.stream()
                .filter(room -> {
                    boolean passesMinPrice = minPrice == null || room.getPricePerNight().compareTo(minPrice) >= 0;
                    boolean passesMaxPrice = maxPrice == null || room.getPricePerNight().compareTo(maxPrice) <= 0;
                    return passesMinPrice && passesMaxPrice;
                })
                .collect(Collectors.toList());
    }
}
