// Recommended sizes from Z.AI documentation
export const RECOMMENDED_SIZES = {
  '1:1': '1280x1280',
  '3:2': '1568x1056',
  '2:3': '1056x1568',
  '4:3': '1472x1088',
  '3:4': '1088x1472',
  '16:9': '1728x960',
  '9:16': '960x1728',
} as const;

export type SizePreset = keyof typeof RECOMMENDED_SIZES;

export const SIZE_PRESETS = Object.keys(RECOMMENDED_SIZES) as SizePreset[];

// Validation constants
const MIN_DIMENSION = 1024;
const MAX_DIMENSION = 2048;
const DIVISOR = 32;
const MAX_TOTAL_PIXELS = Math.pow(2, 22); // ~4.19 million pixels

export interface SizeValidationResult {
  valid: boolean;
  size?: string;
  error?: string;
}

export function parseSize(sizeStr: string): { width: number; height: number } | null {
  const match = sizeStr.match(/^(\d+)x(\d+)$/);
  if (!match) return null;
  return {
    width: parseInt(match[1], 10),
    height: parseInt(match[2], 10),
  };
}

export function validateCustomSize(sizeStr: string): SizeValidationResult {
  const parsed = parseSize(sizeStr);

  if (!parsed) {
    return {
      valid: false,
      error: `Invalid size format: "${sizeStr}". Use "WIDTHxHEIGHT" format (e.g., "1280x1280")`,
    };
  }

  const { width, height } = parsed;

  // Check dimension range
  if (width < MIN_DIMENSION || width > MAX_DIMENSION) {
    return {
      valid: false,
      error: `Width ${width}px is out of range. Must be ${MIN_DIMENSION}-${MAX_DIMENSION}px`,
    };
  }

  if (height < MIN_DIMENSION || height > MAX_DIMENSION) {
    return {
      valid: false,
      error: `Height ${height}px is out of range. Must be ${MIN_DIMENSION}-${MAX_DIMENSION}px`,
    };
  }

  // Check divisibility by 32
  if (width % DIVISOR !== 0) {
    return {
      valid: false,
      error: `Width ${width}px must be divisible by ${DIVISOR}. Suggested: ${Math.round(width / DIVISOR) * DIVISOR}px`,
    };
  }

  if (height % DIVISOR !== 0) {
    return {
      valid: false,
      error: `Height ${height}px must be divisible by ${DIVISOR}. Suggested: ${Math.round(height / DIVISOR) * DIVISOR}px`,
    };
  }

  // Check total pixel count
  const totalPixels = width * height;
  if (totalPixels > MAX_TOTAL_PIXELS) {
    return {
      valid: false,
      error: `Total pixels (${totalPixels.toLocaleString()}) exceeds maximum (${MAX_TOTAL_PIXELS.toLocaleString()})`,
    };
  }

  return {
    valid: true,
    size: sizeStr,
  };
}

export function resolveSize(
  sizePreset?: SizePreset,
  customSize?: string
): SizeValidationResult {
  // If custom size is provided, validate it
  if (customSize) {
    return validateCustomSize(customSize);
  }

  // If preset is provided, use it
  if (sizePreset) {
    const size = RECOMMENDED_SIZES[sizePreset];
    if (!size) {
      return {
        valid: false,
        error: `Invalid size preset: "${sizePreset}". Valid presets: ${SIZE_PRESETS.join(', ')}`,
      };
    }
    return {
      valid: true,
      size,
    };
  }

  // Default to 1:1
  return {
    valid: true,
    size: RECOMMENDED_SIZES['1:1'],
  };
}
