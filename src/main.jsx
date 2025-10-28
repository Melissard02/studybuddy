import React, {useEffect, useState} from "react";
import ReactDOM from "react-dom/client";
import './style.css';


// THIS IS THE FRONT END

function App() {
    // Keep track of notes fetched from backend
    const [notes, setNotes] = useState([]);

    // Store what's typed in the input box
    const [newNote, setNewNote] = useState("");

    // Update notes
    const [editNoteId, setEditNoteId] = useState(null);

    //Fetch them notes when load
    useEffect(() => {
        // Load notes before the fetch
        const savedNotes = localStorage.getItem("notes");
        if (savedNotes) {
            setNotes(JSON.parse(savedNotes));
        }

        // Tells front-end what port the backend is on
        fetch('http://localhost:5000/')
            // Converts server response to a string that react can read
            .then((res) => res.text())
            // Logs extracted text to the console
            .then((data) => console.log(data))
            // Logs errors to the console
            .catch((err) => console.log(err));
    }, []);
    useEffect(() => {
        localStorage.setItem('notes', JSON.stringify(notes));
    }, [notes]);

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

    //Summarize notes logic
    const handleSummarize = () => {
        fetch("http://localhost:5000/summarize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notes }),
        })
        .then((res) => res.json())
            .then((data) => {
                alert("Summary:\n\n" + data.summary);
            })
        .catch((err) => console.error("Error summarizing:", err));
    };

    // Delete note logic
    const handleDeleteNote = (id) => {
        fetch(`http://localhost:5000/notes/${id}`, {
            method: "DELETE",
        })
        .then((res) => res.json())
        .then(() => {
            setNotes((prev) => prev.filter((note) => note.id !== id));
        })
        .catch((err) => console.log(err));
    };

    // Update note logic
    const handleUpdateNote = (e) => {
        e.preventDefault();
        if (!newNote.trim()) return;

        fetch(`http://localhost:5000/notes/${editNoteId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: newNote }),
        })
            .then((res) => res.json())
            .then((updatedNote) => {
                setNotes((prev) =>
                    prev.map((note) =>
                        note.id === updatedNote.id ? updatedNote : note
                    )
                );
                setEditNoteId(null);
                setNewNote("");
            })
            .catch((err) => console.error("Error updating note:", err));
    };


    // HTML Junk
    return (
        <div className="app-container">
            <h1 className="app-title">StudyBuddy</h1>
            {/*<img src="images/buddy.png" alt="Classic Buddy" width="300" height="200"/>*/}
            <form onSubmit={editNoteId ? handleUpdateNote : handleAddNote} className="note-form">
                <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Write your note..."
                    className="note-input"
                />
                <button type="submit" className="note-button">
                    {editNoteId ? "Update" : "Save"}
                </button>
                {editNoteId && (
                    <button
                        type="button"
                        className="cancel-button"
                        onClick={() => {
                            setEditNoteId(null);
                            setNewNote("");
                        }}
                    >
                        Cancel
                    </button>
                )}
            </form>

            <button className="ai-button" onClick={handleSummarize}>
                Summarize Notes
            </button>
            <div className="note-list">
                {notes.length === 0 ? (
                    // Default message in the saved notes area
                    <p className="no-notes">No notes yet! Start writing!</p>
                ) : (
                    notes.map((note) => (
                        <div key={note.id} className="note-item">

                            {/*Display the notes in the saved area*/}
                            <p>{note.text}</p>

                            <small>
                                {note.createdAt
                                    ? new Date(note.createdAt).toLocaleString([], {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })
                                    : "No date available"}
                            </small>
                            <div className="button-container">
                                <button
                                    className="edit-button"
                                    onClick={() => {
                                        setEditNoteId(note.id);
                                        setNewNote(note.text);
                                    }}
                                >Edit
                                </button>


                                {/*Delete Note Button*/}
                                <button
                                    className="delete-button"
                                    onClick={() => {
                                        handleDeleteNote(note.id)
                                    }}
                                >Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}


ReactDOM.createRoot(document.getElementById("root")).render(<App />);
