#!/bin/bash

# Bob Docker Setup Script
# This script sets up Docker containers for local development with production Supabase

set -e

echo "🚀 Bob Docker Setup"
echo "=================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker is not running. Please start Docker.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is installed and running${NC}"
echo ""

# Check for .env.local file
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠️  .env.local file not found. Creating from example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env.local
        echo -e "${GREEN}✅ Created .env.local from .env.example${NC}"
        echo -e "${YELLOW}⚠️  Please update .env.local with your actual keys${NC}"
    else
        echo -e "${RED}❌ .env.example not found. Please create .env.local manually.${NC}"
        exit 1
    fi
fi

# Function to stop existing containers
cleanup_containers() {
    echo "🧹 Cleaning up existing containers..."
    docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
    docker-compose -f docker-compose.yml down 2>/dev/null || true
    docker-compose -f docker-compose.ollama.yml down 2>/dev/null || true
}

# Function to remove old images
cleanup_images() {
    echo "🧹 Removing old Bob/Zola images..."
    docker rmi $(docker images -q "bob*") 2>/dev/null || true
    docker rmi $(docker images -q "zola*") 2>/dev/null || true
}

# Parse command line arguments
CLEAN=false
OLLAMA=false
PRODUCTION=false

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --clean) CLEAN=true ;;
        --ollama) OLLAMA=true ;;
        --production) PRODUCTION=true ;;
        --help)
            echo "Usage: ./scripts/setup-docker.sh [options]"
            echo ""
            echo "Options:"
            echo "  --clean       Clean up all containers and images before starting"
            echo "  --ollama      Include Ollama service for local AI models"
            echo "  --production  Use production docker-compose.yml"
            echo "  --help        Show this help message"
            exit 0
            ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# Clean up if requested
if [ "$CLEAN" = true ]; then
    cleanup_containers
    cleanup_images
    echo -e "${GREEN}✅ Cleanup complete${NC}"
    echo ""
fi

# Determine which docker-compose file to use
if [ "$PRODUCTION" = true ]; then
    COMPOSE_FILE="docker-compose.yml"
    echo "📦 Using production configuration"
else
    COMPOSE_FILE="docker-compose.dev.yml"
    echo "🔧 Using development configuration"
fi

# Build the containers
echo ""
echo "🏗️  Building Docker containers..."
docker-compose -f $COMPOSE_FILE build

# Start the services
echo ""
echo "🚀 Starting services..."
if [ "$OLLAMA" = true ]; then
    docker-compose -f $COMPOSE_FILE up -d
else
    # Start without Ollama
    docker-compose -f $COMPOSE_FILE up -d bob redis
fi

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check service health
echo ""
echo "🔍 Checking service health..."

# Check Bob app
if curl -f http://localhost:3000 &>/dev/null; then
    echo -e "${GREEN}✅ Bob app is running at http://localhost:3000${NC}"
else
    echo -e "${YELLOW}⚠️  Bob app is still starting up...${NC}"
fi

# Check Ollama if enabled
if [ "$OLLAMA" = true ]; then
    if curl -f http://localhost:11434/api/tags &>/dev/null; then
        echo -e "${GREEN}✅ Ollama is running at http://localhost:11434${NC}"
    else
        echo -e "${YELLOW}⚠️  Ollama is still starting up...${NC}"
    fi
fi

# Check Redis if in dev mode
if [ "$PRODUCTION" = false ]; then
    if docker exec bob-redis-dev redis-cli ping &>/dev/null; then
        echo -e "${GREEN}✅ Redis is running${NC}"
    else
        echo -e "${YELLOW}⚠️  Redis is still starting up...${NC}"
    fi
fi

echo ""
echo "📝 Docker containers are set up!"
echo ""
echo "🔗 Access points:"
echo "  • Bob App: http://localhost:3000"
if [ "$OLLAMA" = true ]; then
    echo "  • Ollama API: http://localhost:11434"
fi
echo ""
echo "📚 Useful commands:"
echo "  • View logs: docker-compose -f $COMPOSE_FILE logs -f"
echo "  • Stop services: docker-compose -f $COMPOSE_FILE down"
echo "  • Restart services: docker-compose -f $COMPOSE_FILE restart"
echo ""
echo -e "${GREEN}✨ Setup complete! You can now test Google OAuth at http://localhost:3000${NC}"