# CLAUDE.md - Development Guide

## Project Overview

This is an MCP (Model Context Protocol) server for generating images using Z.AI's glm-image model.

## Build & Run Commands

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run MCP server
npm start

# Run batch CLI
npm run batch -- config.json

# Development (watch mode)
npm run dev
```

## Architecture

```
src/
├── index.ts          # MCP server entry point
├── cli.ts            # Batch CLI entry point
├── batch.ts          # Batch processing logic
├── zai-client.ts     # Z.AI API client
├── types.ts          # TypeScript type definitions
└── utils/
    └── path.ts       # Path utilities (sanitization, unique filenames)
```

## Key Components

### ZAIClient (`src/zai-client.ts`)
- Handles API communication with Z.AI
- Downloads images from returned URLs
- Error handling and formatting

### MCP Server (`src/index.ts`)
- Exposes `generate_image` tool
- Uses `@modelcontextprotocol/sdk` for MCP protocol
- Lazy initialization of API client

### Batch Processor (`src/batch.ts`)
- Reads JSON config files
- Parallel job execution with concurrency control
- Progress reporting and result formatting

### Path Utilities (`src/utils/path.ts`)
- Filename sanitization (removes invalid characters)
- Auto-numbering for duplicate filenames
- Path traversal protection

## API Notes

- Z.AI API endpoint: `https://open.z.ai/paas/v4/images/generations`
- Model is fixed as `glm-image`
- Timeout: 2 minutes for generation, 1 minute for download
- Images are returned as URLs that need to be downloaded

## Testing

```bash
# Test with MCP inspector
npx @anthropic/mcp-inspector dist/index.js

# Test batch CLI
echo '{"jobs":[{"prompt":"test image"}]}' > test.json
Z_AI_API_KEY=your_key npx glm-image-batch test.json
```

## Environment Variables

- `Z_AI_API_KEY`: Required for API authentication
- `OUTPUT_DIRECTORY`: Override default download location
