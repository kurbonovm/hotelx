package com.hotel.reservation;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

/**
 * Main application class for HotelX.
 * This class bootstraps the Spring Boot application.
 *
 * @author HotelX Team
 * @version 1.0
 */
@SpringBootApplication
@EnableMongoAuditing
public class HotelReservationApplication {

    /**
     * Main entry point for the application.
     *
     * @param args command line arguments
     */
    public static void main(String[] args) {
        // Load .env file
        Dotenv dotenv = Dotenv.configure()
                .directory(".")
                .ignoreIfMissing()
                .load();

        // Set environment variables from .env file
        dotenv.entries().forEach(entry ->
            System.setProperty(entry.getKey(), entry.getValue())
        );

        SpringApplication.run(HotelReservationApplication.class, args);
    }
}
