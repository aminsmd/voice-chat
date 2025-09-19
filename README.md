# 🎤 Voice Chat - AI Assistant

A simple voice chat web application using OpenAI's Speech-to-speech architecture with real-time voice interaction.

## ✨ Features

- **Real-time Voice Conversation**: Speak naturally with an AI assistant
- **Modern UI**: Beautiful, responsive design with voice indicators
- **WebRTC Integration**: Uses OpenAI's Realtime API for low-latency communication
- **Visual Feedback**: Animated voice wave indicators and status updates
- **Cross-platform**: Works on desktop and mobile browsers

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
   Navigate to `http://localhost:3002`

### Usage

1. Click "Connect" to start the voice session
2. Allow microphone access when prompted by your browser
3. Start speaking naturally - the AI will respond with voice
4. Use "Disconnect" to end the session

## 🏗️ Architecture

This application uses OpenAI's Speech-to-speech architecture:

- **Frontend**: HTML/CSS/JavaScript with OpenAI Agents Realtime SDK
- **Backend**: Express.js server for API key management
- **Voice Processing**: WebRTC for real-time audio streaming
- **AI Model**: GPT-4o Realtime Preview for natural conversation

## 📁 Project Structure

```
voice-chat/
├── public/
│   ├── index.html          # Main application page
│   ├── styles.css          # Modern UI styling
│   └── app.js             # Voice chat application logic
├── server.js              # Express.js backend server
├── package.json           # Dependencies and scripts
├── .env.example           # Environment variables template
└── README.md              # This file
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