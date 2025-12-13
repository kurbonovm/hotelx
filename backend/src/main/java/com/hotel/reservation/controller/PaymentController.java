package com.hotel.reservation.controller;

import com.hotel.reservation.model.Payment;
import com.hotel.reservation.model.Reservation;
import com.hotel.reservation.security.UserPrincipal;
import com.hotel.reservation.service.PaymentService;
import com.hotel.reservation.service.ReservationService;
import com.stripe.exception.StripeException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * REST controller for payment processing endpoints.
 * Handles Stripe payment operations.
 *
 * @author Hotel Reservation Team
 * @version 1.0
 */
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final ReservationService reservationService;

    /**
     * Create a payment intent for a reservation.
     *
     * @param userPrincipal authenticated user
     * @param paymentData payment details containing reservationId
     * @return payment entity with client secret
     * @throws StripeException if Stripe API fails
     */
    @PostMapping("/create-intent")
    public ResponseEntity<Map<String, Object>> createPaymentIntent(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody Map<String, String> paymentData) throws StripeException {

        String reservationId = paymentData.get("reservationId");
        Reservation reservation = reservationService.getReservationById(reservationId);

        if (!reservation.getUser().getId().equals(userPrincipal.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Payment payment = paymentService.createPaymentIntent(reservation);

        // Return payment details including client secret for Stripe Elements
        return ResponseEntity.ok(Map.of(
                "paymentId", payment.getId(),
                "paymentIntentId", payment.getStripePaymentIntentId(),
                "clientSecret", payment.getStripeClientSecret()
        ));
    }

    /**
     * Confirm a payment after successful Stripe processing.
     *
     * @param paymentData payment confirmation details
     * @return confirmed payment
     */
    @PostMapping("/confirm")
    public ResponseEntity<Payment> confirmPayment(@RequestBody Map<String, String> paymentData) {
        String paymentIntentId = paymentData.get("paymentIntentId");
        Payment payment = paymentService.confirmPayment(paymentIntentId);
        return ResponseEntity.ok(payment);
    }

    /**
     * Get payment history for the authenticated user.
     *
     * @param userPrincipal authenticated user
     * @return list of payments
     */
    @GetMapping("/history")
    public ResponseEntity<List<Payment>> getPaymentHistory(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<Payment> payments = paymentService.getUserPaymentHistory(userPrincipal.getId());
        return ResponseEntity.ok(payments);
    }

    /**
     * Get all payments (Admin/Manager only).
     *
     * @return list of all payments
     */
    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<Payment>> getAllPayments() {
        List<Payment> payments = paymentService.getAllPayments();
        return ResponseEntity.ok(payments);
    }

    /**
     * Get payment by ID.
     *
     * @param id payment ID
     * @param userPrincipal authenticated user
     * @return payment entity
     */
    @GetMapping("/{id}")
    public ResponseEntity<Payment> getPaymentById(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        Payment payment = paymentService.getPaymentById(id);

        // Check if user is admin/manager from security context
        org.springframework.security.core.Authentication authentication =
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();

        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") ||
                        a.getAuthority().equals("ROLE_MANAGER"));

        boolean isOwner = false;
        if (userPrincipal != null && payment.getUser() != null) {
            String userId = userPrincipal.getId();
            if (userId != null) {
                isOwner = userId.equals(payment.getUser().getId());
            }
        }

        if (!isAdmin && !isOwner) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(payment);
    }

    /**
     * Process a refund (Admin/Manager only).
     *
     * @param id payment ID
     * @param refundData refund details
     * @return updated payment entity
     * @throws StripeException if Stripe API fails
     */
    @PostMapping("/{id}/refund")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Payment> processRefund(
            @PathVariable String id,
            @RequestBody Map<String, Object> refundData) throws StripeException {

        BigDecimal amount = new BigDecimal(refundData.get("amount").toString());
        String reason = (String) refundData.getOrDefault("reason", "Customer request");

        Payment payment = paymentService.processRefund(id, amount, reason);
        return ResponseEntity.ok(payment);
    }

    /**
     * Stripe webhook endpoint for payment events.
     *
     * @param payload webhook payload
     * @param signature Stripe signature header
     * @return success response
     */
    @PostMapping("/webhook")
    public ResponseEntity<String> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String signature) {

        return ResponseEntity.ok("Webhook received");
    }
}
