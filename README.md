# Hotel Reservation System

A modern, full-stack hotel reservation platform built with Spring Boot, MongoDB, React, Redux, and Stripe for secure payment processing.

## Project Overview

This system simplifies the booking process for guests and provides hotel administrators with robust tools for managing room availability, reservations, and amenities. The solution is designed for deployment to AWS.

## Tech Stack

### Backend
- **Java 17** with **Spring Boot 3.2.0**
- **MongoDB** - NoSQL database
- **Spring Security** - Authentication & Authorization
- **OAuth2** - Social login (Google, Facebook)
- **JWT** - Token-based authentication
- **Stripe** - Payment processing
- **Maven** - Build tool

### Frontend
- **React 18** with **Vite**
- **Redux Toolkit** with **RTK Query**
- **React Router v6**
- **Material-UI (MUI)**
- **Axios**
- **Stripe.js**

### Deployment
- **Backend**: AWS EC2, Lambda, or EKS
- **Database**: AWS DocumentDB
- **Frontend**: AWS S3 + CloudFront
- **Authentication**: AWS Cognito (optional)

## Features

### User Management
- Email/password registration and login
- OAuth2 social login (Google, Facebook)
- Role-based access control (GUEST, MANAGER, ADMIN)
- User profile management

### Room Management
- CRUD operations for rooms
- Real-time availability checking
- Advanced search and filtering
- Capacity and amenity management

### Reservation Management
- Create, update, and cancel reservations
- **Overbooking prevention** with synchronized transactions
- Date validation and availability checks
- Automated email confirmations

### Payment Processing
- Secure Stripe integration
- Payment intent creation and confirmation
- Refund processing
- Transaction history

### Security
- JWT authentication
- BCrypt password hashing
- CORS configuration
- Method-level authorization
- Input validation

## Project Structure

```
mkhrs/
├── backend/                 # Spring Boot API
│   ├── src/main/java/
│   │   └── com/hotel/reservation/
│   │       ├── config/
│   │       ├── controller/
│   │       ├── dto/
│   │       ├── exception/
│   │       ├── model/
│   │       ├── repository/
│   │       ├── security/
│   │       └── service/
│   ├── src/main/resources/
│   │   └── application.yml
│   ├── pom.xml
│   └── README.md
│
├── frontend/                # React application
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   └── theme.js
│   ├── package.json
│   └── README.md
│
├── Docs/
│   └── Requirements.md
└── README.md
```

## Getting Started

### Prerequisites

- **Java 17+**
- **Node.js 18+**
- **MongoDB 4.4+**
- **Maven 3.6+**
- **Stripe Account** (for payments)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Configure `application.yml`:
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

3. Set environment variables:
```bash
export GOOGLE_CLIENT_ID=your-google-client-id
export GOOGLE_CLIENT_SECRET=your-google-client-secret
export STRIPE_API_KEY=your-stripe-api-key
```

4. Start MongoDB:
```bash
# macOS
brew services start mongodb-community

# Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

5. Build and run:
```bash
mvn clean install
mvn spring-boot:run
```

Backend will be available at `http://localhost:8080`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment (`.env`):
```env
VITE_API_URL=http://localhost:8080/api
VITE_STRIPE_PUBLIC_KEY=your-stripe-public-key
```

4. Start development server:
```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Rooms
- `GET /api/rooms` - Get all rooms
- `GET /api/rooms/{id}` - Get room by ID
- `GET /api/rooms/available` - Get available rooms
- `POST /api/rooms` - Create room (Manager/Admin)
- `PUT /api/rooms/{id}` - Update room (Manager/Admin)
- `DELETE /api/rooms/{id}` - Delete room (Manager/Admin)

### Reservations
- `GET /api/reservations` - Get all (Admin/Manager)
- `GET /api/reservations/my-reservations` - Get user's reservations
- `POST /api/reservations` - Create reservation
- `PUT /api/reservations/{id}` - Update reservation
- `POST /api/reservations/{id}/cancel` - Cancel reservation

### Payments
- `POST /api/payments/create-intent` - Create payment
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/history` - Payment history
- `POST /api/payments/{id}/refund` - Process refund

## Key Implementation Details

### Overbooking Prevention
The system prevents double-booking using:
- `synchronized` methods in ReservationService
- MongoDB queries for overlapping reservations
- Atomic database operations

### Security
- JWT tokens with 24-hour expiration
- BCrypt password hashing (10 rounds)
- OAuth2 ready for social login
- Role-based access control

### Payment Security
- Stripe handles sensitive card data
- Server-side payment confirmation
- Webhook verification for events

## Testing

### Backend
```bash
cd backend
mvn test
```

### Frontend
```bash
cd frontend
npm test
```

## Building for Production

### Backend
```bash
cd backend
mvn clean package
java -jar target/reservation-system-1.0.0.jar
```

### Frontend
```bash
cd frontend
npm run build
# dist/ folder ready for deployment
```

## Deployment

### AWS Deployment

1. **Backend**: Deploy JAR to EC2 or containerize for EKS
2. **Frontend**: Upload build to S3, serve via CloudFront
3. **Database**: Use AWS DocumentDB
4. **Authentication**: Optionally integrate AWS Cognito

See individual README files in `backend/` and `frontend/` for detailed deployment instructions.

## Documentation

- All Java classes include comprehensive JavaDoc
- All React components include JSDoc comments
- API documentation available via Swagger (if enabled)

## License

This project is developed as part of the Hotel Reservation System requirements.

## Contributors

Hotel Reservation Team

## Support

For issues and questions, please refer to the project documentation or contact the development team.
