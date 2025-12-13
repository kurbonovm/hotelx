package com.hotel.reservation.controller;

import com.hotel.reservation.model.Room;
import com.hotel.reservation.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * REST controller for room management endpoints.
 * Handles CRUD operations for rooms and availability checks.
 *
 * @author Hotel Reservation Team
 * @version 1.0
 */
@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    /**
     * Get all rooms with optional filtering.
     *
     * @param type room type filter (optional)
     * @param minPrice minimum price filter (optional)
     * @param maxPrice maximum price filter (optional)
     * @return list of rooms
     */
    @GetMapping
    public ResponseEntity<List<Room>> getAllRooms(
            @RequestParam(required = false) Room.RoomType type,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice) {

        List<Room> rooms;
        if (type != null || minPrice != null || maxPrice != null) {
            rooms = roomService.filterRooms(type, minPrice, maxPrice);
        } else {
            rooms = roomService.getAllRooms();
        }

        return ResponseEntity.ok(rooms);
    }

    /**
     * Get room by ID.
     *
     * @param id room ID
     * @return room entity
     */
    @GetMapping("/{id}")
    public ResponseEntity<Room> getRoomById(@PathVariable String id) {
        Room room = roomService.getRoomById(id);
        return ResponseEntity.ok(room);
    }

    /**
     * Get available rooms for specific dates.
     *
     * @param checkInDate check-in date
     * @param checkOutDate check-out date
     * @param guests number of guests
     * @return list of available rooms
     */
    @GetMapping("/available")
    public ResponseEntity<List<Room>> getAvailableRooms(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkInDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOutDate,
            @RequestParam int guests) {

        List<Room> rooms = roomService.getAvailableRooms(checkInDate, checkOutDate, guests);
        return ResponseEntity.ok(rooms);
    }

    /**
     * Create a new room (Manager/Admin only).
     *
     * @param room room details
     * @return created room
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<Room> createRoom(@RequestBody Room room) {
        Room createdRoom = roomService.createRoom(room);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdRoom);
    }

    /**
     * Update an existing room (Manager/Admin only).
     *
     * @param id room ID
     * @param room updated room details
     * @return updated room
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<Room> updateRoom(@PathVariable String id, @RequestBody Room room) {
        Room updatedRoom = roomService.updateRoom(id, room);
        return ResponseEntity.ok(updatedRoom);
    }

    /**
     * Delete a room (Manager/Admin only).
     *
     * @param id room ID
     * @return no content response
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<Void> deleteRoom(@PathVariable String id) {
        roomService.deleteRoom(id);
        return ResponseEntity.noContent().build();
    }
}
