// Z.AI API Types
export interface ZAIImageGenerationRequest {
  model: 'glm-image';
  prompt: string;
  quality?: 'hd' | 'standard';
  size?: string;
  user_id?: string;
}

export interface ZAIImageGenerationResponse {
  data: Array<{ url: string }>;
  created: number;
}

export interface ZAIErrorResponse {
  error?: {
    message: string;
    type?: string;
    code?: string;
  };
}

// MCP Tool Types
export interface GenerateImageParams {
  prompt: string;
  quality?: 'hd' | 'standard';
  size?: string;
  output_filename?: string;
}

export interface GenerateImageResult {
  success: boolean;
  filepath?: string;
  url?: string;
  error?: string;
}

// Size Types
export type SizePreset = '1:1' | '3:2' | '2:3' | '4:3' | '3:4' | '16:9' | '9:16';

// Batch Processing Types
export interface BatchJob {
  prompt: string;
  quality?: 'hd' | 'standard';
  size_preset?: SizePreset;
  custom_size?: string;
  output_filename?: string;
}

export interface BatchConfig {
  jobs: BatchJob[];
  output_directory?: string;
  concurrency?: number;
}

export interface BatchJobResult {
  job: BatchJob;
  success: boolean;
  filepath?: string;
  error?: string;
}

export interface BatchResult {
  total: number;
  successful: number;
  failed: number;
  results: BatchJobResult[];
}

// Configuration Types
export interface Config {
  apiKey: string;
  outputDirectory: string;
}
