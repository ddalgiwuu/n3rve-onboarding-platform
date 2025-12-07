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
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    audio.addEventListener('loadedmetadata', () => {
      const duration = audio.duration;

      // Read file as ArrayBuffer to get detailed metadata
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          const sampleRate = audioBuffer.sampleRate;
          const numberOfChannels = audioBuffer.numberOfChannels;

          // Determine if HD quality
          const isHD = sampleRate >= 48000;

          // Estimate bit depth from file size (approximation)
          const bitDepth = estimateBitDepth(file.size, duration, sampleRate, numberOfChannels);

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

          audioContext.close();
        } catch (error) {
          // Fallback: basic metadata only
          resolve({
            duration,
            sampleRate: 44100,
            numberOfChannels: 2,
            isHD: false,
            qualityLabel: 'Standard'
          });
          audioContext.close();
        }
      };

      reader.readAsArrayBuffer(file);
    });

    audio.addEventListener('error', () => {
      reject(new Error('Failed to load audio metadata'));
      audioContext.close();
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
