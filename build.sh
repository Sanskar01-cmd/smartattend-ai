#!/usr/bin/env bash
# SmartAttend AI - Render Production Build Script
set -o errexit

echo "===> Step 1: Building Frontend React Vite Assets..."
cd frontend
npm install
npm run build
cd ..

echo "===> Step 2: Installing Python Backend Dependencies..."
pip install --upgrade pip
pip install -r backend/requirements.txt

echo "===> Step 3: Applying Database Migrations..."
python backend/manage.py migrate --no-input

echo "===> Step 4: Seeding Initial Campus Events..."
python backend/manage.py seed_events

echo "===> Step 5: Collecting Static Files..."
python backend/manage.py collectstatic --no-input

echo "===> SmartAttend AI Build Complete!"
