# BluHire-AI: Testing Guide & Instructions

Welcome to the comprehensive testing guide for the BluHire-AI Interview Module. Since you are new to testing, this document is designed to teach you how to verify that everything we've built is working perfectly.

We will cover **Manual Testing** (using simple tools like Postman or your terminal) and **Functional/Integration Testing** (making sure different pieces talk to each other correctly).

---

## Prerequisites

Before we begin testing, ensure you have the following installed and configured:
1. **Node.js & npm**: For the backend server.
2. **Python 3.9+ & pip**: For the AI Service.
3. **MongoDB**: Make sure your local MongoDB instance is running, or you have a MongoDB Atlas URI.
4. **Postman**: Download Postman (https://www.postman.com/downloads/) for manual API testing.

---

## 1. Setting Up the Environments

### Backend (Node.js)
1. Open your terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies (if you haven't already):
   ```bash
   npm install
   ```
3. Ensure your `.env` file has the MongoDB URI:
   ```env
   MONGO_URI=mongodb://localhost:27017/bluhire
   PORT=5000
   JWT_SECRET=your_secret_key
   ```
4. Start the backend server:
   ```bash
   npm run dev
   ```

### AI Service (Python)
1. Open a new terminal window and navigate to the `ai-service` folder:
   ```bash
   cd ai-service
   ```
2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # Mac/Linux:
   source venv/bin/activate
   ```
3. Install required packages:
   ```bash
   pip install fastapi uvicorn httpx
   ```
4. Set your OpenRouter API key in your environment variables. 
   - **Windows PowerShell**: `$env:OPENROUTER_API_KEY="your-api-key"`
   - **Mac/Linux**: `export OPENROUTER_API_KEY="your-api-key"`
5. *(Optional)* Start the FastAPI server (once we set up the `main.py` entry point for it).

---

## 2. Manual Testing with Postman (Backend APIs)

Postman allows you to act as the "Frontend" and send requests to the Backend to see how it responds.

### Test A: Chunked Video Upload API
We built a chunk upload endpoint (`POST /api/v1/interview/recordings/upload`).

1. Open Postman.
2. Create a new **POST** request to: `http://localhost:5000/api/v1/interview/recordings/upload`
3. Go to the **Headers** tab:
   - Add `Authorization`: `Bearer <your_test_jwt_token>` (Generate one from your auth endpoints).
4. Go to the **Body** tab, select **form-data**:
   - `fileId`: (Text) `test-video-123`
   - `totalChunks`: (Text) `1`
   - `chunkIndex`: (Text) `0`
   - `sessionId`: (Text) `<a_valid_session_mongodb_id>`
   - `questionId`: (Text) `<a_valid_question_mongodb_id>`
   - `candidateId`: (Text) `<a_valid_candidate_mongodb_id>`
   - `chunk`: (File) -> Select a small `.webm` or `.mp4` file from your computer.
5. Click **Send**.
6. **Expected Result**: You should get a `200 OK` response saying `"Upload complete and merged"`, and the video file should now exist in your `backend/uploads/videos/` directory!

---

## 3. Integration Testing the AI Service (Python)

We want to test if the Python code successfully connects to OpenRouter, applies our exact prompts, and returns the expected JSON formats.

Since you are learning, the best way to test Python logic is a simple script. 

1. Create a file named `test_ai.py` inside the `ai-service` folder.
2. Paste the following code:

```python
import asyncio
import os
from app.services.evaluation_service import EvaluationService

async def run_tests():
    print("Testing AI Evaluation Service...")
    
    # Make sure you have your key set!
    if not os.getenv("OPENROUTER_API_KEY"):
        print("ERROR: OPENROUTER_API_KEY is not set!")
        return

    service = EvaluationService()

    question = "Explain Random Forest"
    expected_topics = ["Ensemble Learning", "Decision Trees", "Bagging", "Overfitting Reduction"]
    transcript = "Random forest is a machine learning algorithm. It uses multiple decision trees to make a prediction, which is a type of ensemble learning. It helps prevent the model from overfitting to the training data, unlike a single decision tree."

    print("Sending request to OpenRouter...")
    try:
        result = await service.evaluate_technical_response(question, expected_topics, transcript)
        print("\n--- TEST SUCCESS ---")
        print("Received valid JSON from AI:")
        print(result)
        print("\nNotice the 'rubricEvaluations' array and the 'overallTechnicalScore'!")
    except Exception as e:
        print("\n--- TEST FAILED ---")
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(run_tests())
```

3. Run the script from your terminal:
   ```bash
   python test_ai.py
   ```
4. **Expected Result**: The terminal will print out a structured JSON evaluation scoring the transcript against the rubric, proving that the Python backend successfully communicates with DeepSeek via OpenRouter.

---

## 4. Next Steps for Automated Testing

Once manual testing feels comfortable, we will move to **Automated Testing**:
1. **Backend**: We will use `Jest` and `Supertest` to write scripts that run the Postman steps automatically every time you save code.
2. **AI Service**: We will use `pytest` to automatically run scripts like `test_ai.py` but with mock data.

> [!TIP]
> **Action Required**: Try running the Python `test_ai.py` script above first! It is the easiest way to see the magic of the AI evaluation engine you just built. Let me know the results, and we can move on to the next testing phase!
