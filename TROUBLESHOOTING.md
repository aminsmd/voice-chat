# 🔧 Troubleshooting Guide

## 🎨 Frontend Styling Issues

### **CSS/JS Files Not Loading**
**Symptoms:** Page loads but without styles, or JavaScript functionality not working

**Solutions:**
1. **Check file paths** - After reorganization, CSS/JS files moved to `app/frontend/src/`
2. **Verify server configuration** - Server should serve both `public` and `src` directories
3. **Check browser console** for 404 errors on CSS/JS files

**Quick Fix:**
```bash
# Restart the server to apply new static file serving
npm start
```

---

## "Error processing audio" - Common Issues & Solutions

### 🚨 Quick Diagnosis

1. **Check Browser Console** (F12 → Console tab)
2. **Check Server Console** (terminal where you ran `npm start`)
3. **Verify API Key** is set in `.env` file
4. **Test Network Connection** to OpenAI APIs

---

## 🔍 Common Causes & Solutions

### 1. **API Key Issues**
**Symptoms:** "OpenAI API key not configured" or authentication errors

**Solutions:**
```bash
# Check if .env file exists and has API key
cat .env | grep OPENAI_API_KEY

# If missing, create .env file
cp .env.example .env
# Edit .env and add your OpenAI API key
```

### 2. **Network/Connection Issues**
**Symptoms:** "Network error" or timeout errors

**Solutions:**
- Check internet connection
- Verify OpenAI API is accessible: `curl https://api.openai.com/v1/models`
- Check firewall/proxy settings

### 3. **Audio Format Issues**
**Symptoms:** "Audio format error" or "Invalid base64"

**Solutions:**
- Ensure microphone permissions are granted
- Try different browsers (Chrome recommended)
- Check if audio is being recorded properly

### 4. **Server Configuration Issues**
**Symptoms:** "Server error" or 500 errors

**Solutions:**
```bash
# Check if server is running
curl http://localhost:3000/api/health

# Check server logs
npm start
# Look for error messages in terminal

# Verify dependencies
npm install
```

### 5. **Chained Mode Specific Issues**

#### Python Chained Processing
**Symptoms:** "Python chained processing failed"

**Solutions:**
```bash
# Check if Python server is running
curl http://localhost:8001/health

# Start Python server if needed
python python_chained_server.py

# Check Python dependencies
pip install -r requirements.txt
```

#### Node.js Chained Processing
**Symptoms:** "Transcription failed" or "TTS failed"

**Solutions:**
- Check OpenAI API quota/limits
- Verify audio file format (should be webm)
- Check server logs for specific error messages

---

## 🧪 Debugging Steps

### Step 1: Check Server Health
```bash
# Test server endpoints
curl http://localhost:3000/api/health
curl http://localhost:3000/api/network
```

### Step 2: Test API Key
```bash
# Test OpenAI API access
curl -H "Authorization: Bearer YOUR_API_KEY" https://api.openai.com/v1/models
```

### Step 3: Check Browser Console
1. Open browser developer tools (F12)
2. Go to Console tab
3. Look for error messages
4. Check Network tab for failed requests

### Step 4: Test Audio Recording
```javascript
// In browser console, test microphone access
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => console.log('Microphone working:', stream))
  .catch(err => console.error('Microphone error:', err));
```

### Step 5: Test Chained Processing
```bash
# Test the chained endpoint directly
curl -X POST http://localhost:3000/api/chained/process \
  -H "Content-Type: application/json" \
  -d '{"audio":"dGVzdA==","instructions":"Hello","voice":"alloy"}'
```

---

## 🔧 Advanced Debugging

### Enable Detailed Logging
Add to your `.env` file:
```env
DEBUG=true
LOG_LEVEL=debug
```

### Check Server Logs
```bash
# Run with debug logging
DEBUG=* npm start

# Or check specific logs
tail -f server.log
```

### Test Individual Components

#### Test Speech-to-Text
```bash
# Test Whisper API directly
curl -X POST https://api.openai.com/v1/audio/transcriptions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "file=@test_audio.webm" \
  -F "model=whisper-1"
```

#### Test Text-to-Speech
```bash
# Test TTS API directly
curl -X POST https://api.openai.com/v1/audio/speech \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"tts-1","input":"Hello world","voice":"alloy"}'
```

---

## 🆘 Still Having Issues?

### Check These Common Problems:

1. **Browser Compatibility**
   - Use Chrome/Chromium (recommended)
   - Ensure WebRTC is supported
   - Check microphone permissions

2. **Audio Quality**
   - Speak clearly and not too fast
   - Avoid background noise
   - Ensure good microphone quality

3. **API Limits**
   - Check OpenAI usage limits
   - Verify billing is set up
   - Check rate limits

4. **Environment Issues**
   - Node.js version (16+)
   - Python version (3.8+)
   - Dependencies installed

### Get Help:
1. Check the browser console for specific error messages
2. Check the server terminal for backend errors
3. Test with a simple audio file first
4. Try switching between Real-time and Chained modes
5. Verify your OpenAI API key has the necessary permissions

---

## 📊 Error Codes Reference

| Error | Cause | Solution |
|-------|-------|----------|
| `401 Unauthorized` | Invalid API key | Check `.env` file |
| `429 Too Many Requests` | Rate limit exceeded | Wait and retry |
| `500 Internal Server Error` | Server configuration | Check server logs |
| `Network Error` | Connection issue | Check internet/firewall |
| `Audio format error` | Invalid audio data | Check microphone permissions |
| `Python chained processing failed` | Python server down | Start Python server |

---

## 🎯 Quick Fixes

### Reset Everything:
```bash
# Stop servers
# Kill any running processes

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Reset Python environment
rm -rf venv
python setup_python.py

# Restart servers
npm start
```

### Test with Minimal Setup:
1. Use Real-time mode first (simpler)
2. Try with default voice (Alloy)
3. Use simple instructions
4. Test with short audio clips
