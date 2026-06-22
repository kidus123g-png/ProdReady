import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Eye, Sparkles, Compass, Zap, Palette, Flame, Shield, Heart } from 'lucide-react';

interface ThemePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTheme: string;
  setActiveTheme: (theme: string) => void;
  isLightMode: boolean;
}

export default function ThemePickerModal({
  isOpen,
  onClose,
  activeTheme,
  setActiveTheme,
  isLightMode
}: ThemePickerModalProps) {
  
  const themes = [
    {
      id: 'default',
      name: 'Default Notion Suite',
      description: 'Clean, professional dual-palette in minimalist gray tones.',
      swatches: ['#191919', '#2eaadc', '#44b281', '#ff7369', '#e6e6e5'],
      badge: 'Bilevel Standard',
      details: [
        'Pure obsidian dark & clean paper light dual modes',
        'Notion-authentic typography & soft borders',
        'System synchronization preference support'
      ],
      icon: Compass,
      accentColor: 'text-neutral-500',
      fontFamily: "'Inter', sans-serif"
    },
    {
      id: 'nord',
      name: 'Nordic Ice Staging',
      description: 'Frosted elements and icy aurora accents.',
      swatches: ['#2E3440', '#88C0D0', '#A3BE8C', '#BF616A', '#ECEFF4'],
      badge: 'Premium Arctic Dark',
      details: [
        'Deep Polaris slate slate backdrops (#2E3440)',
        'Frosted glass visual effects & 2px border radius overrides',
        'High-density text-decoration line-through accomplished checks',
        'Arctic aurora blue highlights (#88C0D0)'
      ],
      icon: Eye,
      accentColor: 'text-[#88C0D0]',
      fontFamily: "'Inter', sans-serif"
    },
    {
      id: 'tokyo-night',
      name: 'Tokyo Midnight Cyber',
      description: 'Deep navy using electric cornflower blue accents.',
      swatches: ['#1A1B2E', '#7AA2F7', '#9ECE6A', '#F7768E', '#C0CAF5'],
      badge: 'Vapor Neon Dark',
      details: [
        'Storm purple midnight sky canvas (#1A1B2E)',
        '3px high-contrast active left accent borders with soft backglow',
        'Deep cybernetic risk badges with active custom gradients',
        'Intense neon pink & cold blue indicators'
      ],
      icon: Zap,
      accentColor: 'text-[#7AA2F7]',
      fontFamily: "'DM Sans', sans-serif"
    },
    {
      id: 'dracula',
      name: 'Dracula Dark Royalty',
      description: 'Purple-soaked night, neon pink selection highlights.',
      swatches: ['#282A36', '#BD93F9', '#50FA7B', '#FF5555', '#F8F8F2'],
      badge: 'Theatrical Goth',
      details: [
        'Nunito display & Ubuntu Mono code typography',
        'Purple-soaked dark canvas (#282A36) and deep surface panels',
        'Active links snap to neon pink (#FF79C6) on hover',
        'Vivid green certified badges and purple progress lines'
      ],
      icon: Flame,
      accentColor: 'text-[#BD93F9]',
      fontFamily: "'Nunito', sans-serif"
    },
    {
      id: 'rose-pine',
      name: 'Rosé Pine Naturalism',
      description: 'Dusty rose fog and pine forest greens.',
      swatches: ['#191724', '#C4A7E7', '#31748F', '#EB6F92', '#E0DEF4'],
      badge: 'Warm Analog',
      details: [
        'Gentle Lora classic serif headings paired with Source Sans 3',
        'Warm dusty-plum backdrops with elegant barely-there dividers',
        'Active nav items express clean rose underlines instead of hard borders',
        'Soft organic outline cards for premium focus and balance'
      ],
      icon: Heart,
      accentColor: 'text-[#C4A7E7]',
      fontFamily: "'Lora', Georgia, serif"
    },
    {
      id: 'synthwave84',
      name: "SynthWave '84 Electra",
      description: 'Magenta and cyan electricity against deep violet.',
      swatches: ['#1A1033', '#FF6AC1', '#72F1B8', '#FE4450', '#F5F5FF'],
      badge: 'Retro Futurism',
      details: [
        'Orbitron display, Share Tech Mono, and Exo 2 body fonts',
        'Deep cosmic violet backgrounds styled with CRT scanlines',
        'Flamboyant outer glowing cards and fluorescent pink accent outlines',
        'Intense electric blue gradients and mint-green certifications'
      ],
      icon: Shield,
      accentColor: 'text-[#FF6AC1]',
      fontFamily: "'Orbitron', 'Exo 2', sans-serif"
    },
    {
      id: 'catppuccin-mocha',
      name: 'Catppuccin Mocha',
      description: 'Creamy latte tones on deep espresso. Cozy and gentle.',
      swatches: ['#1E1E2E', '#CBA6F7', '#A6E3A1', '#F38BA8', '#CDD6F4'],
      badge: 'Warm Pastel Dark',
      details: [
        'Plus Jakarta Sans display and Cascadia Code monospace',
        'Cozy warm espresso backdrops with cozy border radius overrides',
        'Active sidebar has soft mauve pill shape rather than borders',
        'Gentle pastel mauve progress indicators and warning peaches'
      ],
      icon: Sparkles,
      accentColor: 'text-[#CBA6F7]',
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    },
    {
      id: 'gruvbox',
      name: 'Gruvbox Dark Retro',
      description: 'Earthy ochres and vintage terminal warmth.',
      swatches: ['#282828', '#FABD2F', '#B8BB26', '#FB4934', '#EBDBB2'],
      badge: 'Vintage Terminal',
      details: [
        'Maximalist IBM Plex Mono font applied globally to all typography',
        'Authentic ochre-yellow highlights with stark sharp borders',
        'Active sidebar items render bold sharp accent lines without borders',
        'Perfect all-caps section titles with letter spacing expansions'
      ],
      icon: Palette,
      accentColor: 'text-[#FABD2F]',
      fontFamily: "'IBM Plex Mono', monospace"
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black"
          />

          {/* Dialog Body Box */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="relative w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border z-10 flex flex-col card-theme-target"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)'
            }}
          >
            {/* Modal Top Header Bar */}
            <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-default)' }}>
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
                  <Palette className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight">System Skins & Visual Identities</h3>
                  <p className="text-[11px] font-mono" style={{ color: 'var(--text-secondary)' }}>Experience-crafted theme customization engine</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl transition cursor-pointer"
                style={{ color: 'var(--text-secondary)', backgroundColor: 'transparent' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
                title="Close Theme Panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Themes Grid Panel */}
            <div className="p-6 overflow-y-auto max-h-[65vh] scrollbar-thin">
              <div className="text-[11px] font-mono uppercase tracking-wider mb-4" style={{ color: 'var(--text-secondary)' }}>
                Select Theme Style:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {themes.map((t) => {
                  const isSelected = activeTheme === t.id;
                  const IconComponent = t.icon;

                  return (
                    <div
                      key={t.id}
                      onClick={() => setActiveTheme(t.id)}
                      className="relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between h-[180px] group"
                      style={{
                        backgroundColor: isSelected ? 'var(--accent-subtle)' : 'var(--bg-surface)',
                        borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-default)',
                        boxShadow: isSelected ? '0 4px 12px var(--accent-subtle)' : 'var(--shadow-sm)'
                      }}
                    >
                      {/* Swatch dots & icon */}
                      <div className="flex items-center justify-between gap-2">
                        {/* 5-dot color palette represented accurately */}
                        <div className="flex gap-1">
                          {t.swatches.map((color, sIdx) => {
                            const label = ['bg-base', 'accent-primary', 'color-success', 'color-danger', 'text-primary'][sIdx];
                            return (
                              <div
                                key={sIdx}
                                className="w-4 h-4 rounded-full border border-black/10 dark:border-white/10 shrink-0 shadow-sm"
                                style={{ backgroundColor: color }}
                                title={`${label}: ${color}`}
                              />
                            );
                          })}
                        </div>
                        <IconComponent className="w-4 h-4 opacity-60" style={{ color: 'var(--accent-primary)' }} />
                      </div>

                      {/* Display name and visual config summary */}
                      <div className="mt-4 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span 
                            className="font-bold text-sm tracking-tight truncate"
                            style={{ 
                              fontFamily: t.fontFamily,
                              color: 'var(--text-primary)'
                            }}
                          >
                            {t.name}
                          </span>
                        </div>
                        <span 
                          className="text-[9px] font-mono px-2 py-0.5 rounded uppercase mt-1 inline-block"
                          style={{
                            backgroundColor: 'var(--bg-elevated)',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          {t.badge}
                        </span>
                      </div>

                      {/* Active Ring indicator and short desc */}
                      <div className="pt-2 border-t mt-2 flex items-center justify-between gap-2" style={{ borderColor: 'var(--border-subtle)' }}>
                        <span className="text-[9px] line-clamp-1 flex-1" style={{ color: 'var(--text-secondary)' }}>
                          {t.description}
                        </span>

                        <div 
                          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 border"
                          style={{
                            backgroundColor: isSelected ? 'var(--accent-primary)' : 'transparent',
                            borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-default)',
                            color: 'var(--btn-primary-text, var(--bg-surface))'
                          }}
                        >
                          {isSelected && <Check className="w-3 h-3 text-current stroke-[3px]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Bottom Footer bar */}
            <div className="p-4 border-t flex justify-end gap-2" style={{ borderColor: 'var(--border-default)' }}>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 cursor-pointer transition select-none btn-primary"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: 'var(--bg-base)'
                }}
              >
                Close & Audit Staging
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
