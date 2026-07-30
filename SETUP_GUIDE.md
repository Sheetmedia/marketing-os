# MarketingOS - Setup Guide

> Get your AI Marketing Operating System up and running in minutes.

---

## Prerequisites

Before you start, make sure you have these installed:

| Software | Version | Check Command | Download |
|----------|---------|---------------|----------|
| Python | 3.10+ | `python3 --version` | python.org |
| Node.js | 18+ | `node --version` | nodejs.org |
| npm | 9+ | `npm --version` | Comes with Node.js |
| Git | Any | `git --version` | git-scm.com |

### Optional (for AI features):
- **OpenAI API Key** - For AI content generation (get one at platform.openai.com)
- **Stable Diffusion** - For AI image generation (local or API)

---

## Quick Start (5 Minutes)

### Step 1: Clone & Navigate

```bash
cd /path/to/your/projects
git clone <your-repo-url> MarketingOS
cd MarketingOS
```

Or if you already have the code:
```bash
cd /home/brijesh/Downloads/code-automation/SEO
```

### Step 2: Setup Backend

```bash
# Create Python virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate    # Linux/Mac
# venv\Scripts\activate     # Windows

# Install dependencies
pip install -r backend/requirements.txt

# Copy environment file
cp backend/.env.example backend/.env
```

### Step 3: Configure Environment

Edit `backend/.env` and set your keys:

```env
# Database (SQLite works out of the box, no setup needed!)
DATABASE_URL=sqlite+aiosqlite:///./marketing_os.db

# Security (change this in production!)
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# OpenAI (required for AI features)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Optional: Ad platform integrations
GOOGLE_ADS_CLIENT_ID=
GOOGLE_ADS_CLIENT_SECRET=
FACEBOOK_ADS_ACCESS_TOKEN=
LINKEDIN_ADS_ACCESS_TOKEN=
```

> **Note:** The platform works without API keys - AI features will gracefully fall back to defaults. You can add keys later.

### Step 4: Initialize Database

```bash
cd backend

# Create database tables and admin user
python -c "
import asyncio
from core.database import init_db
asyncio.run(init_db())
print('Database tables created!')
"

# Create admin user
python -c "
import asyncio, uuid
from core.database import async_session, init_db
from core.security import get_password_hash
from models.user import User
from models.agency import Agency

async def setup():
    await init_db()
    async with async_session() as db:
        agency_id = uuid.uuid4()
        db.add(Agency(id=agency_id, name='My Agency', slug='my-agency', subscription_plan='professional', max_clients=50, is_active=True))
        db.add(User(id=uuid.uuid4(), email='admin@marketingos.com', full_name='Admin', hashed_password=get_password_hash('admin123'), role='agency_admin', is_active=True, agency_id=agency_id))
        await db.commit()
        print('Admin user created!')
        print('  Email: admin@marketingos.com')
        print('  Password: admin123')

asyncio.run(setup())
"

cd ..
```

### Step 5: Start Backend

```bash
source venv/bin/activate
cd backend
uvicorn main:app --host 0.0.0.0 --port 3031 &
cd ..
```

Verify: Open http://localhost:3031/docs - you should see the Swagger API docs.

### Step 6: Setup & Start Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npx vite --host 0.0.0.0 --port 3030 &

cd ..
```

### Step 7: Open MarketingOS

1. Open your browser
2. Go to **http://localhost:3030**
3. Login with:
   - Email: `admin@marketingos.com`
   - Password: `admin123`
4. You're in!

---

## First Steps After Login

### 1. Add Your First Client

1. Click **"Clients"** in the sidebar
2. Click **"Add Client"**
3. Enter:
   - Company Name: `My Company`
   - Domain: `mycompany.com`
   - Industry: `Technology`
   - Marketing Goals: `Increase organic traffic`
4. Click **"Create"**

### 2. Run Your First SEO Audit

1. Click **"SEO Audit"** in the sidebar
2. Select your client
3. Click **"Run New Audit"**
4. Wait for results

### 3. Add Keywords to Track

1. Click **"Keywords"**
2. Click **"Add Keywords"**
3. Enter keywords relevant to your business
4. Click **"Add"**

### 4. Enable SEO By AI

1. Click **"SEO By AI"**
2. Review the settings
3. Toggle on the features you want automated
4. Atlas will start managing your SEO!

---

## Starting & Stopping

### Start Both Servers
```bash
# From the project root directory
source venv/bin/activate

# Start backend
cd backend && uvicorn main:app --host 0.0.0.0 --port 3031 &
cd ..

# Start frontend
cd frontend && npx vite --host 0.0.0.0 --port 3030 &
cd ..

echo "Frontend: http://localhost:3030"
echo "Backend:  http://localhost:3031/docs"
```

### Stop Both Servers
```bash
# Stop all
kill $(lsof -ti:3030) 2>/dev/null
kill $(lsof -ti:3031) 2>/dev/null
echo "All servers stopped"
```

### One-Command Start Script
Create a file called `start.sh` in your project root:
```bash
#!/bin/bash
echo "Starting MarketingOS..."

# Kill existing processes
kill $(lsof -ti:3030) 2>/dev/null
kill $(lsof -ti:3031) 2>/dev/null
sleep 1

# Start backend
source venv/bin/activate
cd backend && uvicorn main:app --host 0.0.0.0 --port 3031 > /tmp/marketingos-backend.log 2>&1 &
cd ..

# Start frontend
cd frontend && npx vite --host 0.0.0.0 --port 3030 > /tmp/marketingos-frontend.log 2>&1 &
cd ..

sleep 3
echo ""
echo "MarketingOS is running!"
echo ""
echo "   Frontend:  http://localhost:3030"
echo "   Backend:   http://localhost:3031/docs"
echo ""
echo "   Login:     admin@marketingos.com / admin123"
echo ""
echo "   Logs:"
echo "   Backend:   tail -f /tmp/marketingos-backend.log"
echo "   Frontend:  tail -f /tmp/marketingos-frontend.log"
echo ""
echo "   Stop:      ./stop.sh"
```

Make it executable: `chmod +x start.sh`

Create `stop.sh`:
```bash
#!/bin/bash
kill $(lsof -ti:3030) 2>/dev/null
kill $(lsof -ti:3031) 2>/dev/null
echo "MarketingOS stopped."
```

Make it executable: `chmod +x stop.sh`

---

## Using with Docker (Optional)

If you prefer Docker:

```bash
# Build and start everything
docker-compose up --build

# Stop
docker-compose down
```

This starts: Backend, Frontend, PostgreSQL, Redis, Celery worker, Celery beat, Flower.

---

## Switching to PostgreSQL (Production)

For production, switch from SQLite to PostgreSQL:

1. Install PostgreSQL and create a database:
```bash
sudo apt install postgresql
sudo -u postgres createuser marketingos
sudo -u postgres createdb marketing_os -O marketingos
```

2. Update `backend/.env`:
```env
DATABASE_URL=postgresql+asyncpg://marketingos:password@localhost:5432/marketing_os
```

3. Restart the backend server

---

## Adding OpenAI API Key (For AI Features)

1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Edit `backend/.env`:
```env
OPENAI_API_KEY=sk-your-key-here
```
4. Restart the backend server
5. AI features (content generation, AI assistant, SEO By AI) will now work!

---

## Project Structure

```
MarketingOS/
├── backend/                 # Python FastAPI backend
│   ├── api/                 # API route handlers
│   │   ├── routes/          # All endpoint files
│   │   └── utils.py         # Shared utilities
│   ├── core/                # Core config, security, database
│   ├── models/              # SQLAlchemy database models
│   ├── schemas/             # Pydantic validation schemas
│   ├── services/            # Business logic & AI services
│   │   ├── seo_crawler/     # Website crawling & analysis
│   │   ├── keyword_engine/  # Keyword research & tracking
│   │   ├── backlink_monitor/# Backlink monitoring
│   │   ├── ai_engine/       # OpenAI integration
│   │   ├── content_studio/  # AI content generation
│   │   ├── image_generation/# AI image generation
│   │   ├── seo_by_ai/       # Autonomous SEO agent
│   │   ├── campaigns/       # Campaign management
│   │   ├── reports/         # Report generation
│   │   ├── social_media/    # Social media management
│   │   ├── ads/             # Ad platform integration
│   │   ├── alerts/          # Alert monitoring
│   │   └── crud.py          # Database CRUD operations
│   ├── tasks/               # Celery background tasks
│   ├── main.py              # FastAPI application entry
│   ├── seed.py              # Database seed script
│   └── requirements.txt     # Python dependencies
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/          # ShadCN UI components
│   │   │   └── layout/      # Layout components
│   │   ├── pages/           # All page components
│   │   ├── lib/             # Utilities & API client
│   │   ├── store/           # Zustand state management
│   │   └── types/           # TypeScript types
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml       # Docker deployment
├── USER_GUIDE.md            # Complete user guide
├── API_REFERENCE.md         # API documentation
├── SETUP_GUIDE.md           # This file
├── start.sh                 # Start script
└── stop.sh                  # Stop script
```

---

## Troubleshooting

### "Port already in use"
```bash
# Kill whatever is using the port
kill $(lsof -ti:3030) 2>/dev/null
kill $(lsof -ti:3031) 2>/dev/null
```

### "Module not found" errors
```bash
# Make sure venv is activated
source venv/bin/activate
pip install -r backend/requirements.txt
```

### "npm packages missing"
```bash
cd frontend && npm install
```

### Database issues
```bash
# Reset database completely
cd backend
rm -f marketing_os.db
python seed.py  # or run the init commands from Step 4
```

### Backend won't start
```bash
# Check the error
cd backend
source ../venv/bin/activate
python -c "from main import app; print('OK')"
```

---

## Support

- User Guide: See `USER_GUIDE.md`
- API Docs: See `API_REFERENCE.md`
- Interactive API: http://localhost:3031/docs
