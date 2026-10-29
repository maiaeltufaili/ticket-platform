const express = require('express');
const { createClient } = require('redis');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// PostgreSQL Client Setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Redis Client Setup
const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

// Retry helper function for database connections
async function retryConnection(fn, retries = 5, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      console.log(`Connection failed. Retrying in ${delay / 1000}s... (${i + 1}/${retries})`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
}

async function initializeDatabase() {
  await retryConnection(async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        event_id INT NOT NULL,
        user_id VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  });
  console.log('Database tables verified.');
}

async function initializeCache() {
  const ticketsLeft = await redisClient.get('event:1:tickets');
  if (ticketsLeft === null) {
    await redisClient.set('event:1:tickets', 10); // Limit to 10 tickets for testing flash sale
    console.log('Redis cache seeded: Event 1 has 10 tickets available.');
  }
}

/**
 * BOOKING ENDPOINT (Handles High Concurrency Race Conditions)
 */
app.post('/api/book', async (req, res) => {
  const { userId, eventId } = req.body;
  if (!userId || !eventId) {
    return res.status(400).json({ error: 'userId and eventId are required' });
  }

  const ticketKey = `event:${eventId}:tickets`;

  try {
    // 1. ATOMIC DECREMENT IN REDIS
    const remainingTickets = await redisClient.decr(ticketKey);

    if (remainingTickets < 0) {
      await redisClient.incr(ticketKey);
      return res.status(409).json({ success: false, message: 'Sold out!' });
    }

    // 2. PERSIST ORDER TO POSTGRES
    await pool.query(
      'INSERT INTO orders (event_id, user_id) VALUES ($1, $2)',
      [eventId, userId]
    );

    return res.status(200).json({
      success: true,
      message: 'Ticket booked successfully!',
      remainingTickets,
    });
  } catch (error) {
    console.error('Booking error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server and initialize dependencies with retry safety
async function start() {
  try {
    console.log('Connecting to Redis...');
    await redisClient.connect();
    
    console.log('Connecting to PostgreSQL...');
    await initializeDatabase();
    
    await initializeCache();

    app.listen(PORT, () => {
      console.log(`Ticket Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

start();