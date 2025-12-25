# HotelX - Frontend

A modern, responsive React frontend for HotelX built with Redux, RTK Query, and Material-UI.

## 🚀 Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Redux Toolkit** - State management
- **RTK Query** - Data fetching and caching
- **React Router v6** - Routing
- **Material-UI (MUI)** - UI component library
- **Axios** - HTTP client
- **Stripe** - Payment processing

## 📋 Features

### User Management
- ✅ OAuth2 authentication (Google)
- ✅ Email/password login and registration
- ✅ Role-based access control (Guest, Manager, Admin)
- ✅ User profile management

### Room Management
- ✅ Browse available rooms
- ✅ Advanced search and filtering
- ✅ Real-time availability checking
- ✅ Room details with amenities

### Reservation Management
- ✅ Book rooms with date selection
- ✅ View reservation history
- ✅ Modify reservations
- ✅ Cancel reservations
- ✅ Email confirmations

### Payment Processing
- ✅ Stripe integration
- ✅ Secure payment processing
- ✅ Transaction history
- ✅ Refund processing

### Admin Features
- ✅ Room inventory management
- ✅ Reservation management
- ✅ User management
- ✅ Reporting and analytics

## 🛠️ Project Structure

```
frontend/
├── src/
│   ├── components/         # Reusable components
│   │   └── ProtectedRoute.jsx
│   ├── features/          # Feature-based modules
│   │   ├── auth/         # Authentication
│   │   │   ├── authSlice.js
│   │   │   └── authApi.js
│   │   ├── rooms/        # Room management
│   │   │   └── roomsApi.js
│   │   ├── reservations/ # Reservation management
│   │   │   └── reservationsApi.js
│   │   ├── payments/     # Payment processing
│   │   │   └── paymentsApi.js
│   │   └── admin/        # Admin features
│   ├── layouts/          # Layout components
│   │   └── MainLayout.jsx
│   ├── pages/            # Page components
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Rooms.jsx
│   │   ├── Reservations.jsx
│   │   ├── Unauthorized.jsx
│   │   └── NotFound.jsx
│   ├── services/         # API services
│   │   └── api.js
│   ├── store/            # Redux store
│   │   └── store.js
│   ├── hooks/            # Custom hooks
│   ├── utils/            # Utility functions
│   ├── types/            # TypeScript types (if needed)
│   ├── constants/        # Constants and enums
│   ├── theme.js          # Material-UI theme
│   ├── App.jsx           # Main app component
│   └── main.jsx          # Entry point
├── public/               # Static assets
├── .env.example         # Environment variables template
├── .env                 # Environment variables (local)
├── .prettierrc          # Prettier configuration
├── eslint.config.js     # ESLint configuration
├── vite.config.js       # Vite configuration
└── package.json         # Dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Backend API running (see backend README)

### Installation

1. Clone the repository and navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
```env
VITE_API_URL=http://localhost:8080/api
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
VITE_OAUTH2_REDIRECT_URI=http://localhost:5173/oauth2/callback
```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

Build the application:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## 🎨 Code Style

The project uses ESLint and Prettier for code formatting:

```bash
# Run linter
npm run lint

# Format code
npm run format
```

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔐 Authentication

The application supports multiple authentication methods:

1. **Email/Password**: Traditional authentication
2. **OAuth2**: Google login

All authenticated routes are protected using the `ProtectedRoute` component.

## 🎯 Key Components

### Redux Store
- Centralized state management using Redux Toolkit
- RTK Query for efficient data fetching and caching
- Automatic cache invalidation and refetching

### Protected Routes
- Route protection based on authentication
- Role-based access control
- Automatic redirects for unauthorized access

### Material-UI Theme
- Custom theme configuration
- Consistent design system
- Responsive components

## 🔗 API Integration

The frontend communicates with the backend API using RTK Query:

- Automatic request/response handling
- Built-in caching and optimization
- Automatic token injection for authenticated requests

## 📱 Responsive Design

The application is fully responsive and optimized for:
- Desktop (1920px+)
- Tablet (768px - 1919px)
- Mobile (320px - 767px)

## 🚢 Deployment

### AWS S3 + CloudFront

1. Build the application:
```bash
npm run build
```

2. Upload the `dist` folder to S3

3. Configure CloudFront to serve from the S3 bucket

4. Update the environment variables to point to the production API

## 📝 License

This project is part of HotelX.

## 👥 Contributing

1. Follow the code style guidelines
2. Write JSDoc comments for all functions
3. Add proper error handling
4. Test your changes before committing
