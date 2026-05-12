import React, { useEffect, useState, useCallback } from "react";
import moment from "moment";
import { Calendar, momentLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "./App.css";

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

function App() {
  const API = "http://127.0.0.1:5000";

  const [meetings, setMeetings] = useState([]);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [dark, setDark] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [title, setTitle] = useState("");
  const [datetime, setDatetime] = useState("");
  const [category, setCategory] = useState("Work");

  // ✅ SAFE FETCH (FIXES ERROR)
  const fetchMeetings = useCallback(async () => {
    try {
      const res = await fetch(`${API}/meetings`, {
        headers: { Authorization: token },
      });

      if (!res.ok) return;

      const data = await res.json();
      setMeetings(data.meetings || []);
    } catch (err) {
      console.log("Backend error:", err);
    }
  }, [token]);

  // ✅ PREVENT EARLY CALL
  useEffect(() => {
    if (!token) return;
    fetchMeetings();
  }, [token, fetchMeetings]);

  // 🔐 Login
  const login = async () => {
    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          email: "test@test.com",
          password: "123"
        }),
      });

      const data = await res.json();

      if (data.token) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
      } else {
        alert("Login failed");
      }
    } catch (err) {
      alert("Backend not running!");
    }
  };

  // ➕ Add
  const addMeeting = async () => {
    const res = await fetch(`${API}/schedule`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({ title, datetime, category }),
    });

    if (res.status === 400) {
      alert("⚠️ Conflict!");
      return;
    }

    setShowModal(false);
    fetchMeetings();
  };

  // 🗑 Delete
  const deleteMeeting = async (id) => {
    await fetch(`${API}/delete/${id}`, {
      method: "DELETE",
      headers: { Authorization: token },
    });
    setShowModal(false);
    fetchMeetings();
  };

  // 🔄 Drag
  const moveEvent = async ({ event, start }) => {
    await fetch(`${API}/reschedule/${event.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({ newStart: start.toISOString() }),
    });
    fetchMeetings();
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  const events = meetings.map((m) => ({
    id: m.id,
    title: m.title,
    start: new Date(m.scheduledTime),
    end: new Date(new Date(m.scheduledTime).getTime() + 3600000),
    color: m.color,
  }));

  // 🔐 Login UI
  if (!token) {
    return (
      <div className="login">
        <h2>Login</h2>
        <button onClick={login}>Login</button>
      </div>
    );
  }

  return (
    <div className={dark ? "dark layout" : "light layout"}>
      <div className="sidebar">
        <h2>📅 Scheduler</h2>

        <button onClick={() => {
          setSelectedEvent(null);
          setShowModal(true);
        }}>
          ➕ Create
        </button>

        <button onClick={() => setDark(!dark)}>
          {dark ? "🌙 Dark" : "☀️ Light"}
        </button>
      </div>

      <div className="main">
        <DnDCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "90vh" }}
          onEventDrop={moveEvent}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={(event) => ({
            style: {
              backgroundColor: event.color,
              borderRadius: "8px",
              border: "none",
            },
          })}
        />
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">

            {!selectedEvent ? (
              <>
                <h2>Create Meeting</h2>
                <input placeholder="Title" onChange={(e)=>setTitle(e.target.value)} />
                <input type="datetime-local" onChange={(e)=>setDatetime(e.target.value)} />
                <select onChange={(e)=>setCategory(e.target.value)}>
                  <option>Work</option>
                  <option>Personal</option>
                  <option>Urgent</option>
                </select>
                <button onClick={addMeeting}>Add</button>
              </>
            ) : (
              <>
                <h2>{selectedEvent.title}</h2>
                <p>{new Date(selectedEvent.start).toLocaleString()}</p>
                <button onClick={() => deleteMeeting(selectedEvent.id)}>
                  Delete
                </button>
              </>
            )}

            <button onClick={()=>setShowModal(false)}>Close</button>

          </div>
        </div>
      )}
    </div>
  );
}

export default App;