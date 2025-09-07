#!/bin/bash
# Quick start script for Sigment Language Constructor
# Runs in interactive mode

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

echo ""
echo "========================================"
echo " Sigment Language Constructor"
echo "========================================"
echo ""

./sigment.sh

echo ""
echo "Press Enter to continue..."
read