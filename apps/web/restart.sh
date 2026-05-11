#!/bin/bash
lsof -ti:3000 | xargs kill -9
rm -rf .next
pnpm install
pnpm run dev > server.log 2>&1 &
