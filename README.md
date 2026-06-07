# BluHire-AI: Enterprise AI-Powered HRMS & Recruitment Platform

BluHire-AI is a next-generation Enterprise Human Resource Management System (HRMS) powered by AI. It simplifies candidate screening, automated voice interviews, shift scheduling, payroll cycles, and leave management through a sleek dark glassmorphic dashboard interface.

---

## 🚀 Key Modules & Features

### 1. 🎤 Recruitment & AI Interviews
* **Voice Interview Engine**: Candidates receive structured invitations and record response webms.
* **Auto-Screening Worker**: BullMQ queue asynchronously routes audio responses to FastAPI/Uvicorn AI service for transcripts and scoring.
* **Hiring Decision Center**: Interactive scorecard reviews, problem-solving evaluations, and technical metrics dashboard.

### 2. 💸 Enterprise Payroll & Incentives
* **Incentives Registry**: Award spot bonuses, referrals, or retention incentives linked to specific employees.
* **Deductions Registry**: Automatically applies custom tax configurations, TDS slabs, or payroll deductions.
* **AI Payroll Assistant**: Chat-based assistant that allows HR to detect anomalies or predict monthly costs, and allows employees to analyze salary structures.

### 3. 📅 Attendance & Shift Scheduling
* **Leaves Management**: Dynamic quota balances (Annual, Sick, Casual) styled with custom linear progress bars.
* **Shift Roster**: Setup and allocate shift configurations (Morning, Night, and Flexible shifts).
* **Analytics**: Monthly presence summaries and interactive trends charts.

---

## 🛠️ Technology Stack

* **Frontend**: Next.js 15, TailwindCSS, Framer Motion, React Query, Lucide icons.
* **Backend API**: Node.js, Express, TypeScript, Mongoose (MongoDB), BullMQ.
* **AI Service**: Python (FastAPI/Uvicorn), Pydantic, pytest.
* **Task Queues**: Redis (BullMQ queue manager).

---

## 📦 Project Directory Structure

```
├── ai-service/          # Python-based FastAPI audio transcription & screening service
├── backend/             # Node/Express TypeScript server (auth, payroll, attendance, etc.)
└── frontend/            # Next.js 15 frontend application (glassmorphic theme dashboard)
```

---

## ⚙️ Installation & Local Setup

### Prerequisites
* **Node.js**: v18+ and `npm`
* **Python**: v3.10+
* **MongoDB**: A running local or Atlas instance
* **Redis**: Required for BullMQ job queueing

### 1. Database & Queue Startup
Ensure your local MongoDB and Redis instances are running:
```bash
mongod
redis-server
```

### 2. Backend API Setup
```bash
cd backend
npm install
# Configure your .env file
npm run dev
```

### 3. AI Service Setup
```bash
cd ai-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
# Configure your .env file
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 4. Frontend Next.js Setup
```bash
cd frontend/bluhire-ai-frontend
npm install
# Configure your .env file
npm run dev
```
Open `http://localhost:3001` in your browser.
