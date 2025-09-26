#!/usr/bin/env python3
"""
Chained Voice Pipeline using OpenAI Agents Python SDK
This implements the chained architecture as described in:
https://platform.openai.com/docs/guides/voice-agents?voice-agent-architecture=chained
"""

import asyncio
import base64
import io
import json
import logging
import os
import random
import tempfile
from typing import Optional

import numpy as np
import sounddevice as sd
from agents import Agent, function_tool
from agents.voice import AudioInput, SingleAgentVoiceWorkflow, VoicePipeline
from agents.extensions.handoff_prompt import prompt_with_handoff_instructions

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Weather tool for demonstration
@function_tool
def get_weather(city: str) -> str:
    """Get the weather for a given city."""
    logger.info(f"[debug] get_weather called with city: {city}")
    choices = ["sunny", "cloudy", "rainy", "snowy"]
    return f"The weather in {city} is {random.choice(choices)}."

# Create agents
spanish_agent = Agent(
    name="Spanish",
    handoff_description="A spanish speaking agent.",
    instructions=prompt_with_handoff_instructions(
        "You're speaking to a human, so be polite and concise. Speak in Spanish.",
    ),
    model="gpt-4o-mini",
)

main_agent = Agent(
    name="Assistant",
    instructions=prompt_with_handoff_instructions(
        "You're speaking to a human, so be polite and concise. If the user speaks in Spanish, handoff to the spanish agent.",
    ),
    model="gpt-4o-mini",
    handoffs=[spanish_agent],
    tools=[get_weather],
)

class ChainedVoicePipeline:
    """Chained voice pipeline implementation using OpenAI Agents Python SDK"""
    
    def __init__(self, agent: Agent = main_agent):
        self.agent = agent
        self.pipeline = VoicePipeline(workflow=SingleAgentVoiceWorkflow(agent))
        self.is_running = False
        
    async def process_audio(self, audio_data: bytes, instructions: str = None, voice: str = "alloy") -> dict:
        """
        Process audio through the chained pipeline:
        1. Speech-to-Text
        2. AI Processing
        3. Text-to-Speech
        """
        try:
            logger.info("Starting chained voice processing...")
            
            # Convert bytes to numpy array for AudioInput
            audio_array = np.frombuffer(audio_data, dtype=np.int16)
            
            # Create AudioInput object
            audio_input = AudioInput(buffer=audio_array)
            
            # Update agent instructions if provided
            if instructions:
                self.agent.instructions = instructions
                logger.info(f"Updated agent instructions: {instructions}")
            
            # Run the pipeline
            logger.info("Running voice pipeline...")
            result = await self.pipeline.run(audio_input)
            
            # Collect the audio output
            output_audio_chunks = []
            async for event in result.stream():
                if event.type == "voice_stream_event_audio":
                    output_audio_chunks.append(event.data)
            
            # Combine audio chunks
            if output_audio_chunks:
                combined_audio = np.concatenate(output_audio_chunks)
                audio_bytes = combined_audio.tobytes()
                audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
                
                logger.info("Chained processing completed successfully")
                return {
                    "success": True,
                    "audio": audio_base64,
                    "transcription": "Processed through chained pipeline",
                    "ai_response": "Generated through agents workflow"
                }
            else:
                logger.warning("No audio output generated")
                return {
                    "success": False,
                    "error": "No audio output generated"
                }
                
        except Exception as e:
            logger.error(f"Error in chained processing: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def run_interactive_demo(self):
        """Run an interactive demo of the chained voice pipeline"""
        logger.info("Starting interactive chained voice demo...")
        
        # Create 3 seconds of silence for demo
        buffer = np.zeros(24000 * 3, dtype=np.int16)
        audio_input = AudioInput(buffer=buffer)
        
        logger.info("Running pipeline with demo audio...")
        result = await self.pipeline.run(audio_input)
        
        # Create an audio player
        player = sd.OutputStream(samplerate=24000, channels=1, dtype=np.int16)
        player.start()
        
        logger.info("Playing generated audio...")
        # Play the audio stream as it comes in
        async for event in result.stream():
            if event.type == "voice_stream_event_audio":
                player.write(event.data)
        
        logger.info("Demo completed!")

def create_voice_pipeline(instructions: str = None, voice: str = "alloy") -> ChainedVoicePipeline:
    """Create a voice pipeline with custom instructions and voice"""
    
    # Create agent with custom instructions
    agent = Agent(
        name="Assistant",
        instructions=instructions or "You are a helpful AI assistant. Respond naturally and conversationally. Keep responses concise and engaging.",
        model="gpt-4o-mini",
        tools=[get_weather],
    )
    
    return ChainedVoicePipeline(agent)

async def main():
    """Main function for testing the chained voice pipeline"""
    logger.info("Initializing chained voice pipeline...")
    
    # Create pipeline
    pipeline = create_voice_pipeline(
        instructions="You are a helpful AI assistant. Be friendly and engaging.",
        voice="alloy"
    )
    
    # Run interactive demo
    await pipeline.run_interactive_demo()

if __name__ == "__main__":
    # Check if required environment variables are set
    if not os.getenv("OPENAI_API_KEY"):
        logger.error("OPENAI_API_KEY environment variable not set")
        exit(1)
    
    # Run the main function
    asyncio.run(main())
