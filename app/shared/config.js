/**
 * Shared configuration for the Voice Chat Application
 */

module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    host: '0.0.0.0'
  },

  // Paths
  paths: {
    frontend: {
      public: 'app/frontend/public',
      css: 'app/frontend/src/css',
      js: 'app/frontend/src/js'
    },
    backend: {
      node: 'app/backend/node',
      python: 'app/backend/python'
    },
    data: {
      saved: 'saved_data',
      audio: 'saved_data/audio',
      transcripts: 'saved_data/transcripts'
    }
  },

  // API configuration
  api: {
    openai: {
      baseUrl: 'https://api.openai.com/v1',
      models: {
        chat: 'gpt-4o-mini',
        tts: 'tts-1',
        whisper: 'whisper-1'
      },
      voices: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']
    },
    python: {
      url: process.env.PYTHON_SERVER_URL || 'http://localhost:8001',
      enabled: process.env.USE_PYTHON_CHAINED === 'true'
    }
  },

  // File upload limits
  limits: {
    audio: '50mb',
    json: '10mb'
  },

  // Session configuration
  session: {
    timeout: 30 * 60 * 1000, // 30 minutes
    maxMessages: 100
  }
};
