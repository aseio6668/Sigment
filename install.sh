#!/bin/bash
# Install dependencies and setup

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "========================================"
echo " Installing Sigment Language Constructor"
echo "========================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}ERROR: Node.js is not installed${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    echo "Minimum version required: Node.js 16+"
    exit 1
else
    echo -e "${GREEN}✓ Node.js found:${NC} $(node --version)"
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}ERROR: npm is not installed${NC}"
    exit 1
else
    echo -e "${GREEN}✓ npm found:${NC} $(npm --version)"
fi

echo ""
echo "Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Failed to install dependencies${NC}"
    echo "Try running: npm install --verbose"
    exit 1
fi

echo ""
echo "Creating directories..."
mkdir -p dictionaries data examples

echo ""
echo "Making scripts executable..."
chmod +x sigment.sh run.sh install.sh demo.sh clean.sh

echo ""
echo "========================================"
echo -e " ${GREEN}Installation Complete!${NC}"
echo "========================================"
echo ""
echo "Quick start:"
echo -e "  ${BLUE}./run.sh${NC}          - Interactive mode"
echo -e "  ${BLUE}npm run demo${NC}      - Run demo"
echo -e "  ${BLUE}./sigment.sh${NC}      - Command line usage"
echo ""
echo "Examples:"
echo -e "  ${BLUE}./sigment.sh generate --name MyLang --style default${NC}"
echo -e "  ${BLUE}./sigment.sh translate --language TestLang --word hello${NC}"
echo -e "  ${BLUE}./sigment.sh list${NC}"
echo ""