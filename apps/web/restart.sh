#!/bin/bash
lsof -ti:3000 | xargs kill 2>/dev/null; sleep 2; lsof -ti:3000 | xargs kill -9 2>/dev/null
rm -rf .next
pnpm install
pnpm run dev > server.log 2>&1 &
