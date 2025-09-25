class AIMultiPartyVoiceChat {
    constructor() {
        this.localStream = null;
        this.participants = new Map();
        this.isMuted = false;
        this.roomId = null;
        this.userName = null;
        this.userId = this.generateUserId();
        
        // AI Agent properties
        this.aiSession = null;
        this.aiAgent = null;
        this.isAiConnected = false;
        this.isAiListening = false;
        this.isAiSpeaking = false;
        
        this.initializeElements();
        this.attachEventListeners();
    }

    generateUserId() {
        return 'user_' + Math.random().toString(36).substring(2, 15);
    }

    initializeElements() {
        this.joinRoomForm = document.getElementById('joinRoomForm');
        this.roomInterface = document.getElementById('roomInterface');
        this.userNameInput = document.getElementById('userName');
        this.roomIdInput = document.getElementById('roomId');
        this.joinRoomBtn = document.getElementById('joinRoomBtn');
        this.createRoomBtn = document.getElementById('createRoomBtn');
        this.leaveRoomBtn = document.getElementById('leaveRoomBtn');
        this.participantsGrid = document.getElementById('participantsGrid');
        this.currentRoomId = document.getElementById('currentRoomId');
        
        // AI elements
        this.aiStatusIndicator = document.getElementById('aiStatusIndicator');
        this.aiStatusText = document.getElementById('aiStatusText');
        this.connectAiBtn = document.getElementById('connectAiBtn');
        this.disconnectAiBtn = document.getElementById('disconnectAiBtn');
    }

    attachEventListeners() {
        this.joinRoomBtn.addEventListener('click', () => this.joinRoom());
        this.createRoomBtn.addEventListener('click', () => this.createRoom());
        this.leaveRoomBtn.addEventListener('click', () => this.leaveRoom());
        this.connectAiBtn.addEventListener('click', () => this.connectAI());
        this.disconnectAiBtn.addEventListener('click', () => this.disconnectAI());
    }

    generateRoomId() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    async createRoom() {
        const userName = this.userNameInput.value.trim();
        if (!userName) {
            alert('Please enter your name');
            return;
        }

        this.userName = userName;
        this.roomId = this.generateRoomId();
        this.roomIdInput.value = this.roomId;
        
        await this.joinRoom();
    }

    async joinRoom() {
        const userName = this.userNameInput.value.trim();
        const roomId = this.roomIdInput.value.trim();
        
        if (!userName) {
            alert('Please enter your name');
            return;
        }

        if (!roomId) {
            alert('Please enter a room ID');
            return;
        }

        this.userName = userName;
        this.roomId = roomId;

        try {
            // Get user media
            await this.getUserMedia();
            
            // Show room interface
            this.showRoomInterface();
            
            // Add self as participant
            this.addParticipant(this.userName, true, true);
            
            console.log(`Joined room ${this.roomId} as ${this.userName}`);
            
        } catch (error) {
            console.error('Failed to join room:', error);
            alert('Failed to join room. Please check your microphone permissions.');
        }
    }

    async getUserMedia() {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            console.log('Got user media');
        } catch (error) {
            console.error('Error accessing microphone:', error);
            throw error;
        }
    }

    showRoomInterface() {
        this.joinRoomForm.style.display = 'none';
        this.roomInterface.style.display = 'block';
        this.currentRoomId.textContent = this.roomId;
    }

    addParticipant(name, isLocal, isSpeaking = false) {
        const participantId = isLocal ? 'local' : `participant_${Date.now()}`;
        
        this.participants.set(participantId, {
            id: participantId,
            name: name,
            isLocal: isLocal,
            isSpeaking: isSpeaking,
            isMuted: false
        });

        this.renderParticipants();
        
        // Simulate speaking events for demo (non-local participants)
        if (!isLocal) {
            this.simulateSpeakingEvents(participantId);
        }
    }

    simulateSpeakingEvents(participantId) {
        setInterval(() => {
            if (Math.random() < 0.3) { // 30% chance to speak
                this.updateParticipantSpeaking(participantId, true);
                setTimeout(() => {
                    this.updateParticipantSpeaking(participantId, false);
                }, 2000 + Math.random() * 3000);
            }
        }, 5000);
    }

    updateParticipantSpeaking(participantId, isSpeaking) {
        const participant = this.participants.get(participantId);
        if (participant) {
            participant.isSpeaking = isSpeaking;
            this.renderParticipants();
        }
    }

    renderParticipants() {
        this.participantsGrid.innerHTML = '';
        
        // Add AI Agent card first
        this.renderAICard();
        
        // Add human participants
        this.participants.forEach((participant) => {
            const participantCard = this.createParticipantCard(participant);
            this.participantsGrid.appendChild(participantCard);
        });
    }

    renderAICard() {
        const aiCard = document.createElement('div');
        aiCard.className = 'ai-card';
        
        const aiStatusClass = this.isAiSpeaking ? 'speaking' : (this.isAiListening ? 'listening' : (this.isAiConnected ? 'connected' : ''));
        
        aiCard.innerHTML = `
            <div class="ai-avatar">🤖</div>
            <div class="participant-name">AI Assistant</div>
            <div class="participant-status">
                <div class="ai-status-indicator ${aiStatusClass}"></div>
                <span>${this.isAiSpeaking ? 'Speaking' : (this.isAiListening ? 'Listening' : (this.isAiConnected ? 'Connected' : 'Disconnected'))}</span>
            </div>
            <div class="participant-controls">
                ${this.isAiConnected ? `
                    <button class="control-btn disconnect" onclick="aiMultiPartyChat.disconnectAI()">
                        🔌 Disconnect
                    </button>
                ` : `
                    <button class="control-btn connect" onclick="aiMultiPartyChat.connectAI()">
                        🤖 Connect
                    </button>
                `}
            </div>
        `;
        
        this.participantsGrid.appendChild(aiCard);
    }

    createParticipantCard(participant) {
        const card = document.createElement('div');
        card.className = 'participant-card';
        card.id = `participant_${participant.id}`;
        
        const avatar = participant.name.charAt(0).toUpperCase();
        const statusClass = participant.isSpeaking ? 'speaking' : (participant.isMuted ? 'muted' : '');
        
        card.innerHTML = `
            <div class="participant-avatar">${avatar}</div>
            <div class="participant-name">${participant.name}${participant.isLocal ? ' (You)' : ''}</div>
            <div class="participant-status">
                <div class="status-indicator ${statusClass}"></div>
                <span>${participant.isSpeaking ? 'Speaking' : (participant.isMuted ? 'Muted' : 'Connected')}</span>
            </div>
            <div class="participant-controls">
                ${participant.isLocal ? `
                    <button class="control-btn ${this.isMuted ? 'unmute' : 'mute'}" 
                            onclick="aiMultiPartyChat.toggleMute()">
                        ${this.isMuted ? '🔊 Unmute' : '🔇 Mute'}
                    </button>
                ` : `
                    <button class="control-btn mute" onclick="aiMultiPartyChat.muteParticipant('${participant.id}')">
                        🔇 Mute
                    </button>
                `}
            </div>
        `;
        
        return card;
    }

    async connectAI() {
        if (this.isAiConnected) return;

        try {
            console.log('Connecting to AI...');
            this.updateAIStatus('connecting', 'Connecting to AI...');
            this.connectAiBtn.disabled = true;

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

            // Create the AI agent
            this.aiAgent = new RealtimeAgentClass({
                name: 'AI Assistant',
                instructions: `You are a helpful AI assistant in a multi-party voice chat room with ${this.participants.size} participants. 
                You can hear and respond to all participants in the room. Be conversational and engaging. 
                Address the group as a whole when appropriate, or respond to specific individuals when they ask you something directly.
                Keep responses concise and natural for voice conversation.`,
                voice: 'alloy',
                interruptible: true
            });

            // Create the AI session
            this.aiSession = new RealtimeSessionClass(this.aiAgent, {
                model: 'gpt-realtime'
            });

            // Set up AI session event listeners
            this.setupAISessionListeners();

            // Connect to the AI session
            await this.aiSession.connect({ 
                apiKey: clientSecret
            });
            
            console.log('AI connected successfully!');
            
            this.isAiConnected = true;
            this.updateAIStatus('connected', 'AI Connected - Ready to chat!');
            this.updateAIControls();
            this.renderParticipants();

        } catch (error) {
            console.error('AI connection failed:', error);
            this.updateAIStatus('error', `AI Connection failed: ${error.message}`);
            this.connectAiBtn.disabled = false;
            this.updateAIControls();
        }
    }

    setupAISessionListeners() {
        if (!this.aiSession) return;

        // Handle AI listening events
        this.aiSession.on('conversation.item.input_audio_buffer.speech_started', () => {
            if (!this.isAiConnected) return;
            console.log('AI started listening');
            this.isAiListening = true;
            this.updateAIStatus('listening', 'AI is listening...');
            this.renderParticipants();
        });

        this.aiSession.on('conversation.item.input_audio_buffer.speech_stopped', () => {
            if (!this.isAiConnected) return;
            console.log('AI stopped listening');
            this.isAiListening = false;
            this.updateAIStatus('connected', 'AI is processing...');
            this.renderParticipants();
        });

        // Handle AI speaking events
        this.aiSession.on('conversation.item.output_audio_buffer.speech_started', () => {
            if (!this.isAiConnected) return;
            console.log('AI started speaking');
            this.isAiSpeaking = true;
            this.updateAIStatus('speaking', 'AI is speaking...');
            this.renderParticipants();
        });

        this.aiSession.on('conversation.item.output_audio_buffer.speech_stopped', () => {
            if (!this.isAiConnected) return;
            console.log('AI stopped speaking');
            this.isAiSpeaking = false;
            this.updateAIStatus('connected', 'AI is ready to chat');
            this.renderParticipants();
        });

        // Handle AI errors
        this.aiSession.on('error', (error) => {
            console.error('AI session error:', error);
            this.updateAIStatus('error', `AI Error: ${error.message}`);
        });

        // Handle AI disconnection
        this.aiSession.on('disconnect', () => {
            console.log('AI disconnected');
            this.isAiConnected = false;
            this.isAiListening = false;
            this.isAiSpeaking = false;
            this.updateAIStatus('disconnected', 'AI Disconnected');
            this.updateAIControls();
            this.renderParticipants();
        });
    }

    async disconnectAI() {
        if (!this.isAiConnected) return;

        try {
            console.log('Disconnecting AI...');
            this.updateAIStatus('disconnecting', 'Disconnecting AI...');
            this.disconnectAiBtn.disabled = true;

            if (this.aiSession) {
                // Try to disconnect the AI session
                if (typeof this.aiSession.close === 'function') {
                    await this.aiSession.close();
                    console.log('AI session closed');
                }
            }

            this.isAiConnected = false;
            this.isAiListening = false;
            this.isAiSpeaking = false;
            this.aiSession = null;
            this.aiAgent = null;

            this.updateAIStatus('disconnected', 'AI Disconnected');
            this.updateAIControls();
            this.renderParticipants();

            // Re-enable the connect button
            this.connectAiBtn.disabled = false;

            console.log('AI disconnected successfully');

        } catch (error) {
            console.error('Error disconnecting AI:', error);
            this.updateAIStatus('error', `Disconnect failed: ${error.message}`);
            this.disconnectAiBtn.disabled = false;
            this.connectAiBtn.disabled = false;
        }
    }

    updateAIStatus(status, message) {
        this.aiStatusIndicator.className = `ai-status-indicator ${status}`;
        this.aiStatusText.textContent = message;
    }

    updateAIControls() {
        if (this.isAiConnected) {
            this.connectAiBtn.style.display = 'none';
            this.disconnectAiBtn.style.display = 'inline-block';
        } else {
            this.connectAiBtn.style.display = 'inline-block';
            this.disconnectAiBtn.style.display = 'none';
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        
        if (this.localStream) {
            this.localStream.getAudioTracks().forEach(track => {
                track.enabled = !this.isMuted;
            });
        }
        
        // Update local participant
        const localParticipant = this.participants.get('local');
        if (localParticipant) {
            localParticipant.isMuted = this.isMuted;
            this.renderParticipants();
        }
        
        console.log(this.isMuted ? 'Muted' : 'Unmuted');
    }

    muteParticipant(participantId) {
        const participant = this.participants.get(participantId);
        if (participant) {
            participant.isMuted = !participant.isMuted;
            this.renderParticipants();
            console.log(`${participant.name} ${participant.isMuted ? 'muted' : 'unmuted'}`);
        }
    }

    leaveRoom() {
        // Disconnect AI if connected
        if (this.isAiConnected) {
            this.disconnectAI();
        }
        
        // Stop all tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }
        
        // Clear data
        this.participants.clear();
        
        // Reset UI
        this.roomInterface.style.display = 'none';
        this.joinRoomForm.style.display = 'block';
        this.participantsGrid.innerHTML = '';
        
        // Reset form
        this.userNameInput.value = '';
        this.roomIdInput.value = '';
        
        console.log('Left room');
    }
}

// Initialize the AI multi-party voice chat
const aiMultiPartyChat = new AIMultiPartyVoiceChat();
