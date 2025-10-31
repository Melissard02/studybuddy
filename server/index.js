import express from "express";
import cors from "cors";
import fs from "fs";
import multer from "multer";
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const upload = multer({ dest: "uploads/" });
const app = express();
const PORT = process.env.PORT || 5000;
let notes = [];

const NOTES_FILE = "./notes.json";

// Load saved notes
if (fs.existsSync(NOTES_FILE)) {
    try {
        const data = fs.readFileSync(NOTES_FILE, "utf8");
        notes = JSON.parse(data);
        console.log(`Loaded ${notes.length} notes from notes.json`);
    } catch (error) {
        console.error("Error reading notes.json", error);
    }
}

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    console.log(`🌐 ${req.method} ${req.url}`);
    next();
});


// Health check
app.get("/", (req, res) => {
    res.send("StudyBuddy server started!");
});

// Create new note
app.post("/notes", (req, res) => {
    const { title, text } = req.body;

    if (!title || !text) {
        return res.status(400).json({ error: "Note title and text are required" });
    }

    const newNote = {
        id: Date.now(),
        title: title || "Untitled Note",
        text,
        createdAt: new Date().toISOString(),
    };

    notes.push(newNote);
    fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2));
    res.status(201).json(newNote);
});

// Get all notes
app.get("/notes", (req, res) => {
    res.json(notes);
});

// Delete note
app.delete("/notes/:id", (req, res) => {
    const { id } = req.params;
    const noteIndex = notes.findIndex((note) => note.id === Number(id));

    if (noteIndex === -1) {
        return res.status(404).json({ error: "Note not found" });
    }

    const deletedNote = notes.splice(noteIndex, 1);
    fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2));
    res.json(deletedNote[0]);
});

// Update note
app.put("/notes/:id", (req, res) => {
    const { id } = req.params;
    const { title, text } = req.body;

    const noteIndex = notes.findIndex((note) => note.id === Number(id));
    if (noteIndex === -1) {
        return res.status(404).json({ error: "Note not found" });
    }

    notes[noteIndex].title = title || notes[noteIndex].title;
    notes[noteIndex].text = text;
    notes[noteIndex].updatedAt = new Date().toISOString();

    fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2));
    res.json(notes[noteIndex]);
});

// Upload note file
app.post("/upload", upload.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    const file = req.file;
    let extractedText = "";

    try {
        if (file.mimetype === "application/pdf") {
            const pdfParse = (await import("pdf-parse")).default;
            const dataBuffer = fs.readFileSync(file.path);
            const data = await pdfParse(dataBuffer);
            extractedText = data.text;
        } else if (
            file.mimetype ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
            const mammoth = (await import("mammoth")).default;
            const data = await mammoth.extractRawText({ path: file.path });
            extractedText = data.value;
        } else if (file.mimetype === "text/plain") {
            extractedText = fs.readFileSync(file.path, "utf8");
        } else {
            return res.status(400).json({ error: "Unsupported file format." });
        }

        extractedText = extractedText.replace(/\s+/g, " ").trim();

        const newNote = {
            id: Date.now(),
            title: file.originalname.replace(/\.[^/.]+$/, ""),
            text: extractedText,
            createdAt: new Date().toISOString(),
        };

        notes.push(newNote);
        fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2));
        fs.unlinkSync(file.path);

        res.status(200).json({ message: "File uploaded and note created!", note: newNote });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: "Failed to process file" });
    }
});

// AI Summarizer
app.post("/summarize", async (req, res) => {
    console.log("✅ /summarize endpoint hit!");
    try {
        const { notes } = req.body;
        if (!Array.isArray(notes) || notes.length === 0) {
            return res.status(400).json({ error: "No notes provided" });
        }

        // 1) Gather all text, trim super-long notes to protect token budget
        const rawText = notes
            .map(n => (n?.text || "").toString().trim())
            .filter(Boolean)
            .join("\n\n");

        if (!rawText) {
            return res.status(400).json({ error: "Notes had no text" });
        }

        // Helper: extract model text safely across SDK response shapes
        const extractText = (resp) => {
            // Old style
            const m = resp?.choices?.[0]?.message;
            if (!m) return null;
            // New style can be array of content parts OR string
            if (Array.isArray(m.content)) {
                const part = m.content.find(p => typeof p.text === "string");
                return part?.text || null;
            }
            if (typeof m.content === "string") return m.content;
            return null;
        };

        // 2) Chunk the text (by characters ~2.5k each). You can tweak sizes.
        const CHUNK_SIZE = 2500; // ~2.5k chars per chunk
        const chunks = [];
        for (let i = 0; i < rawText.length; i += CHUNK_SIZE) {
            chunks.push(rawText.slice(i, i + CHUNK_SIZE));
        }

        console.log(`🧩 Splitting into ${chunks.length} chunk(s)`);

        // 3) Summarize each chunk
        const chunkSummaries = [];
        for (let idx = 0; idx < chunks.length; idx++) {
            const content = `Summarize this part of study notes clearly:\n\n${chunks[idx]}`;
            console.log(`🧠 Summarizing chunk ${idx + 1}/${chunks.length} (${chunks[idx].length} chars)`);

            const resp = await client.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content }],
            });

            const text = extractText(resp);
            console.log(`📄 Chunk ${idx + 1} summary length: ${text?.length || 0}`);
            chunkSummaries.push(text || "");
        }

        // 4) Summarize the summaries (final pass)
        const combined = chunkSummaries.join("\n\n");
        const finalPrompt = `Combine these partial summaries into one short, clear study summary:\n\n${combined}`;
        const finalResp = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: finalPrompt }],
        });
        const finalSummary = extractText(finalResp) || "No summary returned.";

        console.log("✅ Final summary length:", finalSummary.length);
        res.json({ summary: finalSummary });
    } catch (err) {
        console.error("❌ SUMMARIZE ERROR:", err);
        // Helpful error surface
        res.status(err.status || 500).json({
            error: "Failed to summarize notes",
            detail: err?.message || String(err),
        });
    }
});


// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
