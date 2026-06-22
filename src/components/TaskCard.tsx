import React, { useState } from 'react';
import { ChecklistItem, CategoryInfo, Teammate, PriorityType, StatusType } from '../types';
import { 
  Edit3, Trash2, ChevronDown, ChevronUp, Calendar, MessageSquare, CheckSquare, Square, UserPlus, Check, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TaskCardProps {
  key?: string;
  task: ChecklistItem;
  categories: CategoryInfo[];
  team: Teammate[];
  onEdit: (task: ChecklistItem) => void;
  onDelete: (id: string) => void;
  onMoveStatus: (id: string, nextStatus: StatusType) => void;
  onUpdateTask?: (task: ChecklistItem) => void;
  isLightMode?: boolean;
}

export default function TaskCard({ 
  task, 
  categories,
  team,
  onEdit, 
  onDelete, 
  onMoveStatus,
  onUpdateTask
}: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

  const isOverdue = React.useMemo(() => {
    if (task.status === 'completed' || !task.dueDate) return false;
    // Set due date to end of that day local time
    const due = new Date(task.dueDate + 'T23:59:59');
    return due < new Date();
  }, [task.status, task.dueDate]);

  const categoryInfo = categories.find(cat => cat.id === task.category) || {
    id: 'general',
    name: 'General Group',
    icon: 'Shield',
    color: 'border-neutral-500 text-neutral-400 bg-neutral-500/10',
    lightColor: 'bg-neutral-500/10',
    textColor: 'text-neutral-500'
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
    const element = e.currentTarget as HTMLElement;
    setTimeout(() => {
      element.style.opacity = '0.4';
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const element = e.currentTarget as HTMLElement;
    element.style.opacity = '1';
  };

  const getPriorityTag = (priority: PriorityType) => {
    switch (priority) {
      case 'high':
        return (
          <span 
            className="risk-high"
            style={{
              color: 'var(--notion-red)',
              backgroundColor: 'rgba(224,62,62,0.08)',
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '3px',
              fontWeight: 500,
              flexShrink: 0
            }}
          >
            High
          </span>
        );
      case 'medium':
        return (
          <span 
            className="risk-med"
            style={{
              color: 'var(--notion-amber)',
              backgroundColor: 'rgba(217,115,13,0.08)',
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '3px',
              fontWeight: 500,
              flexShrink: 0
            }}
          >
            Med
          </span>
        );
      case 'low':
        return (
          <span 
            className="risk-low"
            style={{
              color: 'var(--notion-green)',
              backgroundColor: 'rgba(15,123,108,0.08)',
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '3px',
              fontWeight: 500,
              flexShrink: 0
            }}
          >
            Low
          </span>
        );
    }
  };

  // Find assigned teammates
  const assignedTeammates = team.filter(member => task.assignedTo?.includes(member.id));

  const priorityColors: Record<PriorityType, string> = {
    high: '#e03e3e',
    medium: '#d9730d',
    low: '#0f7b6c'
  };
  const priorityColor = priorityColors[task.priority] || 'var(--n-border)';

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      id={`task-card-${task.id}`}
      className={`group cursor-grab active:cursor-grabbing transition-all duration-200 select-none flex flex-col gap-2.5 p-3 kanban-card card-theme-target ${
        task.status === 'completed' ? 'kanban-card-done' : ''
      }`}
      style={{
        backgroundColor: isOverdue ? 'rgba(235, 87, 87, 0.08)' : 'var(--notion-bg-secondary)',
        border: isOverdue ? '1px solid rgba(235, 87, 87, 0.25)' : '1px solid var(--n-border)',
        borderLeft: isOverdue ? '3px solid var(--notion-red)' : `2px solid ${priorityColor}`,
        borderRadius: 'var(--card-border-radius, 6px)'
      }}
    >
      
      {/* Row 1: Phase tag (left-border-accent) + Priority tag (right-aligned) */}
      <div className="flex items-center justify-between gap-2 overflow-hidden select-none">
        <div 
          className="truncate font-medium text-left" 
          style={{ 
            fontSize: '11px', 
            color: 'var(--notion-text-secondary)' 
          }}
        >
          {categoryInfo.name}
        </div>
        {getPriorityTag(task.priority)}
      </div>

      {/* Row 2: Task title */}
      <div>
        <h4 
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--notion-text-primary)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: '1.4'
          }}
          className={`text-left ${task.status === 'completed' ? 'line-through opacity-60' : ''}`}
        >
          {task.title}
        </h4>
      </div>

      {/* Row 3: Description */}
      <div>
        <p 
          style={{
            fontSize: '12px',
            color: 'var(--notion-text-secondary)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: '1.4'
          }}
          className="text-left font-normal"
        >
          {task.description}
        </p>
      </div>

      {/* Row 3.5: Due Date & Comments Metadata Bubble Stripe */}
      {(task.dueDate || (task.comments && task.comments.length > 0)) && (
        <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-left font-mono text-[10px]">
          {task.dueDate && (
            <span 
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${
                isOverdue 
                  ? 'text-red-600 bg-red-500/15 dark:text-red-400 font-bold' 
                  : (task.status === 'completed' ? 'text-green-600 dark:text-green-400 bg-green-500/10' : 'text-stone-500 dark:text-stone-400 bg-stone-500/5')
              }`}
            >
              <Calendar className="w-2.5 h-2.5" />
              <span>{isOverdue ? 'Overdue: ' : 'Due: '}{task.dueDate}</span>
            </span>
          )}
          {task.comments && task.comments.length > 0 && (
            <span className="inline-flex items-center gap-1 text-stone-500 dark:text-stone-400 bg-stone-500/5 px-1.5 py-0.5 rounded">
              <MessageSquare className="w-2.5 h-2.5" />
              <span>{task.comments.length} comments</span>
            </span>
          )}
        </div>
      )}

      {/* Optional Subtasks Track */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div 
          style={{
            backgroundColor: 'var(--notion-bg-hover)',
            borderRadius: '3px',
            padding: '6px 8px'
          }}
          className="mt-0.5 border border-transparent hover:border-[var(--notion-border)] transition-colors duration-150"
        >
          <div 
            onClick={() => setShowSubtasks(!showSubtasks)}
            className="flex items-center justify-between font-mono text-[9px] mb-1.5 cursor-pointer select-none" 
            style={{ color: 'var(--notion-text-secondary)' }}
          >
            <span className="flex items-center gap-1">
              {showSubtasks ? <ChevronUp className="w-2.5 h-2.5 shrink-0" /> : <ChevronDown className="w-2.5 h-2.5 shrink-0" />}
              <span>Subtasks checklist</span>
            </span>
            <span>
              {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} Done
            </span>
          </div>
          
          <div className="w-full bg-[var(--notion-border)] rounded-full h-1 overflow-hidden" style={{ height: '3px' }}>
            <div 
              className="h-full transition-all duration-300"
              style={{
                width: `${(task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100}%`,
                backgroundColor: 'var(--notion-green)'
              }}
            />
          </div>

          {showSubtasks && (
            <div className="space-y-1.5 mt-2 pt-2 border-t" style={{ borderColor: 'var(--notion-border)' }}>
              {task.subtasks.map(sub => (
                <div 
                  key={sub.id} 
                  className="flex items-center gap-2 text-[11px]"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <label className="flex items-center gap-1.5 cursor-pointer flex-1 min-w-0 select-none">
                    <input
                      type="checkbox"
                      checked={sub.completed}
                      onChange={(e) => {
                        e.stopPropagation();
                        if (onUpdateTask) {
                          const updatedSubtasks = task.subtasks!.map(s => 
                            s.id === sub.id ? { ...s, completed: !s.completed } : s
                          );
                          onUpdateTask({
                            ...task,
                            subtasks: updatedSubtasks,
                            updatedAt: new Date().toISOString()
                          });
                        }
                      }}
                      className="rounded border-neutral-300 text-emerald-500 focus:ring-emerald-500 w-3 h-3 cursor-pointer"
                    />
                    <span className={`truncate leading-tight font-sans ${
                      sub.completed ? 'line-through text-neutral-500 opacity-60' : 'text-[var(--notion-text-primary)]'
                    }`}>
                      {sub.title}
                    </span>
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Accordion implementation specs */}
      {task.notes && (
        <div 
          className="border-t pt-1"
          style={{ borderColor: 'var(--notion-border)' }}
        >
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ fontSize: '10px', color: 'var(--notion-text-secondary)' }}
            className="flex items-center gap-1 font-mono transition duration-150 font-bold bg-transparent border-none cursor-pointer p-0"
          >
            {isExpanded ? <ChevronUp style={{ width: '10px', height: '10px' }} /> : <ChevronDown style={{ width: '10px', height: '10px' }} />}
            <span>{isExpanded ? "Hide Specs" : "View Specs"}</span>
          </button>
          
          {isExpanded && (
            <div 
              style={{
                fontSize: '11px',
                backgroundColor: 'var(--notion-bg-hover)',
                color: 'var(--notion-text-primary)',
                border: '1px solid var(--notion-border)',
                borderRadius: '3px',
                marginTop: '4px',
              }}
              className="p-1 px-2 font-mono text-left whitespace-pre-wrap break-words leading-relaxed"
            >
              {task.notes}
            </div>
          )}
        </div>
      )}

      {/* Row 4: Assignee avatar + Unassigned text + status label */}
      <div 
        className="flex items-center justify-between border-t pt-2 select-none"
        style={{ borderColor: 'var(--notion-border)' }}
      >
        <div className="relative z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAssigneeDropdown(!showAssigneeDropdown);
            }}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-[var(--notion-bg-hover)] cursor-pointer select-none border border-transparent hover:border-[var(--notion-border)] transition-all duration-150 bg-transparent text-left outline-none font-sans"
            title="Manage assignments"
            type="button"
          >
            {assignedTeammates.length > 0 ? (
              <div className="flex items-center -space-x-1">
                {assignedTeammates.map(member => (
                  <div 
                    key={member.id}
                    className={`w-[20px] h-[20px] rounded-full flex items-center justify-center text-white text-[9px] font-mono font-bold shrink-0 ring-1 ring-[var(--notion-bg-secondary)] ${member.avatarColor}`}
                    title={`${member.name} (${member.role})`}
                  >
                    {member.name[0].toUpperCase()}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[11px] text-stone-400 dark:text-stone-500 font-medium">
                <UserPlus className="w-3.5 h-3.5" />
                <span>Unassigned</span>
              </div>
            )}
          </button>

          <AnimatePresence>
            {showAssigneeDropdown && (
              <>
                {/* Fixed fullscreen overlay to detect clicks outside popover */}
                <div 
                  className="fixed inset-0 z-30 bg-transparent cursor-default"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAssigneeDropdown(false);
                  }}
                />
                
                {/* Popover list */}
                <motion.div
                  initial={{ opacity: 0, y: 5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.95 }}
                  transition={{ duration: 0.12 }}
                  className="absolute left-0 bottom-full mb-1.5 z-40 w-52 max-h-56 rounded-xl shadow-xl overflow-y-auto border p-1"
                  style={{
                    backgroundColor: 'var(--bg-surface, var(--notion-bg-secondary))',
                    borderColor: 'var(--border-default, var(--notion-border))',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-2 py-1.5 text-[9px] font-mono uppercase tracking-wider text-stone-400 border-b mb-1 select-none flex items-center justify-between" style={{ borderColor: 'var(--border-default, var(--notion-border))' }}>
                    <span>Assign Team</span>
                    {assignedTeammates.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onUpdateTask) {
                            onUpdateTask({
                              ...task,
                              assignedTo: [],
                              updatedAt: new Date().toISOString()
                            });
                          }
                        }}
                        className="text-[9px] text-rose-500 hover:underline bg-transparent border-none p-0 cursor-pointer font-bold"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  
                  {team.length === 0 ? (
                    <div className="px-2 py-3 text-xs text-stone-400 text-center select-none">
                      No team members in project.
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      {team.map(member => {
                        const isAssigned = task.assignedTo?.includes(member.id);
                        return (
                          <button
                            key={member.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onUpdateTask) {
                                const currentAssigned = task.assignedTo || [];
                                const isAlreadyAssigned = currentAssigned.includes(member.id);
                                const nextAssigned = isAlreadyAssigned
                                  ? currentAssigned.filter(id => id !== member.id)
                                  : [...currentAssigned, member.id];
                                
                                onUpdateTask({
                                  ...task,
                                  assignedTo: nextAssigned,
                                  updatedAt: new Date().toISOString()
                                });
                              }
                            }}
                            className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-[var(--notion-bg-hover)] transition-colors duration-150 text-left font-sans bg-transparent border-none outline-none"
                            style={{ color: 'var(--notion-text-primary)' }}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center text-white text-[10px] font-mono font-bold shrink-0 ${member.avatarColor}`}>
                                {member.name[0].toUpperCase()}
                              </div>
                              <div className="truncate">
                                <div className="font-semibold truncate" style={{ color: 'var(--notion-text-primary)' }}>{member.name}</div>
                                <div className="text-[10px] text-stone-400 dark:text-stone-500 truncate mt-0.5">{member.role}</div>
                              </div>
                            </div>
                            
                            {isAssigned && (
                              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 ml-2 animate-scaleIn" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Status indicator stamp */}
        <span 
          style={{
            fontSize: '11px',
            color: 'var(--n-tx3)',
            fontWeight: 400,
            background: 'none',
            border: 'none',
            padding: 0
          }} 
          className="uppercase font-mono"
        >
          {task.status === 'todo' ? 'TODO →' : task.status === 'in-progress' ? 'DOING →' : 'DONE ✔'}
        </span>
      </div>

      {/* Row 5: hover action buttons */}
      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-1 border-t pt-1" style={{ borderColor: 'var(--notion-border)' }}>
        
        {/* Rapid Status Shifts */}
        <div className="flex items-center gap-1.5 mr-auto">
          {task.status !== 'todo' && (
            <button
              onClick={() => {
                const prev: Record<StatusType, StatusType> = { 'todo': 'todo', 'in-progress': 'todo', 'completed': 'in-progress' };
                onMoveStatus(task.id, prev[task.status]);
              }}
              style={{ color: 'var(--notion-text-tertiary)', fontSize: '11px' }}
              className="hover:text-[var(--notion-text-primary)] cursor-pointer bg-transparent border-none p-0"
            >
              ← Back
            </button>
          )}
          {task.status !== 'completed' && (
            <button
              onClick={() => {
                const next: Record<StatusType, StatusType> = { 'todo': 'in-progress', 'in-progress': 'completed', 'completed': 'completed' };
                onMoveStatus(task.id, next[task.status]);
              }}
              style={{ color: 'var(--notion-text-tertiary)', fontSize: '11px' }}
              className="hover:text-[var(--notion-text-primary)] cursor-pointer bg-transparent border-none p-0"
            >
              Next →
            </button>
          )}
        </div>

        {/* Edit and Delete */}
        <button
          onClick={() => onEdit(task)}
          className="p-1 hover:bg-[var(--notion-bg-hover)] rounded transition duration-150 cursor-pointer text-neutral-500"
          style={{ color: 'var(--notion-text-tertiary)' }}
          title="Edit"
        >
          <Edit3 style={{ width: '13px', height: '13px' }} />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="p-1 hover:bg-rose-500/10 rounded transition duration-150 cursor-pointer hover:text-rose-500 text-neutral-500"
          style={{ color: 'var(--notion-text-tertiary)' }}
          title="Delete"
        >
          <Trash2 style={{ width: '13px', height: '13px' }} />
        </button>
      </div>

    </div>
  );
}
