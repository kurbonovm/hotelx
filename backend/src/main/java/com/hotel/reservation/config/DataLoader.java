package com.hotel.reservation.config;

import com.hotel.reservation.model.Room;
import com.hotel.reservation.model.User;
import com.hotel.reservation.repository.RoomRepository;
import com.hotel.reservation.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

/**
 * Data loader to initialize the database with sample data.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataLoader implements CommandLineRunner {

    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        log.info("Starting data initialization...");

        // Only load data if database is empty
        if (roomRepository.count() == 0) {
            loadRooms();
            log.info("Sample rooms loaded successfully!");
        } else {
            log.info("Database already contains data. Skipping initialization.");
        }

        // Create default admin user if not exists
        if (userRepository.findByEmail("admin@hotel.com").isEmpty()) {
            createAdminUser();
            log.info("Default admin user created!");
        }
    }

    private void loadRooms() {
        List<Room> rooms = Arrays.asList(
            // Deluxe Rooms
            createRoom(
                "Deluxe Ocean View Suite",
                "DELUXE",
                "Experience luxury with breathtaking ocean views. This spacious suite features a king-size bed, private balcony, and modern amenities.",
                299.99,
                4,
                85,
                Arrays.asList(
                    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
                    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800",
                    "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800"
                ),
                Arrays.asList("Ocean View", "King Bed", "Private Balcony", "Mini Bar", "Smart TV", "Free WiFi", "Room Service", "Luxury Bathroom")
            ),
            createRoom(
                "Executive Business Suite",
                "DELUXE",
                "Perfect for business travelers. Features a dedicated workspace, high-speed internet, and premium coffee maker.",
                279.99,
                2,
                65,
                Arrays.asList(
                    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
                    "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800"
                ),
                Arrays.asList("Work Desk", "Queen Bed", "Ergonomic Chair", "Coffee Maker", "Smart TV", "Free WiFi", "City View", "Premium Toiletries")
            ),
            createRoom(
                "Romantic Honeymoon Suite",
                "DELUXE",
                "Celebrate love in style with champagne on arrival, rose petals, and a luxurious jacuzzi tub.",
                349.99,
                2,
                95,
                Arrays.asList(
                    "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800",
                    "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800"
                ),
                Arrays.asList("King Bed", "Jacuzzi Tub", "Champagne", "Rose Petals", "Fireplace", "Private Balcony", "Ocean View", "Room Service")
            ),

            // Standard Rooms
            createRoom(
                "Standard Double Room",
                "STANDARD",
                "Comfortable and affordable accommodation with all the essentials for a pleasant stay.",
                149.99,
                2,
                40,
                Arrays.asList(
                    "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800",
                    "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800"
                ),
                Arrays.asList("Double Bed", "Air Conditioning", "Free WiFi", "Flat Screen TV", "Private Bathroom", "Daily Housekeeping")
            ),
            createRoom(
                "Standard Twin Room",
                "STANDARD",
                "Ideal for friends or colleagues traveling together. Features two comfortable single beds.",
                159.99,
                2,
                40,
                Arrays.asList(
                    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800"
                ),
                Arrays.asList("Two Single Beds", "Air Conditioning", "Free WiFi", "Flat Screen TV", "Work Desk", "Private Bathroom")
            ),
            createRoom(
                "Standard City View",
                "STANDARD",
                "Enjoy views of the bustling city from your comfortable room with modern amenities.",
                169.99,
                2,
                40,
                Arrays.asList(
                    "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800"
                ),
                Arrays.asList("Queen Bed", "City View", "Air Conditioning", "Free WiFi", "Mini Fridge", "Coffee Maker", "Private Bathroom")
            ),

            // Suite Rooms
            createRoom(
                "Presidential Suite",
                "SUITE",
                "The ultimate luxury experience. Spacious living area, dining room, master bedroom, and stunning panoramic views.",
                599.99,
                6,
                150,
                Arrays.asList(
                    "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800",
                    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
                    "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800"
                ),
                Arrays.asList("King Bed", "Living Room", "Dining Area", "Kitchen", "Panoramic View", "Jacuzzi", "Private Balcony", "Butler Service", "Premium Minibar")
            ),
            createRoom(
                "Family Suite",
                "SUITE",
                "Perfect for families! Separate bedroom, living area with sofa bed, and kid-friendly amenities.",
                399.99,
                5,
                110,
                Arrays.asList(
                    "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800",
                    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800"
                ),
                Arrays.asList("King Bed", "Sofa Bed", "Separate Living Room", "Kitchenette", "Two Bathrooms", "Kids Welcome Pack", "Family Games", "Free WiFi")
            ),
            createRoom(
                "Penthouse Suite",
                "SUITE",
                "Top floor luxury with private elevator access, rooftop terrace, and 360-degree city views.",
                799.99,
                4,
                200,
                Arrays.asList(
                    "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800",
                    "https://images.unsplash.com/photo-1571508601936-4e3f0d229c47?w=800",
                    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800"
                ),
                Arrays.asList("King Bed", "Private Elevator", "Rooftop Terrace", "Full Kitchen", "Wine Cellar", "Home Theater", "Gym Access", "Private Chef Available")
            ),

            // More Standard Rooms (Budget-friendly options)
            createRoom(
                "Standard Single Room",
                "STANDARD",
                "Budget-friendly option for solo travelers. Clean, comfortable, and conveniently located.",
                89.99,
                1,
                25,
                Arrays.asList(
                    "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800"
                ),
                Arrays.asList("Single Bed", "Air Conditioning", "Free WiFi", "Private Bathroom", "Daily Housekeeping")
            ),
            createRoom(
                "Standard Garden View",
                "STANDARD",
                "Great value for money. Simple and clean accommodation with garden views.",
                119.99,
                2,
                35,
                Arrays.asList(
                    "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800"
                ),
                Arrays.asList("Double Bed", "Garden View", "Air Conditioning", "Free WiFi", "Private Bathroom", "Daily Housekeeping", "TV")
            ),
            createRoom(
                "Standard Triple Room",
                "STANDARD",
                "Perfect for small groups. Three comfortable beds in a spacious room.",
                189.99,
                3,
                45,
                Arrays.asList(
                    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800"
                ),
                Arrays.asList("Three Single Beds", "Air Conditioning", "Free WiFi", "Private Bathroom", "Work Desk", "TV", "Mini Fridge")
            )
        );

        roomRepository.saveAll(rooms);
    }

    private Room createRoom(String name, String type, String description, double price,
                          int capacity, double size, List<String> images, List<String> amenities) {
        Room room = new Room();
        room.setName(name);
        room.setType(Room.RoomType.valueOf(type));
        room.setDescription(description);
        room.setPricePerNight(java.math.BigDecimal.valueOf(price));
        room.setCapacity(capacity);
        room.setSize((int) size);
        room.setImageUrl(images.get(0)); // First image as primary
        room.setAdditionalImages(images.subList(1, images.size())); // Rest as additional
        room.setAmenities(amenities);
        room.setAvailable(true);
        return room;
    }

    private void createAdminUser() {
        User admin = new User();
        admin.setEmail("admin@hotel.com");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setFirstName("Admin");
        admin.setLastName("User");
        admin.setPhoneNumber("+1234567890");
        admin.setEnabled(true);
        admin.getRoles().add(User.Role.ADMIN);
        userRepository.save(admin);

        log.info("=".repeat(60));
        log.info("Default Admin User Created:");
        log.info("Email: admin@hotel.com");
        log.info("Password: admin123");
        log.info("=".repeat(60));
    }
}
