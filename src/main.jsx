import React, {useEffect, useState} from "react";
import ReactDOM from "react-dom/client";
import './style.css';


// THIS IS THE FRONT END

function App() {
    // Keep track of notes fetched from backend
    const [notes, setNotes] = useState([]);
    // Store what's typed in the input box
    const [newNote, setNewNote] = useState("");

    //Fetch them notes when load
    useEffect(() => {
        // Tells front-end what port the backend is on
        fetch('http://localhost:5000/')
            // Converts server response to a string that react can read
            .then((res) => res.text())
            // Logs extracted text to the console
            .then((data) => console.log(data))
            // Logs errors to the console
            .catch((err) => console.log(err));
    }, []);

    //Sends new note to the backend for storage
    const handleAddNote = (e) => {
        e.preventDefault();
        if (!newNote.trim()) return; // stop if the input is empty

        fetch("http://localhost:5000/notes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: newNote }),
        })
            .then((res) => res.json())
            .then((savedNote) => {
                setNotes((prev) => [...prev, savedNote]); // add new note to state
                setNewNote(""); // clear input field
            })
            .catch((err) => console.error("Error saving note:", err));
    };

    return (
        <div className="app-container">
            <h1 className="app-title">StudyBuddy</h1>
            <form onSubmit={handleAddNote} className="note-form">
                <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Write your new note..."
                    className="note-input"
                />
                <button type="submit" className="note-button">Save</button>
            </form>
            <div className="notes-lists">
                {notes.length === 0 ? (
                    <p className="no-notes">No notes yet! Start writing!</p>
                ): (
                    notes.map((note) => (
                        <div key={note.id} className="note-item">
                            <p>{note.text}</p>
                            {/*Fix the date, its not populating correctly */}
                            <small>{new Date(note.createdAt).toLocaleString()}</small>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}



ReactDOM.createRoot(document.getElementById("root")).render(<App />);
