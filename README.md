# Flash Sale & Event Ticketing Backend

Hey there! This is a backend system built to solve a classic engineering headache: keeping flash sales from crashing or overselling when thousands of people try to buy the last few tickets at the exact same millisecond.

Standard relational databases can choke or suffer from race conditions under heavy concurrent load (where multiple users somehow manage to buy the very last ticket). This project solves that by combining **Redis** for ultra-fast, atomic state management with **PostgreSQL** for reliable, persistent storage.

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
git clone [https://github.com/maiaeltufaili/ticket-platform.git](https://github.com/maiaeltufaili/ticket-platform.git)
cd ticket-platform
