#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import 'dotenv/config';
import { ZAIClient } from './zai-client.js';
import { resolveSize, SIZE_PRESETS, type SizePreset } from './utils/size.js';

const server = new McpServer({
  name: 'glm-image-mcp-server',
  version: '1.0.0',
});

// Initialize client (will be created on first tool call to allow lazy API key loading)
let client: ZAIClient | null = null;

function getClient(): ZAIClient {
  if (!client) {
    client = new ZAIClient();
  }
  return client;
}

// Define the generate_image tool
server.tool(
  'generate_image',
  'Generate an image from a text prompt using Z.AI glm-image model',
  {
    prompt: z.string().describe('The text prompt describing the image to generate'),
    quality: z.enum(['hd', 'standard']).optional().describe('Image quality: "hd" (default) or "standard"'),
    size_preset: z.enum(['1:1', '3:2', '2:3', '4:3', '3:4', '16:9', '9:16']).optional()
      .describe('Recommended size preset by aspect ratio. "1:1"=1280x1280 (default), "3:2"=1568x1056, "2:3"=1056x1568, "4:3"=1472x1088, "3:4"=1088x1472, "16:9"=1728x960, "9:16"=960x1728'),
    custom_size: z.string().optional()
      .describe('Custom size (e.g., "1536x1024"). Must be 1024-2048px, divisible by 32, max 2^22 total pixels. Ignored if size_preset is specified'),
    output_filename: z.string().optional().describe('Optional output filename (without path)'),
  },
  async (params) => {
    try {
      // Resolve and validate size
      const sizeResult = resolveSize(
        params.size_preset as SizePreset | undefined,
        params.custom_size
      );

      if (!sizeResult.valid) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                success: false,
                error: sizeResult.error,
              }, null, 2),
            },
          ],
          isError: true,
        };
      }

      const zaiClient = getClient();
      const result = await zaiClient.generateImage({
        prompt: params.prompt,
        quality: params.quality,
        size: sizeResult.size,
        output_filename: params.output_filename,
      });

      if (result.success) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                success: true,
                message: 'Image generated successfully',
                filepath: result.filepath,
                url: result.url,
              }, null, 2),
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                success: false,
                error: result.error,
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: errorMessage,
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('glm-image MCP server started');
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
