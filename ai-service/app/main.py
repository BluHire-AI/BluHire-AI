import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.api.endpoints import router as ai_router

# Load environment variables
load_dotenv()

app = FastAPI(
    title="HRMinds AI Resume Screening Engine",
    description="Microservice for resume text extraction and OpenRouter matching analysis",
    version="1.0.0"
)

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include AI endpoints
app.include_router(ai_router)

@app.get("/")
async def root():
    return {
        "status": "healthy",
        "service": "HRMinds AI Resume Screening Engine",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host=host, port=port, reload=True)
