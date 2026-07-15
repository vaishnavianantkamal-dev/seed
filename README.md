# Ellora Seeds Sales Analytics CRM

## Prerequisites
- Node.js 20+
- MongoDB running locally or Atlas reachable

## Install
```bash
npm install
npm install --prefix server
npm install --prefix client
```

## Seed admin user and sample data
```bash
npm run seed
```

## Run
```bash
npm run dev
```

Open the client at http://localhost:5173 and log in with the seeded admin account.

## Deployment notes
- Frontend: deploy on Vercel using the client folder with Vite build.
- Backend: deploy on Render as a Node.js service using the server folder.
- Set the following environment variables on the deployment platforms:
  - MONGO_URI
  - JWT_SECRET
  - CLIENT_ORIGIN
  - ADMIN_EMAIL
  - ADMIN_PASSWORD
