import React from 'react';
import { Stats, CategoryInfo, ChecklistItem, Teammate } from '../types';
import { Shield } from 'lucide-react';

interface StatsSectionProps {
  stats: Stats;
  items: ChecklistItem[];
  categories: CategoryInfo[];
  team: Teammate[];
  onSelectCategory: (category: string | 'all') => void;
  selectedCategory: string | 'all';
  isLightMode: boolean;
  accent: {
    primaryText: string;
    progressBar: string;
  };
  onAssignClick?: (memberId: string) => void;
}

// Map icons cleanly
import { 
  Server, Code2, CheckSquare, Database, FileText, 
  Layers, Cpu, Globe, Lock, Settings, Terminal
} from 'lucide-react';

const categoryIcons: Record<string, React.ComponentType<any>> = {
  Shield,
  Server,
  Code2,
  CheckSquare,
  Database,
  FileText,
  Layers,
  Cpu,
  Globe,
  Lock,
  Settings,
  Terminal
};

export default function StatsSection({ 
  stats, 
  items, 
  categories,
  team,
  onSelectCategory, 
  selectedCategory,
  onAssignClick
}: StatsSectionProps) {
  
  // Calculate overdue and due this week items
  const activeItemsWithDueDates = items.filter(item => item.status !== 'completed' && item.dueDate);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const overdueCount = activeItemsWithDueDates.filter(item => {
    const due = new Date(item.dueDate + 'T23:59:59');
    return due < now;
  }).length;

  const dueThisWeekCount = activeItemsWithDueDates.filter(item => {
    const due = new Date(item.dueDate + 'T00:00:00');
    // Day diff calculation
    const dayDiff = (due.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24);
    return dayDiff >= 0 && dayDiff <= 7;
  }).length;

  // Calculate category-specific progress dynamically
  const categoryStats = categories.map(cat => {
    const catItems = items.filter(item => item.category === cat.id);
    const total = catItems.length;
    const completed = catItems.filter(item => item.status === 'completed').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      category: cat,
      total,
      completed,
      percentage
    };
  });

  // Teammate level progress calculations
  const teammateStats = team.map(member => {
    const assignedItems = items.filter(item => item.assignedTo?.includes(member.id));
    const total = assignedItems.length;
    const completed = assignedItems.filter(item => item.status === 'completed').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      member,
      total,
      completed,
      percentage
    };
  });

  return (
    <div id="stats-section-container" className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      
      {/* =========================================================================
          COLUMN 1: PROJECT VELOCITY CARD (Notion Property Panel Style)
          ========================================================================= */}
      <div 
        id="overall-progress-card" 
        className="p-4 border transition-all duration-300 rounded-[6px] flex flex-col justify-between stats-card card-theme-target"
        style={{
          backgroundColor: 'var(--notion-bg-secondary)',
          borderColor: 'var(--notion-border)',
          minHeight: '190px'
        }}
      >
        <div className="flex flex-col space-y-1.5">
          <span 
            className="section-header"
            style={{
              fontSize: '11px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              color: 'var(--n-tx3)',
              marginBottom: '12px',
              display: 'block'
            }}
          >
            PROJECT VELOCITY
          </span>
          <div className="flex items-baseline gap-2">
            <span 
              className="velocity-percent"
              style={{
                fontSize: '28px',
                fontWeight: 600,
                color: 'var(--notion-text-primary)'
              }}
            >
              {stats.progressPercentage}%
            </span>
            <span 
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--notion-text-tertiary)',
                fontWeight: 500
              }}
            >
              Overall
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--notion-text-secondary)', lineHeight: '1.4' }}>
            {stats.progressPercentage === 100 
              ? "All specifications fully certified." 
              : `${stats.progressPercentage}% development checks completed successfully.`}
          </p>
        </div>

        {/* Horizontal Progress Bar */}
        <div 
          className="progress-track"
          style={{
            width: '100%',
            height: '4px',
            background: 'var(--n-hover)',
            borderRadius: '2px',
            marginTop: '16px',
            overflow: 'hidden'
          }}
        >
          <div 
            className="progress-fill"
            style={{
              width: `${stats.progressPercentage}%`,
              height: '100%',
              background: 'var(--n-blue)',
              borderRadius: '2px',
              transition: 'width 0.4s ease-in-out'
            }}
          />
        </div>

        {/* Due This Week & Overdue row metrics */}
        <div className="flex gap-4 mt-4 pt-3 border-t" style={{ borderColor: 'var(--notion-border)' }}>
          <div className="flex flex-col">
            <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--notion-text-tertiary)', letterSpacing: '0.05em' }}>Due This Week</span>
            <span className="font-mono font-semibold" style={{ fontSize: '14px', color: dueThisWeekCount > 0 ? 'var(--notion-amber)' : 'var(--notion-text-primary)' }}>{dueThisWeekCount} items</span>
          </div>
          <div className="flex flex-col border-l pl-4" style={{ borderColor: 'var(--notion-border)' }}>
            <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--notion-text-tertiary)', letterSpacing: '0.05em' }}>Overdue Checks</span>
            <span className="font-mono font-bold animate-pulse" style={{ fontSize: '14px', color: overdueCount > 0 ? 'var(--notion-red)' : 'var(--notion-text-primary)' }}>{overdueCount} overdue</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          COLUMN 2: FOCUS PHASES SUMMARY
          ========================================================================= */}
      <div 
        id="category-stats-card" 
        className="p-4 border transition-all duration-300 rounded-[6px] flex flex-col justify-between stats-card card-theme-target"
        style={{
          backgroundColor: 'var(--notion-bg-secondary)',
          borderColor: 'var(--notion-border)',
          minHeight: '190px'
        }}
      >
        <div style={{ marginBottom: '12px' }}>
          <span 
            className="section-header"
            style={{
              fontSize: '11px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              color: 'var(--n-tx3)',
              display: 'block'
            }}
          >
            FOCUS PHASES
          </span>
        </div>

        <div className="flex-1 mt-1 overflow-y-auto max-h-[170px] scrollbar-none">
          {categoryStats.map(({ category, total, completed, percentage }, index) => {
            const IconComponent = categoryIcons[category.icon] || Shield;
            const isSelected = selectedCategory === category.id;

            return (
              <button
                key={category.id}
                onClick={() => onSelectCategory(isSelected ? 'all' : category.id)}
                className="w-full text-left transition-all duration-150 flex items-center justify-between px-2 cursor-pointer border-none bg-transparent hover:bg-[var(--notion-bg-hover)]"
                style={{
                  height: '36px',
                  borderBottom: index < categoryStats.length - 1 ? '1px solid var(--notion-border)' : 'none'
                }}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <IconComponent 
                    className="shrink-0" 
                    style={{ width: '16px', height: '16px', color: 'var(--notion-text-secondary)' }} 
                  />
                  <span 
                    className="truncate"
                    style={{
                      fontSize: '13px',
                      fontWeight: isSelected ? 500 : 400,
                      color: isSelected ? 'var(--notion-text-primary)' : 'var(--notion-text-secondary)'
                    }}
                  >
                    {category.name}
                  </span>
                </div>
                
                <span 
                  style={{
                    marginLeft: 'auto',
                    fontSize: '12px',
                    color: 'var(--n-tx3)',
                    fontVariantNumeric: 'tabular-nums'
                  }}
                >
                  {completed}/{total}
                </span>
              </button>
            );
          })}
          {categoryStats.length === 0 && (
            <div className="text-center py-4 text-xs" style={{ color: 'var(--notion-text-tertiary)' }}>
              No phases defined.
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          COLUMN 3: TEAM PERFORMANCE PANEL
          ========================================================================= */}
      <div 
        id="team-progress-card" 
        className="p-4 border transition-all duration-300 rounded-[6px] flex flex-col justify-between stats-card card-theme-target"
        style={{
          backgroundColor: 'var(--notion-bg-secondary)',
          borderColor: 'var(--notion-border)',
          minHeight: '190px'
        }}
      >
        <div style={{ marginBottom: '12px' }}>
          <span 
            className="section-header"
            style={{
              fontSize: '11px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              color: 'var(--n-tx3)',
              display: 'block'
            }}
          >
            TEAM PERFORMANCE
          </span>
        </div>

        <div className="flex-1 mt-1 overflow-y-auto max-h-[170px] scrollbar-none">
          {teammateStats.map(({ member, total, completed }, index) => {
            const initials = member.name.split(' ').map(n => n[0]).join('').substr(0, 2).toUpperCase();

            return (
              <div
                key={member.id}
                className="group flex items-center justify-between px-2 hover:bg-[var(--notion-bg-hover)] transition-all duration-150"
                style={{
                  height: '40px',
                  borderBottom: index < teammateStats.length - 1 ? '1px solid var(--notion-border)' : 'none'
                }}
              >
                {/* Left side: Avatar and name/role inline */}
                <div className="flex items-center gap-2 truncate flex-1 mr-2">
                  {/* Avatar */}
                  <div 
                    className="flex items-center justify-center font-mono font-bold shrink-0 team-avatar"
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--notion-bg-hover)',
                      color: 'var(--notion-text-secondary)',
                      fontSize: '11px'
                    }}
                  >
                    {initials}
                  </div>

                  {/* Name and Role inline */}
                  <div className="truncate flex items-center gap-2">
                    <span 
                      className="truncate"
                      style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: 'var(--notion-text-primary)'
                      }}
                    >
                      {member.name}
                    </span>
                    <span 
                      className="truncate hidden sm:inline-block"
                      style={{
                        fontSize: '12px',
                        color: 'var(--notion-text-tertiary)'
                      }}
                    >
                      {member.role}
                    </span>

                    {/* + assign button, only active on hover */}
                    <button
                      onClick={() => onAssignClick?.(member.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 border-none bg-transparent cursor-pointer font-sans text-xs underline"
                      style={{
                        color: 'var(--notion-accent-blue)',
                        padding: '0 4px',
                      }}
                    >
                      + assign
                    </button>
                  </div>
                </div>

                {/* Right side status */}
                <div className="shrink-0 text-right">
                  {total === 0 ? (
                    <span 
                      style={{
                        fontSize: '12px',
                        color: 'var(--notion-text-tertiary)'
                      }}
                    >
                      No tasks assigned
                    </span>
                  ) : (
                    <span 
                      style={{
                        fontSize: '12px',
                        color: 'var(--notion-text-secondary)',
                        fontFamily: 'monospace'
                      }}
                    >
                      {completed}/{total}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {team.length === 0 && (
            <div className="text-center py-4 text-xs" style={{ color: 'var(--notion-text-tertiary)' }}>
              No teammates defined.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
