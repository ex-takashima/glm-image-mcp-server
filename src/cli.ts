#!/usr/bin/env node
import 'dotenv/config';
import { processBatch, formatBatchResult } from './batch.js';

interface CLIOptions {
  configPath: string;
  format: 'text' | 'json';
}

function printUsage(): void {
  console.log(`
glm-image-batch - Batch image generation using Z.AI glm-image model

Usage:
  glm-image-batch <config.json> [options]

Options:
  --format <text|json>  Output format (default: text)
  --help, -h            Show this help message

Environment Variables:
  Z_AI_API_KEY          API key for Z.AI (required)
  OUTPUT_DIRECTORY      Default output directory for images

Config File Format:
  {
    "jobs": [
      {
        "prompt": "A beautiful sunset over the ocean",
        "quality": "hd",
        "size": "1280x1280",
        "output_filename": "sunset.png"
      }
    ],
    "output_directory": "./output",
    "concurrency": 3
  }

Examples:
  glm-image-batch batch.json
  glm-image-batch batch.json --format json
  Z_AI_API_KEY=xxx glm-image-batch batch.json
`);
}

function parseArgs(args: string[]): CLIOptions | null {
  const positionalArgs: string[] = [];
  let format: 'text' | 'json' = 'text';

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    }

    if (arg === '--format') {
      const formatArg = args[++i];
      if (formatArg !== 'text' && formatArg !== 'json') {
        console.error('Error: --format must be "text" or "json"');
        return null;
      }
      format = formatArg;
    } else if (!arg.startsWith('-')) {
      positionalArgs.push(arg);
    } else {
      console.error(`Error: Unknown option: ${arg}`);
      return null;
    }
  }

  if (positionalArgs.length === 0) {
    console.error('Error: Config file path is required');
    return null;
  }

  if (positionalArgs.length > 1) {
    console.error('Error: Only one config file can be specified');
    return null;
  }

  return {
    configPath: positionalArgs[0],
    format,
  };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    printUsage();
    process.exit(1);
  }

  const options = parseArgs(args);
  if (!options) {
    process.exit(1);
  }

  // Check for API key
  if (!process.env.Z_AI_API_KEY) {
    console.error('Error: Z_AI_API_KEY environment variable is required');
    process.exit(1);
  }

  try {
    console.error(`Processing batch config: ${options.configPath}`);
    const result = await processBatch(options.configPath);
    const output = formatBatchResult(result, options.format);
    console.log(output);

    // Exit with code 1 if any jobs failed
    if (result.failed > 0) {
      process.exit(1);
    }
    process.exit(0);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error: ${message}`);
    process.exit(1);
  }
}

main();
