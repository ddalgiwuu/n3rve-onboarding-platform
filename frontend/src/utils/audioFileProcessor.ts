// Note: music-metadata-browser is deprecated, using simple fallback for now
// TODO: Consider upgrading to music-metadata v9+ when needed

export interface ExtractedMetadata {
  title?: string;
  artist?: string;
  album?: string;
  genre?: string;
}

export interface AudioTechnicalInfo {
  duration?: number;
  sampleRate?: number;
  bitDepth?: number;
  format?: string;
  fileSize: number;
}

export interface AudioProcessingResult {
  metadata: ExtractedMetadata;
  technicalInfo: AudioTechnicalInfo;
  qualityScore: number;
  waveformData?: number[];
}

/**
 * Extract metadata from audio file
 * For now, returns empty metadata - users will input manually
 * TODO: Implement proper ID3 extraction when library compatibility is resolved
 */
export async function extractID3Tags(file: File): Promise<ExtractedMetadata> {
  // Simple fallback: Extract title from filename
  const fileName = file.name.replace(/\.(wav|flac|mp3|aiff|m4a)$/i, '');

  return {
    title: fileName
    // Other fields will be inherited from album or entered manually
  };
}

/**
 * Extract technical information from audio file
 */
export async function extractTechnicalInfo(file: File): Promise<AudioTechnicalInfo> {
  const format = file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN';
  const fileSize = file.size;

  return new Promise((resolve) => {
    // Create audio element to extract duration and sample rate
    const audio = document.createElement('audio');
    const url = URL.createObjectURL(file);

    audio.addEventListener('loadedmetadata', () => {
      const duration = audio.duration;

      // Estimate sample rate based on format
      // Note: Exact sample rate requires Web Audio API decoding
      let estimatedSampleRate: number | undefined;
      let estimatedBitDepth: number | undefined;

      if (format === 'FLAC' || format === 'WAV') {
        estimatedSampleRate = 96000;  // Assume HD for lossless
        estimatedBitDepth = 24;
      } else if (format === 'MP3') {
        estimatedSampleRate = 44100;
        estimatedBitDepth = 16;
      }

      URL.revokeObjectURL(url);

      resolve({
        duration,
        sampleRate: estimatedSampleRate,
        bitDepth: estimatedBitDepth,
        format,
        fileSize
      });
    });

    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      resolve({
        format,
        fileSize
      });
    });

    audio.src = url;
  });
}

/**
 * Calculate quality score based on technical specs
 * @returns Score from 0-100
 */
export function calculateQualityScore(technicalInfo: AudioTechnicalInfo): number {
  let score = 0;

  // Format scoring (40 points max)
  if (technicalInfo.format === 'FLAC' || technicalInfo.format === 'WAV') {
    score += 40;
  } else if (technicalInfo.format === 'AIFF') {
    score += 35;
  } else if (technicalInfo.format === 'MP3') {
    score += 25;
  } else {
    score += 10;
  }

  // Sample rate scoring (30 points max)
  if (technicalInfo.sampleRate) {
    if (technicalInfo.sampleRate >= 96000) {
      score += 30;
    } else if (technicalInfo.sampleRate >= 48000) {
      score += 25;
    } else if (technicalInfo.sampleRate >= 44100) {
      score += 20;
    } else {
      score += 10;
    }
  }

  // Bit depth scoring (30 points max)
  if (technicalInfo.bitDepth) {
    if (technicalInfo.bitDepth >= 24) {
      score += 30;
    } else if (technicalInfo.bitDepth >= 16) {
      score += 20;
    } else {
      score += 10;
    }
  }

  return Math.min(score, 100);
}

/**
 * Generate simplified waveform data for visualization
 */
export async function generateWaveformData(file: File, samples: number = 100): Promise<number[]> {
  return new Promise((resolve) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const fileReader = new FileReader();

    fileReader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const rawData = audioBuffer.getChannelData(0); // Use first channel
        const blockSize = Math.floor(rawData.length / samples);
        const waveformData: number[] = [];

        for (let i = 0; i < samples; i++) {
          const start = blockSize * i;
          let sum = 0;

          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(rawData[start + j]);
          }

          waveformData.push(sum / blockSize);
        }

        resolve(waveformData);
      } catch (error) {
        console.warn('Waveform generation failed:', error);
        resolve(Array(samples).fill(0.5));  // Return placeholder data
      }
    };

    fileReader.onerror = () => {
      resolve(Array(samples).fill(0.5));  // Return placeholder on error
    };

    fileReader.readAsArrayBuffer(file);
  });
}

/**
 * Process audio file completely: extract metadata, technical info, quality, waveform
 */
export async function processAudioFile(file: File): Promise<AudioProcessingResult> {
  try {
    const [metadata, technicalInfo, waveformData] = await Promise.all([
      extractID3Tags(file),
      extractTechnicalInfo(file),
      generateWaveformData(file)
    ]);

    const qualityScore = calculateQualityScore(technicalInfo);

    return {
      metadata,
      technicalInfo,
      qualityScore,
      waveformData
    };
  } catch (error) {
    console.error('Audio file processing failed:', error);
    throw error;
  }
}
