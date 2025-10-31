import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import "./style.css";

function App() {
    // --- STATES ---
    const [notes, setNotes] = useState([]);
    const [newTitle, setNewTitle] = useState("");
    const [newNote, setNewNote] = useState("");
    const [editNoteId, setEditNoteId] = useState(null);
    const [file, setFile] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showNoteForm, setShowNoteForm] = useState(false);
    const [expandedNoteId, setExpandedNoteId] = useState(null);
    const [message, setMessage] = useState("");
    const [showMessage, setShowMessage] = useState(false);
    const [selectedNote, setSelectedNote] = useState(null);
    const [summarizing, setSummarizing] = useState(false);

    // --- LOAD NOTES FROM LOCAL STORAGE ---
    useEffect(() => {
        const savedNotes = localStorage.getItem("notes");
        if (savedNotes) setNotes(JSON.parse(savedNotes));

        fetch("http://localhost:5000/")
            .then((res) => res.text())
            .then((data) => console.log(data))
            .catch((err) => console.log(err));
    }, []);

    // --- SAVE NOTES TO LOCAL STORAGE WHEN CHANGED ---
    useEffect(() => {
        localStorage.setItem("notes", JSON.stringify(notes));
    }, [notes]);

    // --- ADD NOTE ---
    const handleAddNote = (e) => {
        e.preventDefault();
        if (!newTitle.trim() || !newNote.trim()) return;

        fetch("http://localhost:5000/notes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newTitle, text: newNote }),
        })
            .then((res) => res.json())
            .then((savedNote) => {
                setNotes((prev) => [...prev, savedNote]);
                setNewTitle("");
                setNewNote("");
                setShowNoteForm(false);
            })
            .catch((err) => console.error("Error saving note:", err));
    };

    // --- UPDATE NOTE ---
    const handleUpdateNote = (e) => {
        e.preventDefault();
        if (!newTitle.trim() || !newNote.trim()) return;

        fetch(`http://localhost:5000/notes/${editNoteId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newTitle, text: newNote }),
        })
            .then((res) => res.json())
            .then((updatedNote) => {
                setNotes((prev) =>
                    prev.map((note) => (note.id === updatedNote.id ? updatedNote : note))
                );
                setEditNoteId(null);
                setNewTitle("");
                setNewNote("");
                setShowNoteForm(false);
            })
            .catch((err) => console.error("Error updating note:", err));
    };

    // --- DELETE NOTE ---
    const handleDeleteNote = (id) => {
        fetch(`http://localhost:5000/notes/${id}`, { method: "DELETE" })
            .then((res) => res.json())
            .then(() => {
                setNotes((prev) => prev.filter((note) => note.id !== id));
            })
            .catch((err) => console.error("Error deleting note:", err));
    };

    // --- SUMMARIZE NOTES ---
    const handleSummarize = async () => {
        if (!notes || notes.length === 0) {
            return showNotification("No notes to summarize yet.", "error");
        }

        try {
            setSummarizing(true);
            console.log("📡 Sending summarize request...");

            const res = await fetch("http://127.0.0.1:5000/summarize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                mode: "cors",
                body: JSON.stringify({ notes }),
            });

            if (!res.ok) {
                const txt = await res.text();
                console.error("❌ Summarize failed:", res.status, txt);
                showNotification("Summarizer failed. Try again in a moment.", "error");
                return;
            }

            const data = await res.json();
            console.log("✅ Summarize response:", data);
            if (!data.summary) {
                showNotification("No summary returned from server.", "error");
                return;
            }
            showNotification("✨ Summary:\n\n" + data.summary);
        } catch (err) {
            console.error("Error summarizing:", err);
            showNotification("Network error hitting summarizer.", "error");
        } finally {
            setSummarizing(false);
        }
    };

    // --- EVENT MESSAGES ---
    const showNotification = (text) => {
        setMessage(text);
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 3000)
    }

    // --- RENDER ---
    return (
        <div className="app-container">
            {/*--- TOAST MESSAGE ---*/}
            {showMessage && (
                <div className="toast">{message}</div>
            )}
            <h1 className="app-title">StudyBuddy</h1>

            {/* --- NEW/EDIT NOTE FORM --- */}
            {showNoteForm && (
                <form
                    onSubmit={editNoteId ? handleUpdateNote : handleAddNote}
                    className="note-form"
                >
                    <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Enter note title..."
                        className="note-input"
                    />
                    <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Write your note..."
                        className="note-input"
                        rows="5"
                    />
                    <div className="button-group">
                        <button
                            type="submit"
                            className="note-button"
                            disabled={!newTitle.trim() || !newNote.trim()}
                        >
                            {editNoteId ? "Update" : "Save"}
                        </button>
                        <button
                            type="button"
                            className="cancel-button"
                            onClick={() => {
                                setEditNoteId(null);
                                setNewTitle("");
                                setNewNote("");
                                setShowNoteForm(false);
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* --- MAIN BUTTONS --- */}
            {!showNoteForm && !showUploadModal && (
                <div className="main-buttons">
                    <button className="ai-button" onClick={handleSummarize} disabled={summarizing}>
                        {summarizing ? "Summarizing…" : "Summarize Notes"}
                    </button>
                    <button className="note-button" onClick={() => setShowNoteForm(true)}>
                        Write New Note
                    </button>
                    <button
                        className="open-upload-button"
                        onClick={() => setShowUploadModal(true)}
                    >
                        Upload a Note
                    </button>
                </div>
            )}

            {/* --- UPLOAD MODAL --- */}
            {showUploadModal && (
                <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
                    <div
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2>Upload a Note File</h2>
                        <form
                            className="upload-form"
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (!file) return showNotification("Please select a file first!");
                                const formData = new FormData();
                                formData.append("file", file);

                                fetch("http://localhost:5000/upload", {
                                    method: "POST",
                                    body: formData,
                                })
                                    .then((res) => res.json())
                                    .then((data) => {
                                        if (data.note) setNotes((prev) => [...prev, data.note]);
                                        setFile(null);
                                        setShowUploadModal(false);
                                        showNotification("File uploaded and converted into a note!");
                                    })
                                    .catch((err) => console.error("Upload error:", err));
                            }}
                        >
                            <input
                                type="file"
                                accept=".txt,.pdf,.docx"
                                onChange={(e) => setFile(e.target.files[0])}
                            />
                            <div className="button-group">
                                <button type="submit">Upload</button>
                                <button
                                    type="button"
                                    className="close-modal"
                                    onClick={() => setShowUploadModal(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- NOTE VIEWER MODAL --- */}
            {selectedNote && (
                <div className="modal-overlay" onClick={() => setSelectedNote(null)}>
                    <div
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2>{selectedNote.title || "Untitled Note"}</h2>
                        <p className="modal-text">{selectedNote.text}</p>
                        {/*<button*/}
                        {/*    className="close-modal"*/}
                        {/*    onClick={() => setSelectedNote(null)}*/}
                        {/*>*/}
                        {/*    Close*/}
                        {/*</button>*/}
                    </div>
                </div>
            )}


            {/* --- NOTE LIST --- */}
            <div className="note-list">
                {notes.length === 0 ? (
                    <p className="no-notes">No notes yet! Start writing!</p>
                ) : (
                    notes.map((note) => {
                        const isExpanded = expandedNoteId === note.id;
                        const preview =
                            note.text.split(" ").length > 5
                                ? note.text.split(" ").slice(0, 5).join(" ") + "..."
                                : note.text;
                        return (
                            <div
                                key={note.id}
                                className={`note-item ${isExpanded ? "expanded" : ""}`}
                                onClick={() => {
                                    if (note.text.length > 200) {
                                        setSelectedNote(note);
                                    } else {
                                        setExpandedNoteId(isExpanded ? null : note.id);
                                    }
                                }}

                            >
                                <h3 className="note-title">{note.title || "Untitled"}</h3>
                                <p className="note-preview">
                                    {isExpanded ? note.text : preview}
                                </p>
                                <small>
                                    {note.createdAt
                                        ? new Date(note.createdAt).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })
                                        : "No date available"}
                                </small>
                                <div className="button-container">
                                    <button
                                        className="edit-button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditNoteId(note.id);
                                            setNewTitle(note.title);
                                            setNewNote(note.text);
                                            setShowNoteForm(true);
                                        }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="delete-button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteNote(note.id);
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
