# ✦ Kumpas

<img src="./images/Kumpas Preview.png" alt="Kumpas Banner" />

An Agentic AI financial tracking and forecasting tool for Philippine college students. It uses machine learning and simulations to predict spending patterns, helping prevent early wallet depletion.

---

## Overview

Kumpas combines a database with a Python analytics engine to project financial runways. Instead of static spreadsheets, it learns from daily spending habits and allowance cycles, turning complex quant finance math into clear dashboards.

---

## Problem

Most trackers only show past expenses. Students often overspend right after allowance drops or during weekends, leaving them short before the next cycle. Kumpas adds foresight by predicting balance trends and risks.

---

## Features

- **Allowance Cycle Tracking** – Flexible timelines based on allowance schedules
- **Detailed Transactions** – Categorized inflows/outflows with merchant tags
- **Multi-Wallets** – Manage multiple wallets with unified balance
- **Stress Testing** – Simulates surprise expenses to test resilience
- **Behavior Profiling (ML)** – Maps spending phases within allowance cycles
- **Spend Regression** – Ridge Regression to capture surges and weekend spikes
- **Monte Carlo Simulator** – Runs 1,000 scenarios using drift + volatility
- **Radar UI** – Shows success rates, pace, unpredictability, and “financial weather”
- **Agentic AI** - Checks financial weather and guides on how to manage finance proactively

---

## Tech Stack

**Frontend:** React + Next.js, TanStack Router, Tailwind, Lucide  
**Backend:** NestJS, Prisma + PostgreSQL, Supabase Auth, Axios  
**Analytics:** FastAPI, Uvicorn, NumPy, Scikit-Learn

---

## System Architecture

```
[ Web Frontend (React / TanStack) ]
             │
             ▼  (Supabase JWT Authenticated)
[ Backend Core Gateway (NestJS) ]
             │
             ├──► Read / Write ──► [ Database Ledger (Prisma / PostgreSQL) ]
             │
             ▼  (Internal HTTP JSON payload)
[ Analytics Sidecar Engine (FastAPI) ]
             │
             ├──► [ ML Ridge Model: Behavior / Velocity Predictor ]
             ▼
[ Vectorized Monte Carlo Simulation Matrix (NumPy) ]

```

---

## Installation and Setup

### Prerequisites

- Node.js (v18 or higher)
- pnpm package manager (`npm install -g pnpm`)
- Python (v3.10 or higher) with `pip` and `virtualenv`

### Step 1: Clone and Configure Environment Files

Set up your `.env` flags within `apps/api` referencing your active PostgreSQL connection string and Supabase JWT credentials.

### Step 2: Install Node Workspace Dependencies

From the absolute root of the repository, execute:

```bash
pnpm install

```

### Step 3: Configure and Initialize the Python Virtual Environment

Navigate to the analytics directory to lock down Python dependencies:

```bash
cd apps/analytics
python -m venv .venv

# Activation (MacOS/Linux)
source .venv/bin/activate
# Activation (Windows)
.venv\Scripts\activate

pip install -r requirements.txt

```

### Step 4: Synchronize Database Models

Generate your Prisma schemas and push configurations directly to your local database engine:

```bash
pnpm --filter api prisma db push

```

### Step 5: Run the Monorepo Development Environment

To boot the unified frontend interface, NestJS server, and automated watch processes concurrently, run:

```bash
pnpm dev

```

In a parallel terminal window, ensure the Python mathematical sidecar is up and active:

```bash
cd apps/analytics
source .venv/bin/activate
python main.py

```

Open your browser and navigate to `http://localhost:5173` (or your terminal's designated Vite port) to interact with the system dashboard. Selecting **Radar Analytics** will automatically fire the historical extraction bridge, train your local profile model, and compute forward runway metrics instantly.
