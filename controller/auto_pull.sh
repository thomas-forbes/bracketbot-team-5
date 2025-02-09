#!/bin/bash

echo "Starting auto-pull script..."
echo "Press Ctrl+C to stop"

while true; do
    echo "Pulling from git..."
    git pull | cat
    sleep 5
done 
