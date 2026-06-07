import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.api.endpoints import router as ai_router

try:
    from app.api.routes import router as eval_router
except ImportError:
    eval_router = None

# Load environment variables
load_dotenv()
print("OpenRouter Model:", os.getenv("OPENROUTER_MODEL", "openrouter/auto"), flush=True)

app = FastAPI(
    title="BluHire AI Evaluation & Screening Service",
    description="Microservice for resume screening and evaluating candidate interviews using AI.",
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

if eval_router:
    app.include_router(eval_router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "BluHire AI Evaluation & Screening Service",
        "version": "1.0.0"
    }

@app.get("/")
async def root():
    return await health_check()

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host=host, port=port, reload=True)
