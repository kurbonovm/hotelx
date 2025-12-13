package com.hotel.reservation.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Room entity representing a hotel room.
 * Contains information about room type, pricing, amenities, and capacity.
 *
 * @author Hotel Reservation Team
 * @version 1.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "rooms")
public class Room {

    /**
     * Unique identifier for the room
     */
    @Id
    private String id;

    /**
     * Room name/number
     */
    private String name;

    /**
     * Room type (Standard, Deluxe, Suite, Presidential)
     */
    private RoomType type;

    /**
     * Detailed description of the room
     */
    private String description;

    /**
     * Price per night
     */
    private BigDecimal pricePerNight;

    /**
     * Maximum number of guests allowed
     */
    private int capacity;

    /**
     * List of amenities available in the room
     */
    private List<String> amenities = new ArrayList<>();

    /**
     * URL of the room's primary image
     */
    private String imageUrl;

    /**
     * List of additional image URLs
     */
    private List<String> additionalImages = new ArrayList<>();

    /**
     * Whether the room is currently available
     */
    private boolean available = true;

    /**
     * Total number of rooms of this type available in the hotel
     */
    private int totalRooms = 1;

    /**
     * Floor number where the room is located
     */
    private int floorNumber;

    /**
     * Size of the room in square feet
     */
    private int size;

    /**
     * Room creation timestamp
     */
    @CreatedDate
    private LocalDateTime createdAt;

    /**
     * Room last modification timestamp
     */
    @LastModifiedDate
    private LocalDateTime updatedAt;

    /**
     * Room type enumeration
     */
    public enum RoomType {
        STANDARD,
        DELUXE,
        SUITE,
        PRESIDENTIAL
    }
}
