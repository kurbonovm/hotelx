package com.hotel.reservation.service;

import com.hotel.reservation.model.Payment;
import com.hotel.reservation.model.Reservation;
import com.hotel.reservation.repository.PaymentRepository;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Refund;
import com.stripe.param.PaymentIntentCreateParams;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service class for payment processing using Stripe.
 * Handles payment creation, confirmation, and refunds.
 *
 * @author Hotel Reservation Team
 * @version 1.0
 */
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final ReservationService reservationService;

    @Value("${stripe.api.key}")
    private String stripeApiKey;

    /**
     * Initialize Stripe with API key.
     */
    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeApiKey;
    }

    /**
     * Create a payment intent for a reservation.
     *
     * @param reservation the reservation to create payment for
     * @return payment entity with Stripe payment intent
     * @throws StripeException if Stripe API call fails
     */
    @Transactional
    public Payment createPaymentIntent(Reservation reservation) throws StripeException {
        long amountInCents = reservation.getTotalAmount()
                .multiply(BigDecimal.valueOf(100))
                .longValue();

        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(amountInCents)
                .setCurrency("usd")
                .putMetadata("reservationId", reservation.getId())
                .putMetadata("userId", reservation.getUser().getId())
                .setAutomaticPaymentMethods(
                        PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                .setEnabled(true)
                                .build()
                )
                .build();

        PaymentIntent paymentIntent = PaymentIntent.create(params);

        Payment payment = new Payment();
        payment.setReservation(reservation);
        payment.setUser(reservation.getUser());
        payment.setAmount(reservation.getTotalAmount());
        payment.setCurrency("USD");
        payment.setStripePaymentIntentId(paymentIntent.getId());
        payment.setStripeClientSecret(paymentIntent.getClientSecret());
        payment.setStatus(Payment.PaymentStatus.PENDING);

        return paymentRepository.save(payment);
    }

    /**
     * Confirm a payment after successful Stripe processing.
     *
     * @param paymentIntentId Stripe payment intent ID
     * @return updated payment entity
     * @throws RuntimeException if payment not found
     */
    @Transactional
    public Payment confirmPayment(String paymentIntentId) {
        Payment payment = paymentRepository.findByStripePaymentIntentId(paymentIntentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        try {
            // Retrieve payment intent from Stripe to get charge details
            PaymentIntent paymentIntent = PaymentIntent.retrieve(paymentIntentId);

            // Extract charge ID if available
            if (paymentIntent.getLatestCharge() != null) {
                payment.setStripeChargeId(paymentIntent.getLatestCharge());
            }

            // Extract payment method details if available
            if (paymentIntent.getPaymentMethod() != null) {
                com.stripe.model.PaymentMethod paymentMethod =
                    com.stripe.model.PaymentMethod.retrieve(paymentIntent.getPaymentMethod());

                if (paymentMethod.getCard() != null) {
                    payment.setCardBrand(paymentMethod.getCard().getBrand());
                    payment.setCardLast4(paymentMethod.getCard().getLast4());
                    payment.setPaymentMethod("card");
                }
            }
        } catch (StripeException e) {
            // Log error but don't fail the confirmation
            System.err.println("Failed to retrieve payment details from Stripe: " + e.getMessage());
        }

        payment.setStatus(Payment.PaymentStatus.SUCCEEDED);
        Payment savedPayment = paymentRepository.save(payment);

        reservationService.confirmReservation(payment.getReservation().getId());

        return savedPayment;
    }

    /**
     * Process a refund for a payment.
     *
     * @param paymentId payment ID
     * @param amount refund amount
     * @param reason refund reason
     * @return updated payment entity
     * @throws StripeException if Stripe API call fails
     * @throws RuntimeException if payment not found or already refunded
     */
    @Transactional
    public Payment processRefund(String paymentId, BigDecimal amount, String reason) throws StripeException {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        if (payment.getStatus() != Payment.PaymentStatus.SUCCEEDED) {
            throw new RuntimeException("Cannot refund payment that hasn't succeeded");
        }

        long refundAmountInCents = amount.multiply(BigDecimal.valueOf(100)).longValue();

        Map<String, Object> refundParams = new HashMap<>();
        refundParams.put("payment_intent", payment.getStripePaymentIntentId());
        refundParams.put("amount", refundAmountInCents);
        refundParams.put("reason", "requested_by_customer");

        Refund refund = Refund.create(refundParams);

        payment.setRefundAmount(amount);
        payment.setRefundReason(reason);
        payment.setRefundedAt(java.time.LocalDateTime.now());

        if (amount.compareTo(payment.getAmount()) >= 0) {
            payment.setStatus(Payment.PaymentStatus.REFUNDED);
        } else {
            payment.setStatus(Payment.PaymentStatus.PARTIALLY_REFUNDED);
        }

        return paymentRepository.save(payment);
    }

    /**
     * Get payment history for a user.
     *
     * @param userId user ID
     * @return list of payments
     */
    public List<Payment> getUserPaymentHistory(String userId) {
        return paymentRepository.findByUserId(userId);
    }

    /**
     * Get all payments (Admin only).
     *
     * @return list of all payments
     */
    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }

    /**
     * Get payment by ID.
     *
     * @param id payment ID
     * @return payment entity
     * @throws RuntimeException if payment not found
     */
    public Payment getPaymentById(String id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found with id: " + id));
    }
}
