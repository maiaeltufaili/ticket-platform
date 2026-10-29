
```markdown
# Flash Sale & Event Ticketing Backend

Hey there! This is a backend system built to solve a classic engineering headache: **keeping flash sales from crashing or overselling when thousands of people try to buy the last few tickets at the exact same millisecond.**

Standard relational databases can choke or suffer from race conditions under heavy concurrent load (where multiple users somehow manage to buy the very last ticket). This project solves that by combining **Redis for ultra-fast, atomic state management** with **PostgreSQL for reliable, persistent storage**.

---

## What's Under the Hood?

* **Atomic Concurrency Control:** Uses Redis `DECR` commands. Because Redis operations are single-threaded and atomic, even if 1,000 requests hit the server at the exact same time, it safely decrements the ticket count without any race conditions or overselling.
* **Separation of Concerns:** 
  * **Redis:** Handles high-speed inventory tracking and rate limiting in memory.
  * **PostgreSQL:** Acts as the source of truth, persisting successful orders securely to disk.
* **Fully Containerized:** Everything (App, Database, Cache) spins up instantly using Docker Compose.

---

## Tech Stack
* **Runtime:** Node.js & Express
* **In-Memory Cache & Concurrency:** Redis
* **Database:** PostgreSQL (`pg`)
* **Infrastructure:** Docker & Docker Compose

---

## Getting Started Locally

Getting this running on your machine takes less than a minute if you have Docker installed.

### 1. Clone & Navigate
```bash
git clone [https://github.com/YOUR_USERNAME/ticket-platform.git](https://github.com/YOUR_USERNAME/ticket-platform.git)
cd ticket-platform

```

### 2. Fire Up Docker Compose

Run the app in the background:

```bash
docker compose up -d --build

```

This automatically boots up PostgreSQL, Redis, and your Node.js container.

---

## How to Test It (The Concurrency Stress Test)

Want to see the race-condition protection in action? We can simulate a mini flash-sale mob.

### 1. Fire a batch of parallel requests

Run this script in your terminal to fire 20 simultaneous checkout requests when only 10 tickets are available:

```bash
for i in {1..20}; do
  curl -s -X POST http://localhost:3000/api/book \
    -H "Content-Type: application/json" \
    -d "{\"userId\": \"user_$i\", \"eventId\": 1}" &
done
wait

```

### 2. What happens?

* Exactly **10 requests** will succeed (`"success": true`) and grab the tickets.
* The remaining **10 requests** will cleanly return `"Sold out!"` with zero database corruption, negative inventory counts, or race conditions.

*(Note: If you want to run the test again later, just reset the Redis counter back to 10 with: `docker compose exec redis redis-cli set event:1:tickets 10`)*

---

## Project Structure

```text
├── docker-compose.yml       # Orchestrates app, postgres, and redis containers
├── Dockerfile               # Container setup for the Node.js service
├── package.json             # Project dependencies (express, pg, redis)
├── server.js                # Core API routing and Redis concurrency logic
└── README.md                # You are here!

```

```

```