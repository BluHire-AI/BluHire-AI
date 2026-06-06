from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router

app = FastAPI(
    title="BluHire AI Evaluation Service",
    description="Microservice for evaluating candidate interviews using AI.",
    version="1.0.0"
)

# Configure CORS so the backend/frontend can interact with this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the evaluation routes
app.include_router(router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "BluHire AI Evaluation Service"}
