# MERN Stack Application

A simple MERN (MongoDB, Express, React, Node.js) application with a blank white landing page.

## Project Structure
```
mern-app/
├── backend/          # Express.js server
│   ├── server.js     # Main server file
│   ├── package.json  # Backend dependencies
│   └── .env          # Environment variables
├── frontend/         # React app
│   ├── public/       # Public assets
│   ├── src/          # React source code
│   └── package.json  # Frontend dependencies
└── package.json      # Root package.json for scripts
```

## Installation

1. Install root dependencies:
```bash
npm install
```

2. Install all dependencies (backend + frontend):
```bash
npm run install-all
```

## Running the Application

### Development Mode (Both frontend and backend)
```bash
npm run dev
```

This will start:
- Backend server on http://localhost:5000
- Frontend React app on http://localhost:3000

### Individual Commands
- Backend only: `npm run server`
- Frontend only: `npm run client`

## Features

- **Backend**: Express.js server with MongoDB connection ready
- **Frontend**: React app with blank white landing page
- **Development**: Concurrently runs both frontend and backend
- **API**: Basic test endpoint at `/api/test`

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (optional - will show connection error but app will still work)

## Environment Variables

Backend environment variables are in `backend/.env`:
- `PORT`: Server port (default: 5000)
- `MONGODB_URI`: MongoDB connection string

## API Endpoints

- `GET /api/test` - Test endpoint to verify backend is running