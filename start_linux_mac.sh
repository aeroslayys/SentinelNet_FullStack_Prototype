#!/usr/bin/env sh
set -e
cd "$(dirname "$0")"
echo "Installing SentinelNet dependencies..."
npm run install:all
echo "Starting SentinelNet..."
npm run dev
