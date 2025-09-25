const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

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
app.use(express.json());
app.use(express.static('public'));

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve the multi-party voice chat
app.get('/multiparty', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'multiparty.html'));
});

// Serve the advanced multi-party voice chat
app.get('/advanced-multiparty', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'advanced-multiparty.html'));
});

    // Serve the recording multi-party voice chat
    app.get('/recording-multiparty', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'recording-multiparty.html'));
    });

    // Serve the AI multi-party voice chat
    app.get('/ai-multiparty', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'ai-multiparty.html'));
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
        res.json({ status: 'OK', timestamp: new Date().toISOString() });
    });

    // Network info endpoint
    app.get('/api/network', (req, res) => {
        const localIP = getLocalIPAddress();
        res.json({ 
            localIP: localIP,
            port: PORT,
            localUrl: `http://localhost:${PORT}`,
            networkUrl: `http://${localIP}:${PORT}`,
            aiMultipartyUrl: `http://${localIP}:${PORT}/ai-multiparty`,
            basicChatUrl: `http://${localIP}:${PORT}`
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

app.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIPAddress();
  console.log(`🚀 Voice Chat server running on:`);
  console.log(`   Local:    http://localhost:${PORT}`);
  console.log(`   Network:  http://${localIP}:${PORT}`);
  console.log(`📝 Make sure to set your OPENAI_API_KEY in .env file`);
  console.log(`🌐 Access from other devices using: http://${localIP}:${PORT}`);
  console.log(`   - AI Multi-Party: http://${localIP}:${PORT}/ai-multiparty`);
  console.log(`   - Basic Voice Chat: http://${localIP}:${PORT}`);
});
