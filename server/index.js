import express from 'express';
// cors (Cross-Origin Resource Sharing) lets front-end safely talk to back-end
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Get the URL Port to start the server
app.get('/', (req, res) => {
    res.send('StudyBuddy server started!');
});

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
    }

    // Push the newNote into the array
    notes.push(newNote);
    // Create a status code 201, new object created, send it back to the JSON
    res.status(201).json(newNote);
});

// Get all the notes, sends back current notes array whenever the front-end requests it
app.get('/notes', (req, res) => {
    res.json(notes);
});

// App checks to see if server is running, displays message if true
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})

let notes = [];