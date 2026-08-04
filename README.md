# Proximity Chat - AI DevSecOps App

A hyper-local, real-time networking and dating application that uses H3 geohashing to connect people within a 500m radius. This project serves as a comprehensive **DevSecOps** demonstration, implementing strict CI/CD pipelines, automated security scanning, container orchestration, and real-time observability.

---

## 📖 About the Project

**Proximity Chat** is built with privacy and security at its core. Instead of tracking exact GPS coordinates, the application uses **Uber's H3 Hexagonal Hierarchical Spatial Index** to map users to approximate geographic zones. 

### Key Features:
- **Zero Coordinate Persistence**: Exact GPS coordinates are never stored; they are mapped to H3 hexagons and kept temporarily in Redis.
- **Real-Time Connections**: Socket.io enables instant messaging and live location-based event broadcasting.
- **Privacy First**: Users see fuzzy distances ("~150m away") and regex engines block sharing precise coordinates in chat.
- **Social & Gamification**: Google/Apple authentication, feed posts, neighborhood titles, and "Two Truths and a Lie" widgets.

### Core Tech Stack:
- **Backend:** Node.js, Express, Socket.io, Prisma ORM
- **Frontend:** React Native (Expo), Zustand
- **Database:** PostgreSQL (Persistent), Redis (Ephemeral/Geospatial)
- **DevSecOps:** Docker, Jenkins, Prometheus, Grafana, Trivy

---

## 🐳 The Docker Architecture

The application is fully containerized and orchestrated using `docker-compose`. The architecture consists of the following microservices:

1. **`postgres`**: Runs PostgreSQL 15. Stores persistent user data, chat histories, relationships, and application states. Volume mapped for data persistence.
2. **`redis`**: Runs Redis 7. Handles high-speed geospatial queries, WebSocket pub/sub messaging, and temporary session data.
3. **`backend`**: Custom Node.js image. Connects to Postgres and Redis. Automatically runs `prisma db push` on startup to ensure database schema synchronization.
4. **`web`**: Serves the mobile/web application bundle.
5. **`prometheus`**: Scrapes performance metrics (CPU, Memory, API request times) directly from the backend.
6. **`grafana`**: Provides visual dashboards for application health and log monitoring. It is automatically provisioned to connect to Prometheus on boot.

---

## 🧪 The Testing Process & QA Strategy

Quality assurance and security are enforced at multiple layers before any code reaches deployment. This project follows a "Shift-Left" testing approach, where security and functionality are verified as early as possible in the development lifecycle.

### 1. Unit Testing (Functionality)
- **What it tests:** Individual, isolated functions such as the Uber H3 geohashing logic, distance calculation algorithms, and JWT token generation.
- **Tools used:** Jest.
- **Execution:** Runs instantly on every code commit. Ensures core business logic remains intact when refactoring.

### 2. Integration Testing (API & Database)
- **What it tests:** The connection between the Node.js Express server, the PostgreSQL database, and the Redis cache. Validates critical flows like user registration, authentication (Google/Apple login), WebSocket (Socket.io) event emissions, and feed post creation.
- **Tools used:** Jest, Supertest.
- **Execution:** `npm test` inside the backend directory. Requires a test database instance to verify Prisma ORM transactions.

### 3. End-to-End (E2E) Testing (Mobile Experience)
- **What it tests:** Simulates real user behavior on the React Native mobile app. This includes navigating through the UI, entering OTPs, interacting with the "Two Truths and a Lie" widgets, and rendering the dynamic feed.
- **Tools used:** Detox or Appium.
- **Execution:** Runs against a staging environment before final production releases to guarantee the user journey is flawless.

### 4. Static Application Security Testing (SAST)
- **What it tests:** Analyzes the source code and dependencies for known security flaws (CVEs), outdated packages, or bad coding practices (such as hardcoded secrets).
- **Tools used:** `npm audit` (integrated into Pipeline stage 2), SonarQube.
- **Execution:** The Jenkins pipeline will automatically block the build if high or critical vulnerabilities are found in the project dependencies.

### 5. Container & OS Vulnerability Scanning
- **What it tests:** Scans the compiled Docker images (`backend:latest`, `web:latest`) layer-by-layer. Checks the underlying base OS image (e.g., Debian/Alpine), the Node.js runtime environment, and system binaries for exploits.
- **Tools used:** AquaSec Trivy.
- **Execution:** The Jenkins pipeline executes Trivy via the Docker daemon. The pipeline will fail if unresolved OS-level critical vulnerabilities are detected before deployment.

---

## ⚙️ The DevSecOps (CI/CD) Process

The project utilizes a declarative **Jenkinsfile** to define a strict, automated DevSecOps pipeline. The pipeline executes in the following stages:

1. **Checkout Code:** Pulls the latest commits from the source control repository.
2. **Scan Dependencies:** Runs high-level dependency audits on the Node.js environment.
3. **Run Automated Tests:** Installs dependencies and runs integration tests.
4. **Build Docker Containers:** Executes `docker-compose build` to create fresh, immutable container images for the backend and frontend.
5. **Scan Containers:** Runs Trivy against the newly built images to ensure they meet security compliance (Zero Critical vulnerabilities).
6. **Manual Approval Gate:** The pipeline pauses. A DevOps engineer or release manager must manually click "Approve" in the Jenkins UI to authorize the release.
7. **Deploy:** Executes the deployment sequence to the target environment.

---

## 🚀 The Deployment Process

Deployment is fully automated but gated by human approval to ensure maximum safety.

### 1. Pre-Deployment Configuration
Environment variables (`DATABASE_URL`, `REDIS_URL`, API Keys) are injected securely into the Docker environment. Secrets are kept out of source control.

### 2. Zero-Downtime Database Migrations
When the backend container boots up, its entrypoint command is:
`sh -c "npx prisma db push --skip-generate && node src/index.js"`
This ensures that the database schema is seamlessly updated to match the new application code before the Node.js server starts accepting traffic.

### 3. Container Orchestration
The deployment stage runs `docker-compose up -d`, which gracefully shuts down old containers and replaces them with the newly built, security-scanned versions. The application instantly resumes with the updated state.

### 4. Observability & Monitoring
Post-deployment, **Prometheus** immediately begins scraping metrics from the newly deployed containers. Operations teams use **Grafana** (accessible on port `3001`) to monitor CPU usage, memory leaks, and API response times in real-time.

---

## 🛠️ Local Development Setup

To run the full stack locally:

1. **Start the Infrastructure (Databases & Monitoring):**
   ```bash
   docker-compose up -d postgres redis prometheus grafana
   ```

2. **Start the Backend:**
   ```bash
   cd backend
   npm install
   cp .env.example .env  # Add your variables
   npm run dev
   ```

3. **Start the Mobile App:**
   ```bash
   cd mobile
   npm install
   npm start
   ```

*(For detailed feature tracking and API requirements, see `COMPLETION_CHECKLIST.md`)*
