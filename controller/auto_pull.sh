#!/bin/bash

# Change to the script's directory
cd "$(dirname "$0")"

echo "Starting auto-pull script..."
echo "Press Ctrl+C to stop"

while true; do
    echo "Pulling from git..."
    git pull | cat
    sleep 5
done 
