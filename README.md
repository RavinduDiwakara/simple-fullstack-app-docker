# Simple Full-Stack Dockerized Application (CloudTasks)

A complete, production-ready full-stack application containerized using **Docker** and **Docker Compose**.

---

## 🏗️ Architecture Overview

The application is decomposed into 3 separate containerized services connected via a dedicated Docker bridge network (`fullstack-net`):

```
                      +-----------------------------+
                      |   Client (React + Nginx)    |
                      |   Port: 3000 -> 80          |
                      +--------------+--------------+
                                     |
                         /api calls  |  reverse-proxied
                                     v
                      +-----------------------------+
                      |    Server (Node.js/Express) |
                      |    Port: 5000 -> 5000       |
                      +--------------+--------------+
                                     |
                                     |  mongoose connection
                                     v
                      +-----------------------------+
                      |    Database (MongoDB 7)     |
                      |    Port: 27017 -> 27017     |
                      |    Volume: mongo-data       |
                      +-----------------------------+
```

1. **Frontend (`client`)**:
   - Built with **React 18 + Vite** (JavaScript).
   - High-performance dark-mode UI with live container status monitoring and CRUD interactions.
   - Production bundle served by **Nginx** on Alpine Linux.
   - Nginx reverse-proxies `/api/*` to the Express backend container.

2. **Backend (`server`)**:
   - Built with **Express 5** and **Mongoose 9**.
   - Exposes RESTful endpoints for CRUD items and `/api/health`.
   - Connected to MongoDB using environment variables (`MONGO_URI`).

3. **Database (`mongo`)**:
   - Official MongoDB image.
   - Data persisted using named Docker volume `mongo-data`.

---

## 🚀 Getting Started with Docker

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### 1. Build and Run All Services
In the project root directory, run:

```bash
docker compose up --build
```

To run in detached mode (background):
```bash
docker compose up --build -d
```

### 2. Access the Application
- **Frontend Web App**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

### 3. Check Container Status
```bash
docker compose ps
```

### 4. View Container Logs
```bash
# Follow logs for all services
docker compose logs -f

# Follow logs for backend only
docker compose logs -f server
```

### 5. Stop Containers
```bash
# Stop and remove containers and network
docker compose down

# Stop and wipe database volume
docker compose down -v
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API status and root greeting |
| `GET` | `/api/health` | Container and MongoDB connectivity status |
| `GET` | `/api/items` | Retrieve all items (sorted by newest) |
| `POST` | `/api/items` | Create a new item (`{ title, description }`) |
| `PATCH` | `/api/items/:id/toggle` | Toggle item completion status |
| `DELETE` | `/api/items/:id` | Delete an item by ID |

---

## 🛠️ Local Development (Without Docker)

### Backend
```bash
cd server
npm install
npm run dev # or npm start
```

### Frontend
```bash
cd client
npm install
npm run dev
```
The Vite development server runs at [http://localhost:3000](http://localhost:3000) and automatically proxies `/api` requests to [http://localhost:5000](http://localhost:5000).
