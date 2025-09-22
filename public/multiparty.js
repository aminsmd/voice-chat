class MultiPartyVoiceChat {
    constructor() {
        this.localStream = null;
        this.peerConnections = new Map();
        this.remoteStreams = new Map();
        this.participants = new Map();
        this.isMuted = false;
        this.roomId = null;
        this.userName = null;
        this.socket = null;
        
        this.initializeElements();
        this.attachEventListeners();
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
        this.participantsGrid = document.getElementById('participantsGrid');
        this.currentRoomId = document.getElementById('currentRoomId');
    }

    attachEventListeners() {
        this.joinRoomBtn.addEventListener('click', () => this.joinRoom());
        this.createRoomBtn.addEventListener('click', () => this.createRoom());
        this.leaveRoomBtn.addEventListener('click', () => this.leaveRoom());
        this.muteAllBtn.addEventListener('click', () => this.muteAll());
        this.unmuteAllBtn.addEventListener('click', () => this.unmuteAll());
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
            // Initialize WebSocket connection (simplified - in production use proper signaling server)
            this.initializeSignaling();
            
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

    initializeSignaling() {
        // Simplified signaling - in production, use a proper WebSocket server
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
            { name: 'Charlie', isLocal: false }
        ];

        demoParticipants.forEach((participant, index) => {
            setTimeout(() => {
                this.addParticipant(participant.name, false, false);
            }, index * 1000);
        });
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
        
        // Simulate speaking events for demo
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
        
        this.participants.forEach((participant) => {
            const participantCard = this.createParticipantCard(participant);
            this.participantsGrid.appendChild(participantCard);
        });
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
                            onclick="multipartyChat.toggleMute()">
                        ${this.isMuted ? '🔊 Unmute' : '🔇 Mute'}
                    </button>
                ` : `
                    <button class="control-btn mute" onclick="multipartyChat.muteParticipant('${participant.id}')">
                        🔇 Mute
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

    muteAll() {
        this.participants.forEach((participant) => {
            if (!participant.isLocal) {
                participant.isMuted = true;
            }
        });
        this.renderParticipants();
        console.log('All participants muted');
    }

    unmuteAll() {
        this.participants.forEach((participant) => {
            if (!participant.isLocal) {
                participant.isMuted = false;
            }
        });
        this.renderParticipants();
        console.log('All participants unmuted');
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
        
        console.log('Left room');
    }
}

// Initialize the multi-party voice chat
const multipartyChat = new MultiPartyVoiceChat();
