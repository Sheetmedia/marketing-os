#!/bin/bash
echo "Stopping MarketingOS..."
kill $(lsof -ti:3030) 2>/dev/null
kill $(lsof -ti:3031) 2>/dev/null
echo "MarketingOS stopped."
