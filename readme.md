# Studdy Buddy

Studdy Buddy is a web app for storing and organizing notes. You can create notes directly in the browser or upload notes from your computer. After uploading, you can generate summaries using the OpenAI API.

## Features

- Create notes in the web editor
- Upload note files from your computer
- Summarize notes using OpenAI

## Getting Started

### Prerequisites

- Node.js + npm installed
- An OpenAI API key

### Setup

1. Clone the repo and install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file (or use the provided `.env.example` if you have one) and add your OpenAI key:

   ```env
   OPENAI_API_KEY=your_key_here
   ```

   > Make sure the variable name matches what the backend expects.

3. Run the backend and frontend on separate ports (two terminals):

   - Terminal 1 (backend):

     ```bash
     npm run server
     ```

   - Terminal 2 (frontend):

     ```bash
     npm run client
     ```

> If your scripts are named differently, update the commands above to match your `package.json`.

## How to Use

1. Create a note using the in-app form/editor **or** upload a note file.
2. Select a note you want summarized.
3. Click summarize to generate a summary (this uses tokens via the OpenAI API).

## Development Environment

Tools/libraries used:

- Any IDE (I used WebStorm)
- React (frontend)
- Express (backend)
- CORS (backend middleware)

## Useful Resources

- [React Docs](https://react.dev/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [Express Docs](https://expressjs.com/)
- [CORS Package](https://www.npmjs.com/package/cors)

## Future Work

- [ ] Connect notes to a cloud database
