class VoiceChatApp {
    constructor() {
        this.session = null;
        this.isConnected = false;
        this.isListening = false;
        this.isSpeaking = false;
        this.isDisconnecting = false;
        this.isDestroyed = false;
        this.updateTimeout = null; // For debouncing updates
        this.currentSessionId = null; // For chained mode session tracking
        
        this.initializeElements();
        this.attachEventListeners();
        this.updateUI();
    }

    initializeElements() {
        try {
            this.connectBtn = document.getElementById('connectBtn');
            this.disconnectBtn = document.getElementById('disconnectBtn');
            this.reconnectBtn = document.getElementById('reconnectBtn');
            this.statusIndicator = document.getElementById('statusIndicator');
            this.statusText = document.getElementById('statusText');
            this.voiceWave = document.getElementById('voiceWave');
            this.voiceStatus = document.getElementById('voiceStatus');
            this.customPrompt = document.getElementById('customPrompt');
            this.apiModeSelector = document.getElementById('apiModeSelector');
            this.voiceSelector = document.getElementById('voiceSelector');
            this.transcriptSection = document.getElementById('transcriptSection');
            this.transcriptContainer = document.getElementById('transcriptContainer');
            this.recordingControls = document.getElementById('recordingControls');
            this.talkBtn = document.getElementById('talkBtn');
            
            // Check if all required elements are found
            const requiredElements = [
                'connectBtn', 'disconnectBtn', 'reconnectBtn', 'statusIndicator', 'statusText',
                'voiceWave', 'voiceStatus', 'customPrompt', 'apiModeSelector', 'voiceSelector'
            ];
            
            for (const elementName of requiredElements) {
                if (!this[elementName]) {
                    console.error(`Required element not found: ${elementName}`);
                }
            }
        } catch (error) {
            console.error('Error initializing elements:', error);
        }
    }

    attachEventListeners() {
        try {
            this.connectBtn.addEventListener('click', () => this.connect());
            this.disconnectBtn.addEventListener('click', () => this.disconnect());
            this.reconnectBtn.addEventListener('click', () => this.reconnectWithNewVoice());
            
            // Add real-time listener for custom prompt changes with debouncing
            if (this.customPrompt) {
                this.customPrompt.addEventListener('input', () => this.debouncedUpdateAgentInstructions());
            } else {
                console.error('Custom prompt element not found');
            }
            
        // Add listener for API mode selector changes
        if (this.apiModeSelector) {
            this.apiModeSelector.addEventListener('change', () => {
                this.updateApiMode();
            });
        } else {
            console.error('API mode selector element not found');
            }
            
        // Add listener for voice selector changes
        if (this.voiceSelector) {
            this.voiceSelector.addEventListener('change', () => {
                this.updateAgentVoice();
                this.checkVoiceCompatibility();
            });
        } else {
            console.error('Voice selector element not found');
        }
        } catch (error) {
            console.error('Error attaching event listeners:', error);
        }
    }

    updateApiMode() {
        const selectedMode = this.apiModeSelector.value;
        console.log('API mode changed to:', selectedMode);
        
        // Update voice options based on API mode
        this.updateVoiceOptions(selectedMode);
        
        if (selectedMode === 'chained') {
            this.showChainedModeInfo();
        } else {
            this.showRealtimeModeInfo();
        }
    }

    updateVoiceOptions(apiMode) {
        const voiceSelector = this.voiceSelector;
        const currentVoice = voiceSelector.value;
        
        // Clear existing options
        voiceSelector.innerHTML = '';
        
        if (apiMode === 'realtime') {
            // Real-time API voices
            const realtimeVoices = [
                { value: 'cedar', text: 'Cedar - New Realtime API voice (recommended)' },
                { value: 'marin', text: 'Marin - New Realtime API voice (recommended)' },
                { value: 'alloy', text: 'Alloy - Neutral, balanced (legacy)' },
                { value: 'echo', text: 'Echo - Warm, friendly (legacy)' },
                { value: 'fable', text: 'Fable - Expressive, storytelling (legacy)' },
                { value: 'onyx', text: 'Onyx - Deep, authoritative (legacy)' },
                { value: 'nova', text: 'Nova - Bright, energetic (legacy)' },
                { value: 'shimmer', text: 'Shimmer - Soft, gentle (legacy)' }
            ];
            
            realtimeVoices.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.value;
                option.textContent = voice.text;
                voiceSelector.appendChild(option);
            });
            
        } else if (apiMode === 'chained') {
            // Chained API voices (TTS API)
            const chainedVoices = [
                { value: 'alloy', text: 'Alloy - Neutral, balanced' },
                { value: 'echo', text: 'Echo - Warm, friendly' },
                { value: 'fable', text: 'Fable - Expressive, storytelling' },
                { value: 'onyx', text: 'Onyx - Deep, authoritative' },
                { value: 'nova', text: 'Nova - Bright, energetic' },
                { value: 'shimmer', text: 'Shimmer - Soft, gentle' }
            ];
            
            chainedVoices.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.value;
                option.textContent = voice.text;
                voiceSelector.appendChild(option);
            });
        }
        
        // Try to maintain the current selection if it's valid for the new mode
        if (voiceSelector.querySelector(`option[value="${currentVoice}"]`)) {
            voiceSelector.value = currentVoice;
        } else {
            // Default to the first option
            voiceSelector.selectedIndex = 0;
        }
        
        console.log(`Updated voice options for ${apiMode} mode`);
    }

    showChainedModeInfo() {
        const info = document.createElement('div');
        info.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #17a2b8;
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                font-size: 14px;
                z-index: 1000;
                max-width: 300px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            ">
                <div style="font-weight: bold; margin-bottom: 4px;">🔗 Chained Mode</div>
                <div>Speech → Text → AI → Text → Speech</div>
                <div style="font-size: 12px; margin-top: 4px; opacity: 0.8;">
                    Higher latency but more reliable
                </div>
            </div>
        `;
        
        document.body.appendChild(info);
        
        setTimeout(() => info.style.opacity = '1', 10);
        setTimeout(() => {
            info.style.opacity = '0';
            setTimeout(() => document.body.removeChild(info), 300);
        }, 4000);
    }

    showRealtimeModeInfo() {
        const info = document.createElement('div');
        info.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #28a745;
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                font-size: 14px;
                z-index: 1000;
                max-width: 300px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            ">
                <div style="font-weight: bold; margin-bottom: 4px;">⚡ Real-time Mode</div>
                <div>WebRTC streaming with low latency</div>
                <div style="font-size: 12px; margin-top: 4px; opacity: 0.8;">
                    Best for interactive conversations
                </div>
            </div>
        `;
        
        document.body.appendChild(info);
        
        setTimeout(() => info.style.opacity = '1', 10);
        setTimeout(() => {
            info.style.opacity = '0';
            setTimeout(() => document.body.removeChild(info), 300);
        }, 4000);
    }

    async connect() {
        try {
            const selectedMode = this.apiModeSelector.value;
            console.log('Connecting with mode:', selectedMode);
            
            this.updateStatus('connecting', `Connecting to OpenAI (${selectedMode} mode)...`);
            this.connectBtn.disabled = true;

            if (selectedMode === 'realtime') {
                await this.connectRealtime();
            } else if (selectedMode === 'chained') {
                await this.connectChained();
            } else {
                throw new Error('Invalid API mode selected');
            }

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

    async connectRealtime() {
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

            // Get custom prompt and voice from UI
            const customPrompt = this.customPrompt.value.trim();
            const selectedVoice = this.voiceSelector.value;
            
            // Create the agent with custom or default instructions
            const defaultInstructions = 'You are a helpful AI assistant. Respond naturally and conversationally. Keep responses concise and engaging.';
            const instructions = customPrompt ? customPrompt : defaultInstructions;
            
            console.log('Creating agent with voice:', selectedVoice);
            const agent = new RealtimeAgentClass({
                name: 'Assistant',
                instructions: instructions,
                voice: selectedVoice,
                interruptible: true
            });
            
            console.log('Agent created successfully:', agent);
            console.log('Agent voice property:', agent.voice);
            console.log('Voice validation:', agent.voice === selectedVoice ? 'PASS' : 'FAIL');
            
            // Check if this is a legacy voice that might not work
            const legacyVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
            const newVoices = ['cedar', 'marin'];
            
            if (legacyVoices.includes(selectedVoice)) {
                console.warn('⚠️ Using legacy voice - may not work properly with current Realtime API');
                console.warn('Consider using Cedar or Marin for better compatibility');
            } else if (newVoices.includes(selectedVoice)) {
                console.log('✅ Using new Realtime API voice - should work optimally');
            }

            // Store agent reference for real-time updates
            this.agent = agent;

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
    }

    async connectChained() {
        // Get custom prompt and voice from UI
        const customPrompt = this.customPrompt.value.trim();
        const selectedVoice = this.voiceSelector.value;
        
        // Create the agent with custom or default instructions
        const defaultInstructions = 'You are a helpful AI assistant. Respond naturally and conversationally. Keep responses concise and engaging.';
        const instructions = customPrompt ? customPrompt : defaultInstructions;
        
        console.log('Creating chained voice pipeline with voice:', selectedVoice);
        
        // Start a new session
        try {
            const sessionResponse = await fetch('/api/session/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    voice: selectedVoice,
                    instructions: instructions
                })
            });
            
            if (!sessionResponse.ok) {
                throw new Error('Failed to start session');
            }
            
            const sessionData = await sessionResponse.json();
            this.currentSessionId = sessionData.sessionId;
            console.log('Started session:', this.currentSessionId);

        } catch (error) {
            console.error('Failed to start session:', error);
            throw new Error('Failed to start session: ' + error.message);
        }
        
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('Microphone access granted');
        
        // Create a simple chained voice interface
        this.chainedInterface = {
            stream: stream,
            instructions: instructions,
            voice: selectedVoice,
            isRecording: false,
            audioContext: null,
            mediaRecorder: null
        };
        
        // Set up audio context for recording
        this.chainedInterface.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create media recorder for audio capture with webm format
        const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 
                         MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : 
                         MediaRecorder.isTypeSupported('audio/wav') ? 'audio/wav' : '';
        
        console.log('Using MIME type for recording:', mimeType);
        this.chainedInterface.mediaRecorder = new MediaRecorder(stream, { 
            mimeType,
            audioBitsPerSecond: 128000 // Limit bitrate to reduce file size
        });
        
        // Set up recording event handlers - no chunking, just get the complete recording
        this.chainedInterface.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                // Process the complete audio data directly
                this.handleChainedAudioData(event.data);
            }
        };
        
        this.isConnected = true;
        this.updateStatus('connected', 'Connected (Chained mode) - Click to start recording!');
        this.updateVoiceStatus('Click the microphone to start recording');
        this.updateButtons();
        
        // Add click-to-record functionality
        this.setupChainedRecording();
    }

    setupChainedRecording() {
        // Show recording controls
        this.recordingControls.style.display = 'flex';
        
        // Add hold-to-talk functionality
        this.talkBtn.addEventListener('mousedown', () => {
            if (!this.chainedInterface.isRecording) {
                this.startChainedRecording();
            }
        });
        
        this.talkBtn.addEventListener('mouseup', () => {
            if (this.chainedInterface.isRecording) {
                this.stopChainedRecording();
            }
        });
        
        this.talkBtn.addEventListener('mouseleave', () => {
            if (this.chainedInterface.isRecording) {
                this.stopChainedRecording();
            }
        });
        
        // Touch events for mobile
        this.talkBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!this.chainedInterface.isRecording) {
                this.startChainedRecording();
            }
        });
        
        this.talkBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (this.chainedInterface.isRecording) {
                this.stopChainedRecording();
            }
        });
    }

    startChainedRecording() {
        console.log('Starting chained recording...');
        this.chainedInterface.isRecording = true;
        // Start recording without time slices - we'll get the complete recording when stopped
        this.chainedInterface.mediaRecorder.start();
        this.updateVoiceStatus('Recording... Speak now');
        this.updateVoiceIndicator();
        
        // Update button state
        this.talkBtn.classList.add('talking');
        
        // Auto-stop after 30 seconds to prevent very long recordings
        this.chainedInterface.recordingTimeout = setTimeout(() => {
            if (this.chainedInterface.isRecording) {
                console.log('Auto-stopping recording after 30 seconds');
                this.stopChainedRecording();
            }
        }, 30000);
    }

    stopChainedRecording() {
        console.log('Stopping chained recording...');
        this.chainedInterface.isRecording = false;
        this.chainedInterface.mediaRecorder.stop();
        this.updateVoiceStatus('Processing your message...');
        this.updateVoiceIndicator();
        
        // Update button state
        this.talkBtn.classList.remove('talking');
        
        // Clear the auto-stop timeout
        if (this.chainedInterface.recordingTimeout) {
            clearTimeout(this.chainedInterface.recordingTimeout);
            this.chainedInterface.recordingTimeout = null;
        }
    }

    async handleChainedAudioData(audioData) {
        console.log('Processing chained audio data...');
        console.log('Audio data type:', audioData.type);
        console.log('Audio data size:', audioData.size);
        
        // Check audio size to prevent memory issues (should be much smaller now with bitrate limit)
        const maxSize = 2 * 1024 * 1024; // 2MB limit (should be plenty for a few seconds)
        if (audioData.size > maxSize) {
            console.warn('Audio file too large:', audioData.size, 'bytes. Max allowed:', maxSize);
            this.updateVoiceStatus('Audio file too large. Please record shorter audio.');
            return;
        }
        
        try {
            // Convert audio data to base64 for API call (using FileReader to avoid stack overflow)
            const arrayBuffer = await audioData.arrayBuffer();
            
            // Use FileReader for large files to avoid stack overflow
            const base64Audio = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = reader.result;
                    // Remove data URL prefix to get just the base64
                    const base64 = result.split(',')[1];
                    resolve(base64);
                };
                reader.onerror = reject;
                reader.readAsDataURL(new Blob([arrayBuffer], { type: audioData.type }));
            });
            
            console.log('Audio converted to base64, length:', base64Audio.length);
            console.log('Sending to backend with instructions:', this.chainedInterface.instructions);
            console.log('Voice:', this.chainedInterface.voice);
            
            // Send to backend for chained processing
            const response = await fetch('/api/chained/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    audio: base64Audio,
                    instructions: this.chainedInterface.instructions,
                    voice: this.chainedInterface.voice,
                    sessionId: this.currentSessionId
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to process audio');
            }
            
            const result = await response.json();
            console.log('Chained processing result:', result);
            
            // Display transcript
            this.addTranscriptMessage('user', result.transcription);
            this.addTranscriptMessage('assistant', result.aiResponse);
            
            // Play the response audio
            await this.playChainedResponse(result.audio);
            
        } catch (error) {
            console.error('Error processing chained audio:', error);
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            
            // Show more specific error message
            let errorMessage = 'Error processing audio';
            if (error.message.includes('Failed to process audio')) {
                errorMessage = 'Server error - check console for details';
            } else if (error.message.includes('Invalid base64')) {
                errorMessage = 'Audio format error';
            } else if (error.message.includes('Network')) {
                errorMessage = 'Network error - check connection';
            }
            
            this.updateVoiceStatus(errorMessage);
            this.showErrorNotification(errorMessage, error.message);
        }
    }

    async playChainedResponse(audioData) {
        try {
            // Convert base64 audio to blob
            const binaryString = atob(audioData);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: 'audio/mpeg' });
            
            // Create audio element and play
            const audio = new Audio();
            audio.src = URL.createObjectURL(blob);
            
            this.updateVoiceStatus('Playing AI response...');
            this.isSpeaking = true;
            this.updateVoiceIndicator();
            
            await new Promise((resolve, reject) => {
                audio.onended = () => {
                    this.isSpeaking = false;
                    this.updateVoiceStatus('Click to record again');
                    this.updateVoiceIndicator();
                    resolve();
                };
                audio.onerror = reject;
                audio.play();
            });
            
        } catch (error) {
            console.error('Error playing chained response:', error);
            this.updateVoiceStatus('Error playing response');
        }
    }

    debouncedUpdateAgentInstructions() {
        // Clear existing timeout
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
        
        // Set new timeout for debounced update
        this.updateTimeout = setTimeout(() => {
            this.updateAgentInstructions();
        }, 500); // Wait 500ms after user stops typing
    }

    updateAgentInstructions() {
        // Only update if we have an active session and agent
        if (!this.session || !this.isConnected || !this.agent) {
            return;
        }

        try {
            // Get the current custom prompt
            const customPrompt = this.customPrompt.value.trim();
            const defaultInstructions = 'You are a helpful AI assistant. Respond naturally and conversationally. Keep responses concise and engaging.';
            const newInstructions = customPrompt ? customPrompt : defaultInstructions;

            // Try multiple approaches to update the agent instructions
            let updated = false;

            // Method 1: Try to update instructions property directly
            if (this.agent.instructions !== undefined) {
                this.agent.instructions = newInstructions;
                updated = true;
                console.log('Agent instructions updated via direct property access');
            }

            // Method 2: Try to call an update method if it exists
            if (typeof this.agent.updateInstructions === 'function') {
                this.agent.updateInstructions(newInstructions);
                updated = true;
                console.log('Agent instructions updated via updateInstructions method');
            }

            // Method 3: Try to access through session
            if (!updated && this.session.agent && this.session.agent.instructions !== undefined) {
                this.session.agent.instructions = newInstructions;
                updated = true;
                console.log('Agent instructions updated via session.agent');
            }

            // Method 4: Try to access through session's internal structure
            if (!updated && this.session._agent && this.session._agent.instructions !== undefined) {
                this.session._agent.instructions = newInstructions;
                updated = true;
                console.log('Agent instructions updated via session._agent');
            }

            if (updated) {
                // Show visual feedback that instructions were updated
                this.showInstructionsUpdateFeedback();
            } else {
                console.log('Could not find a way to update agent instructions');
            }
            
        } catch (error) {
            console.error('Error updating agent instructions:', error);
        }
    }

    async reconnectWithNewVoice() {
        if (!this.isConnected) {
            console.log('Not connected, cannot reconnect');
            return;
        }

        try {
            console.log('Reconnecting with new voice...');
            this.updateStatus('reconnecting', 'Reconnecting with new voice...');
            
            // Disconnect first
            await this.disconnect();
            
            // Wait a moment for cleanup
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Connect with new voice
            await this.connect();
            
            console.log('Reconnected successfully with new voice');
        } catch (error) {
            console.error('Error reconnecting:', error);
            this.updateStatus('error', 'Reconnection failed');
        }
    }

    updateAgentVoice() {
        const selectedVoice = this.voiceSelector.value;
        console.log('=== VOICE CHANGE REQUEST ===');
        console.log('Selected voice:', selectedVoice);
        
        if (!this.session || !this.isConnected || !this.agent) {
            console.log('Voice change will apply on next connection');
            this.showVoiceUpdateFeedback(selectedVoice + ' (will apply on next connection)');
            return;
        }

        // The Realtime API doesn't support real-time voice changes
        // Voice changes require reconnection to take effect
        console.log('=== VOICE CHANGE LIMITATION ===');
        console.log('The Realtime API does not support real-time voice changes');
        console.log('Voice changes require disconnecting and reconnecting');
        console.log('Current voice will remain:', this.agent.voice);
        console.log('New voice will apply on next connection:', selectedVoice);
        
        // Show user-friendly message
        this.showVoiceChangeRequiresReconnection(selectedVoice);
        
        // Enable reconnect button to make it easy to apply voice change
        this.reconnectBtn.disabled = false;
    }

    showVoiceChangeRequiresReconnection(voice) {
        // Create a more informative feedback message
        const feedback = document.createElement('div');
        feedback.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #ffc107;
                color: #000;
                padding: 12px 16px;
                border-radius: 8px;
                font-size: 14px;
                z-index: 1000;
                max-width: 300px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            ">
                <div style="font-weight: bold; margin-bottom: 4px;">🎤 Voice Change</div>
                <div>Voice changed to: <strong>${voice}</strong></div>
                <div style="font-size: 12px; margin-top: 4px; opacity: 0.8;">
                    Click "Reconnect with New Voice" to apply
                </div>
            </div>
        `;
        
        document.body.appendChild(feedback);
        
        // Fade in
        setTimeout(() => feedback.style.opacity = '1', 10);
        
        // Fade out and remove
        setTimeout(() => {
            feedback.style.opacity = '0';
            setTimeout(() => document.body.removeChild(feedback), 300);
        }, 4000);
    }

    checkVoiceCompatibility() {
        const selectedVoice = this.voiceSelector.value;
        const legacyVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
        const newVoices = ['cedar', 'marin'];
        
        if (legacyVoices.includes(selectedVoice)) {
            this.showLegacyVoiceWarning(selectedVoice);
        } else if (newVoices.includes(selectedVoice)) {
            this.showNewVoiceConfirmation(selectedVoice);
        }
    }

    showLegacyVoiceWarning(voice) {
        const warning = document.createElement('div');
        warning.innerHTML = `
            <div style="
                position: fixed;
                top: 80px;
                right: 20px;
                background: #ffc107;
                color: #000;
                padding: 12px 16px;
                border-radius: 8px;
                font-size: 14px;
                z-index: 1000;
                max-width: 300px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            ">
                <div style="font-weight: bold; margin-bottom: 4px;">⚠️ Legacy Voice</div>
                <div>Using <strong>${voice}</strong> (legacy voice)</div>
                <div style="font-size: 12px; margin-top: 4px; opacity: 0.8;">
                    May not work properly. Consider using Cedar or Marin.
                </div>
            </div>
        `;
        
        document.body.appendChild(warning);
        
        setTimeout(() => warning.style.opacity = '1', 10);
        setTimeout(() => {
            warning.style.opacity = '0';
            setTimeout(() => document.body.removeChild(warning), 300);
        }, 5000);
    }

    showNewVoiceConfirmation(voice) {
        const confirmation = document.createElement('div');
        confirmation.innerHTML = `
            <div style="
                position: fixed;
                top: 80px;
                right: 20px;
                background: #28a745;
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                font-size: 14px;
                z-index: 1000;
                max-width: 300px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            ">
                <div style="font-weight: bold; margin-bottom: 4px;">✅ Recommended Voice</div>
                <div>Using <strong>${voice}</strong> (new Realtime API voice)</div>
                <div style="font-size: 12px; margin-top: 4px; opacity: 0.8;">
                    Optimal compatibility and quality
                </div>
            </div>
        `;
        
        document.body.appendChild(confirmation);
        
        setTimeout(() => confirmation.style.opacity = '1', 10);
        setTimeout(() => {
            confirmation.style.opacity = '0';
            setTimeout(() => document.body.removeChild(confirmation), 300);
        }, 3000);
    }

    showInstructionsUpdateFeedback() {
        // Create a temporary visual indicator that instructions were updated
        const feedback = document.createElement('div');
        feedback.textContent = '✓ Instructions updated';
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        document.body.appendChild(feedback);
        
        // Fade in
        setTimeout(() => feedback.style.opacity = '1', 10);
        
        // Fade out and remove
        setTimeout(() => {
            feedback.style.opacity = '0';
            setTimeout(() => document.body.removeChild(feedback), 300);
        }, 2000);
    }

    showVoiceUpdateFeedback(voice) {
        // Create a temporary visual indicator that voice was updated
        const feedback = document.createElement('div');
        feedback.textContent = `✓ Voice changed to ${voice}`;
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #007bff;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        document.body.appendChild(feedback);
        
        // Fade in
        setTimeout(() => feedback.style.opacity = '1', 10);
        
        // Fade out and remove
        setTimeout(() => {
            feedback.style.opacity = '0';
            setTimeout(() => document.body.removeChild(feedback), 300);
        }, 2000);
    }

    showErrorNotification(title, details) {
        const error = document.createElement('div');
        error.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #dc3545;
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                font-size: 14px;
                z-index: 1000;
                max-width: 300px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            ">
                <div style="font-weight: bold; margin-bottom: 4px;">❌ ${title}</div>
                <div style="font-size: 12px; opacity: 0.8;">${details}</div>
                <div style="font-size: 11px; margin-top: 4px; opacity: 0.7;">
                    Check browser console for more details
                </div>
            </div>
        `;
        
        document.body.appendChild(error);
        
        // Fade in
        setTimeout(() => error.style.opacity = '1', 10);
        
        // Fade out and remove
        setTimeout(() => {
            error.style.opacity = '0';
            setTimeout(() => document.body.removeChild(error), 300);
        }, 8000); // Show error longer
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
        
        // Handle chained mode cleanup
        if (this.chainedInterface) {
            console.log('Cleaning up chained interface...');
            if (this.chainedInterface.stream) {
                this.chainedInterface.stream.getTracks().forEach(track => track.stop());
            }
            if (this.chainedInterface.audioContext) {
                this.chainedInterface.audioContext.close();
            }
            this.chainedInterface = null;
        }
        
        // Hide recording controls
        if (this.recordingControls) {
            this.recordingControls.style.display = 'none';
        }
        
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
        
        // End session if we have an active chained session
        if (this.currentSessionId) {
            try {
                console.log('Ending chained session:', this.currentSessionId);
                const response = await fetch('/api/session/end', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        sessionId: this.currentSessionId
                    })
                });
                
                if (response.ok) {
                    console.log('Session ended successfully');
                } else {
                    console.warn('Failed to end session:', response.status);
                }
            } catch (error) {
                console.warn('Error ending session:', error);
            }
            this.currentSessionId = null;
        }
        
        // Clean up state
        this.isConnected = false;
        this.isListening = false;
        this.isSpeaking = false;
        this.isDisconnecting = false;
        
        // Clear timeout and references
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
            this.updateTimeout = null;
        }
        this.session = null;
        this.agent = null;
        
        // Clear transcript
        this.clearTranscript();
        
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
        
        // Clear session and agent references
        this.session = null;
        this.agent = null;
        
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
        this.reconnectBtn.disabled = !this.isConnected;
    }

    updateUI() {
        this.updateButtons();
        this.updateVoiceIndicator();
        
        // Initialize voice options based on default API mode
        const defaultMode = this.apiModeSelector.value;
        this.updateVoiceOptions(defaultMode);
    }

    addTranscriptMessage(speaker, text) {
        // Remove placeholder if it exists
        const placeholder = this.transcriptContainer?.querySelector('.transcript-placeholder');
        if (placeholder) {
            placeholder.remove();
        }
        
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `transcript-message ${speaker}`;
        
        const timestamp = new Date().toLocaleTimeString();
        const speakerName = speaker === 'user' ? 'You' : 'AI Assistant';
        
        messageDiv.innerHTML = `
            <div class="speaker">${speakerName}</div>
            <div class="text">${text}</div>
            <div class="timestamp">${timestamp}</div>
        `;
        
        // Add to transcript container
        if (this.transcriptContainer) {
            this.transcriptContainer.appendChild(messageDiv);
            
            // Scroll to bottom
            this.transcriptContainer.scrollTop = this.transcriptContainer.scrollHeight;
        }
    }

    clearTranscript() {
        if (this.transcriptContainer) {
            this.transcriptContainer.innerHTML = `
                <div class="transcript-placeholder">
                    <p>Start a conversation to see the transcript here</p>
                </div>
            `;
        }
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting app initialization...');
});

// Global function to initialize the app when SDK is ready
window.initializeApp = () => {
    try {
        console.log('SDK ready, initializing app');
        window.voiceChatApp = new VoiceChatApp();
        console.log('VoiceChatApp initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
    }
};

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
