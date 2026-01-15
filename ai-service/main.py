from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
import clip
from PIL import Image
import numpy as np
import requests
from io import BytesIO
import logging
from typing import List, Optional
import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="HaNoiGo AI Service",
    description="CLIP-based visual search service for HaNoiGo platform",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for model
device = "cuda" if torch.cuda.is_available() else "cpu"
model = None
preprocess = None

# Pydantic models
class ImageSearchRequest(BaseModel):
    query: str
    image_urls: List[str]
    top_k: Optional[int] = 5

class ImageSearchResponse(BaseModel):
    results: List[dict]
    query: str
    total_processed: int

class HealthResponse(BaseModel):
    status: str
    device: str
    model_loaded: bool

@app.on_event("startup")
async def startup_event():
    """Load CLIP model on startup"""
    global model, preprocess
    try:
        logger.info("Loading CLIP model...")
        model, preprocess = clip.load("ViT-B/32", device=device)
        logger.info(f"CLIP model loaded successfully on {device}")
    except Exception as e:
        logger.error(f"Failed to load CLIP model: {e}")
        raise e

@app.get("/", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        device=device,
        model_loaded=model is not None
    )

@app.post("/search/visual", response_model=ImageSearchResponse)
async def visual_search(request: ImageSearchRequest):
    """
    Perform visual search using CLIP model
    Compare text query with images and return similarity scores
    """
    if model is None:
        raise HTTPException(status_code=500, detail="CLIP model not loaded")
    
    try:
        # Encode text query
        text_tokens = clip.tokenize([request.query]).to(device)
        with torch.no_grad():
            text_features = model.encode_text(text_tokens)
            text_features /= text_features.norm(dim=-1, keepdim=True)
        
        results = []
        processed_count = 0
        
        for idx, image_url in enumerate(request.image_urls):
            try:
                # Download and preprocess image
                response = requests.get(image_url, timeout=10)
                image = Image.open(BytesIO(response.content)).convert("RGB")
                image_tensor = preprocess(image).unsqueeze(0).to(device)
                
                # Encode image
                with torch.no_grad():
                    image_features = model.encode_image(image_tensor)
                    image_features /= image_features.norm(dim=-1, keepdim=True)
                
                # Calculate similarity
                similarity = (text_features @ image_features.T).item()
                
                results.append({
                    "image_url": image_url,
                    "similarity_score": float(similarity),
                    "index": idx
                })
                processed_count += 1
                
            except Exception as e:
                logger.warning(f"Failed to process image {image_url}: {e}")
                continue
        
        # Sort by similarity score and get top_k
        results.sort(key=lambda x: x["similarity_score"], reverse=True)
        results = results[:request.top_k]
        
        return ImageSearchResponse(
            results=results,
            query=request.query,
            total_processed=processed_count
        )
        
    except Exception as e:
        logger.error(f"Visual search failed: {e}")
        raise HTTPException(status_code=500, detail=f"Visual search failed: {str(e)}")

@app.post("/search/image-to-image")
async def image_to_image_search(
    query_image: UploadFile = File(...),
    candidate_urls: List[str] = None
):
    """
    Find similar images using image-to-image search
    """
    if model is None:
        raise HTTPException(status_code=500, detail="CLIP model not loaded")
    
    if not candidate_urls:
        raise HTTPException(status_code=400, detail="No candidate URLs provided")
    
    try:
        # Process query image
        query_image_data = await query_image.read()
        query_pil = Image.open(BytesIO(query_image_data)).convert("RGB")
        query_tensor = preprocess(query_pil).unsqueeze(0).to(device)
        
        with torch.no_grad():
            query_features = model.encode_image(query_tensor)
            query_features /= query_features.norm(dim=-1, keepdim=True)
        
        results = []
        
        for idx, candidate_url in enumerate(candidate_urls):
            try:
                # Download and process candidate image
                response = requests.get(candidate_url, timeout=10)
                candidate_pil = Image.open(BytesIO(response.content)).convert("RGB")
                candidate_tensor = preprocess(candidate_pil).unsqueeze(0).to(device)
                
                with torch.no_grad():
                    candidate_features = model.encode_image(candidate_tensor)
                    candidate_features /= candidate_features.norm(dim=-1, keepdim=True)
                
                # Calculate similarity
                similarity = (query_features @ candidate_features.T).item()
                
                results.append({
                    "image_url": candidate_url,
                    "similarity_score": float(similarity),
                    "index": idx
                })
                
            except Exception as e:
                logger.warning(f"Failed to process candidate image {candidate_url}: {e}")
                continue
        
        # Sort by similarity
        results.sort(key=lambda x: x["similarity_score"], reverse=True)
        
        return {
            "results": results,
            "total_processed": len(results)
        }
        
    except Exception as e:
        logger.error(f"Image-to-image search failed: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@app.get("/model/info")
async def model_info():
    """Get information about the loaded model"""
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    return {
        "model_name": "ViT-B/32",
        "device": device,
        "available_devices": {
            "cuda_available": torch.cuda.is_available(),
            "cuda_device_count": torch.cuda.device_count() if torch.cuda.is_available() else 0
        }
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=True
    )