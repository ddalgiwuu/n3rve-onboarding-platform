/**
 * Waveform Variant Examples
 * Showcase different color schemes and styles for the ModernWaveform component
 */

import ModernWaveform from './ModernWaveform';

// Mock waveform data for demo
const mockWaveformData = Array(50).fill(0).map(() => Math.random() * 0.7 + 0.3);

interface WaveformVariantProps {
  isPlaying?: boolean;
  currentTime?: number;
  duration?: number;
}

export function WaveformVariants({
  isPlaying = false,
  currentTime = 15,
  duration = 180
}: WaveformVariantProps) {
  return (
    <div className="space-y-8 p-8 bg-gray-50 dark:bg-gray-900">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Modern Waveform Variants
      </h2>

      {/* Default - Purple/Pink/Blue */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          1. Default (Purple → Pink → Blue)
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Vibrant gradient perfect for music platforms and creative apps
        </p>
        <ModernWaveform
          waveformData={mockWaveformData}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          onSeek={(time) => console.log('Seek to:', time)}
        />
      </div>

      {/* Compact Version */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          2. Compact Version
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Space-efficient design for lists or tight layouts
        </p>
        <ModernWaveform
          waveformData={mockWaveformData}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          className="h-12"
        />
      </div>

      {/* Large Version */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          3. Large Featured Display
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Prominent showcase for main player or hero sections
        </p>
        <ModernWaveform
          waveformData={mockWaveformData}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          className="h-24 shadow-2xl"
        />
      </div>

      {/* Without Seeking */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          4. Display Only (No Seeking)
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Pure visualization without interaction
        </p>
        <ModernWaveform
          waveformData={mockWaveformData}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          // No onSeek prop = no interaction
        />
      </div>

      {/* Custom Glass Effect */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          5. Enhanced Glassmorphism
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Extra blur and depth for premium feel
        </p>
        <ModernWaveform
          waveformData={mockWaveformData}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          className="backdrop-blur-lg shadow-2xl border-2"
        />
      </div>

      {/* Static Display */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          6. Static Waveform (Not Playing)
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Clean preview before playback starts
        </p>
        <ModernWaveform
          waveformData={mockWaveformData}
          isPlaying={false}
          currentTime={0}
          duration={duration}
        />
      </div>

      {/* Full Width */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          7. Full Width Player
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Spanning container width for immersive experience
        </p>
        <div className="max-w-full">
          <ModernWaveform
            waveformData={mockWaveformData}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            className="w-full"
          />
        </div>
      </div>

      {/* Color Palette Reference */}
      <div className="space-y-4 pt-8 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          Color Palette Reference
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Purple */}
          <div className="space-y-2">
            <div className="h-20 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 shadow-lg" />
            <p className="text-sm font-mono text-gray-600 dark:text-gray-400">
              Purple: #a855f7
            </p>
          </div>

          {/* Pink */}
          <div className="space-y-2">
            <div className="h-20 rounded-lg bg-gradient-to-br from-pink-400 to-pink-600 shadow-lg" />
            <p className="text-sm font-mono text-gray-600 dark:text-gray-400">
              Pink: #ec4899
            </p>
          </div>

          {/* Blue */}
          <div className="space-y-2">
            <div className="h-20 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg" />
            <p className="text-sm font-mono text-gray-600 dark:text-gray-400">
              Blue: #3b82f6
            </p>
          </div>
        </div>

        {/* Gradient Visualization */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Combined Gradient (Active State)
          </p>
          <div className="h-20 rounded-lg bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 shadow-xl" />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Combined Gradient (Inactive State - 30% opacity)
          </p>
          <div className="h-20 rounded-lg bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-blue-500/30 shadow-xl" />
        </div>
      </div>

      {/* Alternative Color Schemes */}
      <div className="space-y-4 pt-8 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          Alternative Color Schemes (For Customization)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Green-Cyan */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Nature Theme (Green → Cyan)</p>
            <div className="h-16 rounded-lg bg-gradient-to-r from-green-500 via-cyan-500 to-teal-500 shadow-lg" />
            <p className="text-xs font-mono text-gray-500">
              #22c55e → #06b6d4 → #14b8a6
            </p>
          </div>

          {/* Orange-Red */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Warm Theme (Orange → Red)</p>
            <div className="h-16 rounded-lg bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 shadow-lg" />
            <p className="text-xs font-mono text-gray-500">
              #f97316 → #ef4444 → #ec4899
            </p>
          </div>

          {/* Indigo-Purple */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Royal Theme (Indigo → Purple)</p>
            <div className="h-16 rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500 shadow-lg" />
            <p className="text-xs font-mono text-gray-500">
              #6366f1 → #a855f7 → #8b5cf6
            </p>
          </div>

          {/* Yellow-Orange */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Sunset Theme (Yellow → Orange)</p>
            <div className="h-16 rounded-lg bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 shadow-lg" />
            <p className="text-xs font-mono text-gray-500">
              #eab308 → #f97316 → #ef4444
            </p>
          </div>
        </div>
      </div>

      {/* Implementation Notes */}
      <div className="space-y-4 pt-8 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          Implementation Notes
        </h3>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
            ⚡ Performance Tips
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
            <li>Limit waveform data to 50 points for optimal rendering</li>
            <li>Use CSS transforms for animations (GPU accelerated)</li>
            <li>Implement proper cleanup for audio elements</li>
            <li>Consider memoizing normalized data for large datasets</li>
          </ul>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <h4 className="font-semibold text-green-900 dark:text-green-200 mb-2">
            ✨ Customization Options
          </h4>
          <ul className="text-sm text-green-800 dark:text-green-300 space-y-1 list-disc list-inside">
            <li>Adjust height: className="h-12", "h-16", "h-20", "h-24"</li>
            <li>Modify gradient colors in component CSS</li>
            <li>Toggle animations: remove pulse class when not playing</li>
            <li>Change bar count by adjusting slice() parameter</li>
          </ul>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <h4 className="font-semibold text-purple-900 dark:text-purple-200 mb-2">
            🎨 Design Considerations
          </h4>
          <ul className="text-sm text-purple-800 dark:text-purple-300 space-y-1 list-disc list-inside">
            <li>Glassmorphism requires backdrop-filter support</li>
            <li>Test in both light and dark modes</li>
            <li>Ensure sufficient contrast for accessibility</li>
            <li>Consider reduced-motion preferences for animations</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default WaveformVariants;
