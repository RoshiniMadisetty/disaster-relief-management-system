# Disaster Relief Resource Allocation and Aid Distribution System

DBMS Experiential Learning – Level 3 project (PES University).
Team: Parnika Machamma (PES2UG24CS255), Roshini Madisetty (PES2UG24CS256)

**Stack:** Next.js 14 (UI + API route handlers) · MySQL (relational data) · MongoDB (field reports) · Git/GitHub

## Prerequisites
- Node.js 20 or newer
- MySQL 8.0.16 or newer (CHECK constraints are enforced from this version)
- MongoDB Community Server running on `mongodb://127.0.0.1:27017` (or a MongoDB Atlas URI)

## Setup and run
```bash
# 1. Install packages (inside the project folder)
npm install

# 2. Create the environment file and edit it with your MySQL password
cp .env.example .env.local          # Windows CMD: copy .env.example .env.local

# 3. Create the MySQL database, tables, triggers, views and procedure
mysql -u root -p < sql/schema.sql
mysql -u root -p Disaster_Relief_DB < sql/advanced.sql

# 4. Add users (hashed passwords), sample data and MongoDB indexes
npm run seed

# 5. Start the app
npm run dev                          # open http://localhost:3000
```

Logins created by the seed script:

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Admin |
| staff | staff123 | Staff |

Admin: manage disasters/resources, allocate stock, change statuses, delete records.
Staff: register beneficiaries, raise aid requests, record distributions, add field reports.

## Useful commands
```bash
mysql -u root -p Disaster_Relief_DB < sql/queries.sql   # run the important queries
npm run build && npm start                               # production mode
```

## Folder structure
```
sql/        schema.sql, advanced.sql, queries.sql
scripts/    seed.mjs
lib/        db.js (MySQL), mongo.js (MongoDB), auth.js (JWT + roles), client.js
app/api/    route handlers (the backend/API layer)
app/        pages (dashboard, disasters, resources, beneficiaries, requests, allocations, distributions, reports)
components/ Nav.js, Table.js
docs/       DOCUMENTATION.md
```

## Git / GitHub (each member commits their own work)
```bash
git init
git add .
git commit -m "Initial project setup"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```
Teammate:
```bash
git clone https://github.com/<your-username>/<repo-name>.git
git config user.name "Your Name"          # so commits show who did what
git config user.email "you@example.com"
git add <files you worked on>
git commit -m "Describe your change"
git pull --rebase origin main
git push
```
