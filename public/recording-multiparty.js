class RecordingMultiPartyVoiceChat {
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
        
        // Recording properties
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;
        this.recordingStartTime = null;
        this.recordingTimer = null;
        this.recordings = [];
        
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
        this.loadRecordings();
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
        
        // Recording elements
        this.recordingIndicator = document.getElementById('recordingIndicator');
        this.recordingStatus = document.getElementById('recordingStatus');
        this.recordingTime = document.getElementById('recordingTime');
        this.startRecordingBtn = document.getElementById('startRecordingBtn');
        this.stopRecordingBtn = document.getElementById('stopRecordingBtn');
        this.downloadRecordingBtn = document.getElementById('downloadRecordingBtn');
        this.clearRecordingsBtn = document.getElementById('clearRecordingsBtn');
        this.recordingsList = document.getElementById('recordingsList');
        
        // Stats elements
        this.participantCount = document.getElementById('participantCount');
        this.speakingCount = document.getElementById('speakingCount');
        this.mutedCount = document.getElementById('mutedCount');
        this.recordingCount = document.getElementById('recordingCount');
    }

    attachEventListeners() {
        this.joinRoomBtn.addEventListener('click', () => this.joinRoom());
        this.createRoomBtn.addEventListener('click', () => this.createRoom());
        this.leaveRoomBtn.addEventListener('click', () => this.leaveRoom());
        this.muteAllBtn.addEventListener('click', () => this.muteAll());
        this.unmuteAllBtn.addEventListener('click', () => this.unmuteAll());
        this.settingsBtn.addEventListener('click', () => this.showSettings());
        
        // Recording event listeners
        this.startRecordingBtn.addEventListener('click', () => this.startRecording());
        this.stopRecordingBtn.addEventListener('click', () => this.stopRecording());
        this.downloadRecordingBtn.addEventListener('click', () => this.downloadCurrentRecording());
        this.clearRecordingsBtn.addEventListener('click', () => this.clearAllRecordings());
    }

    initializeStats() {
        this.stats = {
            participants: 0,
            speaking: 0,
            muted: 0,
            recordings: 0
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
                            onclick="recordingMultipartyChat.toggleMute()">
                        ${this.isMuted ? '🔊 Unmute' : '🔇 Mute'}
                    </button>
                ` : `
                    <button class="control-btn ${participant.isMuted ? 'unmute' : 'mute'}" 
                            onclick="recordingMultipartyChat.muteParticipant('${participant.id}')">
                        ${participant.isMuted ? '🔊 Unmute' : '🔇 Mute'}
                    </button>
                    <button class="control-btn kick" 
                            onclick="recordingMultipartyChat.kickParticipant('${participant.id}')">
                        🚫 Kick
                    </button>
                `}
            </div>
        `;
        
        return card;
    }

    // Recording functionality
    async startRecording() {
        try {
            if (!this.localStream) {
                alert('No audio stream available. Please check your microphone.');
                return;
            }

            // Create a new MediaRecorder
            this.mediaRecorder = new MediaRecorder(this.localStream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            this.recordedChunks = [];
            this.isRecording = true;
            this.recordingStartTime = Date.now();

            // Handle data available
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            // Handle recording stop
            this.mediaRecorder.onstop = () => {
                const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
                this.saveRecording(blob);
            };

            // Start recording
            this.mediaRecorder.start(1000); // Collect data every second

            // Update UI
            this.updateRecordingUI();
            this.startRecordingTimer();

            console.log('Recording started');

        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Failed to start recording. Please check your microphone permissions.');
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.stopRecordingTimer();
            this.updateRecordingUI();
            console.log('Recording stopped');
        }
    }

    startRecordingTimer() {
        this.recordingTimer = setInterval(() => {
            if (this.isRecording && this.recordingStartTime) {
                const elapsed = Date.now() - this.recordingStartTime;
                const minutes = Math.floor(elapsed / 60000);
                const seconds = Math.floor((elapsed % 60000) / 1000);
                this.recordingTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }

    stopRecordingTimer() {
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
    }

    updateRecordingUI() {
        if (this.isRecording) {
            this.recordingIndicator.className = 'recording-indicator recording';
            this.recordingStatus.textContent = 'Recording...';
            this.recordingTime.classList.remove('hidden');
            this.startRecordingBtn.classList.add('hidden');
            this.stopRecordingBtn.classList.remove('hidden');
            this.downloadRecordingBtn.classList.add('hidden');
        } else {
            this.recordingIndicator.className = 'recording-indicator stopped';
            this.recordingStatus.textContent = 'Ready to record';
            this.recordingTime.classList.add('hidden');
            this.startRecordingBtn.classList.remove('hidden');
            this.stopRecordingBtn.classList.add('hidden');
            this.downloadRecordingBtn.classList.remove('hidden');
        }
    }

    saveRecording(blob) {
        const recording = {
            id: Date.now(),
            name: `Recording_${new Date().toLocaleString()}`,
            blob: blob,
            size: blob.size,
            duration: this.recordingTime.textContent,
            timestamp: new Date().toISOString()
        };

        this.recordings.push(recording);
        this.saveRecordingsToStorage();
        this.renderRecordings();
        this.updateStats();
        
        console.log('Recording saved:', recording.name);
    }

    downloadCurrentRecording() {
        if (this.recordedChunks.length > 0) {
            const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
            this.downloadBlob(blob, `recording_${Date.now()}.webm`);
        }
    }

    downloadRecording(recordingId) {
        const recording = this.recordings.find(r => r.id === recordingId);
        if (recording) {
            this.downloadBlob(recording.blob, `${recording.name}.webm`);
        }
    }

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    renderRecordings() {
        if (this.recordings.length === 0) {
            this.recordingsList.innerHTML = '<p>No recordings yet. Start recording to see them here!</p>';
            return;
        }

        this.recordingsList.innerHTML = '';
        
        this.recordings.forEach(recording => {
            const recordingItem = document.createElement('div');
            recordingItem.className = 'recording-item';
            
            recordingItem.innerHTML = `
                <div class="recording-info">
                    <div class="recording-name">${recording.name}</div>
                    <div class="recording-details">
                        Duration: ${recording.duration} | 
                        Size: ${this.formatFileSize(recording.size)} | 
                        ${new Date(recording.timestamp).toLocaleString()}
                    </div>
                </div>
                <div class="recording-actions">
                    <button class="btn-small btn-play" onclick="recordingMultipartyChat.playRecording(${recording.id})">
                        ▶️ Play
                    </button>
                    <button class="btn-small btn-download" onclick="recordingMultipartyChat.downloadRecording(${recording.id})">
                        ⬇️ Download
                    </button>
                    <button class="btn-small btn-delete" onclick="recordingMultipartyChat.deleteRecording(${recording.id})">
                        🗑️ Delete
                    </button>
                </div>
            `;
            
            this.recordingsList.appendChild(recordingItem);
        });
    }

    playRecording(recordingId) {
        const recording = this.recordings.find(r => r.id === recordingId);
        if (recording) {
            const url = URL.createObjectURL(recording.blob);
            const audio = new Audio(url);
            audio.play();
            
            // Clean up URL after playing
            audio.onended = () => {
                URL.revokeObjectURL(url);
            };
        }
    }

    deleteRecording(recordingId) {
        if (confirm('Are you sure you want to delete this recording?')) {
            this.recordings = this.recordings.filter(r => r.id !== recordingId);
            this.saveRecordingsToStorage();
            this.renderRecordings();
            this.updateStats();
        }
    }

    clearAllRecordings() {
        if (confirm('Are you sure you want to delete all recordings?')) {
            this.recordings = [];
            this.saveRecordingsToStorage();
            this.renderRecordings();
            this.updateStats();
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    saveRecordingsToStorage() {
        // Save metadata only (not the actual blob data)
        const recordingsData = this.recordings.map(r => ({
            id: r.id,
            name: r.name,
            size: r.size,
            duration: r.duration,
            timestamp: r.timestamp
        }));
        localStorage.setItem('voiceChatRecordings', JSON.stringify(recordingsData));
    }

    loadRecordings() {
        const saved = localStorage.getItem('voiceChatRecordings');
        if (saved) {
            try {
                const recordingsData = JSON.parse(saved);
                // Note: We can't restore the actual blob data from localStorage
                // This is just for demonstration - in a real app, you'd store files on a server
                this.recordings = recordingsData.map(r => ({
                    ...r,
                    blob: null // Placeholder - actual blob data is lost
                }));
                this.renderRecordings();
            } catch (error) {
                console.error('Error loading recordings:', error);
            }
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

    showSettings() {
        alert('Settings panel would open here. Features could include:\n\n• Audio quality settings\n• Echo cancellation\n• Noise suppression\n• Audio input/output device selection\n• Recording quality settings\n• Connection preferences');
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
        this.stats.recordings = this.recordings.length;
        
        // Update UI
        this.participantCount.textContent = this.stats.participants;
        this.speakingCount.textContent = this.stats.speaking;
        this.mutedCount.textContent = this.stats.muted;
        this.recordingCount.textContent = this.stats.recordings;
    }

    leaveRoom() {
        // Stop recording if active
        if (this.isRecording) {
            this.stopRecording();
        }
        
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

// Initialize the recording multi-party voice chat
const recordingMultipartyChat = new RecordingMultiPartyVoiceChat();



