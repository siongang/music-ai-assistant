#!/bin/bash

# AI Music Agent - Frontend Folder Structure Setup Script
# This script creates the complete folder structure for the Next.js frontend

echo "🚀 Setting up AI Music Agent frontend folder structure..."

# Base directories
mkdir -p src/{api-client,adapters,types,features,components,lib}
mkdir -p src/api-client/endpoints
mkdir -p src/features/{object-tree,musical-objects,tools,tracks,views,transport,playback,projects,studio-shell,marketing,shortcuts}

# Object Tree feature
mkdir -p src/features/object-tree/{components,hooks,store}

# Musical Objects feature
mkdir -p src/features/musical-objects/{utils,types}

# Tools feature
mkdir -p src/features/tools/{registry,types,definitions,components,hooks,services}

# Tracks feature
mkdir -p src/features/tracks/{components,hooks,utils}

# Views feature
mkdir -p src/features/views/waveform/{hooks,utils}
mkdir -p src/features/views/midi/{components,hooks,utils}
mkdir -p src/features/views/sheet/utils

# Transport feature
mkdir -p src/features/transport/{components,hooks}

# Playback feature
mkdir -p src/features/playback/hooks

# Projects feature
mkdir -p src/features/projects/{components,hooks}

# Studio Shell feature
mkdir -p src/features/studio-shell/{components,hooks}

# Marketing feature
mkdir -p src/features/marketing/components

# Shortcuts feature
mkdir -p src/features/shortcuts/components

# Shared components
mkdir -p src/components/{ui,layout}

# App Router structure
mkdir -p app/\(marketing\)/{pricing,about}
mkdir -p app/\(studio\)/project/\[id\]
mkdir -p app/api/health

# Docs
mkdir -p docs

# Tests
mkdir -p tests/{unit,integration}

# Public assets (already exists, but ensure it)
mkdir -p public

echo "✅ Folder structure created!"
echo ""
echo "📁 Next steps:"
echo "1. Review the folder structure with: tree -L 4 src/"
echo "2. Read DEVELOPMENT_PLAN.md to understand the development phases"
echo "3. Read docs/CURSOR_PROMPTS.md for ready-to-use prompts"
echo "4. Start with Phase 1: Type System & Domain Models"
echo ""
echo "🎯 To start development:"
echo "   Copy the Phase 1 prompt from docs/CURSOR_PROMPTS.md"
echo "   Paste it into Cursor Composer"
echo "   Review and test the generated code"
echo ""
echo "Good luck! 🎵"
