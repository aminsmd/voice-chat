const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

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

app.listen(PORT, () => {
  console.log(`🚀 Voice Chat server running on http://localhost:${PORT}`);
  console.log(`📝 Make sure to set your OPENAI_API_KEY in .env file`);
});
