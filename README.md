# Proximity Chat

A hyper-local, real-time networking and dating application that uses H3 geohashing to connect people within a 500m radius.

## 🚀 Tech Stack

### Backend
- **Node.js + Express**: RESTful API and WebSocket server
- **PostgreSQL + Prisma**: Persistent storage for users, chats, and relationships
- **Redis**: High-performance geospatial caching and ephemeral state
- **Socket.io**: Real-time messaging and live events
- **Uber H3**: Hexagonal hierarchical spatial index for privacy-preserving location matching
- **Firebase**: Push notifications and photo storage
- **Docker**: Containerization and deployment

### Mobile App
- **React Native (Expo)**: Cross-platform mobile development
- **Zustand**: Global state management
- **React Navigation**: Complex routing and flow management
- **Lucide Icons**: Clean vector iconography

## 🔒 Safety & Privacy First
- **Zero Coordinate Persistence**: Exact GPS coordinates are never stored in the database. They live temporarily in Redis and are mapped to H3 hexagons.
- **Fuzzy Distances**: Users only see relative distances (e.g., "~150m away"), never a map pin.
- **Auto-expiring Sessions**: Chat requests expire in 10 minutes; active chats self-destruct after 24 hours.
- **Coordinate Blocking**: Real-time regex engines block the sharing of GPS coordinates in chat messages.
- **Automated Moderation**: 3 reports trigger an invisible, automatic shadow-ban.

## ✅ Newly Added Flows
- **Google + Apple social login API** (`POST /api/auth/social-login`)
- **Access + refresh token auth** (`accessToken` 15m, `refreshToken` 7d, `POST /api/auth/refresh`)
- **Post feed API** with public/proximity visibility:
  - `POST /api/posts`
  - `GET /api/posts/feed`
  - `POST /api/posts/:id/like`
  - `POST /api/posts/:id/comments`
  - `GET /api/posts/:id/comments`

## 📋 Feature completion tracker

See **[COMPLETION_CHECKLIST.md](./COMPLETION_CHECKLIST.md)** for:
- Every required feature (done / partial / missing)
- **Exactly what credentials you must provide** (Twilio, Firebase, S3, etc.)
- Production deployment steps

## 🛠️ Local Development Setup

### Prerequisites
- Node.js (v18+)
- Docker and Docker Compose
- Expo CLI (`npm i -g expo-cli`)

### 1. Backend Setup

1. Navigate to the root directory and start the infrastructure:
```bash
docker-compose up -d postgres redis
```

> **Note:** Postgres is exposed on host port **5433** (not 5432) to avoid conflicts with a local PostgreSQL install. Update `backend/.env` if you change this.

2. Navigate to the backend directory:
```bash
cd backend
```

3. Install dependencies:
```bash
npm install
```

4. Configure environment variables:
Copy `.env.example` to `.env`. The database and redis URLs are pre-configured for docker-compose. Add your Firebase credentials if you want to test push notifications and photo uploads (otherwise it will fall back to mock mode).

5. Run Prisma migrations:
```bash
npm run migrate
```

6. Start the development server:
```bash
npm run dev
```
The server will start on `http://localhost:4000`.

### 2. Mobile Setup

1. Open a new terminal and navigate to the mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Copy `.env.example` to `.env`. For a physical device, set `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_SOCKET_URL` to your machine's LAN IP (e.g. `http://192.168.1.50:4000/api`).

4. Start the Expo development server:
```bash
npm start
```
Use the Expo Go app on your phone, or press `i` for iOS simulator / `a` for Android emulator.

## 🧪 Testing

To run the backend integration tests:
```bash
cd backend
npm test
```

## 📦 Deployment (Render/Railway ready)
The `docker-compose.yml` and `backend/Dockerfile` are production-ready.
1. Spin up a managed PostgreSQL and Redis instance.
2. Deploy the `backend/Dockerfile`.
3. The entrypoint automatically runs `npx prisma migrate deploy` before starting the server.
