import { clsx } from 'clsx';
import { AIPitchEditor } from './AIPitchEditor';
import { TagMultiSelect } from '../ui/TagMultiSelect';
import { StarRating } from '../ui/StarRating';
import { CharLimitTextarea } from '../ui/CharLimitTextarea';
import { Target, DollarSign, FileText, Settings2, Youtube, Music2, Image } from 'lucide-react';
import { FUGA_MOODS, FUGA_INSTRUMENTS } from '@/constants/fuga-data';

interface MarketingSectionProps {
  // Pitch fields
  hook: string;
  onHookChange: (value: string) => void;
  mainPitch: string;
  onMainPitchChange: (value: string) => void;

  // Metadata
  moods: string[];
  onMoodsChange: (value: string[]) => void;
  instruments: string[];
  onInstrumentsChange: (value: string[]) => void;

  // Priority
  priority: number;
  onPriorityChange: (value: number) => void;

  // Campaign details
  socialMediaPlan: string;
  onSocialMediaPlanChange: (value: string) => void;
  marketingSpend: string;
  onMarketingSpendChange: (value: string) => void;
  factSheetUrl: string;
  onFactSheetUrlChange: (value: string) => void;

  // Distribution preferences
  youtubeShorts: boolean;
  onYoutubeShortsChange: (value: boolean) => void;
  thisIsPlaylist: boolean;
  onThisIsPlaylistChange: (value: boolean) => void;
  motionArtwork: boolean;
  onMotionArtworkChange: (value: boolean) => void;

  className?: string;
}

// Mood options (18 from FUGA)
const MOOD_OPTIONS = FUGA_MOODS.map((mood) => ({
  id: mood.toLowerCase().replace(/\s+/g, '-'),
  label: mood,
  category: getMoodCategory(mood)
}));

function getMoodCategory(mood: string): string {
  const energyMoods = ['Energetic', 'Fitness', 'Party', 'Motivation'];
  const emotionMoods = ['Happy', 'Romantic', 'Sad', 'Feel Good', 'Fierce', 'Sexy'];
  const relaxMoods = ['Chill', 'Meditative', 'Sleep', 'Focus'];
  const nostalgicMoods = ['Throwback', 'Feeling Blue', 'Heartbreak'];

  if (energyMoods.includes(mood)) return 'Energy';
  if (emotionMoods.includes(mood)) return 'Emotion';
  if (relaxMoods.includes(mood)) return 'Relaxation';
  if (nostalgicMoods.includes(mood)) return 'Nostalgia';
  return 'Other';
}

// Instrument options (45 from FUGA)
const INSTRUMENT_OPTIONS = FUGA_INSTRUMENTS.map((instrument) => ({
  id: instrument.toLowerCase().replace(/\s+/g, '-'),
  label: instrument,
  category: getInstrumentCategory(instrument)
}));

function getInstrumentCategory(instrument: string): string {
  const strings = ['Acoustic Guitar', 'Electric Guitar', 'Bass Guitar', 'Classical Guitar', 'Banjo', 'Mandolin', 'Ukelele', 'Violin', 'Viola', 'Cello', 'Double Bass', 'Pedal Steel Guitar'];
  const keyboards = ['Piano', 'Organ', 'Synthesizer', 'Harpsichord', 'Cembalo'];
  const percussion = ['Drum Kit', 'Marimba', 'Vibraphone', 'Xylophone', 'Djembe', 'Steel Drum'];
  const woodwinds = ['Flute', 'Clarinet', 'Oboe', 'Bassoon', 'Saxophone', 'Piccolo', 'Recorder', 'Bass Clarinet'];
  const brass = ['Trumpet', 'Trombone', 'French Horn', 'Horn'];
  const world = ['Sitar', 'Oud', 'Erhu', 'Buzuq'];
  const vocal = ['Vocals'];
  const other = ['Harp', 'Accordion', 'Harmonica', 'Orchestra', 'Samples'];

  if (strings.includes(instrument)) return 'Strings';
  if (keyboards.includes(instrument)) return 'Keyboards';
  if (percussion.includes(instrument)) return 'Percussion';
  if (woodwinds.includes(instrument)) return 'Woodwinds';
  if (brass.includes(instrument)) return 'Brass';
  if (world.includes(instrument)) return 'World';
  if (vocal.includes(instrument)) return 'Vocal';
  if (other.includes(instrument)) return 'Other';
  return 'Miscellaneous';
}

// Priority descriptions
const PRIORITY_DESCRIPTIONS = {
  1: '⭐ Specialist release or compilation',
  2: '⭐⭐ Standard release',
  3: '⭐⭐⭐ Important release',
  4: '⭐⭐⭐⭐ Very important release',
  5: '⭐⭐⭐⭐⭐ Biggest release of the year'
};

export function MarketingSection({
  hook,
  onHookChange,
  mainPitch,
  onMainPitchChange,
  moods,
  onMoodsChange,
  instruments,
  onInstrumentsChange,
  priority,
  onPriorityChange,
  socialMediaPlan,
  onSocialMediaPlanChange,
  marketingSpend,
  onMarketingSpendChange,
  factSheetUrl,
  onFactSheetUrlChange,
  youtubeShorts,
  onYoutubeShortsChange,
  thisIsPlaylist,
  onThisIsPlaylistChange,
  motionArtwork,
  onMotionArtworkChange,
  className
}: MarketingSectionProps) {
  return (
    <div className={clsx('space-y-8', className)}>
      {/* Section 1: Marketing Pitch */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Target size={20} className="text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Marketing Pitch</h3>
            <p className="text-sm text-gray-400">For DSP editorial teams</p>
          </div>
        </div>

        <div className="space-y-6 p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl">
          <AIPitchEditor
            label="What's Your Hook?"
            value={hook}
            onChange={onHookChange}
            minChars={50}
            maxChars={175}
            placeholder="A powerful one-sentence essence of your release..."
            helpText="DSP editors see this first. Make it compelling and concise."
          />

          <AIPitchEditor
            label="The Main Pitch"
            value={mainPitch}
            onChange={onMainPitchChange}
            maxChars={500}
            rows={8}
            required
            placeholder="Describe your release, collaboration, and what makes it special..."
            helpText="Comprehensive project summary for playlist curators and editors"
          />
        </div>
      </div>

      {/* Section 2: Music Metadata */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <Music2 size={20} className="text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Music Characterization</h3>
            <p className="text-sm text-gray-400">Help DSPs categorize your release</p>
          </div>
        </div>

        <div className="space-y-6 p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl">
          <TagMultiSelect
            label="Mood(s)"
            placeholder="Choose up to 3 moods..."
            value={moods}
            onChange={onMoodsChange}
            options={MOOD_OPTIONS}
            maxSelections={3}
            required
            helpText="Select moods that characterize this release"
            variant="glass-enhanced"
            groupByCategory
          />

          <TagMultiSelect
            label="Instruments"
            placeholder="Select instruments featured..."
            value={instruments}
            onChange={onInstrumentsChange}
            options={INSTRUMENT_OPTIONS}
            required
            helpText="Main instruments featured in the release"
            variant="glass-enhanced"
            groupByCategory
          />

          <StarRating
            label="Release Priority"
            value={priority}
            onChange={onPriorityChange}
            max={5}
            variant="glass"
            size="lg"
            descriptions={PRIORITY_DESCRIPTIONS}
            helpText="Internal importance indicator for your team"
          />
        </div>
      </div>

      {/* Section 3: Campaign Details */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <DollarSign size={20} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Campaign Details</h3>
            <p className="text-sm text-gray-400">Marketing strategy and resources</p>
          </div>
        </div>

        <div className="space-y-6 p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl">
          <CharLimitTextarea
            label="Social Media Rollout Plan"
            value={socialMediaPlan}
            onChange={onSocialMediaPlanChange}
            maxChars={2000}
            rows={8}
            required
            variant="glass-enhanced"
            helpText="Include: posting schedule, content types, hashtags, target audience, KPIs"
          />

          <CharLimitTextarea
            label="Marketing Spend"
            value={marketingSpend}
            onChange={onMarketingSpendChange}
            maxChars={1000}
            rows={6}
            variant="glass-enhanced"
            placeholder="Spotify: $X / TikTok: $X / Meta: $X / YouTube: $X / ..."
            helpText="Platform-by-platform budget breakdown"
          />

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Fact Sheet / Project Deck URL
            </label>
            <input
              type="url"
              value={factSheetUrl}
              onChange={(e) => onFactSheetUrlChange(e.target.value)}
              placeholder="https://..."
              className="
                w-full px-4 py-3 rounded-xl
                bg-white/5 backdrop-blur-md border border-white/10
                text-white placeholder-gray-500
                outline-none focus:ring-2 focus:ring-purple-500/50
                transition-all
              "
            />
            <p className="mt-1 text-xs text-gray-400">
              Link to detailed press materials, artist bio, or project deck
            </p>
          </div>
        </div>
      </div>

      {/* Section 4: Distribution Preferences */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-pink-500/20 rounded-lg">
            <Settings2 size={20} className="text-pink-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Distribution Preferences</h3>
            <p className="text-sm text-gray-400">Platform-specific options</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* YouTube Shorts */}
          <label className={clsx(
            'flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all',
            'bg-white/5 backdrop-blur-md border border-white/10',
            'hover:border-purple-500/30 hover:bg-white/10',
            youtubeShorts && 'border-purple-500/50 bg-purple-500/10'
          )}>
            <input
              type="checkbox"
              checked={youtubeShorts}
              onChange={(e) => onYoutubeShortsChange(e.target.checked)}
              className="sr-only"
            />
            <Youtube size={20} className={youtubeShorts ? 'text-purple-400' : 'text-gray-400'} />
            <div className="flex-1">
              <p className="text-sm font-medium text-white">YouTube Shorts</p>
              <p className="text-xs text-gray-400">Enable short previews</p>
            </div>
            {youtubeShorts && (
              <div className="w-5 h-5 bg-purple-500 rounded flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </label>

          {/* This Is Playlist */}
          <label className={clsx(
            'flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all',
            'bg-white/5 backdrop-blur-md border border-white/10',
            'hover:border-green-500/30 hover:bg-white/10',
            thisIsPlaylist && 'border-green-500/50 bg-green-500/10'
          )}>
            <input
              type="checkbox"
              checked={thisIsPlaylist}
              onChange={(e) => onThisIsPlaylistChange(e.target.checked)}
              className="sr-only"
            />
            <Music2 size={20} className={thisIsPlaylist ? 'text-green-400' : 'text-gray-400'} />
            <div className="flex-1">
              <p className="text-sm font-medium text-white">"This Is" Playlist</p>
              <p className="text-xs text-gray-400">Spotify pinning</p>
            </div>
            {thisIsPlaylist && (
              <div className="w-5 h-5 bg-green-500 rounded flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </label>

          {/* Motion Artwork */}
          <label className={clsx(
            'flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all',
            'bg-white/5 backdrop-blur-md border border-white/10',
            'hover:border-pink-500/30 hover:bg-white/10',
            motionArtwork && 'border-pink-500/50 bg-pink-500/10'
          )}>
            <input
              type="checkbox"
              checked={motionArtwork}
              onChange={(e) => onMotionArtworkChange(e.target.checked)}
              className="sr-only"
            />
            <Image size={20} className={motionArtwork ? 'text-pink-400' : 'text-gray-400'} />
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Motion Artwork</p>
              <p className="text-xs text-gray-400">Animated cover</p>
            </div>
            {motionArtwork && (
              <div className="w-5 h-5 bg-pink-500 rounded flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </label>
        </div>
      </div>
    </div>
  );
}
