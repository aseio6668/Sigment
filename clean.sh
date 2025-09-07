#!/bin/bash
# Clean build artifacts and generated files

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

echo ""
echo "========================================"
echo " Cleaning Sigment Language Constructor"
echo "========================================"
echo ""

echo "Cleaning generated dictionaries..."
if [ -d "dictionaries" ]; then
    rm -rf "dictionaries"
    mkdir -p "dictionaries"
    echo "- Dictionaries cleaned"
else
    mkdir -p "dictionaries"
    echo "- Dictionaries directory created"
fi

echo "Cleaning node_modules..."
if [ -d "node_modules" ]; then
    rm -rf "node_modules"
    echo "- Node modules removed"
fi

echo "Cleaning npm cache..."
if [ -f "package-lock.json" ]; then
    rm "package-lock.json"
    echo "- Package lock removed"
fi

echo ""
echo "Clean complete! Run './install.sh' to reinstall dependencies."