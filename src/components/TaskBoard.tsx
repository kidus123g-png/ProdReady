import React, { useState } from 'react';
import { ChecklistItem, CategoryInfo, Teammate, StatusType } from '../types';
import TaskCard from './TaskCard';

interface TaskBoardProps {
  tasks: ChecklistItem[];
  categories: CategoryInfo[];
  team: Teammate[];
  onEdit: (task: ChecklistItem) => void;
  onDelete: (id: string) => void;
  onMoveStatus: (id: string, nextStatus: StatusType) => void;
  onUpdateTask?: (task: ChecklistItem) => void;
  isLightMode?: boolean;
  onNewCard?: (status: StatusType) => void;
}

export default function TaskBoard({ 
  tasks, 
  categories,
  team,
  onEdit, 
  onDelete, 
  onMoveStatus,
  onUpdateTask,
  onNewCard
}: TaskBoardProps) {
  const [activeDropColumn, setActiveDropColumn] = useState<StatusType | null>(null);

  // Sorting function to sort checklists by urgency
  const sortTasksByUrgency = (a: ChecklistItem, b: ChecklistItem) => {
    // Tasks with due dates are more urgent than those without
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    
    if (a.dueDate && b.dueDate) {
      // Both have due dates. Compare due dates.
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    
    // Both have no due dates. Compare by priority.
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    const aWeight = priorityWeight[a.priority] || 0;
    const bWeight = priorityWeight[b.priority] || 0;
    return bWeight - aWeight; // higher weight first
  };

  const columns: { 
    id: StatusType; 
    name: string; 
  }[] = [
    {
      id: 'todo',
      name: 'To do'
    },
    {
      id: 'in-progress',
      name: 'Active validation'
    },
    {
      id: 'completed',
      name: 'Production signed off'
    }
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, columnId: StatusType) => {
    e.preventDefault();
    setActiveDropColumn(columnId);
  };

  const handleDragLeave = () => {
    setActiveDropColumn(null);
  };

  const handleDrop = (e: React.DragEvent, columnId: StatusType) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onMoveStatus(taskId, columnId);
    }
    setActiveDropColumn(null);
  };

  return (
    <div 
      id="board-grid-cols" 
      className="flex items-start overflow-x-auto gap-4 pb-4 w-full select-none"
      style={{ minHeight: '600px' }}
    >
      {columns.map(col => {
        const colTasks = tasks.filter(task => task.status === col.id).sort(sortTasksByUrgency);
        const isHovering = activeDropColumn === col.id;

        return (
          <div
            key={col.id}
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
            style={{
              width: '300px',
              backgroundColor: isHovering ? 'var(--notion-bg-hover)' : 'var(--notion-bg-primary)'
            }}
            className="flex-shrink-0 flex flex-col h-full min-h-[500px] transition-all duration-200"
          >
            {/* Column Header */}
            <div className="flex items-center gap-2 mb-3 pb-1 select-none flex-shrink-0">
              <h3 
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--n-tx2)'
                }}
              >
                {col.name}
              </h3>
              
              <span 
                className="flex items-center justify-center font-mono"
                style={{
                  fontSize: '11px',
                  background: 'var(--n-hover)',
                  color: 'var(--n-tx2)',
                  borderRadius: '3px',
                  padding: '1px 5px',
                  marginLeft: '6px'
                }}
              >
                {colTasks.length}
              </span>
            </div>

            {/* List column body */}
            <div className="flex-1 space-y-2 overflow-y-auto max-h-[75vh] pr-1.5 scrollbar-none">
              {colTasks.length > 0 ? (
                <>
                  {colTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      categories={categories}
                      team={team}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onMoveStatus={onMoveStatus}
                      onUpdateTask={onUpdateTask}
                    />
                  ))}
                  
                  {/* Subtle placeholder to add new card inside non-empty list of columns */}
                  <div 
                    onClick={() => onNewCard?.(col.id)}
                    style={{
                      fontSize: '13px',
                      color: 'var(--notion-text-tertiary)'
                    }}
                    className="cursor-pointer hover:text-[var(--notion-text-primary)] transition-colors duration-150 py-1.5 px-2 select-none"
                  >
                    + New card
                  </div>
                </>
              ) : (
                <div 
                  onClick={() => onNewCard?.(col.id)}
                  style={{
                    fontSize: '13px',
                    color: 'var(--notion-text-tertiary)'
                  }}
                  className="cursor-pointer hover:text-[var(--notion-text-primary)] transition-colors duration-150 py-1.5 px-2 select-none"
                >
                  + New card
                </div>
              )}
            </div>
            
          </div>
        );
      })}
    </div>
  );
}
