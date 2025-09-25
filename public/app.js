class VoiceChatApp {
    constructor() {
        this.session = null;
        this.isConnected = false;
        this.isListening = false;
        this.isSpeaking = false;
        this.isDisconnecting = false;
        this.isDestroyed = false;
        
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
            
            // Store the session globally for manual control
            window.currentRealtimeSession = this.session;
            
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
            if (!this.isConnected || this.isDisconnecting || this.isDestroyed) return;
            this.isListening = true;
            this.updateVoiceIndicator();
        });

        this.session.on('conversation.item.input_audio_buffer.speech_stopped', () => {
            if (!this.isConnected || this.isDisconnecting || this.isDestroyed) return;
            this.isListening = false;
            this.updateVoiceIndicator();
        });

        this.session.on('conversation.item.output_audio_buffer.speech_started', () => {
            if (!this.isConnected || this.isDisconnecting || this.isDestroyed) return;
            this.isSpeaking = true;
            this.updateVoiceIndicator();
        });

        this.session.on('conversation.item.output_audio_buffer.speech_stopped', () => {
            if (!this.isConnected || this.isDisconnecting || this.isDestroyed) return;
            this.isSpeaking = false;
            this.updateVoiceIndicator();
        });

        this.session.on('conversation.item.input_audio_buffer.committed', () => {
            if (!this.isConnected || this.isDisconnecting || this.isDestroyed) return;
            this.updateVoiceStatus('Processing your message...');
        });

        this.session.on('conversation.item.output_audio_buffer.committed', () => {
            if (!this.isConnected || this.isDisconnecting || this.isDestroyed) return;
            this.updateVoiceStatus('AI is responding...');
        });

        this.session.on('conversation.item.output_audio_buffer.done', () => {
            if (!this.isConnected || this.isDisconnecting || this.isDestroyed) return;
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
        // Prevent multiple disconnect attempts
        if (this.isDisconnecting) {
            console.log('Already disconnecting, ignoring duplicate request');
            return;
        }
        
        console.log('Disconnecting...');
        this.isDisconnecting = true;
        
        // Disable disconnect button and show disconnecting status
        this.disconnectBtn.disabled = true;
        this.updateStatus('disconnecting', 'Disconnecting...');
        
        // Try to disconnect session properly
        if (this.session) {
            try {
                console.log('Session object available, checking for disconnect method...');
                
                // Check if disconnect method exists
                if (typeof this.session.disconnect === 'function') {
                    console.log('Calling session.disconnect()');
                    await this.session.disconnect();
                    console.log('Session disconnected successfully');
                } else {
                    console.log('No disconnect method found on session object');
                }
                
                // Try other possible disconnect methods
                if (typeof this.session.close === 'function') {
                    console.log('Calling session.close()');
                    await this.session.close();
                    console.log('Session closed successfully');
                }
                
                if (typeof this.session.end === 'function') {
                    console.log('Calling session.end()');
                    await this.session.end();
                    console.log('Session ended successfully');
                }
                
            } catch (error) {
                console.error('Session disconnect error:', error);
            }
        }
        
        // Try to access call ID and use the official hangup endpoint
        if (this.session) {
            try {
                // Check for various possible call ID properties
                const possibleCallIds = [
                    this.session.callId,
                    this.session.call_id,
                    this.session.id,
                    this.session.sessionId,
                    this.session.session_id
                ];
                
                const callId = possibleCallIds.find(id => id);
                
                if (callId) {
                    console.log('Found call ID:', callId, 'attempting official hangup endpoint...');
                    const response = await fetch(`/api/realtime/calls/${callId}/hangup`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    });
                    
                    if (response.ok) {
                        console.log('Official hangup endpoint successful');
                    } else {
                        console.log('Official hangup endpoint failed:', response.status);
                    }
                } else {
                    console.log('No call ID found on session object');
                }
            } catch (error) {
                console.log('Could not use official hangup endpoint:', error);
            }
        }
        
        // Try to stop the session's internal audio stream
        if (this.session) {
            try {
                console.log('Session object keys:', Object.keys(this.session));
                
                // Try to access the session's internal audio stream
                if (this.session._audioStream) {
                    console.log('Found _audioStream, stopping tracks...');
                    this.session._audioStream.getTracks().forEach(track => {
                        track.stop();
                        console.log('Stopped session audio stream:', track.kind);
                    });
                } else {
                    console.log('No _audioStream found on session');
                }
                
                // Try to access the session's internal properties more deeply
                try {
                    // Access the session's internal map/object
                    if (this.session._t && this.session._t instanceof Map) {
                        console.log('Found _t Map, checking for audio streams...');
                        for (let [key, value] of this.session._t) {
                            if (value && typeof value.getTracks === 'function') {
                                console.log('Found audio stream in _t Map:', key);
                                value.getTracks().forEach(track => {
                                    track.stop();
                                    console.log('Stopped _t stream track:', track.kind);
                                });
                            }
                        }
                    }
                    
                    // Try to access the session's internal connection
                    if (this.session._c) {
                        console.log('Found _c connection object');
                        if (this.session._c._audioStream) {
                            console.log('Found _c._audioStream, stopping...');
                            this.session._c._audioStream.getTracks().forEach(track => {
                                track.stop();
                                console.log('Stopped _c audio stream:', track.kind);
                            });
                        }
                    }
                    
                    // Try to access the session's internal media
                    if (this.session._m) {
                        console.log('Found _m media object');
                        if (this.session._m._audioStream) {
                            console.log('Found _m._audioStream, stopping...');
                            this.session._m._audioStream.getTracks().forEach(track => {
                                track.stop();
                                console.log('Stopped _m audio stream:', track.kind);
                            });
                        }
                    }
                    
                } catch (e) {
                    console.log('Could not access session internals:', e);
                }
                
                // Try to access the WebRTC connection
                if (this.session._webrtcConnection) {
                    console.log('Found _webrtcConnection, closing...');
                    this.session._webrtcConnection.close();
                    console.log('Closed WebRTC connection');
                } else {
                    console.log('No _webrtcConnection found on session');
                }
                
                // Try other possible internal properties
                if (this.session.audioStream) {
                    console.log('Found audioStream, stopping tracks...');
                    this.session.audioStream.getTracks().forEach(track => {
                        track.stop();
                        console.log('Stopped audioStream:', track.kind);
                    });
                }
                
                if (this.session.webrtcConnection) {
                    console.log('Found webrtcConnection, closing...');
                    this.session.webrtcConnection.close();
                    console.log('Closed webrtcConnection');
                }
                
                // Try to access the session's internal media stream
                if (this.session._mediaStream) {
                    console.log('Found _mediaStream, stopping tracks...');
                    this.session._mediaStream.getTracks().forEach(track => {
                        track.stop();
                        console.log('Stopped _mediaStream:', track.kind);
                    });
                }
                
                // Try to access the session's internal peer connection
                if (this.session._peerConnection) {
                    console.log('Found _peerConnection, closing...');
                    this.session._peerConnection.close();
                    console.log('Closed _peerConnection');
                }
                
                // Try to access WebSocket connections
                if (this.session._websocket) {
                    console.log('Found _websocket, closing...');
                    this.session._websocket.close();
                    console.log('Closed _websocket');
                }
                
                if (this.session._socket) {
                    console.log('Found _socket, closing...');
                    this.session._socket.close();
                    console.log('Closed _socket');
                }
                
                if (this.session._ws) {
                    console.log('Found _ws, closing...');
                    this.session._ws.close();
                    console.log('Closed _ws');
                }
                
                // Try to access transport connections
                if (this.session._transport) {
                    console.log('Found _transport, closing...');
                    if (typeof this.session._transport.close === 'function') {
                        this.session._transport.close();
                        console.log('Closed _transport');
                    }
                }
                
                // Try to access connection manager
                if (this.session._connectionManager) {
                    console.log('Found _connectionManager, closing...');
                    if (typeof this.session._connectionManager.close === 'function') {
                        this.session._connectionManager.close();
                        console.log('Closed _connectionManager');
                    }
                }
                
            } catch (error) {
                console.log('Could not access session internals:', error);
            }
        }
        
        // Try to stop any active media streams - more aggressive approach
        try {
            console.log('Attempting to stop all active media streams...');
            
            // Method 1: Try to get current active streams
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                navigator.mediaDevices.getUserMedia({ audio: true })
                    .then(stream => {
                        console.log('Found active stream, stopping tracks...');
                        stream.getTracks().forEach(track => {
                            console.log('Stopping track:', track.kind, 'state:', track.readyState);
                            track.stop();
                            console.log('Stopped active microphone track:', track.kind);
                        });
                    })
                    .catch(err => {
                        console.log('No active microphone stream to stop:', err.message);
                    });
            }
            
            // Method 2: Try to access global media streams
            if (window.mediaStreams) {
                console.log('Found global mediaStreams, stopping...');
                window.mediaStreams.forEach(stream => {
                    stream.getTracks().forEach(track => {
                        track.stop();
                        console.log('Stopped global stream track:', track.kind);
                    });
                });
            }
            
            // Method 3: Try to access the session's internal audio stream directly
            if (this.session && this.session._t) {
                console.log('Checking session _t Map for audio streams...');
                for (let [key, value] of this.session._t) {
                    if (value && typeof value.getTracks === 'function') {
                        console.log('Found audio stream in session _t:', key);
                        value.getTracks().forEach(track => {
                            track.stop();
                            console.log('Stopped session _t track:', track.kind);
                        });
                    }
                }
            }
            
            // Method 4: Try to access the session's internal connection object
            if (this.session && this.session._c) {
                console.log('Checking session _c connection object...');
                try {
                    // Try to access audio stream from connection
                    if (this.session._c._audioStream) {
                        console.log('Found _c._audioStream, stopping...');
                        this.session._c._audioStream.getTracks().forEach(track => {
                            track.stop();
                            console.log('Stopped _c audio stream:', track.kind);
                        });
                    }
                    
                    // Try to access media stream from connection
                    if (this.session._c._mediaStream) {
                        console.log('Found _c._mediaStream, stopping...');
                        this.session._c._mediaStream.getTracks().forEach(track => {
                            track.stop();
                            console.log('Stopped _c media stream:', track.kind);
                        });
                    }
                    
                    // Try to access any stream properties
                    Object.keys(this.session._c).forEach(key => {
                        if (this.session._c[key] && typeof this.session._c[key].getTracks === 'function') {
                            console.log('Found stream in _c:', key);
                            this.session._c[key].getTracks().forEach(track => {
                                track.stop();
                                console.log('Stopped _c stream:', key, track.kind);
                            });
                        }
                    });
                    
                } catch (e) {
                    console.log('Could not access _c connection:', e);
                }
            }
            
            // Method 2: Try to access global media streams
            if (window.mediaStreams) {
                console.log('Found global mediaStreams, stopping...');
                window.mediaStreams.forEach(stream => {
                    stream.getTracks().forEach(track => {
                        track.stop();
                        console.log('Stopped global stream track:', track.kind);
                    });
                });
            }
            
            // Method 3: Force stop all audio contexts
            if (window.AudioContext || window.webkitAudioContext) {
                try {
                    const AudioContext = window.AudioContext || window.webkitAudioContext;
                    if (window.audioContext) {
                        window.audioContext.close();
                        console.log('Closed audio context');
                    }
                } catch (e) {
                    console.log('Could not close audio context:', e);
                }
            }
            
        } catch (error) {
            console.log('Could not stop microphone:', error);
        }
        
        // Try to destroy the session completely
        if (this.session) {
            try {
                console.log('Attempting to destroy session completely...');
                
                // Try to call destroy method if it exists
                if (typeof this.session.destroy === 'function') {
                    console.log('Calling session.destroy()');
                    this.session.destroy();
                    console.log('Session destroyed');
                }
                
                // Try to call close method if it exists
                if (typeof this.session.close === 'function') {
                    console.log('Calling session.close()');
                    this.session.close();
                    console.log('Session closed');
                }
                
                // Try to call end method if it exists
                if (typeof this.session.end === 'function') {
                    console.log('Calling session.end()');
                    this.session.end();
                    console.log('Session ended');
                }
                
                // Try to access and stop any remaining audio streams
                if (this.session._t && this.session._t instanceof Map) {
                    for (let [key, value] of this.session._t) {
                        if (value && typeof value.getTracks === 'function') {
                            console.log('Stopping remaining stream in _t:', key);
                            value.getTracks().forEach(track => {
                                track.stop();
                                console.log('Stopped remaining track:', track.kind);
                            });
                        }
                    }
                }
                
            } catch (error) {
                console.log('Could not destroy session:', error);
            }
        }
        
        // Clean up state
        this.isConnected = false;
        this.isListening = false;
        this.isSpeaking = false;
        this.isDisconnecting = false;
        
        // Clear session reference
        this.session = null;
        
        // Update UI
        this.updateStatus('disconnected', 'Disconnected');
        this.updateVoiceStatus('Click Connect to start talking');
        this.updateButtons();
        this.updateVoiceIndicator();
        
        console.log('Disconnect completed');
        
        // Test if microphone is actually stopped
        setTimeout(() => {
            console.log('Testing if microphone is stopped...');
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    console.log('❌ Microphone is still active! Found stream with tracks:', stream.getTracks().length);
                    stream.getTracks().forEach(track => {
                        console.log('Track state:', track.readyState, 'kind:', track.kind);
                        track.stop();
                    });
                    
                    // If microphone is still active, try to access session internals more aggressively
                    if (this.session && this.session._t) {
                        console.log('Microphone still active, trying to access session _t Map...');
                        for (let [key, value] of this.session._t) {
                            if (value && typeof value.getTracks === 'function') {
                                console.log('Found remaining stream in _t:', key);
                                value.getTracks().forEach(track => {
                                    track.stop();
                                    console.log('Force stopped remaining track:', track.kind);
                                });
                            }
                        }
                    }
                    
                    // Try to access the session's internal connection
                    if (this.session && this.session._c) {
                        console.log('Trying to access session _c connection...');
                        try {
                            Object.keys(this.session._c).forEach(key => {
                                if (this.session._c[key] && typeof this.session._c[key].getTracks === 'function') {
                                    console.log('Found remaining stream in _c:', key);
                                    this.session._c[key].getTracks().forEach(track => {
                                        track.stop();
                                        console.log('Force stopped _c track:', track.kind);
                                    });
                                }
                            });
                        } catch (e) {
                            console.log('Could not access _c connection:', e);
                        }
                    }
                    
                })
                .catch(err => {
                    console.log('✅ Microphone appears to be stopped - no active streams found');
                });
        }, 2000);
        
        // Final fallback: Force stop all media tracks and connections
        setTimeout(() => {
            console.log('Final fallback: Force stopping all media tracks and connections...');
            
            // Try to access the session's WebRTC connection directly
            if (this.session && this.session._webrtcConnection) {
                try {
                    console.log('Force closing WebRTC connection...');
                    this.session._webrtcConnection.close();
                    console.log('WebRTC connection force closed');
                } catch (e) {
                    console.log('Could not force close WebRTC:', e);
                }
            }
            
            // Force close all possible connections
            if (this.session) {
                try {
                    // Force close WebSocket connections
                    const wsConnections = ['_websocket', '_socket', '_ws', '_transport', '_connectionManager'];
                    wsConnections.forEach(connName => {
                        if (this.session[connName]) {
                            try {
                                console.log(`Force closing ${connName}...`);
                                if (typeof this.session[connName].close === 'function') {
                                    this.session[connName].close();
                                    console.log(`Force closed ${connName}`);
                                }
                            } catch (e) {
                                console.log(`Could not force close ${connName}:`, e);
                            }
                        }
                    });
                    
                    // Force close peer connections
                    const peerConnections = ['_peerConnection', '_webrtcConnection', '_rtcConnection'];
                    peerConnections.forEach(connName => {
                        if (this.session[connName]) {
                            try {
                                console.log(`Force closing ${connName}...`);
                                this.session[connName].close();
                                console.log(`Force closed ${connName}`);
                            } catch (e) {
                                console.log(`Could not force close ${connName}:`, e);
                            }
                        }
                    });
                    
                } catch (e) {
                    console.log('Could not force close connections:', e);
                }
            }
            
            // Try to get and stop any remaining streams
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    console.log('Found remaining stream, force stopping...');
                    stream.getTracks().forEach(track => {
                        track.stop();
                        console.log('Force stopped track:', track.kind, track.readyState);
                    });
                })
                .catch(err => {
                    console.log('No active streams to force stop:', err.message);
                });
                
            // Nuclear option: Try to stop all media tracks globally
            try {
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    // This might trigger a new permission request, but we'll stop it immediately
                    navigator.mediaDevices.getUserMedia({ audio: true })
                        .then(stream => {
                            stream.getTracks().forEach(track => {
                                track.stop();
                                console.log('Nuclear option: Stopped track:', track.kind);
                            });
                        })
                        .catch(() => {
                            console.log('Nuclear option: No streams to stop');
                        });
                }
            } catch (e) {
                console.log('Nuclear option failed:', e);
            }
            
            // Nuclear option: Close any global WebSocket connections
            try {
                // Try to close any global WebSocket connections
                if (window.WebSocket && window.WebSocket.CLOSING === 1) {
                    console.log('Found global WebSocket in closing state');
                }
                
                // Try to close any EventSource connections
                if (window.EventSource) {
                    console.log('EventSource available, checking for active connections...');
                }
                
                // Force close any remaining connections by clearing the session reference
                if (this.session) {
                    console.log('Clearing session reference...');
                    this.session = null;
                }
                
            } catch (e) {
                console.log('Nuclear WebSocket cleanup failed:', e);
            }
        }, 1000);
    }

    // Simple fallback disconnect if the main one doesn't work
    forceDisconnect() {
        console.log('Force disconnect fallback...');
        
        // Just clean up the state
        this.isConnected = false;
        this.isListening = false;
        this.isSpeaking = false;
        this.isDisconnecting = false;
        this.isDestroyed = true;
        
        // Clear session reference
        this.session = null;
        
        // Update UI
        this.updateStatus('disconnected', 'Disconnected');
        this.updateVoiceStatus('Click Connect to start talking');
        this.updateButtons();
        this.updateVoiceIndicator();
        
        console.log('Force disconnect completed');
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
