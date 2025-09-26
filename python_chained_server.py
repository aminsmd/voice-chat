#!/usr/bin/env python3
"""
Python-based chained voice processing server
This provides an alternative implementation using the OpenAI Agents Python SDK
"""

import asyncio
import base64
import json
import logging
import os
import tempfile
from typing import Optional

import numpy as np
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from chained_voice_pipeline import ChainedVoicePipeline, create_voice_pipeline

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(title="Chained Voice Processing API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request models
class ChainedProcessRequest(BaseModel):
    audio: str  # base64 encoded audio
    instructions: Optional[str] = None
    voice: Optional[str] = "alloy"

class ChainedProcessResponse(BaseModel):
    success: bool
    audio: Optional[str] = None  # base64 encoded response audio
    transcription: Optional[str] = None
    ai_response: Optional[str] = None
    error: Optional[str] = None

# Global pipeline instance
pipeline: Optional[ChainedVoicePipeline] = None

@app.on_event("startup")
async def startup_event():
    """Initialize the voice pipeline on startup"""
    global pipeline
    logger.info("Initializing chained voice pipeline...")
    
    # Check for OpenAI API key
    if not os.getenv("OPENAI_API_KEY"):
        logger.error("OPENAI_API_KEY environment variable not set")
        raise RuntimeError("OPENAI_API_KEY environment variable not set")
    
    # Create the pipeline
    pipeline = create_voice_pipeline(
        instructions="You are a helpful AI assistant. Respond naturally and conversationally. Keep responses concise and engaging.",
        voice="alloy"
    )
    
    logger.info("Chained voice pipeline initialized successfully")

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Chained Voice Processing API", "status": "running"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "pipeline_ready": pipeline is not None}

@app.post("/api/chained/process", response_model=ChainedProcessResponse)
async def process_chained_audio(request: ChainedProcessRequest):
    """
    Process audio through the chained voice pipeline
    """
    if not pipeline:
        raise HTTPException(status_code=500, detail="Voice pipeline not initialized")
    
    try:
        logger.info("Processing chained voice request...")
        logger.info(f"Instructions: {request.instructions}")
        logger.info(f"Voice: {request.voice}")
        logger.info(f"Audio data length: {len(request.audio) if request.audio else 0}")
        
        # Decode base64 audio
        try:
            audio_data = base64.b64decode(request.audio)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid base64 audio data: {e}")
        
        # Process through the pipeline
        result = await pipeline.process_audio(
            audio_data=audio_data,
            instructions=request.instructions,
            voice=request.voice
        )
        
        if result["success"]:
            logger.info("Chained processing completed successfully")
            return ChainedProcessResponse(
                success=True,
                audio=result.get("audio"),
                transcription=result.get("transcription"),
                ai_response=result.get("ai_response")
            )
        else:
            logger.error(f"Chained processing failed: {result.get('error')}")
            return ChainedProcessResponse(
                success=False,
                error=result.get("error", "Unknown error in chained processing")
            )
            
    except Exception as e:
        logger.error(f"Error in chained processing: {e}")
        raise HTTPException(status_code=500, detail=f"Chained processing error: {e}")

@app.post("/api/chained/update-agent")
async def update_agent(instructions: str, voice: str = "alloy"):
    """Update the agent instructions and voice"""
    global pipeline
    
    try:
        logger.info(f"Updating agent with instructions: {instructions}")
        logger.info(f"Voice: {voice}")
        
        # Create new pipeline with updated settings
        pipeline = create_voice_pipeline(
            instructions=instructions,
            voice=voice
        )
        
        return {"success": True, "message": "Agent updated successfully"}
        
    except Exception as e:
        logger.error(f"Error updating agent: {e}")
        raise HTTPException(status_code=500, detail=f"Agent update error: {e}")

@app.get("/api/chained/status")
async def get_status():
    """Get the current status of the chained pipeline"""
    return {
        "pipeline_ready": pipeline is not None,
        "agent_name": pipeline.agent.name if pipeline else None,
        "agent_instructions": pipeline.agent.instructions if pipeline else None,
        "tools_count": len(pipeline.agent.tools) if pipeline and pipeline.agent.tools else 0
    }

if __name__ == "__main__":
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    # Check for required environment variables
    if not os.getenv("OPENAI_API_KEY"):
        logger.error("OPENAI_API_KEY environment variable not set")
        exit(1)
    
    # Run the server
    logger.info("Starting Python chained voice processing server...")
    uvicorn.run(
        "python_chained_server:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
