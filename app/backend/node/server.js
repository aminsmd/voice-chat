const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Get the project root directory (3 levels up from this file)
const projectRoot = path.join(__dirname, '../../..');

// Create directories for saving data
const SAVE_DIR = path.join(projectRoot, 'saved_data');
const AUDIO_DIR = path.join(SAVE_DIR, 'audio');
const TRANSCRIPT_DIR = path.join(SAVE_DIR, 'transcripts');

// Ensure directories exist
if (!fs.existsSync(SAVE_DIR)) {
  fs.mkdirSync(SAVE_DIR, { recursive: true });
}
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}
if (!fs.existsSync(TRANSCRIPT_DIR)) {
  fs.mkdirSync(TRANSCRIPT_DIR, { recursive: true });
}

// In-memory session tracking
const activeSessions = new Map();

// Function to get local IP address
function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  return 'localhost';
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for large audio files
const frontendPublicPath = path.join(projectRoot, 'app/frontend/public');
const frontendSrcPath = path.join(projectRoot, 'app/frontend/src');

app.use(express.static(frontendPublicPath));
app.use('/src', express.static(frontendSrcPath));

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPublicPath, 'index.html'));
});


// Endpoint to create a realtime session and get ephemeral client key
app.post('/api/realtime/session', async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Create a realtime client secret (ephemeral key) as per official docs
    const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session: {
          type: 'realtime',
          model: 'gpt-realtime'
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const clientSecretData = await response.json();
    
    console.log('Client secret created successfully:', {
      hasValue: !!clientSecretData.value,
      prefix: clientSecretData.value?.substring(0, 3)
    });
    
    // Return the client secret for the frontend
    res.json({
      clientSecret: clientSecretData.value
    });

  } catch (error) {
    console.error('Error creating realtime session:', error);
    res.status(500).json({ error: error.message });
  }
});

    // Health check endpoint
    app.get('/api/health', (req, res) => {
        res.json({ 
            status: 'OK', 
            timestamp: new Date().toISOString(),
            apiKeyConfigured: !!process.env.OPENAI_API_KEY,
            pythonChainedEnabled: process.env.USE_PYTHON_CHAINED === 'true'
        });
    });

    // Diagnostic endpoint
    app.get('/api/diagnostic', async (req, res) => {
        try {
            const apiKey = process.env.OPENAI_API_KEY;
            const diagnostics = {
                server: {
                    status: 'running',
                    port: PORT,
                    timestamp: new Date().toISOString()
                },
                environment: {
                    apiKeyConfigured: !!apiKey,
                    apiKeyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'Not set',
                    pythonChainedEnabled: process.env.USE_PYTHON_CHAINED === 'true',
                    pythonServerUrl: process.env.PYTHON_SERVER_URL || 'http://localhost:8001'
                },
                dependencies: {
                    formData: 'available',
                    cors: 'available',
                    express: 'available'
                }
            };

            // Test OpenAI API if key is configured
            if (apiKey) {
                try {
                    const response = await fetch('https://api.openai.com/v1/models', {
                        headers: { 'Authorization': `Bearer ${apiKey}` }
                    });
                    diagnostics.openai = {
                        accessible: response.ok,
                        status: response.status,
                        statusText: response.statusText
                    };
                } catch (error) {
                    diagnostics.openai = {
                        accessible: false,
                        error: error.message
                    };
                }
            } else {
                diagnostics.openai = {
                    accessible: false,
                    error: 'API key not configured'
                };
            }

            res.json(diagnostics);
        } catch (error) {
            res.status(500).json({ 
                error: 'Diagnostic failed', 
                message: error.message 
            });
        }
    });

    // Network info endpoint
    app.get('/api/network', (req, res) => {
        const localIP = getLocalIPAddress();
        res.json({ 
            localIP: localIP,
            port: PORT,
            localUrl: `http://localhost:${PORT}`,
            networkUrl: `http://${localIP}:${PORT}`
        });
    });

    // Endpoint to hangup a realtime call (based on OpenAI community discussion)
    app.post('/api/realtime/calls/:callId/hangup', async (req, res) => {
        try {
            const { callId } = req.params;
            const apiKey = process.env.OPENAI_API_KEY;
            
            if (!apiKey) {
                return res.status(500).json({ error: 'OpenAI API key not configured' });
            }

            console.log(`Attempting to hangup call: ${callId}`);

            const response = await fetch(`https://api.openai.com/v1/realtime/calls/${callId}/hangup`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                const error = await response.text();
                console.error(`Hangup failed for call ${callId}:`, error);
                return res.status(response.status).json({ error: `Hangup failed: ${error}` });
            }

            console.log(`Successfully hung up call: ${callId}`);
            res.json({ success: true, callId });

        } catch (error) {
            console.error('Error hanging up call:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Endpoint for chained voice processing
    app.post('/api/chained/process', async (req, res) => {
        try {
            const { audio, instructions, voice, sessionId } = req.body;
            const apiKey = process.env.OPENAI_API_KEY;
            const usePythonChained = process.env.USE_PYTHON_CHAINED === 'true';
            
            if (!apiKey) {
                return res.status(500).json({ error: 'OpenAI API key not configured' });
            }

            console.log('Processing chained voice request...');
            console.log('Instructions:', instructions);
            console.log('Voice:', voice);
            console.log('Audio data length:', audio ? audio.length : 0);
            console.log('Audio data preview:', audio ? audio.substring(0, 50) + '...' : 'No audio data');
            console.log('Using Python chained processing:', usePythonChained);

            if (usePythonChained) {
                // Use Python-based chained processing
                try {
                    const pythonServerUrl = process.env.PYTHON_SERVER_URL || 'http://localhost:8001';
                    const response = await fetch(`${pythonServerUrl}/api/chained/process`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            audio: audio,
                            instructions: instructions,
                            voice: voice
                        })
                    });

                    if (!response.ok) {
                        const error = await response.text();
                        throw new Error(`Python chained processing failed: ${error}`);
                    }

                    const result = await response.json();
                    console.log('Python chained processing completed successfully');
                    res.json(result);
                    return;

                } catch (pythonError) {
                    console.warn('Python chained processing failed, falling back to Node.js implementation:', pythonError.message);
                    // Fall through to Node.js implementation
                }
            }

            // Node.js-based chained processing (fallback or default)
            console.log('Using Node.js chained processing...');

            // Step 1: Speech-to-Text
            console.log('Step 1: Converting speech to text...');
            
            // Convert base64 audio to buffer
            const binaryString = atob(audio);
            const audioBuffer = Buffer.from(binaryString, 'binary');
            
            // Create form data for transcription
            const FormData = require('form-data');
            const formData = new FormData();
            formData.append('file', audioBuffer, {
                filename: 'audio.webm',
                contentType: 'audio/webm'
            });
            formData.append('model', 'whisper-1');
            formData.append('language', 'en');
            
            // Use node-fetch with form-data
            const fetch = require('node-fetch');
            const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    ...formData.getHeaders()
                },
                body: formData
            });

            if (!transcriptionResponse.ok) {
                const error = await transcriptionResponse.text();
                throw new Error(`Transcription failed: ${error}`);
            }

            const transcription = await transcriptionResponse.json();
            const userText = transcription.text;
            console.log('Transcribed text:', userText);

            // Step 2: AI Processing
            console.log('Step 2: Processing with AI...');
            const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: instructions || 'You are a helpful AI assistant. Respond naturally and conversationally. Keep responses concise and engaging.'
                        },
                        {
                            role: 'user',
                            content: userText
                        }
                    ],
                    max_tokens: 500,
                    temperature: 0.7
                })
            });

            if (!chatResponse.ok) {
                const error = await chatResponse.text();
                throw new Error(`AI processing failed: ${error}`);
            }

            const chatResult = await chatResponse.json();
            const aiResponse = chatResult.choices[0].message.content;
            console.log('AI response:', aiResponse);

            // Step 3: Text-to-Speech
            console.log('Step 3: Converting text to speech...');
            const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'tts-1',
                    input: aiResponse,
                    voice: voice || 'alloy',
                    response_format: 'mp3'
                })
            });

            if (!ttsResponse.ok) {
                const error = await ttsResponse.text();
                throw new Error(`TTS failed: ${error}`);
            }

            // Convert response to base64 using Buffer (Node.js native method)
            const ttsAudioBuffer = await ttsResponse.arrayBuffer();
            const buffer = Buffer.from(ttsAudioBuffer);
            const base64Audio = buffer.toString('base64');

            // Save data to files
            const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
            const currentTime = new Date().toISOString();
            
            try {
                // Save input audio
                const inputAudioPath = path.join(AUDIO_DIR, `${sessionId}_${messageId}_input.webm`);
                fs.writeFileSync(inputAudioPath, audioBuffer);
                console.log(`Saved input audio: ${inputAudioPath}`);
                
                // Save output audio
                const outputAudioPath = path.join(AUDIO_DIR, `${sessionId}_${messageId}_output.mp3`);
                fs.writeFileSync(outputAudioPath, buffer);
                console.log(`Saved output audio: ${outputAudioPath}`);
                
                // Add to active session if it exists
                if (activeSessions.has(sessionId)) {
                    const sessionData = activeSessions.get(sessionId);
                    sessionData.conversation.push({
                        messageId: messageId,
                        speaker: 'user',
                        text: userText,
                        timestamp: currentTime,
                        audioFile: `${sessionId}_${messageId}_input.webm`
                    });
                    sessionData.conversation.push({
                        messageId: messageId,
                        speaker: 'assistant',
                        text: aiResponse,
                        timestamp: currentTime,
                        audioFile: `${sessionId}_${messageId}_output.mp3`
                    });
                    sessionData.messageCount += 2;
                    sessionData.lastActivity = currentTime;
                    
                    console.log(`Added message to active session: ${sessionId}`);
                } else {
                    console.warn(`Session ${sessionId} not found in active sessions`);
                }
                
            } catch (saveError) {
                console.warn('Failed to save data:', saveError.message);
                // Continue with response even if saving fails
            }

            console.log('Node.js chained processing completed successfully');
            res.json({
                success: true,
                transcription: userText,
                aiResponse: aiResponse,
                audio: base64Audio,
                sessionId: sessionId
            });

        } catch (error) {
            console.error('Error in chained processing:', error);
            res.status(500).json({ error: error.message });
        }
    });

// Endpoint to start a new session
app.post('/api/session/start', (req, res) => {
    try {
        const { voice, instructions } = req.body;
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const sessionData = {
            sessionId: sessionId,
            startTime: new Date().toISOString(),
            voice: voice || 'alloy',
            instructions: instructions || 'You are a helpful AI assistant. Respond naturally and conversationally. Keep responses concise and engaging.',
            conversation: [],
            messageCount: 0
        };
        
        activeSessions.set(sessionId, sessionData);
        
        console.log(`Started new session: ${sessionId}`);
        res.json({
            success: true,
            sessionId: sessionId
        });
        
    } catch (error) {
        console.error('Error starting session:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to end a session
app.post('/api/session/end', (req, res) => {
    try {
        const { sessionId } = req.body;
        
        if (!activeSessions.has(sessionId)) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        const sessionData = activeSessions.get(sessionId);
        sessionData.endTime = new Date().toISOString();
        
        // Save the complete session to file
        const transcriptPath = path.join(TRANSCRIPT_DIR, `${sessionId}_transcript.json`);
        fs.writeFileSync(transcriptPath, JSON.stringify(sessionData, null, 2));
        console.log(`Saved complete session: ${transcriptPath}`);
        
        // Remove from active sessions
        activeSessions.delete(sessionId);
        
        res.json({
            success: true,
            message: 'Session ended and saved successfully'
        });
        
    } catch (error) {
        console.error('Error ending session:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to get saved data
app.get('/api/saved-data', (req, res) => {
    try {
        const sessions = [];
        
        // Read all transcript files
        const transcriptFiles = fs.readdirSync(TRANSCRIPT_DIR).filter(file => file.endsWith('_transcript.json'));
        
        for (const file of transcriptFiles) {
            const filePath = path.join(TRANSCRIPT_DIR, file);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            // Check for audio files (new format has audioFile in conversation items)
            let hasInputAudio = false;
            let hasOutputAudio = false;
            
            if (data.files) {
                // Old format with files object
                hasInputAudio = fs.existsSync(path.join(AUDIO_DIR, data.files.inputAudio));
                hasOutputAudio = fs.existsSync(path.join(AUDIO_DIR, data.files.outputAudio));
            } else if (data.conversation && data.conversation.length > 0) {
                // New format with audioFile in conversation items
                const inputFiles = data.conversation.filter(msg => msg.speaker === 'user' && msg.audioFile);
                const outputFiles = data.conversation.filter(msg => msg.speaker === 'assistant' && msg.audioFile);
                
                hasInputAudio = inputFiles.length > 0 && fs.existsSync(path.join(AUDIO_DIR, inputFiles[0].audioFile));
                hasOutputAudio = outputFiles.length > 0 && fs.existsSync(path.join(AUDIO_DIR, outputFiles[0].audioFile));
            }
            
            sessions.push({
                sessionId: data.sessionId,
                timestamp: data.startTime || data.timestamp,
                voice: data.voice,
                conversationLength: data.conversation ? data.conversation.length : 0,
                hasAudio: {
                    input: hasInputAudio,
                    output: hasOutputAudio
                }
            });
        }
        
        // Sort by timestamp (newest first)
        sessions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        res.json({
            success: true,
            sessions: sessions,
            totalSessions: sessions.length
        });
        
    } catch (error) {
        console.error('Error retrieving saved data:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to get specific session data
app.get('/api/saved-data/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;
        const transcriptPath = path.join(TRANSCRIPT_DIR, `${sessionId}_transcript.json`);
        
        if (!fs.existsSync(transcriptPath)) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        const data = JSON.parse(fs.readFileSync(transcriptPath, 'utf8'));
        res.json({
            success: true,
            session: data
        });
        
    } catch (error) {
        console.error('Error retrieving session data:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to get audio file (new format with messageId)
app.get('/api/saved-data/:sessionId/:messageId/:audioType', (req, res) => {
    try {
        const { sessionId, messageId, audioType } = req.params;
        
        if (!['input', 'output'].includes(audioType)) {
            return res.status(400).json({ error: 'Invalid audio type. Use "input" or "output"' });
        }
        
        const fileExtension = audioType === 'input' ? 'webm' : 'mp3';
        const audioPath = path.join(AUDIO_DIR, `${sessionId}_${messageId}_${audioType}.${fileExtension}`);
        
        if (!fs.existsSync(audioPath)) {
            return res.status(404).json({ error: 'Audio file not found' });
        }
        
        const mimeType = audioType === 'input' ? 'audio/webm' : 'audio/mpeg';
        res.setHeader('Content-Type', mimeType);
        res.sendFile(audioPath);
        
    } catch (error) {
        console.error('Error retrieving audio file:', error);
        res.status(500).json({ error: error.message });
    }
});

// Legacy endpoint for old format (backward compatibility)
app.get('/api/saved-data/:sessionId/:audioType', (req, res) => {
    try {
        const { sessionId, audioType } = req.params;
        
        if (!['input', 'output'].includes(audioType)) {
            return res.status(400).json({ error: 'Invalid audio type. Use "input" or "output"' });
        }
        
        const fileExtension = audioType === 'input' ? 'webm' : 'mp3';
        const audioPath = path.join(AUDIO_DIR, `${sessionId}_${audioType}.${fileExtension}`);
        
        if (!fs.existsSync(audioPath)) {
            return res.status(404).json({ error: 'Audio file not found' });
        }
        
        const mimeType = audioType === 'input' ? 'audio/webm' : 'audio/mpeg';
        res.setHeader('Content-Type', mimeType);
        res.sendFile(audioPath);
        
    } catch (error) {
        console.error('Error retrieving audio file:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIPAddress();
  console.log(`🚀 Voice Chat server running on:`);
  console.log(`   Local:    http://localhost:${PORT}`);
  console.log(`   Network:  http://${localIP}:${PORT}`);
  console.log(`📝 Make sure to set your OPENAI_API_KEY in .env file`);
  console.log(`🌐 Access from other devices using: http://${localIP}:${PORT}`);
});
