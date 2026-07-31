const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// --- simple file-based "database" ---
function readData() {
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw);
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// --- helpers ---
function statusFor(daysLeft) {
  if (daysLeft < 0) return "expired";
  if (daysLeft <= 5) return "expiring_soon";
  if (daysLeft <= 14) return "due_soon";
  return "ok";
}

function withComputedFields(agent) {
  const changedDate = new Date(agent.changed);
  const expiryDate = new Date(changedDate);
  expiryDate.setDate(expiryDate.getDate() + Number(agent.policy));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

  return {
    ...agent,
    expiry: expiryDate.toISOString().slice(0, 10),
    daysLeft,
    status: statusFor(daysLeft),
  };
}

// --- routes ---

// GET all agents (with computed expiry/status), sorted by soonest expiry
app.get("/api/agents", (req, res) => {
  const data = readData();
  const agents = data.agents
    .map(withComputedFields)
    .sort((a, b) => new Date(a.expiry) - new Date(b.expiry));
  res.json(agents);
});

// POST a new agent
app.post("/api/agents", (req, res) => {
  const { name, changed, policy } = req.body;

  if (!name || !changed || !policy) {
    return res.status(400).json({ error: "name, changed, and policy are required" });
  }

  const data = readData();
  const newAgent = { id: data.nextId, name, changed, policy: Number(policy) };
  data.agents.push(newAgent);
  data.nextId += 1;
  writeData(data);

  res.status(201).json(withComputedFields(newAgent));
});

// PUT reset an agent's password change date to today
app.put("/api/agents/:id/reset", (req, res) => {
  const id = Number(req.params.id);
  const data = readData();
  const agent = data.agents.find((a) => a.id === id);

  if (!agent) return res.status(404).json({ error: "Agent not found" });

  agent.changed = new Date().toISOString().slice(0, 10);
  writeData(data);

  res.json(withComputedFields(agent));
});

// POST simulate sending a reminder email
app.post("/api/agents/:id/remind", (req, res) => {
  const id = Number(req.params.id);
  const data = readData();
  const agent = data.agents.find((a) => a.id === id);

  if (!agent) return res.status(404).json({ error: "Agent not found" });

  // In a real system this would send an actual email.
  console.log(`Reminder email sent to ${agent.name}`);
  res.json({ message: `Reminder email sent to ${agent.name}` });
});

// DELETE an agent
app.delete("/api/agents/:id", (req, res) => {
  const id = Number(req.params.id);
  const data = readData();
  const before = data.agents.length;
  data.agents = data.agents.filter((a) => a.id !== id);

  if (data.agents.length === before) {
    return res.status(404).json({ error: "Agent not found" });
  }

  writeData(data);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Password Expiry Tracker running at http://localhost:${PORT}`);
});
