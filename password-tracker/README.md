# Password Expiry Tracker

A simple full-stack version of the Agent Password Expiry Tracker: a Node/Express
backend storing data in a JSON file, and a plain HTML/JS frontend that talks to it.

## What it does

- Add an agent with their last password change date and expiry policy (30/60/90 days)
- Automatically works out the expiry date, days left, and status (OK / due soon / expiring / expired)
- Send a reminder (simulated — logs to the server console, no real email is sent)
- Reset a password (marks it as changed today)
- Remove an agent
- Data is saved in `data.json`, so it's still there next time you start the server

## How to run it

You'll need [Node.js](https://nodejs.org) installed (any recent version works).

1. Open a terminal in this folder
2. Install the one dependency:
   ```
   npm install
   ```
3. Start the server:
   ```
   npm start
   ```
4. Open your browser to:
   ```
   http://localhost:3000
   ```

That's it — the page talks to the backend automatically.

## How it's built

- `server.js` — the backend. A few REST endpoints:
  - `GET /api/agents` — list all agents with expiry/status already calculated
  - `POST /api/agents` — add a new agent
  - `PUT /api/agents/:id/reset` — mark a password as reset today
  - `POST /api/agents/:id/remind` — simulate sending a reminder email
  - `DELETE /api/agents/:id` — remove an agent
- `data.json` — where agent records are stored (plain JSON file, no database setup needed)
- `public/index.html` — the frontend, calls the API above with `fetch`

## Notes

- This uses a JSON file instead of a real database to keep things simple — fine for
  a small internal tool, but if this ever needs to support many agents at once, a
  proper database (like SQLite or PostgreSQL) would be the next step.
- "Remind" doesn't send a real email yet — it just confirms the action. Wiring up
  real email (e.g. via nodemailer) would be a natural next step for this project.
