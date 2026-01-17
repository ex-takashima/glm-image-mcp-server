import * as fs from 'fs';
import type { BatchConfig, BatchJob, BatchJobResult, BatchResult } from './types.js';
import { ZAIClient } from './zai-client.js';
import { expandPath } from './utils/path.js';
import { resolveSize, type SizePreset } from './utils/size.js';

const DEFAULT_CONCURRENCY = 3;

export async function processBatch(configPath: string): Promise<BatchResult> {
  // Read and parse config file
  const configContent = fs.readFileSync(expandPath(configPath), 'utf-8');
  const config: BatchConfig = JSON.parse(configContent);

  if (!config.jobs || !Array.isArray(config.jobs) || config.jobs.length === 0) {
    throw new Error('Config must contain a non-empty "jobs" array');
  }

  // Initialize client with optional output directory from config
  const client = new ZAIClient(
    undefined, // Use env API key
    config.output_directory ? expandPath(config.output_directory) : undefined
  );

  const concurrency = config.concurrency || DEFAULT_CONCURRENCY;
  const results: BatchJobResult[] = [];

  // Process jobs with concurrency control
  for (let i = 0; i < config.jobs.length; i += concurrency) {
    const batch = config.jobs.slice(i, i + concurrency);
    const batchPromises = batch.map((job) => processJob(client, job));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Log progress
    const completed = Math.min(i + concurrency, config.jobs.length);
    console.error(`Progress: ${completed}/${config.jobs.length} jobs completed`);
  }

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return {
    total: config.jobs.length,
    successful,
    failed,
    results,
  };
}

async function processJob(client: ZAIClient, job: BatchJob): Promise<BatchJobResult> {
  try {
    // Resolve and validate size
    const sizeResult = resolveSize(
      job.size_preset as SizePreset | undefined,
      job.custom_size
    );

    if (!sizeResult.valid) {
      return {
        job,
        success: false,
        error: sizeResult.error,
      };
    }

    const result = await client.generateImage({
      prompt: job.prompt,
      quality: job.quality,
      size: sizeResult.size,
      output_filename: job.output_filename,
    });

    if (result.success) {
      return {
        job,
        success: true,
        filepath: result.filepath,
      };
    } else {
      return {
        job,
        success: false,
        error: result.error,
      };
    }
  } catch (error) {
    return {
      job,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export function formatBatchResult(result: BatchResult, format: 'text' | 'json'): string {
  if (format === 'json') {
    return JSON.stringify(result, null, 2);
  }

  // Text format
  const lines: string[] = [
    '='.repeat(60),
    'Batch Processing Results',
    '='.repeat(60),
    `Total: ${result.total}`,
    `Successful: ${result.successful}`,
    `Failed: ${result.failed}`,
    '',
    'Details:',
    '-'.repeat(60),
  ];

  for (const jobResult of result.results) {
    const status = jobResult.success ? '[SUCCESS]' : '[FAILED]';
    const prompt = jobResult.job.prompt.slice(0, 50) + (jobResult.job.prompt.length > 50 ? '...' : '');
    lines.push(`${status} ${prompt}`);
    if (jobResult.success && jobResult.filepath) {
      lines.push(`  -> ${jobResult.filepath}`);
    }
    if (!jobResult.success && jobResult.error) {
      lines.push(`  Error: ${jobResult.error}`);
    }
  }

  lines.push('='.repeat(60));

  return lines.join('\n');
}
