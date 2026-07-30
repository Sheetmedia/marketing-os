#!/bin/bash
echo "🚀 Starting MarketingOS..."
echo ""

# Kill existing processes
kill $(lsof -ti:3030) 2>/dev/null
kill $(lsof -ti:3031) 2>/dev/null
sleep 1

DIR="$(cd "$(dirname "$0")" && pwd)"

# Start backend
source "$DIR/venv/bin/activate"
cd "$DIR/backend" && uvicorn main:app --host 0.0.0.0 --port 3031 > /tmp/marketingos-backend.log 2>&1 &
BACKEND_PID=$!

# Start frontend
cd "$DIR/frontend" && npx vite --host 0.0.0.0 --port 3030 > /tmp/marketingos-frontend.log 2>&1 &
FRONTEND_PID=$!

sleep 4
echo "============================================"
echo "  MarketingOS is running!"
echo "============================================"
echo ""
echo "  Frontend:  http://localhost:3030"
echo "  Backend:   http://localhost:3031/docs"
echo ""
echo "  Login:     admin@marketingos.com / admin123"
echo ""
echo "  Logs:"
echo "    Backend:  tail -f /tmp/marketingos-backend.log"
echo "    Frontend: tail -f /tmp/marketingos-frontend.log"
echo ""
echo "  Stop:      ./stop.sh"
echo "============================================"
