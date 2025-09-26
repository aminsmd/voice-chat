# 🎤 Voice Chat - AI Assistant

A simple voice chat web application using OpenAI's Speech-to-speech architecture with real-time voice interaction.

## ✨ Features

### Dual Architecture Support
- **Real-time API**: Low-latency WebRTC streaming for interactive conversations
- **Chained API**: Speech-to-text → AI → Text-to-speech pipeline for reliable processing
- **Architecture Comparison**: Easy switching between modes to compare performance
- **Modern UI**: Beautiful, responsive design with voice indicators
- **Visual Feedback**: Animated voice wave indicators and status updates
- **Cross-platform**: Works on desktop and mobile browsers

### Real-time Voice Chat
- **WebRTC Integration**: Uses OpenAI's Realtime API for low-latency communication
- **Natural Conversation**: Speak naturally with an AI assistant
- **Voice Selection**: Multiple AI voices including new Realtime API voices

### Chained Voice Processing
- **Reliable Processing**: Traditional pipeline approach for consistent results
- **Python Integration**: Optional Python-based processing using OpenAI Agents SDK
- **Click-to-Record**: Simple recording interface for chained mode


## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- OpenAI API key with Realtime API access

### Installation

1. **Clone and setup the project:**
   ```bash
   git clone <your-repo-url>
   cd voice-chat
   npm install
   ```

2. **Configure your OpenAI API key:**
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   ```

3. **Start the server:**
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

4. **Open your browser:**
   - Navigate to `http://localhost:3000`
   - Use the "🎤 Voice Chat" tab for conversations
   - Use the "📊 Data Explorer" tab to view saved sessions

### Optional: Python Chained Processing

For advanced chained processing using the OpenAI Agents Python SDK:

1. **Set up Python environment:**
   ```bash
   python setup_python.py
   ```

2. **Activate virtual environment:**
   ```bash
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

3. **Start Python server:**
   ```bash
   python python_chained_server.py
   ```

4. **Configure environment:**
   Set `USE_PYTHON_CHAINED=true` in your `.env` file to use Python processing

### Usage

#### Voice Chat with Architecture Selection
1. Visit `http://localhost:3000` for AI voice chat
2. **Select API Mode**:
   - **Real-time API**: For low-latency interactive conversations
   - **Chained API**: For reliable processing with click-to-record
3. Choose your preferred AI voice
4. Click "Connect" to start the voice session
5. Allow microphone access when prompted by your browser
6. **For Real-time mode**: Start speaking naturally - the AI will respond with voice
7. **For Chained mode**: Click "Start Recording", speak, then click "Stop Recording"
8. Use "Disconnect" to end the session

#### Architecture Comparison
- **Real-time API**: Best for interactive conversations, lower latency
- **Chained API**: More reliable processing, higher latency but consistent results

#### Voice Options by Architecture
- **Real-time API**: Cedar, Marin (recommended) + Alloy, Echo, Fable, Onyx, Nova, Shimmer (legacy)
- **Chained API**: Alloy, Echo, Fable, Onyx, Nova, Shimmer (TTS API voices only)
- **Note**: Cedar and Marin are Realtime API exclusive and won't work with chained mode


## 🏗️ Architecture

This application supports two voice processing architectures:

### Real-time Architecture
- **Frontend**: HTML/CSS/JavaScript with OpenAI Agents Realtime SDK
- **Backend**: Express.js server for API key management
- **Voice Processing**: WebRTC for real-time audio streaming
- **AI Model**: GPT-4o Realtime Preview for natural conversation

### Chained Architecture
- **Frontend**: HTML/CSS/JavaScript with click-to-record interface
- **Backend**: Express.js server with chained processing endpoints
- **Voice Processing**: Speech-to-text → AI → Text-to-speech pipeline
- **AI Model**: GPT-4o-mini for reliable processing
- **Optional Python**: Advanced chained processing using OpenAI Agents Python SDK

## 📁 Project Structure

```
voice-chat/
├── public/
│   ├── index.html                    # Main application page
│   ├── styles.css                    # Modern UI styling
│   └── app.js                       # Voice chat application logic
├── server.js                        # Express.js backend server
├── package.json                     # Node.js dependencies and scripts
├── requirements.txt                  # Python dependencies
├── chained_voice_pipeline.py        # Python chained voice pipeline
├── python_chained_server.py         # Python FastAPI server
├── setup_python.py                  # Python environment setup
├── .env.example                     # Environment variables template
└── README.md                        # This file
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with:

```env
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
```

### OpenAI API Setup

1. Get an API key from [OpenAI Platform](https://platform.openai.com/)
2. Ensure you have access to the Realtime API
3. Add your key to the `.env` file

## 🎨 Customization

### Voice Settings

You can customize the AI assistant in `public/app.js`:

```javascript
const agent = new RealtimeAgent({
    name: 'Assistant',
    instructions: 'Your custom instructions here...',
    voice: 'alloy', // or 'echo', 'fable', 'onyx', 'nova', 'shimmer'
    interruptible: true
});
```

### UI Styling

Modify `public/styles.css` to customize the appearance:
- Colors and gradients
- Button styles
- Voice wave animations
- Responsive breakpoints

## 🐛 Troubleshooting

### Common Issues

1. **Microphone Access Denied**
   - Ensure your browser has microphone permissions
   - Check browser settings for site permissions

2. **Connection Failed**
   - Verify your OpenAI API key is correct
   - Check that you have Realtime API access
   - Ensure your internet connection is stable

3. **Audio Issues**
   - Check your system audio settings
   - Try refreshing the page
   - Ensure WebRTC is supported in your browser

### Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari (with limitations)
- Edge

## 💾 Data Saving (Chained Architecture)

The chained architecture automatically saves conversation data:

### Saved Data Structure
```
saved_data/
├── audio/
│   ├── session_2024-01-15T10-30-45-123Z_input.webm
│   └── session_2024-01-15T10-30-45-123Z_output.mp3
└── transcripts/
    └── session_2024-01-15T10-30-45-123Z_transcript.json
```

### Data Includes
- **Input Audio**: User's recorded speech (WebM format)
- **Output Audio**: AI's generated speech (MP3 format)
- **Transcript**: Complete conversation with timestamps
- **Metadata**: Voice settings, instructions, session info

### Viewing Saved Data
1. Visit `http://localhost:3000/` and click the "📊 Data Explorer" tab
2. Browse all saved sessions
3. Click speaker icons (🔊) next to each message to play audio
4. View complete conversation transcripts with individual message playback
5. Alternative: Visit `http://localhost:3000/saved-data.html` for standalone viewer

### API Endpoints
- `GET /api/saved-data` - List all sessions
- `GET /api/saved-data/:sessionId` - Get specific session
- `GET /api/saved-data/:sessionId/:messageId/:audioType` - Play individual message audio
- `GET /api/saved-data/:sessionId/:audioType` - Legacy audio endpoint (backward compatibility)

## 📚 API Reference

This application uses the [OpenAI Agents Realtime SDK](https://openai.github.io/openai-agents-js/guides/voice-agents/quickstart/).

Key components:
- `RealtimeAgent`: Defines the AI assistant behavior
- `RealtimeSession`: Manages the voice conversation
- Event listeners for real-time status updates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- OpenAI for the Realtime API and Agents SDK
- WebRTC for real-time audio streaming
- Modern web standards for seamless voice interaction