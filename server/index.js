import express from 'express';
// cors (Cross-Origin Resource Sharing) lets front-end safely talk to back-end
import cors from 'cors';
import fs from 'fs';
import OpenAI from "openai";
import dotenv from 'dotenv';
dotenv.config();

const client = new OpenAI({
    accessKeyId: process.env.ACCESS_KEY_ID,
})

const app = express();
const PORT = process.env.PORT || 5000;
let notes = [];

const NOTES_FILE = "./notes.json";

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


// Get the URL Port to start the server
app.get('/', (req, res) => {
    res.send('StudyBuddy server started!');
});

// App checks to see if server is running, displays message if true
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})

// Display Notes
app.post('/notes', (req, res) => {
    // Get text from the front-end
    const { text } = req.body;

    if (!text) {
        // Error code 400, means Bad request, something was missing (data)
        return res.status(400).json({ error: 'Note text is required' });
    }

    const newNote = {
        id: Date.now(),
        text: text,
        createdAt: new Date().toISOString(),
    }

    // Push the newNote into the array
    notes.push(newNote);

    // Save to file
    fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2));

    // Create a status code 201, new object created, send it back to the JSON
    res.status(201).json(newNote);
});

// Get all the notes, sends back current notes array whenever the front-end requests it
app.get('/notes', (req, res) => {
    res.json(notes);
});

// Delete Note by ID
app.delete('/notes/:id', (req, res) => {
    const { id } = req.params;
    const noteIndex = notes.findIndex((note) => note.id === Number(id));

    if (noteIndex === -1) {
        return res.status(404).json({ error: 'Note not found' });
    }

    const deletedNote = notes.splice(noteIndex, 1);

    // Save updated list to file
    fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2));

    res.json(deletedNote[0]);
})



// AI note summarizer
app.post("/summarize", async (req, res) => {
    // Try/catch block to easily get errors handled
    try {
        const { notes } = req.body;

        if (!notes || notes.length === 0) {
            return res.status(400).json({ error: 'No notes provided' });
        }

        //Log notes from front-end
        console.log("Received notes: ",  notes);

        // Prompt to the ai
        const prompt = `
        Summarize these study notes in a short, clear paragraph:
        ${notes.map(n => n.text).join('\n')}
        `;

        // Ai response to the prompt
        const response = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{role: "user", content: prompt}],
        });

        console.log("OpenAI response:", response);

        res.json({  summary: response.choices[0].message.content });
        } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to summarize notes' });
    }
});