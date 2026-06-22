import { PriorityType, ChecklistItem, CategoryInfo } from '../types';
import { Search, Plus, RotateCcw } from 'lucide-react';

interface FilterSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string | 'all';
  setSelectedCategory: (category: string | 'all') => void;
  selectedPriority: PriorityType | 'all';
  setSelectedPriority: (priority: PriorityType | 'all') => void;
  onOpenAddModal: () => void;
  onResetToDefaults: () => void;
  items: ChecklistItem[];
  categories: CategoryInfo[];
  isLightMode: boolean;
  accent: {
    primaryBg: string;
    primaryText: string;
    bgSubtle: string;
    borderAccent: string;
    accentBadge: string;
    tabActiveBg: string;
    tabActiveText: string;
  };
}

export default function FilterSection({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedPriority,
  setSelectedPriority,
  onOpenAddModal,
  onResetToDefaults,
  items,
  categories,
  isLightMode,
  accent
}: FilterSectionProps) {
  
  // Calculate quantity count for each Category dynamically
  const getCategoryCount = (catId: string | 'all') => {
    if (catId === 'all') return items.length;
    return items.filter(i => i.category === catId).length;
  };

  // Calculate high, medium, low counts
  const getPriorityCount = (prio: PriorityType | 'all') => {
    if (prio === 'all') return items.length;
    return items.filter(i => i.priority === prio).length;
  };

  return (
    <div 
      id="notion-filter-panel" 
      className="p-4 border transition-all duration-300 mb-6 rounded-md card-theme-target"
      style={{
        backgroundColor: 'var(--notion-bg-secondary)',
        borderColor: 'var(--notion-border)',
      }}
    >
      
      {/* =========================================================================
          ROW 1: Search and Primary Actions
          ========================================================================= */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-4">
        
        {/* Notion search style */}
        <div className="relative flex-1 flex items-center" style={{ height: '32px' }}>
          <Search 
            className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4" 
            style={{ color: 'var(--notion-text-tertiary)' }} 
          />
          <input
            id="search-standards-input"
            type="text"
            className="w-full text-xs outline-none transition-all duration-200 pl-9 pr-3 rounded-md border-none h-8 font-sans"
            style={{
              backgroundColor: 'var(--notion-bg-hover)',
              color: 'var(--notion-text-primary)'
            }}
            placeholder="Search standards (e.g. CSRF, rate limit, encryption, team member)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Notion style button layout */}
        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
          <button
            onClick={onResetToDefaults}
            className="flex items-center justify-center gap-1.5 px-3 h-8 rounded-md text-xs transition-all duration-200 cursor-pointer font-sans"
            style={{
              border: '1px solid var(--notion-border)',
              color: 'var(--notion-text-secondary)',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--notion-bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Current Project
          </button>

          <button
            onClick={onOpenAddModal}
            className={`flex items-center justify-center gap-1.5 px-3 h-8 rounded-md text-xs font-semibold cursor-pointer text-white shadow-sm transition hover:opacity-90 font-sans ${accent.primaryBg}`}
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            Append Spec Check
          </button>
        </div>

      </div>

      {/* =========================================================================
          ROW 2: Notion-style Horizontal Property Filter Row
          ========================================================================= */}
      <div 
        className="select-none mb-3 scrollbar-none"
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'nowrap',
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className="transition-all duration-150 cursor-pointer flex items-center bg-transparent border-none outline-none"
          style={{
            position: 'relative',
            flexShrink: 0,
            whiteSpace: 'nowrap',
            padding: '0 12px 10px 12px',
            fontSize: '13px',
            lineHeight: 1,
            color: selectedCategory === 'all' ? 'var(--notion-text-primary)' : 'var(--notion-text-secondary)',
            fontWeight: selectedCategory === 'all' ? 500 : 400,
          }}
        >
          <span>
            All Phases
            <span 
              style={{
                fontSize: '11px',
                color: 'var(--notion-text-tertiary)',
                marginLeft: '4px'
              }}
            >
              {getCategoryCount('all')}
            </span>
          </span>
          {selectedCategory === 'all' && (
            <div 
              style={{
                position: 'absolute',
                bottom: 0,
                left: '12px',
                right: '12px',
                height: '2px',
                backgroundColor: 'var(--notion-accent-blue)',
                borderRadius: '1px'
              }}
            />
          )}
        </button>

        {categories.map(cat => {
          const isSelected = selectedCategory === cat.id;
          const count = getCategoryCount(cat.id);

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className="transition-all duration-150 cursor-pointer flex items-center bg-transparent border-none outline-none"
              style={{
                position: 'relative',
                flexShrink: 0,
                whiteSpace: 'nowrap',
                padding: '0 12px 10px 12px',
                fontSize: '13px',
                lineHeight: 1,
                color: isSelected ? 'var(--notion-text-primary)' : 'var(--notion-text-secondary)',
                fontWeight: isSelected ? 500 : 400,
              }}
            >
              <span>
                {cat.name}
                <span 
                  style={{
                    fontSize: '11px',
                    color: 'var(--notion-text-tertiary)',
                    marginLeft: '4px'
                  }}
                >
                  {count}
                </span>
              </span>
              {isSelected && (
                <div 
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: '12px',
                    right: '12px',
                    height: '2px',
                    backgroundColor: 'var(--notion-accent-blue)',
                    borderRadius: '1px'
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          ROW 3: Notion-style Risk Property Chips
          ========================================================================= */}
      <div 
        className="flex items-center flex-wrap" 
        style={{ 
          paddingTop: '8px',
          backgroundColor: 'transparent',
          border: 'none',
          gap: '20px'
        }}
      >
        <span 
          style={{ 
            fontSize: '11px', 
            fontWeight: 400, 
            color: 'var(--notion-text-tertiary)', 
            textTransform: 'none', 
            letterSpacing: 'normal' 
          }}
        >
          Risk levels
        </span>

        {/* HIGH CHIP */}
        <button
          type="button"
          onClick={() => setSelectedPriority(selectedPriority === 'high' ? 'all' : 'high')}
          className="cursor-pointer transition-all duration-150 bg-transparent border-none outline-none"
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '6px',
            padding: 0,
            opacity: selectedPriority === 'all' || selectedPriority === 'high' ? 1 : 0.5
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#e03e3e' }} />
          <span style={{ fontSize: '12px' }}>
            <span style={{ color: 'var(--notion-text-primary)', fontWeight: 500, marginRight: '4px' }}>
              {getPriorityCount('high')}
            </span>
            <span style={{ color: 'var(--notion-text-secondary)' }}>
              High
            </span>
          </span>
        </button>

        {/* MED CHIP */}
        <button
          type="button"
          onClick={() => setSelectedPriority(selectedPriority === 'medium' ? 'all' : 'medium')}
          className="cursor-pointer transition-all duration-150 bg-transparent border-none outline-none"
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '6px',
            padding: 0,
            opacity: selectedPriority === 'all' || selectedPriority === 'medium' ? 1 : 0.5
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#d9730d' }} />
          <span style={{ fontSize: '12px' }}>
            <span style={{ color: 'var(--notion-text-primary)', fontWeight: 500, marginRight: '4px' }}>
              {getPriorityCount('medium')}
            </span>
            <span style={{ color: 'var(--notion-text-secondary)' }}>
              Med
            </span>
          </span>
        </button>

        {/* LOW CHIP */}
        <button
          type="button"
          onClick={() => setSelectedPriority(selectedPriority === 'low' ? 'all' : 'low')}
          className="cursor-pointer transition-all duration-150 bg-transparent border-none outline-none"
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '6px',
            padding: 0,
            opacity: selectedPriority === 'all' || selectedPriority === 'low' ? 1 : 0.5
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0f7b6c' }} />
          <span style={{ fontSize: '12px' }}>
            <span style={{ color: 'var(--notion-text-primary)', fontWeight: 500, marginRight: '4px' }}>
              {getPriorityCount('low')}
            </span>
            <span style={{ color: 'var(--notion-text-secondary)' }}>
              Low
            </span>
          </span>
        </button>
      </div>

    </div>
  );
}
