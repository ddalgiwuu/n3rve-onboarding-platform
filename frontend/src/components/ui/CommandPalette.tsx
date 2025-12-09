import { useEffect, useState, useMemo } from 'react';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  FileText,
  Users,
  BarChart3,
  BookOpen,
  PlusCircle,
  Save,
  Send,
  Download,
  Settings,
  Search
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
  category: string;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CommandPalette({ isOpen: controlledOpen, onOpenChange }: CommandPaletteProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  // Define all commands
  const commands: CommandItem[] = useMemo(() => [
    // Navigation
    {
      id: 'nav-dashboard',
      label: 'Go to Dashboard',
      icon: <Home size={18} />,
      action: () => navigate('/'),
      category: 'Navigation',
      keywords: ['home', 'dashboard', 'main']
    },
    {
      id: 'nav-submissions',
      label: 'View My Submissions',
      icon: <FileText size={18} />,
      action: () => navigate('/my-submissions'),
      category: 'Navigation',
      keywords: ['submissions', 'releases', 'my']
    },
    {
      id: 'nav-artists',
      label: 'View Artist Roster',
      icon: <Users size={18} />,
      action: () => navigate('/artist-roster'),
      category: 'Navigation',
      keywords: ['artists', 'roster', 'musicians']
    },
    {
      id: 'nav-reports',
      label: 'View Feature Reports',
      icon: <BarChart3 size={18} />,
      action: () => navigate('/feature-reports'),
      category: 'Navigation',
      keywords: ['reports', 'analytics', 'performance']
    },
    {
      id: 'nav-guides',
      label: 'Browse Guides',
      icon: <BookOpen size={18} />,
      action: () => navigate('/guides'),
      category: 'Navigation',
      keywords: ['guides', 'help', 'documentation']
    },

    // Actions
    {
      id: 'action-new-submission',
      label: 'New Release Submission',
      icon: <PlusCircle size={18} />,
      action: () => navigate('/release-submission'),
      shortcut: '⌘N',
      category: 'Actions',
      keywords: ['new', 'create', 'submit', 'release']
    },
    {
      id: 'action-new-artist',
      label: 'Create New Artist',
      icon: <PlusCircle size={18} />,
      action: () => navigate('/artist-roster?action=create'),
      category: 'Actions',
      keywords: ['new', 'artist', 'create']
    },
    {
      id: 'action-settings',
      label: 'Open Settings',
      icon: <Settings size={18} />,
      action: () => navigate('/settings'),
      shortcut: '⌘,',
      category: 'Actions',
      keywords: ['settings', 'preferences', 'config']
    }
  ], [navigate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘K or Ctrl+K to toggle
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }

      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSearch('');
      }

      // Execute command shortcuts when palette is closed
      if (!isOpen) {
        // ⌘N for new submission
        if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
          e.preventDefault();
          navigate('/release-submission');
        }

        // ⌘, for settings
        if ((e.metaKey || e.ctrlKey) && e.key === ',') {
          e.preventDefault();
          navigate('/settings');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setIsOpen, navigate]);

  // Group commands by category
  const commandsByCategory = useMemo(() => {
    return commands.reduce((acc, cmd) => {
      if (!acc[cmd.category]) {
        acc[cmd.category] = [];
      }
      acc[cmd.category].push(cmd);
      return acc;
    }, {} as Record<string, CommandItem[]>);
  }, [commands]);

  const handleSelect = (command: CommandItem) => {
    command.action();
    setIsOpen(false);
    setSearch('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setIsOpen(false)}
          />

          {/* Command Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', duration: 0.3, bounce: 0.25 }}
            className="
              fixed top-[20%] left-1/2 -translate-x-1/2
              w-full max-w-2xl z-50
              bg-white/5 backdrop-blur-xl border border-white/10
              rounded-2xl shadow-2xl overflow-hidden
            "
            onClick={(e) => e.stopPropagation()}
          >
            <Command className="w-full" shouldFilter={false}>
              {/* Search input */}
              <div className="flex items-center gap-3 p-4 border-b border-white/10">
                <Search size={20} className="text-gray-400" />
                <Command.Input
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Type a command or search..."
                  className="
                    flex-1 bg-transparent text-lg text-white
                    outline-none placeholder-gray-500
                  "
                  autoFocus
                />
                <kbd className="
                  px-2 py-1 text-xs font-mono text-gray-400
                  bg-white/5 rounded border border-white/10
                ">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <Command.List className="max-h-96 overflow-y-auto p-2">
                <Command.Empty className="text-center text-gray-500 py-12">
                  No commands found
                </Command.Empty>

                {Object.entries(commandsByCategory).map(([category, items]) => (
                  <Command.Group key={category} heading={category} className="mb-4">
                    <div className="text-xs text-gray-500 uppercase px-3 py-2 font-medium">
                      {category}
                    </div>
                    {items.map((cmd) => (
                      <Command.Item
                        key={cmd.id}
                        value={`${cmd.label} ${cmd.keywords?.join(' ') || ''}`}
                        onSelect={() => handleSelect(cmd)}
                        className="
                          flex items-center justify-between gap-3
                          px-3 py-3 rounded-lg
                          text-white cursor-pointer
                          hover:bg-white/10 transition-colors
                          data-[selected=true]:bg-white/10
                          group
                        "
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400 group-hover:text-white transition-colors">
                            {cmd.icon}
                          </span>
                          <span className="font-medium">{cmd.label}</span>
                        </div>
                        {cmd.shortcut && (
                          <kbd className="
                            px-2 py-1 text-xs font-mono text-gray-400
                            bg-white/5 rounded border border-white/10
                          ">
                            {cmd.shortcut}
                          </kbd>
                        )}
                      </Command.Item>
                    ))}
                  </Command.Group>
                ))}
              </Command.List>

              {/* Footer hint */}
              <div className="
                flex items-center justify-between
                px-4 py-3 border-t border-white/10
                text-xs text-gray-500
              ">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10">↑</kbd>
                    <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10">↓</kbd>
                    <span>navigate</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10">↵</kbd>
                    <span>select</span>
                  </div>
                </div>
                <span>Press ⌘K to open anytime</span>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Hook for easier usage
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
    CommandPalette: () => <CommandPalette isOpen={isOpen} onOpenChange={setIsOpen} />
  };
}
