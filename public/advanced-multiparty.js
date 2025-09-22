class AdvancedMultiPartyVoiceChat {
    constructor() {
        this.localStream = null;
        this.peerConnections = new Map();
        this.remoteStreams = new Map();
        this.participants = new Map();
        this.isMuted = false;
        this.roomId = null;
        this.userName = null;
        this.socket = null;
        this.userId = this.generateUserId();
        
        // WebRTC configuration
        this.rtcConfig = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' }
            ]
        };
        
        this.initializeElements();
        this.attachEventListeners();
        this.initializeStats();
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
        this.muteAllBtn = document.getElementById('muteAllBtn');
        this.unmuteAllBtn = document.getElementById('unmuteAllBtn');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.participantsGrid = document.getElementById('participantsGrid');
        this.currentRoomId = document.getElementById('currentRoomId');
        
        // Stats elements
        this.participantCount = document.getElementById('participantCount');
        this.speakingCount = document.getElementById('speakingCount');
        this.mutedCount = document.getElementById('mutedCount');
        this.connectionQuality = document.getElementById('connectionQuality');
    }

    attachEventListeners() {
        this.joinRoomBtn.addEventListener('click', () => this.joinRoom());
        this.createRoomBtn.addEventListener('click', () => this.createRoom());
        this.leaveRoomBtn.addEventListener('click', () => this.leaveRoom());
        this.muteAllBtn.addEventListener('click', () => this.muteAll());
        this.unmuteAllBtn.addEventListener('click', () => this.unmuteAll());
        this.settingsBtn.addEventListener('click', () => this.showSettings());
    }

    initializeStats() {
        this.stats = {
            participants: 0,
            speaking: 0,
            muted: 0,
            connectionQuality: 'Good'
        };
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
            // Initialize WebSocket connection
            this.initializeSignaling();
            
            // Get user media
            await this.getUserMedia();
            
            // Show room interface
            this.showRoomInterface();
            
            // Add self as participant
            this.addParticipant(this.userName, true, true);
            
            // Start stats updates
            this.startStatsUpdates();
            
            console.log(`Joined room ${this.roomId} as ${this.userName}`);
            
        } catch (error) {
            console.error('Failed to join room:', error);
            alert('Failed to join room. Please check your microphone permissions.');
        }
    }

    initializeSignaling() {
        // In a real application, this would connect to a WebSocket server
        // For demo purposes, we'll simulate the signaling
        console.log('Signaling initialized for room:', this.roomId);
        
        // Simulate receiving participants (in real app, this would come from server)
        setTimeout(() => {
            this.simulateOtherParticipants();
        }, 2000);
    }

    simulateOtherParticipants() {
        // Simulate other participants joining (for demo purposes)
        const demoParticipants = [
            { name: 'Alice', isLocal: false },
            { name: 'Bob', isLocal: false },
            { name: 'Charlie', isLocal: false },
            { name: 'Diana', isLocal: false }
        ];

        demoParticipants.forEach((participant, index) => {
            setTimeout(() => {
                this.addParticipant(participant.name, false, false);
                this.createPeerConnection(participant.name);
            }, index * 1500);
        });
    }

    async getUserMedia() {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 48000
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
            isMuted: false,
            connectionQuality: 'Good'
        });

        this.renderParticipants();
        this.updateStats();
        
        // Simulate speaking events for demo
        if (!isLocal) {
            this.simulateSpeakingEvents(participantId);
        }
    }

    async createPeerConnection(participantName) {
        const participantId = `participant_${Date.now()}`;
        
        try {
            const peerConnection = new RTCPeerConnection(this.rtcConfig);
            
            // Add local stream
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => {
                    peerConnection.addTrack(track, this.localStream);
                });
            }
            
            // Handle remote stream
            peerConnection.ontrack = (event) => {
                const remoteStream = event.streams[0];
                this.remoteStreams.set(participantId, remoteStream);
                console.log('Received remote stream from', participantName);
            };
            
            // Handle ICE candidates
            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    // In real app, send to other participants via signaling server
                    console.log('ICE candidate generated');
                }
            };
            
            // Handle connection state changes
            peerConnection.onconnectionstatechange = () => {
                console.log('Connection state:', peerConnection.connectionState);
                this.updateConnectionQuality(participantId, peerConnection.connectionState);
            };
            
            this.peerConnections.set(participantId, peerConnection);
            
        } catch (error) {
            console.error('Error creating peer connection:', error);
        }
    }

    updateConnectionQuality(participantId, state) {
        const participant = this.participants.get(participantId);
        if (participant) {
            switch (state) {
                case 'connected':
                    participant.connectionQuality = 'Excellent';
                    break;
                case 'connecting':
                    participant.connectionQuality = 'Connecting';
                    break;
                case 'disconnected':
                    participant.connectionQuality = 'Disconnected';
                    break;
                default:
                    participant.connectionQuality = 'Good';
            }
            this.renderParticipants();
        }
    }

    simulateSpeakingEvents(participantId) {
        setInterval(() => {
            if (Math.random() < 0.4) { // 40% chance to speak
                this.updateParticipantSpeaking(participantId, true);
                setTimeout(() => {
                    this.updateParticipantSpeaking(participantId, false);
                }, 2000 + Math.random() * 4000);
            }
        }, 6000);
    }

    updateParticipantSpeaking(participantId, isSpeaking) {
        const participant = this.participants.get(participantId);
        if (participant) {
            participant.isSpeaking = isSpeaking;
            this.renderParticipants();
            this.updateStats();
        }
    }

    renderParticipants() {
        this.participantsGrid.innerHTML = '';
        
        this.participants.forEach((participant) => {
            const participantCard = this.createParticipantCard(participant);
            this.participantsGrid.appendChild(participantCard);
        });
    }

    createParticipantCard(participant) {
        const card = document.createElement('div');
        card.className = `participant-card ${participant.isSpeaking ? 'speaking' : ''}`;
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
                            onclick="advancedMultipartyChat.toggleMute()">
                        ${this.isMuted ? '🔊 Unmute' : '🔇 Mute'}
                    </button>
                ` : `
                    <button class="control-btn ${participant.isMuted ? 'unmute' : 'mute'}" 
                            onclick="advancedMultipartyChat.muteParticipant('${participant.id}')">
                        ${participant.isMuted ? '🔊 Unmute' : '🔇 Mute'}
                    </button>
                    <button class="control-btn kick" 
                            onclick="advancedMultipartyChat.kickParticipant('${participant.id}')">
                        🚫 Kick
                    </button>
                `}
            </div>
        `;
        
        return card;
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
            this.updateStats();
        }
        
        console.log(this.isMuted ? 'Muted' : 'Unmuted');
    }

    muteParticipant(participantId) {
        const participant = this.participants.get(participantId);
        if (participant) {
            participant.isMuted = !participant.isMuted;
            this.renderParticipants();
            this.updateStats();
            console.log(`${participant.name} ${participant.isMuted ? 'muted' : 'unmuted'}`);
        }
    }

    kickParticipant(participantId) {
        const participant = this.participants.get(participantId);
        if (participant && confirm(`Are you sure you want to kick ${participant.name}?`)) {
            this.participants.delete(participantId);
            this.renderParticipants();
            this.updateStats();
            console.log(`${participant.name} was kicked from the room`);
        }
    }

    muteAll() {
        this.participants.forEach((participant) => {
            if (!participant.isLocal) {
                participant.isMuted = true;
            }
        });
        this.renderParticipants();
        this.updateStats();
        console.log('All participants muted');
    }

    unmuteAll() {
        this.participants.forEach((participant) => {
            if (!participant.isLocal) {
                participant.isMuted = false;
            }
        });
        this.renderParticipants();
        this.updateStats();
        console.log('All participants unmuted');
    }

    showSettings() {
        alert('Settings panel would open here. Features could include:\n\n• Audio quality settings\n• Echo cancellation\n• Noise suppression\n• Audio input/output device selection\n• Connection preferences');
    }

    startStatsUpdates() {
        setInterval(() => {
            this.updateStats();
        }, 1000);
    }

    updateStats() {
        const participants = Array.from(this.participants.values());
        
        this.stats.participants = participants.length;
        this.stats.speaking = participants.filter(p => p.isSpeaking).length;
        this.stats.muted = participants.filter(p => p.isMuted).length;
        
        // Update UI
        this.participantCount.textContent = this.stats.participants;
        this.speakingCount.textContent = this.stats.speaking;
        this.mutedCount.textContent = this.stats.muted;
        
        // Update connection quality based on peer connections
        const connectedPeers = Array.from(this.peerConnections.values())
            .filter(pc => pc.connectionState === 'connected').length;
        
        if (connectedPeers === 0) {
            this.connectionQuality.textContent = 'No Connections';
        } else if (connectedPeers < this.participants.size - 1) {
            this.connectionQuality.textContent = 'Partial';
        } else {
            this.connectionQuality.textContent = 'Excellent';
        }
    }

    leaveRoom() {
        // Stop all tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }
        
        // Close all peer connections
        this.peerConnections.forEach(connection => {
            connection.close();
        });
        
        // Clear data
        this.peerConnections.clear();
        this.remoteStreams.clear();
        this.participants.clear();
        
        // Reset UI
        this.roomInterface.style.display = 'none';
        this.joinRoomForm.style.display = 'block';
        this.participantsGrid.innerHTML = '';
        
        // Reset form
        this.userNameInput.value = '';
        this.roomIdInput.value = '';
        
        // Reset stats
        this.initializeStats();
        this.updateStats();
        
        console.log('Left room');
    }
}

// Initialize the advanced multi-party voice chat
const advancedMultipartyChat = new AdvancedMultiPartyVoiceChat();
