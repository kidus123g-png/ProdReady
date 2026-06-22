import React, { useState, useMemo } from 'react';
import { ChecklistItem } from '../types';
import { TrendingUp, Activity, CheckSquare } from 'lucide-react';

interface CompletionTimelineProps {
  items: ChecklistItem[];
}

export default function CompletionTimeline({ items }: CompletionTimelineProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const timelineData = useMemo(() => {
    // Generate the last 14 days
    const days = [];
    const now = new Date();
    // Use the calendar date at midnight
    const baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (let i = 13; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - i);
      days.push(d);
    }

    // Map each day to the count of tasks completed on that calendar day
    return days.map(day => {
      const year = day.getFullYear();
      const month = String(day.getMonth() + 1).padStart(2, '0');
      const date = String(day.getDate()).padStart(2, '0');
      const dateStringYMD = `${year}-${month}-${date}`; // YYYY-MM-DD

      // Count tasks completed on this calendar date
      const completedOnThisDay = items.filter(item => {
        if (item.status !== 'completed' || !item.completedAt) return false;
        // Compare YYYY-MM-DD prefix of completedAt (which is in ISO string format usually)
        return item.completedAt.slice(0, 10) === dateStringYMD;
      });

      // Format X-axis label nicely, e.g. "Jun 22" or "22 Jun"
      const dayLabel = day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      return {
        dateString: dateStringYMD,
        label: dayLabel,
        count: completedOnThisDay.length,
        itemsList: completedOnThisDay,
      };
    });
  }, [items]);

  // Find the max count for scaling the SVG chart elegantly
  const maxVelocityCount = useMemo(() => {
    const max = Math.max(...timelineData.map(d => d.count));
    return max > 0 ? max : 3; // default baseline of 3 to avoid divide by zero and style nicely
  }, [timelineData]);

  const totalCompletionsInPast2Weeks = useMemo(() => {
    return timelineData.reduce((acc, d) => acc + d.count, 0);
  }, [timelineData]);

  return (
    <div 
      id="completion-velocity-timeline-card"
      className="p-5 border transition-all duration-300 rounded-[6px] flex flex-col mb-8 stats-card card-theme-target"
      style={{
        backgroundColor: 'var(--notion-bg-secondary)',
        borderColor: 'var(--notion-border)',
        color: 'var(--notion-text-primary)'
      }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b pb-3" style={{ borderColor: 'var(--notion-border)' }}>
        <div className="flex items-center gap-2.5">
          <Activity className="w-4.5 h-4.5 text-[var(--notion-accent-blue)]" />
          <div className="text-left">
            <h4 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--notion-text-primary)' }}>
              Velocity Timeline (Past 2 Weeks)
            </h4>
            <p className="font-sans mt-0.5" style={{ fontSize: '12px', color: 'var(--notion-text-secondary)' }}>
              Tracks daily production certifications and momentum velocity.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto px-3 py-1 rounded border checks-certified-badge" style={{ borderColor: 'var(--notion-border)', backgroundColor: 'var(--notion-bg-hover)' }}>
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500 hover:scale-110" />
          <span className="font-mono text-xs font-semibold text-[var(--notion-text-primary)]">
            {totalCompletionsInPast2Weeks} checks certified
          </span>
        </div>
      </div>

      {timelineData.length > 0 ? (
        <div className="flex flex-col lg:flex-row items-center gap-6">
          
          {/* Main SVG Chart container */}
          <div className="flex-1 w-full min-h-[140px] flex flex-col justify-end">
            <div className="relative w-full h-[120px] flex items-end justify-between px-1 border-b" style={{ borderColor: 'var(--notion-border)' }}>
              
              {/* Optional Gridlines */}
              <div className="absolute inset-x-0 top-0 h-full flex flex-col justify-between pointer-events-none opacity-20">
                <div className="border-t border-dashed w-full" style={{ borderColor: 'var(--notion-border)' }} />
                <div className="border-t border-dashed w-full" style={{ borderColor: 'var(--notion-border)' }} />
                <div className="border-t border-dashed w-full animate-pulse" style={{ borderColor: 'var(--notion-border)' }} />
              </div>

              {/* Bars */}
              {timelineData.map((day, idx) => {
                const ratio = Math.min(day.count / maxVelocityCount, 1);
                const heightPercent = maxVelocityCount > 0 ? ratio * 100 : 0;
                const isHovered = hoveredIdx === idx;

                return (
                  <div 
                    key={day.dateString}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer px-1"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    {/* Tooltip on bar hover */}
                    {isHovered && (
                      <div 
                        className="workspace-health-tooltip absolute bottom-full mb-2 z-10 p-2 text-left rounded shadow-lg border text-[10px] font-mono leading-relaxed"
                        style={{
                          backgroundColor: 'var(--bg-elevated)',
                          borderColor: 'var(--border-default)',
                          color: 'var(--text-primary)',
                          boxShadow: 'var(--shadow-md)',
                          width: '180px'
                        }}
                      >
                        <div className="font-bold underline text-[var(--accent-primary)] transition-colors">{day.label}</div>
                        <div className="mt-1 flex items-center justify-between gap-1.5">
                          <span>Certifications:</span>
                          <span className="font-bold text-[var(--text-primary)]">{day.count}</span>
                        </div>
                        {/* The green health bar inside */}
                        <div className="h-1.5 w-full bg-[rgba(150,150,150,0.15)] rounded-full overflow-hidden mt-1.5">
                          <div 
                            className="h-full rounded-full health-bar-fill transition-all duration-300" 
                            style={{ 
                              width: `${Math.min((day.count / Math.max(maxVelocityCount, 1)) * 100, 100)}%`,
                              backgroundColor: 'var(--color-success)'
                            }}
                          />
                        </div>
                        {day.count > 0 ? (
                          <div 
                            className="mt-1.5 pt-1 border-t space-y-0.5 max-h-[80px] overflow-y-auto"
                            style={{ borderColor: 'var(--border-subtle)' }}
                          >
                            {day.itemsList.map(item => (
                              <div key={item.id} className="truncate text-[var(--text-secondary)]">• {item.title}</div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[10px] italic text-[var(--text-muted)] mt-1.5">No completed items.</div>
                        )}
                      </div>
                    )}

                    {/* Bar graphic */}
                    <div 
                      className="w-full rounded-t transition-all duration-300"
                      style={{
                        height: `${Math.max(heightPercent, 2)}%`,
                        backgroundColor: isHovered 
                      ? 'var(--notion-accent-blue)' 
                      : day.count > 0 
                        ? 'var(--notion-green)' 
                        : 'var(--notion-bg-hover)',
                        opacity: isHovered ? 1 : 0.85
                      }}
                    />
                    
                    {/* Tiny Count badge on non-zero bars */}
                    {day.count > 0 && (
                      <span className="absolute bottom-[3px] font-mono font-bold text-[8px] opacity-75 text-white select-none">
                        {day.count}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* X-Grid Labels */}
            <div className="flex justify-between mt-1 px-1 text-[9px] font-mono select-none" style={{ color: 'var(--notion-text-tertiary)' }}>
              {timelineData.map((day, idx) => (
                <div key={day.dateString} className="flex-1 text-center scale-90 truncate">
                  {/* Show summary dates spacing to prevent label crowding */}
                  {idx % 2 === 0 ? day.label : ''}
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar text summary of velocity */}
          <div className="w-full lg:w-[240px] flex flex-col text-left justify-center p-3 rounded border workspace-health-panel" style={{ borderColor: 'var(--notion-border)', backgroundColor: 'var(--notion-bg-primary)' }}>
            <h5 className="font-mono text-[11px] uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-1.5" style={{ color: 'var(--notion-text-primary)' }}>
              <CheckSquare className="w-3.5 h-3.5 text-green-500" />
              <span>Workspace Health</span>
            </h5>
            <p className="text-[11px]/relaxed font-sans" style={{ color: 'var(--notion-text-secondary)' }}>
              Currently logging active validation logs. When you complete checklists on the Kanban board above, your timeline reflects real-time velocity dynamically.
            </p>
            <div className="mt-2.5 pt-2 border-t flex flex-col gap-1 text-[11px]" style={{ borderColor: 'var(--notion-border)' }}>
              <span style={{ color: 'var(--notion-text-secondary)' }}>
                Peak day count: <span className="font-mono font-semibold" style={{ color: 'var(--notion-text-primary)' }}>{Math.max(...timelineData.map(d=>d.count))}</span>
              </span>
              <span style={{ color: 'var(--notion-text-secondary)' }}>
                Daily average velocity: <span className="font-mono font-semibold" style={{ color: 'var(--notion-text-primary)' }}>{(totalCompletionsInPast2Weeks / 14).toFixed(1)}</span>
              </span>
            </div>
          </div>

        </div>
      ) : (
        <p className="text-xs italic py-4" style={{ color: 'var(--notion-text-tertiary)' }}>Timeline log loading...</p>
      )}
    </div>
  );
}
