# BluHire-AI: Enterprise AI-Powered HRMS & Recruitment Platform

BluHire-AI is a next-generation Enterprise Human Resource Management System (HRMS) powered by AI. It simplifies candidate screening, automated voice interviews, shift scheduling, payroll cycles, and leave management through a sleek dark glassmorphic dashboard interface.

## 🌐 Live Demo

**Deployed Application:** https://bluhire-ai-frontend.vercel.app

---

## 🚀 Key Modules & Features

### 🎤 Recruitment & AI Interviews

* **Voice Interview Engine** – Candidates receive structured interview invitations and record voice responses directly through the platform.
* **AI-Powered Screening** – Audio responses are processed through a FastAPI AI service for transcription, scoring, and evaluation.
* **Hiring Decision Center** – HR teams can review candidate scorecards, communication skills, technical performance, and interview analytics.
* **Candidate Portal** – Dedicated candidate experience with interview scheduling and status tracking.

### 💸 Enterprise Payroll & Incentives

* **Payroll Management** – Automated payroll processing with configurable salary structures.
* **Incentives Registry** – Manage spot bonuses, referral rewards, and retention incentives.
* **Deductions Registry** – Configure taxes, deductions, and payroll adjustments.
* **AI Payroll Assistant** – Analyze salary structures, payroll anomalies, and monthly payroll forecasts through natural language conversations.

### 📅 Attendance & Shift Scheduling

* **Attendance Tracking** – Real-time attendance monitoring and reporting.
* **Leave Management** – Dynamic leave balances with Annual, Sick, and Casual leave tracking.
* **Shift Roster Management** – Create and assign Morning, Night, and Flexible shifts.
* **Attendance Analytics** – Interactive charts and workforce attendance insights.

### 👥 Employee Management

* Employee directory and profile management.
* Role-based access control (RBAC).
* Department and organizational hierarchy management.
* Employee lifecycle management.

### 📈 Performance Management

* Employee performance tracking.
* KPI and goal management.
* Performance reviews and analytics.
* AI-assisted performance insights.

### 🤖 AI-Powered HR Tools

* AI Voice Interview System.
* Resume Screening & Candidate Evaluation.
* HR Copilot Assistant.
* Payroll Intelligence Assistant.
* Employee Performance Analytics.

---

## 🛠️ Technology Stack

### Frontend

* Next.js 15
* React
* TypeScript
* Tailwind CSS
* Framer Motion
* React Query
* Lucide Icons

### Backend

* Node.js
* Express.js
* TypeScript
* MongoDB
* Mongoose
* BullMQ

### AI Services

* Python
* FastAPI
* Uvicorn
* Pydantic
* Pytest

### Infrastructure

* Redis
* MongoDB Atlas
* Vercel
* BullMQ Queue Workers

---

## 📦 Project Structure

```text
BluHire-AI/
├── ai-service/              # FastAPI AI microservice
├── backend/                 # Node.js + Express API
├── frontend/                # Next.js application
│
├── recruitment/             # Recruitment & interview workflows
├── attendance/              # Attendance & leave management
├── payroll/                 # Payroll & incentives
├── performance/             # Performance tracking
├── employee-management/     # Employee directory & profiles
│
└── README.md
```

---

## ⚙️ Installation & Local Setup

### Prerequisites

* Node.js v18+
* Python 3.10+
* MongoDB
* Redis
* npm

---

### 1. Start MongoDB & Redis

```bash
mongod
redis-server
```

---

### 2. Backend Setup

```bash
cd backend

npm install

# Configure environment variables
cp .env.example .env

npm run dev
```

Backend runs on:

```text
http://localhost:5000
```

---

### 3. AI Service Setup

```bash
cd ai-service

python -m venv venv

# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt

uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

AI Service runs on:

```text
http://localhost:8000
```

---

### 4. Frontend Setup

```bash
cd frontend/bluhire-ai-frontend

npm install

# Configure environment variables
npm run dev
```

Frontend runs on:

```text
http://localhost:3001
```

---

## 🔐 Authentication & Access Control

BluHire-AI uses Role-Based Access Control (RBAC) with support for:

* Super Admin
* HR Manager
* Recruiter
* Employee
* Candidate

Permissions are dynamically assigned based on user roles.

---

## 🔄 System Architecture

```text
Frontend (Next.js)
        │
        ▼
Backend API (Node.js + Express)
        │
 ┌──────┼─────────┐
 ▼      ▼         ▼
MongoDB Redis   AI Service
                 (FastAPI)
```

The platform uses BullMQ workers and Redis queues to process interview recordings asynchronously and communicate with the AI evaluation service.

---

## 🎯 Core Highlights

* AI Voice Interviews
* Resume Screening
* HR Copilot
* Payroll Intelligence
* Attendance Analytics
* Leave Management
* Shift Scheduling
* Employee Directory
* Performance Tracking
* Enterprise RBAC
* Glassmorphic Dashboard UI
* Real-Time Analytics

---

## 👨‍💻 Team

### Dhanush Maddila

* HR Copilot
* Performance Management
* RAG Search Integration
* Employee Management
* Frontend Development
* AI Features Integration

### TejDeep

* System Architecture
* Authentication & RBAC
* Attendance & Leave Management
* Payroll Management
* AI Interview Platform
* Interview Processing Pipeline
* Integration Testing

---

## 📄 License

This project was developed as part of a hackathon and educational learning initiative.


