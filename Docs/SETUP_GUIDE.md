# 🚀 Hotel Reservation System - Complete Setup Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Quick Start (Docker)](#-quick-start-docker)
3. [Credentials Checklist](#-credentials-checklist)
4. [Step-by-Step Setup](#-step-by-step-setup)
5. [Manual Setup (Development)](#-manual-setup-development)
6. [Testing](#-testing)
7. [Troubleshooting](#-troubleshooting)
8. [Production Deployment](#-production-deployment)

---

## Prerequisites

- ✅ Java 17+ installed
- ✅ Node.js 20+ installed
- ✅ MongoDB running (or use Docker)
- ✅ Maven 3.6+ installed
- ✅ Git installed
- ✅ Docker & Docker Compose (optional, for containerized setup)

---

## 🚀 Quick Start (Docker)

**Fastest way to get started:**

```bash
# 1. Clone repository
git clone https://github.com/kurbonovm/20251027-p2-group3.git
cd 20251027-p2-group3

# 2. Copy environment file
cp .env.example .env

# 3. Edit .env with your credentials (see Credentials Checklist below)
nano .env

# 4. Start everything with Docker
docker-compose up -d

# 5. Access the application
# Frontend: http://localhost:80
# Backend: http://localhost:8080
# API Docs: http://localhost:8080/swagger-ui.html
```

---

## 🔑 Credentials Checklist

Before running the application, gather these credentials:

### 1. Google OAuth2

**Where:** [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

- [ ] Create project "Hotel Reservation System"
- [ ] Enable Google+ API
- [ ] Configure OAuth consent screen
- [ ] Create OAuth 2.0 Client ID (Web application)
- [ ] Add redirect URIs:
  - `http://localhost:8080/login/oauth2/code/google`
  - `http://localhost:5173/oauth2/callback` (dev)
  - `http://hotelx-system-backend.s3-website-us-east-1.amazonaws.com/oauth2/callback` (AWS)

**Copy to .env:**
```env
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
```

### 2. Facebook OAuth2

**Where:** [Facebook Developers](https://developers.facebook.com/apps/)

- [ ] Create app (Consumer type)
- [ ] Add Facebook Login product
- [ ] Configure Valid OAuth Redirect URIs:
  - `http://localhost:8080/login/oauth2/code/facebook`
  - `http://localhost:5173/oauth2/callback` (dev)
  - `http://hotelx-system-backend.s3-website-us-east-1.amazonaws.com/oauth2/callback` (AWS)

**Copy to .env:**
```env
FACEBOOK_CLIENT_ID=1234567890123456
FACEBOOK_CLIENT_SECRET=xxxxx
```

### 3. Stripe

**Where:** [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)

- [ ] Sign up / Login
- [ ] Get API keys (Developers → API keys):
  - Secret key: `sk_test_...`
  - Publishable key: `pk_test_...`
- [ ] Create Webhook (Developers → Webhooks):
  - URL: `http://localhost:8080/api/payments/webhook`
  - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled`, `charge.refunded`
  - Copy webhook secret: `whsec_...`

**Copy to .env:**
```env
STRIPE_API_KEY=sk_test_51xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
VITE_STRIPE_PUBLIC_KEY=pk_test_51xxxxx
```

**Test Cards:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits

### 4. Gmail (Email Notifications)

**Where:** [Google App Passwords](https://myaccount.google.com/apppasswords)

- [ ] Enable 2-Step Verification
- [ ] Generate App Password (Select app: Mail, Device: Other)
- [ ] Copy 16-character password

**Copy to .env:**
```env
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
```

### 5. JWT Secret

**Generate:**
```bash
openssl rand -base64 64
```

**Copy to .env:**
```env
JWT_SECRET=generated-secret-key
```

### 6. MongoDB Password

**Copy to .env:**
```env
MONGO_PASSWORD=your-secure-password
```

---

## 📋 Step-by-Step Setup

### Step 1: Clone Repository

```bash
git clone https://github.com/kurbonovm/20251027-p2-group3.git
cd 20251027-p2-group3
```

### Step 2: Configure OAuth2 Credentials

#### 🔵 Google OAuth2

1. **Go to:** [Google Cloud Console](https://console.cloud.google.com/)
2. **Create Project:** "Hotel Reservation System"
3. **Enable API:** Google+ API
4. **OAuth Consent Screen:**
   - External
   - App name: Hotel Reservation System
   - Scopes: email, profile
5. **Create Credentials → OAuth Client ID:**
   - Type: Web application
   - Authorized origins: `http://localhost:8080`, `http://localhost:5173`
   - Redirect URIs:
     - `http://localhost:8080/login/oauth2/code/google`
     - `http://localhost:5173/oauth2/callback`
6. **Copy** Client ID and Client Secret

#### 🔵 Facebook OAuth2

1. **Go to:** [Facebook Developers](https://developers.facebook.com/)
2. **Create App → Consumer**
3. **Add Facebook Login → Web**
4. **Configure Settings:**
   - Valid OAuth Redirect URIs:
     - `http://localhost:8080/login/oauth2/code/facebook`
     - `http://localhost:5173/oauth2/callback`
5. **Get credentials** from Settings → Basic
   - App ID (Client ID)
   - App Secret (Client Secret)

#### 💳 Stripe

1. **Go to:** [Stripe Dashboard](https://dashboard.stripe.com/)
2. **Sign up/Login**
3. **Get API Keys** (Developers → API keys):
   - Secret key: `sk_test_...`
   - Publishable key: `pk_test_...`
4. **Create Webhook** (Developers → Webhooks):
   - URL: `http://localhost:8080/api/payments/webhook`
   - Events:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `payment_intent.canceled`
     - `charge.refunded`
   - Copy webhook signing secret: `whsec_...`

### Step 3: Update .env File

Edit `.env` with your credentials:

```bash
nano .env
```

Replace the placeholder values:

```env
# MongoDB
MONGO_PASSWORD=admin123  # Change this!

# JWT Secret (generate a strong random key)
JWT_SECRET=your-super-secret-jwt-key-at-least-256-bits-long-change-this

# Stripe (from Stripe Dashboard)
STRIPE_API_KEY=sk_test_51ABC...  # Your secret key
STRIPE_WEBHOOK_SECRET=whsec_...  # Your webhook secret

# Email (Gmail example)
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password  # See Gmail App Password setup below

# Google OAuth2 (from Google Cloud Console)
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret

# Facebook OAuth2 (from Facebook Developers)
FACEBOOK_CLIENT_ID=1234567890
FACEBOOK_CLIENT_SECRET=your-facebook-secret

# Frontend
VITE_API_URL=http://localhost:8080/api
VITE_STRIPE_PUBLIC_KEY=pk_test_51ABC...  # Your publishable key
```

### Step 4: Setup Gmail App Password (for email notifications)

1. **Go to:** [Google Account Security](https://myaccount.google.com/security)
2. **Enable 2-Step Verification** (if not already enabled)
3. **Go to:** [App Passwords](https://myaccount.google.com/apppasswords)
4. **Select app:** Mail
5. **Select device:** Other (Custom name) → "Hotel Reservation"
6. **Click Generate**
7. **Copy the 16-character password** → Use as `EMAIL_PASSWORD`

### Step 5: Generate JWT Secret

Generate a secure random key:

```bash
# On Mac/Linux
openssl rand -base64 64

# Or use this online: https://www.grc.com/passwords.htm
```

Copy the output and use it as your `JWT_SECRET`.

### Step 6: Update Frontend .env

Edit `frontend/.env`:

```bash
nano frontend/.env
```

Add:

```env
VITE_API_URL=http://localhost:8080/api
VITE_STRIPE_PUBLIC_KEY=pk_test_51ABC...  # Your Stripe publishable key
VITE_OAUTH2_REDIRECT_URI=http://localhost:5173/oauth2/callback
```

---

## 🐳 Option 1: Run with Docker (Recommended)

### Start Everything with Docker Compose

```bash
# Make sure .env is configured
docker-compose up -d

# View logs
docker-compose logs -f

# Stop everything
docker-compose down
```

**Access Points:**
- Frontend: http://localhost:80
- Backend: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui.html
- MongoDB: localhost:27017

---

## 💻 Option 2: Run Manually (Development)

### Start MongoDB

```bash
# If using Homebrew
brew services start mongodb-community

# Or with Docker
docker run -d -p 27017:27017 --name mongodb \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=admin123 \
  mongo:7.0
```

### Start Backend

```bash
cd backend

# Build
mvn clean install

# Run (make sure .env variables are exported)
export $(cat ../.env | xargs)
mvn spring-boot:run

# Or run the JAR
java -jar target/reservation-system-1.0.0.jar
```

Backend will start at: http://localhost:8080

### Start Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

Frontend will start at: http://localhost:5173

---

## 🧪 Test the Setup

### 1. Test Backend

```bash
# Health check
curl http://localhost:8080/actuator/health

# Should return: {"status":"UP"}
```

### 2. Test Swagger UI

Open: http://localhost:8080/swagger-ui.html

You should see all API endpoints documented.

### 3. Test OAuth2 Login

1. Go to frontend: http://localhost:5173
2. Click "Login with Google" or "Login with Facebook"
3. Authorize the app
4. You should be redirected back with a JWT token

### 4. Test Stripe Payment

1. Create a reservation
2. Use Stripe test card: `4242 4242 4242 4242`
3. Use any future date for expiry
4. Use any 3-digit CVC
5. Payment should succeed

**More test cards:** https://stripe.com/docs/testing

### 5. Test Email Notifications

1. Register a new user with your real email
2. Check your inbox for welcome email
3. Create a reservation
4. Check for reservation confirmation email

---

## 🔍 Verify Configuration

### Check if MongoDB is Running

```bash
mongosh
# Or
mongo

# Should connect successfully
```

### Check Backend Logs

```bash
# If using Docker
docker-compose logs backend

# If running manually
# Check console output for any errors
```

### Check Environment Variables are Loaded

```bash
cd backend
mvn spring-boot:run

# Look for log output:
# - "Started HotelReservationApplication"
# - No errors about missing environment variables
```

---

## 🐛 Troubleshooting

### Issue: OAuth2 "redirect_uri_mismatch" error

**Solution:** Make sure redirect URIs in Google/Facebook console EXACTLY match:
```
http://localhost:8080/login/oauth2/code/google
http://localhost:8080/login/oauth2/code/facebook
```

### Issue: Stripe webhook signature verification failed

**Solution:**
1. Use Stripe CLI for local testing:
   ```bash
   stripe listen --forward-to localhost:8080/api/payments/webhook
   ```
2. Use the webhook secret from CLI output in your `.env`

### Issue: Email not sending

**Solution:**
1. Make sure 2-Step Verification is enabled
2. Use App Password, not your regular Gmail password
3. Check `EMAIL_USERNAME` and `EMAIL_PASSWORD` are correct

### Issue: MongoDB connection refused

**Solution:**
```bash
# Start MongoDB
brew services start mongodb-community

# Or with Docker
docker-compose up -d mongodb
```

### Issue: JWT token invalid

**Solution:**
1. Make sure `JWT_SECRET` is at least 256 bits (32+ characters)
2. Same secret must be used in both backend and any token validation

### Issue: CORS errors in browser

**Solution:**
Make sure `APP_CORS_ALLOWED_ORIGINS` in backend includes your frontend URL:
```
http://localhost:5173,http://localhost:3000
```

---

## 📊 Test Data

### Create Admin User (via MongoDB)

```bash
mongosh

use hotel_reservation

db.users.insertOne({
  firstName: "Admin",
  lastName: "User",
  email: "admin@hotel.com",
  password: "$2a$10$...",  // Use BCrypt hash of "admin123"
  roles: ["ADMIN"],
  enabled: true,
  createdAt: new Date()
})
```

Or use the registration endpoint and update role via MongoDB.

### Create Test Rooms

Use Swagger UI or Postman to create rooms via `/api/rooms` endpoint.

Example room:
```json
{
  "name": "Deluxe Suite 101",
  "type": "DELUXE",
  "description": "Luxurious suite with ocean view",
  "pricePerNight": 299.99,
  "capacity": 2,
  "amenities": ["WiFi", "TV", "Mini Bar", "Ocean View"],
  "imageUrl": "https://example.com/room.jpg",
  "available": true,
  "floorNumber": 1,
  "size": 450
}
```

---

## 🎯 Next Steps

### Local Development:
1. ✅ **Verify all services are running**
2. ✅ **Test OAuth2 login flows**
3. ✅ **Test Stripe payment with test cards**
4. ✅ **Create test rooms and reservations**

### Production Deployment:
1. ✅ **Deploy to AWS** - See [aws.md](aws.md) for complete AWS setup guide
2. ✅ **Configure GitHub Actions** - Automated CI/CD pipeline
3. ✅ **Set up monitoring** - CloudWatch logs and alarms

---

## 🌐 Production Deployment

### AWS URLs (Production)

After deploying to AWS, your application will be accessible at:

```
Frontend:  http://hotelx-system-backend.s3-website-us-east-1.amazonaws.com
Backend:   http://[ECS-TASK-IP]:8080/api
```

**Note:** Backend IP is assigned dynamically. See workflow output after deployment.

### GitHub Secrets Required

For automated deployment via GitHub Actions:

```
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_ACCOUNT_ID=837271986183
BACKEND_API_URL=http://[BACKEND-IP]:8080/api
STRIPE_PUBLIC_KEY=pk_test_51xxxxx
```

### AWS Secrets Manager Required

Create these secrets in AWS Secrets Manager (us-east-1):

```
hotelx/jwt-secret
hotelx/stripe-api-key
hotelx/stripe-webhook-secret
hotelx/email-username
hotelx/email-password
hotelx/google-client-id
hotelx/google-client-secret
hotelx/facebook-client-id
hotelx/facebook-client-secret
hotelx/prod/documentdb-connection
```

**Detailed AWS setup instructions:** See [Docs/aws.md](aws.md)

---

## 📚 Additional Resources

### Documentation
- **AWS Deployment Guide:** [Docs/aws.md](aws.md) - Complete AWS infrastructure setup
- **Project Repository:** https://github.com/kurbonovm/20251027-p2-group3

### External Resources
- **Stripe Testing:** https://stripe.com/docs/testing
- **Google OAuth2:** https://developers.google.com/identity/protocols/oauth2
- **Facebook Login:** https://developers.facebook.com/docs/facebook-login
- **Spring Security OAuth2:** https://spring.io/guides/tutorials/spring-boot-oauth2/
- **MongoDB Documentation:** https://docs.mongodb.com/
- **AWS DocumentDB:** https://docs.aws.amazon.com/documentdb/
- **Amazon ECS:** https://docs.aws.amazon.com/ecs/

---

## 🆘 Need Help?

### Local Development
1. Check logs: `docker-compose logs -f`
2. Verify environment variables: `docker-compose config`
3. Check Swagger UI: http://localhost:8080/swagger-ui.html
4. MongoDB shell: `mongosh mongodb://admin:admin123@localhost:27017`

### AWS/Production
1. Check CloudWatch Logs: `/ecs/hotelx-backend`
2. Verify ECS tasks: AWS Console → ECS → Clusters
3. Check DocumentDB: AWS Console → Amazon DocumentDB
4. Review GitHub Actions: Repository → Actions tab

---

**Last Updated:** December 12, 2025
**Version:** 2.0.0
**Environment:** Local Development + AWS Production
