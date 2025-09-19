class VoiceChatApp {
    constructor() {
        this.session = null;
        this.isConnected = false;
        this.isListening = false;
        this.isSpeaking = false;
        
        this.initializeElements();
        this.attachEventListeners();
        this.updateUI();
    }

    initializeElements() {
        this.connectBtn = document.getElementById('connectBtn');
        this.disconnectBtn = document.getElementById('disconnectBtn');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusText = document.getElementById('statusText');
        this.voiceWave = document.getElementById('voiceWave');
        this.voiceStatus = document.getElementById('voiceStatus');
    }

    attachEventListeners() {
        this.connectBtn.addEventListener('click', () => this.connect());
        this.disconnectBtn.addEventListener('click', () => this.disconnect());
    }

    async connect() {
        try {
            this.updateStatus('connecting', 'Connecting to OpenAI...');
            this.connectBtn.disabled = true;

            // Check if RealtimeAgent is available
            if (typeof RealtimeAgent === 'undefined' && typeof window.RealtimeAgent === 'undefined') {
                throw new Error('RealtimeAgent not found. Please check if the OpenAI SDK is loaded correctly.');
            }

            // Use global RealtimeAgent if available
            const RealtimeAgentClass = typeof RealtimeAgent !== 'undefined' ? RealtimeAgent : window.RealtimeAgent;
            const RealtimeSessionClass = typeof RealtimeSession !== 'undefined' ? RealtimeSession : window.RealtimeSession;

            // Get ephemeral client key from backend
            const response = await fetch('/api/realtime/session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Failed to create session: ${error.error}`);
            }
            const { clientSecret } = await response.json();

            // Create the agent
            const agent = new RealtimeAgentClass({
                name: 'Assistant',
                instructions: 'You are a helpful AI assistant. Respond naturally and conversationally. Keep responses concise and engaging.',
                voice: 'alloy',
                interruptible: true
            });

            // Create the session with correct model
            this.session = new RealtimeSessionClass(agent, {
                model: 'gpt-realtime'
            });

            // Set up event listeners
            this.setupSessionListeners();

            // Connect to the session using the ephemeral client key
            // Use the official approach as per documentation
            console.log('Attempting to connect with clientSecret:', clientSecret.substring(0, 20) + '...');
            console.log('Session object:', this.session);
            
            await this.session.connect({ 
                apiKey: clientSecret
            });
            
            console.log('Connection successful!');
            
            this.isConnected = true;
            this.updateStatus('connected', 'Connected - Start speaking!');
            this.updateVoiceStatus('Listening for your voice...');
            this.updateButtons();

        } catch (error) {
            console.error('Connection failed:', error);
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            this.updateStatus('error', `Connection failed: ${error.message}`);
            this.connectBtn.disabled = false;
        }
    }

    setupSessionListeners() {
        // Handle session events
        this.session.on('conversation.item.input_audio_buffer.speech_started', () => {
            this.isListening = true;
            this.updateVoiceIndicator();
        });

        this.session.on('conversation.item.input_audio_buffer.speech_stopped', () => {
            this.isListening = false;
            this.updateVoiceIndicator();
        });

        this.session.on('conversation.item.output_audio_buffer.speech_started', () => {
            this.isSpeaking = true;
            this.updateVoiceIndicator();
        });

        this.session.on('conversation.item.output_audio_buffer.speech_stopped', () => {
            this.isSpeaking = false;
            this.updateVoiceIndicator();
        });

        this.session.on('conversation.item.input_audio_buffer.committed', () => {
            this.updateVoiceStatus('Processing your message...');
        });

        this.session.on('conversation.item.output_audio_buffer.committed', () => {
            this.updateVoiceStatus('AI is responding...');
        });

        this.session.on('conversation.item.output_audio_buffer.done', () => {
            this.updateVoiceStatus('Listening for your voice...');
        });

        // Handle errors
        this.session.on('error', (error) => {
            console.error('Session error:', error);
            this.updateStatus('error', `Error: ${error.message}`);
        });

        // Handle disconnection
        this.session.on('disconnect', () => {
            this.isConnected = false;
            this.updateStatus('disconnected', 'Disconnected');
            this.updateButtons();
        });
    }

    async disconnect() {
        if (this.session) {
            try {
                await this.session.disconnect();
            } catch (error) {
                console.error('Disconnect error:', error);
            }
        }
        
        this.isConnected = false;
        this.isListening = false;
        this.isSpeaking = false;
        this.session = null;
        
        this.updateStatus('disconnected', 'Disconnected');
        this.updateVoiceStatus('Click Connect to start talking');
        this.updateButtons();
        this.updateVoiceIndicator();
    }

    updateStatus(status, message) {
        this.statusIndicator.className = `status-indicator ${status}`;
        this.statusText.textContent = message;
    }

    updateVoiceStatus(message) {
        this.voiceStatus.textContent = message;
    }

    updateVoiceIndicator() {
        if (this.isSpeaking) {
            this.voiceWave.className = 'voice-wave speaking';
        } else if (this.isListening) {
            this.voiceWave.className = 'voice-wave listening';
        } else {
            this.voiceWave.className = 'voice-wave';
        }
    }

    updateButtons() {
        this.connectBtn.disabled = this.isConnected;
        this.disconnectBtn.disabled = !this.isConnected;
    }

    updateUI() {
        this.updateButtons();
        this.updateVoiceIndicator();
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Wait for SDK to load and then initialize
    const checkSDK = () => {
        if (typeof window.RealtimeAgent !== 'undefined' && typeof window.RealtimeSession !== 'undefined') {
            console.log('SDK ready, initializing app');
            new VoiceChatApp();
        } else {
            console.log('SDK not ready yet, waiting...');
            setTimeout(checkSDK, 500);
        }
    };
    
    // Start checking after a short delay
    setTimeout(checkSDK, 1000);
});

// Handle page visibility changes to manage connection
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.voiceChatApp && window.voiceChatApp.isConnected) {
        console.log('Page hidden - maintaining connection');
    }
});

// Handle beforeunload to clean up connection
window.addEventListener('beforeunload', () => {
    if (window.voiceChatApp && window.voiceChatApp.isConnected) {
        window.voiceChatApp.disconnect();
    }
});
