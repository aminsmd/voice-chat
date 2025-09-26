#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎤 Voice Chat Setup');
console.log('==================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (!fs.existsSync(envPath)) {
    if (fs.existsSync(envExamplePath)) {
        console.log('📝 Creating .env file from .env.example...');
        fs.copyFileSync(envExamplePath, envPath);
        console.log('✅ .env file created!');
        console.log('⚠️  Please edit .env and add your OpenAI API key\n');
    } else {
        console.log('📝 Creating .env file...');
        fs.writeFileSync(envPath, 'OPENAI_API_KEY=your_openai_api_key_here\nPORT=3000\n');
        console.log('✅ .env file created!');
        console.log('⚠️  Please edit .env and add your OpenAI API key\n');
    }
} else {
    console.log('✅ .env file already exists\n');
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
    console.log('📦 Installing dependencies...');
    console.log('Run: npm install\n');
} else {
    console.log('✅ Dependencies are installed\n');
}

console.log('🚀 Setup complete! Next steps:');
console.log('1. Edit .env file and add your OpenAI API key');
console.log('2. Run: npm start');
console.log('3. Open: http://localhost:3002');
console.log('\nFor development with auto-reload: npm run dev');
