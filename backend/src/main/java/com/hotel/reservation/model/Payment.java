package com.hotel.reservation.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Payment entity representing a payment transaction.
 * Integrates with Stripe for payment processing.
 *
 * @author Hotel Reservation Team
 * @version 1.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "payments")
public class Payment {

    /**
     * Unique identifier for the payment
     */
    @Id
    private String id;

    /**
     * Reference to the reservation
     */
    @DBRef
    private Reservation reservation;

    /**
     * Reference to the user who made the payment
     */
    @DBRef
    private User user;

    /**
     * Payment amount
     */
    private BigDecimal amount;

    /**
     * Currency (USD, EUR, etc.)
     */
    private String currency = "USD";

    /**
     * Payment status
     */
    private PaymentStatus status = PaymentStatus.PENDING;

    /**
     * Stripe payment intent ID
     */
    private String stripePaymentIntentId;

    /**
     * Stripe client secret for payment confirmation
     */
    private String stripeClientSecret;

    /**
     * Stripe charge ID
     */
    private String stripeChargeId;

    /**
     * Payment method (card, wallet, etc.)
     */
    private String paymentMethod;

    /**
     * Last 4 digits of card (if applicable)
     */
    private String cardLast4;

    /**
     * Card brand (Visa, Mastercard, etc.)
     */
    private String cardBrand;

    /**
     * Refund amount (if refunded)
     */
    private BigDecimal refundAmount;

    /**
     * Refund reason
     */
    private String refundReason;

    /**
     * Refund timestamp
     */
    private LocalDateTime refundedAt;

    /**
     * Payment receipt URL
     */
    private String receiptUrl;

    /**
     * Payment creation timestamp
     */
    @CreatedDate
    private LocalDateTime createdAt;

    /**
     * Payment last modification timestamp
     */
    @LastModifiedDate
    private LocalDateTime updatedAt;

    /**
     * Payment status enumeration
     */
    public enum PaymentStatus {
        PENDING,
        PROCESSING,
        SUCCEEDED,
        FAILED,
        REFUNDED,
        PARTIALLY_REFUNDED
    }
}
