#!/bin/bash

# Quick setup script for Bob worktree workflow
# Run this once to configure everything

set -e

echo "🚀 Bob Worktree Quick Setup"
echo "=========================="
echo ""

# Make scripts executable
chmod +x scripts/bob-worktree.sh

# Create alias
SHELL_PROFILE=""
if [ -f ~/.zshrc ]; then
    SHELL_PROFILE=~/.zshrc
elif [ -f ~/.bashrc ]; then
    SHELL_PROFILE=~/.bashrc
fi

if [ -n "$SHELL_PROFILE" ]; then
    echo "Adding 'bw' alias to $SHELL_PROFILE..."
    echo "" >> $SHELL_PROFILE
    echo "# Bob Worktree Manager" >> $SHELL_PROFILE
    echo "alias bw='bash $PWD/scripts/bob-worktree.sh'" >> $SHELL_PROFILE
    echo "✅ Alias added"
fi

# Configure pnpm if available
if command -v pnpm &> /dev/null; then
    echo "Configuring pnpm shared store..."
    pnpm config set store-dir ~/.pnpm-store
    echo "✅ pnpm configured"
else
    echo "⚠️  pnpm not found. Install with: npm install -g pnpm"
fi

# Create worktree base directory
mkdir -p bob-worktrees
echo "✅ Worktree directory created: bob-worktrees/"

# Create metrics directory for Claude
mkdir -p .claude-metrics
echo "✅ Claude metrics directory created"

echo ""
echo "✨ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Reload your shell: source $SHELL_PROFILE"
echo "2. Create your first worktree: bw create feature/my-feature"
echo "3. Start Claude in worktree: bw claude feature/my-feature"
echo ""
echo "Quick Commands:"
echo "  bw create <branch>  - Create worktree"
echo "  bw list            - List worktrees"
echo "  bw status          - Status dashboard"
echo "  bw remove <branch> - Remove worktree"
echo ""
echo "📖 Full documentation: docs/WORKTREE_WORKFLOW.md"