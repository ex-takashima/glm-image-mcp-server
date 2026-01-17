import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';

const DEFAULT_OUTPUT_DIR = path.join(homedir(), 'Downloads', 'glm-images');

export function getOutputDirectory(): string {
  const envDir = process.env.OUTPUT_DIRECTORY;
  if (envDir) {
    return expandPath(envDir);
  }
  return DEFAULT_OUTPUT_DIR;
}

export function expandPath(filepath: string): string {
  if (filepath.startsWith('~')) {
    return path.join(homedir(), filepath.slice(1));
  }
  return path.resolve(filepath);
}

export function ensureDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function sanitizeFilename(filename: string): string {
  // Remove or replace invalid characters
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 200); // Limit length
}

export function generateFilename(prompt: string, extension: string = 'png'): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const sanitized = sanitizeFilename(prompt).slice(0, 50);
  return `${timestamp}_${sanitized}.${extension}`;
}

export function getUniqueFilepath(directory: string, filename: string): string {
  ensureDirectory(directory);

  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  let filepath = path.join(directory, filename);
  let counter = 1;

  while (fs.existsSync(filepath)) {
    filepath = path.join(directory, `${base}_${counter}${ext}`);
    counter++;
  }

  return filepath;
}

export function isPathWithinDirectory(filepath: string, directory: string): boolean {
  const resolvedPath = path.resolve(filepath);
  const resolvedDir = path.resolve(directory);
  return resolvedPath.startsWith(resolvedDir + path.sep) || resolvedPath === resolvedDir;
}

export function getSafeOutputPath(
  outputDirectory: string,
  requestedFilename?: string,
  prompt?: string
): string {
  const filename = requestedFilename
    ? sanitizeFilename(requestedFilename) + (requestedFilename.endsWith('.png') ? '' : '.png')
    : generateFilename(prompt || 'image', 'png');

  const filepath = getUniqueFilepath(outputDirectory, filename);

  // Security check: ensure the path is within the output directory
  if (!isPathWithinDirectory(filepath, outputDirectory)) {
    throw new Error('Invalid output path: path traversal detected');
  }

  return filepath;
}
