const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let meetings = [];

// 🧠 Weekend logic
const adjustDateIfWeekend = (dateStr) => {
  const date = new Date(dateStr);
  const day = date.getDay();

  if (day === 6) date.setDate(date.getDate() + 2);
  if (day === 0) date.setDate(date.getDate() + 1);

  return date;
};

// ➕ Add meeting
app.post("/schedule", (req, res) => {
  const { title, datetime } = req.body;

  const original = new Date(datetime);
  const adjusted = adjustDateIfWeekend(datetime);

  const meeting = {
    id: Date.now(),
    title,
    scheduledTime: adjusted,
    adjusted: original.getTime() !== adjusted.getTime(),
  };

  meetings.push(meeting);
  res.json({ meeting });
});

// 📅 Get meetings
app.get("/meetings", (req, res) => {
  res.json({ meetings });
});

// 🔄 Reschedule (Drag & Drop)
app.put("/reschedule/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { newStart } = req.body;

  const meeting = meetings.find((m) => m.id === id);
  if (!meeting) return res.status(404).send("Not found");

  const adjusted = adjustDateIfWeekend(newStart);

  meeting.scheduledTime = adjusted;
  meeting.adjusted = true;

  res.json({ meeting });
});

// 🗑 Delete
app.delete("/delete/:id", (req, res) => {
  const id = parseInt(req.params.id);
  meetings = meetings.filter((m) => m.id !== id);
  res.json({ message: "Deleted" });
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});