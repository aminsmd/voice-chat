# Voice Chat Application

A voice chat web application using OpenAI's Speech-to-speech architecture with both realtime and chained processing modes.

## Project Structure

```
app/
├── frontend/                 # Frontend application files
│   ├── public/              # Static HTML files
│   │   ├── index.html       # Main application page
│   │   ├── saved-data.html  # Saved data viewer
│   │   ├── test-*.html      # Test pages
│   │   └── favicon.ico      # Site icon
│   └── src/                 # Source files
│       ├── css/             # Stylesheets
│       │   └── styles.css   # Main styles
│       └── js/              # JavaScript files
│           └── app.js       # Main application logic
├── backend/                 # Backend services
│   ├── node/                # Node.js backend
│   │   ├── server.js        # Main Express server
│   │   └── setup.js         # Setup script
│   └── python/              # Python backend
│       ├── python_chained_server.py    # FastAPI server for chained processing
│       ├── chained_voice_pipeline.py   # Voice pipeline implementation
│       └── setup_python.py             # Python setup script
└── shared/                  # Shared utilities and configurations
```

## Features

- **Realtime Voice Chat**: Direct speech-to-speech communication using OpenAI's Realtime API
- **Chained Processing**: Speech-to-text → AI processing → Text-to-speech pipeline
- **Session Management**: Track and save conversation sessions
- **Audio Storage**: Save input and output audio files
- **Multiple Backends**: Both Node.js and Python implementations

## Getting Started

### Prerequisites

- Node.js (for the main server)
- Python 3.8+ (for Python backend)
- OpenAI API key

### Installation

1. Install Node.js dependencies:
   ```bash
   npm install
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your OpenAI API key
   ```

### Running the Application

#### Node.js Server (Main)
```bash
npm start
```

#### Python Backend (Optional)
```bash
cd app/backend/python
python python_chained_server.py
```

### Configuration

- Set `USE_PYTHON_CHAINED=true` in your `.env` file to use Python backend for chained processing
- Set `PYTHON_SERVER_URL` to point to your Python server (default: http://localhost:8001)

## API Endpoints

### Main Server (Node.js)
- `GET /` - Main application
- `POST /api/realtime/session` - Create realtime session
- `POST /api/chained/process` - Process audio through chained pipeline
- `POST /api/session/start` - Start new session
- `POST /api/session/end` - End session
- `GET /api/saved-data` - Get saved sessions

### Python Backend
- `POST /api/chained/process` - Chained voice processing
- `POST /api/chained/update-agent` - Update agent settings
- `GET /api/chained/status` - Get pipeline status

## Development

### Frontend Development
- HTML files are in `app/frontend/public/`
- CSS files are in `app/frontend/src/css/`
- JavaScript files are in `app/frontend/src/js/`

### Backend Development
- Node.js server: `app/backend/node/server.js`
- Python server: `app/backend/python/python_chained_server.py`

## Data Storage

- Audio files are saved in `saved_data/audio/`
- Session transcripts are saved in `saved_data/transcripts/`
- Files are organized by session ID and message ID
