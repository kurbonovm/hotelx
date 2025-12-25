# HotelX - Backend

Spring Boot REST API for HotelX with MongoDB, Spring Security, OAuth2, and Stripe integration.

## Tech Stack

- **Java 17** - Programming language
- **Spring Boot 3.2.0** - Framework
- **Spring Data MongoDB** - Database integration
- **Spring Security** - Authentication and authorization
- **OAuth2** - Social login (Google)
- **JWT** - Token-based authentication
- **Stripe** - Payment processing
- **Lombok** - Code generation
- **Maven** - Build tool

## Features

### Authentication & Authorization
- Email/password registration and login
- OAuth2 social login (Google)
- JWT token-based authentication
- Role-based access control (GUEST, MANAGER, ADMIN)
- Password encryption with BCrypt

### Room Management
- CRUD operations for rooms
- Room filtering by type, price, amenities
- Real-time availability checking
- Capacity validation

### Reservation Management
- Create, update, and cancel reservations
- Overbooking prevention with synchronized transactions
- Date range validation
- Automatic total calculation
- Email confirmations

### Payment Processing
- Stripe payment intent creation
- Payment confirmation
- Refund processing
- Transaction history
- Webhook support

### Security Features
- JWT authentication filter
- CORS configuration
- Method-level security with annotations
- Request validation

## Project Structure

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/hotel/reservation/
│   │   │   ├── config/              # Configuration classes
│   │   │   │   └── SecurityConfig.java
│   │   │   ├── controller/          # REST controllers
│   │   │   │   ├── AuthController.java
│   │   │   │   ├── RoomController.java
│   │   │   │   ├── ReservationController.java
│   │   │   │   └── PaymentController.java
│   │   │   ├── dto/                 # Data Transfer Objects
│   │   │   │   ├── LoginRequest.java
│   │   │   │   ├── RegisterRequest.java
│   │   │   │   ├── AuthResponse.java
│   │   │   │   └── UserDto.java
│   │   │   ├── exception/           # Exception handling
│   │   │   │   └── GlobalExceptionHandler.java
│   │   │   ├── model/               # Domain models
│   │   │   │   ├── User.java
│   │   │   │   ├── Room.java
│   │   │   │   ├── Reservation.java
│   │   │   │   └── Payment.java
│   │   │   ├── repository/          # MongoDB repositories
│   │   │   │   ├── UserRepository.java
│   │   │   │   ├── RoomRepository.java
│   │   │   │   ├── ReservationRepository.java
│   │   │   │   └── PaymentRepository.java
│   │   │   ├── security/            # Security components
│   │   │   │   ├── JwtTokenProvider.java
│   │   │   │   ├── JwtAuthenticationFilter.java
│   │   │   │   ├── UserPrincipal.java
│   │   │   │   └── CustomUserDetailsService.java
│   │   │   ├── service/             # Business logic
│   │   │   │   ├── AuthService.java
│   │   │   │   ├── RoomService.java
│   │   │   │   ├── ReservationService.java
│   │   │   │   └── PaymentService.java
│   │   │   └── HotelReservationApplication.java
│   │   └── resources/
│   │       └── application.yml      # Application configuration
│   └── test/                        # Test files
├── pom.xml                          # Maven dependencies
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Java 17 or higher
- Maven 3.6+
- MongoDB 4.4+ (or AWS DocumentDB)
- Stripe account for payment processing

### Installation

1. Clone the repository and navigate to the backend directory:
```bash
cd backend
```

2. Configure application settings in `application.yml`:
```yaml
spring:
  data:
    mongodb:
      uri: mongodb://localhost:27017/hotel_reservation

jwt:
  secret: your-256-bit-secret-key

stripe:
  api:
    key: your-stripe-api-key
```

3. Set environment variables (or update application.yml):
```bash
export GOOGLE_CLIENT_ID=your-google-client-id
export GOOGLE_CLIENT_SECRET=your-google-client-secret
export STRIPE_API_KEY=your-stripe-api-key
```

4. Build the project:
```bash
mvn clean install
```

5. Run the application:
```bash
mvn spring-boot:run
```

The API will be available at `http://localhost:8080`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Rooms
- `GET /api/rooms` - Get all rooms (with filters)
- `GET /api/rooms/{id}` - Get room by ID
- `GET /api/rooms/available` - Get available rooms for dates
- `POST /api/rooms` - Create room (Manager/Admin)
- `PUT /api/rooms/{id}` - Update room (Manager/Admin)
- `DELETE /api/rooms/{id}` - Delete room (Manager/Admin)

### Reservations
- `GET /api/reservations` - Get all reservations (Admin/Manager)
- `GET /api/reservations/my-reservations` - Get user's reservations
- `GET /api/reservations/{id}` - Get reservation by ID
- `POST /api/reservations` - Create reservation
- `PUT /api/reservations/{id}` - Update reservation
- `POST /api/reservations/{id}/cancel` - Cancel reservation
- `GET /api/reservations/date-range` - Get reservations by date (Admin/Manager)

### Payments
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/history` - Get payment history
- `GET /api/payments/{id}` - Get payment by ID
- `POST /api/payments/{id}/refund` - Process refund (Admin/Manager)
- `POST /api/payments/webhook` - Stripe webhook

## Security

### JWT Authentication
- All requests (except auth and public endpoints) require JWT token
- Token must be sent in Authorization header: `Bearer <token>`
- Tokens expire after 24 hours

### Role-Based Access
- **GUEST**: Can view rooms, make reservations, manage own bookings
- **MANAGER**: All guest permissions + room management
- **ADMIN**: All permissions + user management and reporting

## Database Schema

### User Collection
```json
{
  "_id": "ObjectId",
  "firstName": "String",
  "lastName": "String",
  "email": "String (unique)",
  "password": "String (hashed)",
  "phoneNumber": "String",
  "roles": ["GUEST", "MANAGER", "ADMIN"],
  "provider": "String (google/null)",
  "providerId": "String",
  "avatar": "String",
  "enabled": "Boolean",
  "createdAt": "DateTime",
  "updatedAt": "DateTime"
}
```

### Room Collection
```json
{
  "_id": "ObjectId",
  "name": "String",
  "type": "Enum (STANDARD/DELUXE/SUITE/PRESIDENTIAL)",
  "description": "String",
  "pricePerNight": "Decimal",
  "capacity": "Integer",
  "amenities": ["String"],
  "imageUrl": "String",
  "additionalImages": ["String"],
  "available": "Boolean",
  "floorNumber": "Integer",
  "size": "Integer",
  "createdAt": "DateTime",
  "updatedAt": "DateTime"
}
```

### Reservation Collection
```json
{
  "_id": "ObjectId",
  "user": "DBRef<User>",
  "room": "DBRef<Room>",
  "checkInDate": "Date",
  "checkOutDate": "Date",
  "numberOfGuests": "Integer",
  "totalAmount": "Decimal",
  "status": "Enum (PENDING/CONFIRMED/CHECKED_IN/CHECKED_OUT/CANCELLED)",
  "specialRequests": "String",
  "paymentId": "String",
  "confirmationEmailSent": "Boolean",
  "cancellationReason": "String",
  "cancelledAt": "DateTime",
  "createdAt": "DateTime",
  "updatedAt": "DateTime"
}
```

### Payment Collection
```json
{
  "_id": "ObjectId",
  "reservation": "DBRef<Reservation>",
  "user": "DBRef<User>",
  "amount": "Decimal",
  "currency": "String",
  "status": "Enum (PENDING/PROCESSING/SUCCEEDED/FAILED/REFUNDED)",
  "stripePaymentIntentId": "String",
  "stripeChargeId": "String",
  "paymentMethod": "String",
  "cardLast4": "String",
  "cardBrand": "String",
  "refundAmount": "Decimal",
  "refundReason": "String",
  "refundedAt": "DateTime",
  "receiptUrl": "String",
  "createdAt": "DateTime",
  "updatedAt": "DateTime"
}
```

## Testing

Run tests:
```bash
mvn test
```

Run tests with coverage:
```bash
mvn test jacoco:report
```

## Building for Production

Build the application:
```bash
mvn clean package
```

The JAR file will be in `target/reservation-system-1.0.0.jar`

Run the JAR:
```bash
java -jar target/reservation-system-1.0.0.jar
```

## Deployment to AWS

### EC2 Deployment
1. Build the JAR file
2. Upload to EC2 instance
3. Install Java 17 on EC2
4. Set environment variables
5. Run the JAR with production profile

### Docker Deployment
Create a Dockerfile and deploy to EKS or ECS

### Environment Variables for Production
```bash
SPRING_DATA_MONGODB_URI=mongodb://documentdb-endpoint:27017/hotel_reservation
JWT_SECRET=production-secret-256-bits
STRIPE_API_KEY=live_stripe_key
GOOGLE_CLIENT_ID=production-google-id
```

## Key Implementation Details

### Overbooking Prevention
- Uses `synchronized` keyword on reservation creation/update methods
- Queries for overlapping reservations before confirming
- Atomic database operations with MongoDB transactions

### Password Security
- BCrypt password encoding
- Minimum 8 characters validation
- Never returns password in responses

### Payment Security
- Stripe handles sensitive card data
- Payment webhook verification
- Refund authorization checks

## Documentation

All classes and methods are documented with JavaDoc comments following industry standards.

## License

This project is part of HotelX.
