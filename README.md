# AgroTech

Monorepo for the AgroTech application, containing backend APIs and frontend dashboards/reports.

## Structure

- `BackEnd/` Node.js + Express + MongoDB API
- `Frontend/` React application (Dashboard, Mini-Dashboard, Table View, Farm Performance Report)

## Backend Overview

Key features:

- JWT auth (`/api/v1/auth/*`)
- Soil monitoring APIs (`/api/v1/soil/*`)
- User management APIs (`/api/v1/users/*`)
- OEE/PLC APIs (`/api/v1/oee/*`)
- Centralized error handling, logging, and Docker support

Run backend:

```bash
cd BackEnd
npm install
npm run dev
```

Run frontend:

```bash
cd Frontend
npm install
npm run start
```

Production:

```bash
cd BackEnd
npm start
```

## Frontend Routes

- `/app/dashboard` Dashboard
- `/app/miniDash` Mini-Dashboard
- `/app/report` Table View (soil nutrient table)
- `/app/qualityc` Farm Performance Report

## Core Frontend Features

- Dashboard views for operational and soil metrics
- Mini-Dashboard for compact high-level monitoring
- Table View for soil nutrient data exploration
- Farm Performance Report for crop and health insights
- Date range filtering across major data views
- Export/reporting support for operational workflows

## Core Backend Features

- JWT-based authentication and session endpoints
- Soil data ingestion, retrieval, and ideals APIs
- OEE/PLC data endpoints
- User management endpoints
- Centralized error handling and request logging
- Production-ready Node.js/Express service with MongoDB

## Setup

Install workspace dependencies:

```bash
npm install
cd BackEnd && npm install
cd ../Frontend && npm install
```

## Local Development

Use these commands (as currently configured):

```bash
# Terminal 1
cd BackEnd
npm run dev

# Terminal 2
cd Frontend
npm run start
```

## Notes

- Date range format in top bars: `MMM D, YYYY -> MMM D, YYYY`
- Backend env vars are configured in `BackEnd/.env`
