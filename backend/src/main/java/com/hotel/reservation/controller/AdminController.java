package com.hotel.reservation.controller;

import com.hotel.reservation.dto.UserDto;
import com.hotel.reservation.model.Reservation;
import com.hotel.reservation.model.Room;
import com.hotel.reservation.model.User;
import com.hotel.reservation.repository.ReservationRepository;
import com.hotel.reservation.repository.RoomRepository;
import com.hotel.reservation.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminController {

    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final ReservationRepository reservationRepository;

    // Dashboard Overview
    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getDashboardOverview() {
        log.info("Getting dashboard overview");

        // Calculate total rooms by summing up totalRooms field from all room types
        List<Room> allRooms = roomRepository.findAll();
        long totalRooms = allRooms.stream()
                .mapToLong(Room::getTotalRooms)
                .sum();

        // Calculate active reservations
        long activeReservations = reservationRepository.countByStatus(Reservation.ReservationStatus.CONFIRMED) +
                                 reservationRepository.countByStatus(Reservation.ReservationStatus.CHECKED_IN);

        // Calculate occupied rooms by counting active reservations
        List<Reservation> activeReservationsList = reservationRepository.findByStatus(Reservation.ReservationStatus.CONFIRMED);
        activeReservationsList.addAll(reservationRepository.findByStatus(Reservation.ReservationStatus.CHECKED_IN));

        long occupiedRooms = activeReservationsList.size();

        long availableRooms = totalRooms - occupiedRooms;
        double occupancyRate = totalRooms > 0 ? ((double)occupiedRooms / totalRooms) * 100 : 0;

        long totalUsers = userRepository.count();

        // Calculate monthly revenue (current month)
        LocalDate now = LocalDate.now();
        LocalDate startOfMonth = now.withDayOfMonth(1);
        List<Reservation> monthlyReservations = reservationRepository
                .findByCreatedAtBetween(startOfMonth.atStartOfDay(), now.atTime(23, 59, 59));

        BigDecimal monthlyRevenue = monthlyReservations.stream()
                .filter(r -> r.getStatus() == Reservation.ReservationStatus.CONFIRMED ||
                            r.getStatus() == Reservation.ReservationStatus.CHECKED_IN ||
                            r.getStatus() == Reservation.ReservationStatus.CHECKED_OUT)
                .map(Reservation::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("totalRooms", totalRooms);
        dashboard.put("availableRooms", availableRooms);
        dashboard.put("occupancyRate", Math.round(occupancyRate * 100.0) / 100.0);
        dashboard.put("activeReservations", activeReservations);
        dashboard.put("totalUsers", totalUsers);
        dashboard.put("monthlyRevenue", monthlyRevenue);

        return ResponseEntity.ok(dashboard);
    }

    // User Management
    @GetMapping("/users")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        log.info("Getting all users");
        List<User> users = userRepository.findAll();
        List<UserDto> userDtos = users.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(userDtos);
    }

    @GetMapping("/users/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<UserDto> getUserById(@PathVariable String id) {
        log.info("Getting user by id: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(convertToDto(user));
    }

    @PutMapping("/users/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> updateUserStatus(
            @PathVariable String id,
            @RequestBody Map<String, Boolean> request) {
        log.info("Updating user status: {}", id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setEnabled(request.get("enabled"));
        User updatedUser = userRepository.save(user);

        return ResponseEntity.ok(convertToDto(updatedUser));
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable String id) {
        log.info("Deleting user: {}", id);
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // Room Management
    @GetMapping("/rooms")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<Room>> getAllRooms() {
        log.info("Getting all rooms");
        return ResponseEntity.ok(roomRepository.findAll());
    }

    @GetMapping("/rooms/statistics")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getRoomStatistics() {
        log.info("Getting room statistics");

        List<Room> allRooms = roomRepository.findAll();

        // Calculate total rooms by summing up totalRooms field from all room types
        long totalRooms = allRooms.stream()
                .mapToLong(Room::getTotalRooms)
                .sum();

        // Calculate occupied rooms based on active reservations count
        List<Reservation> activeReservationsList = reservationRepository.findByStatus(Reservation.ReservationStatus.CONFIRMED);
        activeReservationsList.addAll(reservationRepository.findByStatus(Reservation.ReservationStatus.CHECKED_IN));

        long occupiedRooms = activeReservationsList.size();

        long availableRooms = totalRooms - occupiedRooms;
        double occupancyRate = totalRooms > 0 ? ((double) occupiedRooms / totalRooms) * 100 : 0;

        // Count room types by summing totalRooms for each type
        Map<String, Long> roomsByType = allRooms.stream()
                .collect(Collectors.groupingBy(
                        room -> room.getType().name(),
                        Collectors.summingLong(Room::getTotalRooms)
                ));

        Map<String, Object> statistics = new HashMap<>();
        statistics.put("totalRooms", totalRooms);
        statistics.put("availableRooms", availableRooms);
        statistics.put("occupiedRooms", occupiedRooms);
        statistics.put("occupancyRate", Math.round(occupancyRate * 100.0) / 100.0);
        statistics.put("roomsByType", roomsByType);

        return ResponseEntity.ok(statistics);
    }

    // Reservation Management
    @GetMapping("/reservations")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<Reservation>> getAllReservations() {
        log.info("Getting all reservations");
        return ResponseEntity.ok(reservationRepository.findAll());
    }

    @GetMapping("/reservations/date-range")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<Reservation>> getReservationsByDateRange(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        log.info("Getting reservations by date range: {} to {}", startDate, endDate);

        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);

        List<Reservation> reservations = reservationRepository
                .findByCheckInDateBetween(start, end);

        return ResponseEntity.ok(reservations);
    }

    @PutMapping("/reservations/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Reservation> updateReservationStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        log.info("Updating reservation status: {}", id);

        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));

        String statusStr = request.get("status");
        Reservation.ReservationStatus status = Reservation.ReservationStatus.valueOf(statusStr);

        reservation.setStatus(status);
        Reservation updatedReservation = reservationRepository.save(reservation);

        return ResponseEntity.ok(updatedReservation);
    }

    @GetMapping("/reservations/statistics")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getReservationStatistics() {
        log.info("Getting reservation statistics");

        List<Reservation> allReservations = reservationRepository.findAll();
        long totalReservations = allReservations.size();

        Map<String, Long> reservationsByStatus = allReservations.stream()
                .collect(Collectors.groupingBy(
                        r -> r.getStatus().name(),
                        Collectors.counting()
                ));

        BigDecimal totalRevenue = allReservations.stream()
                .filter(r -> r.getStatus() == Reservation.ReservationStatus.CONFIRMED ||
                            r.getStatus() == Reservation.ReservationStatus.CHECKED_IN ||
                            r.getStatus() == Reservation.ReservationStatus.CHECKED_OUT)
                .map(Reservation::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> statistics = new HashMap<>();
        statistics.put("totalReservations", totalReservations);
        statistics.put("reservationsByStatus", reservationsByStatus);
        statistics.put("totalRevenue", totalRevenue);

        return ResponseEntity.ok(statistics);
    }

    // Helper method to convert User to UserDto
    private UserDto convertToDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setEmail(user.getEmail());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setRoles(user.getRoles());
        dto.setAvatar(user.getAvatar());
        dto.setProvider(user.getProvider());
        dto.setEnabled(user.isEnabled());
        return dto;
    }
}
