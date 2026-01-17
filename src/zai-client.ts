import axios, { AxiosError } from 'axios';
import * as fs from 'fs';
import type {
  ZAIImageGenerationRequest,
  ZAIImageGenerationResponse,
  ZAIErrorResponse,
  GenerateImageParams,
  GenerateImageResult,
} from './types.js';
import { getOutputDirectory, getSafeOutputPath } from './utils/path.js';

const API_ENDPOINT = 'https://api.z.ai/api/paas/v4/images/generations';
const DEFAULT_QUALITY = 'hd';
const DEFAULT_SIZE = '1280x1280';

export class ZAIClient {
  private apiKey: string;
  private outputDirectory: string;

  constructor(apiKey?: string, outputDirectory?: string) {
    this.apiKey = apiKey || process.env.Z_AI_API_KEY || '';
    this.outputDirectory = outputDirectory || getOutputDirectory();

    if (!this.apiKey) {
      throw new Error('Z_AI_API_KEY is required. Set it via environment variable or constructor.');
    }
  }

  async generateImage(params: GenerateImageParams): Promise<GenerateImageResult> {
    try {
      const requestBody: ZAIImageGenerationRequest = {
        model: 'glm-image',
        prompt: params.prompt,
        quality: params.quality || DEFAULT_QUALITY,
        size: params.size || DEFAULT_SIZE,
      };

      const response = await axios.post<ZAIImageGenerationResponse>(
        API_ENDPOINT,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 120000, // 2 minutes timeout for image generation
        }
      );

      if (!response.data.data || response.data.data.length === 0) {
        return {
          success: false,
          error: 'No image URL returned from API',
        };
      }

      const imageUrl = response.data.data[0].url;

      // Download the image
      const filepath = await this.downloadImage(
        imageUrl,
        params.output_filename,
        params.prompt
      );

      return {
        success: true,
        filepath,
        url: imageUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  private async downloadImage(
    url: string,
    outputFilename?: string,
    prompt?: string
  ): Promise<string> {
    const filepath = getSafeOutputPath(this.outputDirectory, outputFilename, prompt);

    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 60000, // 1 minute timeout for download
    });

    fs.writeFileSync(filepath, Buffer.from(response.data));

    return filepath;
  }

  private formatError(error: unknown): string {
    if (error instanceof AxiosError) {
      const responseData = error.response?.data as ZAIErrorResponse | undefined;
      if (responseData?.error?.message) {
        return `API Error: ${responseData.error.message}`;
      }
      if (error.response?.status) {
        return `HTTP Error ${error.response.status}: ${error.message}`;
      }
      return `Network Error: ${error.message}`;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'Unknown error occurred';
  }

  getOutputDirectory(): string {
    return this.outputDirectory;
  }

  setOutputDirectory(directory: string): void {
    this.outputDirectory = directory;
  }
}
