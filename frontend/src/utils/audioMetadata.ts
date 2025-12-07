export interface AudioMetadata {
  duration: number;
  sampleRate: number;
  numberOfChannels: number;
  bitDepth?: number;
  isHD: boolean;
  qualityLabel: string;
}

export async function extractAudioMetadata(file: File): Promise<AudioMetadata> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();

    // Set volume to avoid conflicts
    audio.volume = 1.0;
    audio.muted = false;

    audio.addEventListener('loadedmetadata', () => {
      const duration = audio.duration;

      // Estimate sample rate from file name or use defaults
      const fileName = file.name.toLowerCase();
      let sampleRate = 48000; // Default HD
      let bitDepth = 24; // Default

      // Parse from filename if available (e.g., "song_96kHz_24bit.wav")
      if (fileName.includes('192khz') || fileName.includes('192k')) sampleRate = 192000;
      else if (fileName.includes('96khz') || fileName.includes('96k')) sampleRate = 96000;
      else if (fileName.includes('48khz') || fileName.includes('48k')) sampleRate = 48000;
      else if (fileName.includes('44.1khz') || fileName.includes('44khz')) sampleRate = 44100;

      if (fileName.includes('16bit') || fileName.includes('16-bit')) bitDepth = 16;
      else if (fileName.includes('24bit') || fileName.includes('24-bit')) bitDepth = 24;

      // Estimate from file size
      const estimatedBitDepth = estimateBitDepth(file.size, duration, sampleRate, 2);
      if (!fileName.includes('bit')) {
        bitDepth = estimatedBitDepth;
      }

      const numberOfChannels = 2; // Assume stereo (can't determine without decoding)
      const isHD = sampleRate >= 48000;

      // Quality label
      let qualityLabel = 'SD';
      if (sampleRate >= 192000) qualityLabel = 'Ultra HD';
      else if (sampleRate >= 96000) qualityLabel = 'HD 96kHz';
      else if (sampleRate >= 48000) qualityLabel = 'HD';
      else if (sampleRate >= 44100) qualityLabel = 'CD Quality';

      resolve({
        duration,
        sampleRate,
        numberOfChannels,
        bitDepth,
        isHD,
        qualityLabel
      });

      // Clean up
      audio.src = '';
      URL.revokeObjectURL(audio.src);
    });

    audio.addEventListener('error', () => {
      reject(new Error('Failed to load audio metadata'));
      audio.src = '';
    });

    audio.src = URL.createObjectURL(file);
  });
}

function estimateBitDepth(fileSize: number, duration: number, sampleRate: number, channels: number): number {
  if (duration === 0) return 16;

  const bitsPerSecond = (fileSize * 8) / duration;
  const totalSamplesPerSecond = sampleRate * channels;
  const estimatedBitDepth = bitsPerSecond / totalSamplesPerSecond;

  // Round to nearest common bit depth
  if (estimatedBitDepth > 20) return 24;
  if (estimatedBitDepth > 12) return 16;
  return 16;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatSampleRate(sampleRate: number): string {
  if (sampleRate >= 1000) {
    return `${(sampleRate / 1000).toFixed(1)}kHz`;
  }
  return `${sampleRate}Hz`;
}
