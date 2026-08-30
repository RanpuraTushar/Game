# Neon Rift: Last Stand

A fast-paced multiplayer survival/battle browser game in a futuristic cyberpunk arena.

## Project Structure

This is a monorepo setup containing both frontend and backend.

- `/client` - React + Vite + Phaser 3 frontend
- `/server` - Node.js + Express + Socket.IO backend
- `/database` - MySQL schema and migrations
- `/shared` - Shared logic and constants
- `/docs` - Architecture and API documentation

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- MySQL Server (e.g., via XAMPP)

### Database Setup
1. Start your local MySQL server.
2. Run the `database/schema.sql` script to create the `neon_rift` database and tables.

### Backend Setup
```bash
cd server
npm install
npm run dev
```
Server runs on `http://localhost:3001`

### Frontend Setup
```bash
cd client
npm install
npm run dev
```
Client runs on `http://localhost:3000`

## Tech Stack
- **Frontend:** React, HTML5, CSS (Glassmorphism + Neon), Phaser 3
- **Backend:** Node.js, Express, Socket.IO (Authoritative Server)
- **Database:** MySQL

## Platform Status: Active & Ready
