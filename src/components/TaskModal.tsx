import React, { useState, useEffect } from 'react';
import { ChecklistItem, CategoryInfo, Teammate, PriorityType, StatusType, ChecklistItemSubtask, TaskComment } from '../types';
import { X, Plus, Trash2, AlertCircle, MessageSquare, User } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<ChecklistItem>) => void;
  taskToEdit: ChecklistItem | null;
  categories: CategoryInfo[];
  team: Teammate[];
  isLightMode: boolean;
}

export default function TaskModal({ 
  isOpen, 
  onClose, 
  onSave, 
  taskToEdit,
  categories,
  team
}: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<PriorityType>('medium');
  const [status, setStatus] = useState<StatusType>('todo');
  const [notes, setNotes] = useState('');
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [timeline, setTimeline] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [subtasks, setSubtasks] = useState<ChecklistItemSubtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Comments support state
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [commentAuthorId, setCommentAuthorId] = useState('');

  useEffect(() => {
    if (team && team.length > 0) {
      setCommentAuthorId(team[0].id);
    } else {
      setCommentAuthorId('admin-host');
    }
  }, [team]);

  const handleAddComment = () => {
    if (!newCommentText.trim()) return;
    
    let authorName = 'System Lead';
    if (commentAuthorId === 'admin-host') {
      authorName = 'Lead Auditor (Admin)';
    } else {
      const found = team.find(t => t.id === commentAuthorId);
      if (found) authorName = found.name;
    }

    const newComment: TaskComment = {
      id: `comment-${crypto.randomUUID()}`,
      text: newCommentText.trim(),
      createdAt: new Date().toISOString(),
      authorName
    };

    setComments([newComment, ...comments]);
    setNewCommentText('');
  };

  const handleRemoveComment = (commentId: string) => {
    setComments(comments.filter(c => c.id !== commentId));
  };

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description);
      setCategory(taskToEdit.category);
      setPriority(taskToEdit.priority);
      setStatus(taskToEdit.status);
      setNotes(taskToEdit.notes || '');
      setAssignedTo(taskToEdit.assignedTo || []);
      setDueDate(taskToEdit.dueDate || '');
      setTimeline(taskToEdit.timeline || '');
      setTagsInput(taskToEdit.tags?.join(' ') || '');
      setSubtasks(taskToEdit.subtasks || []);
      setComments(taskToEdit.comments || []);
    } else {
      setTitle('');
      setDescription('');
      setCategory(categories[0]?.id || '');
      setPriority('medium');
      setStatus('todo');
      setNotes('');
      setAssignedTo([]);
      setDueDate('');
      setTimeline('');
      setTagsInput('');
      setSubtasks([]);
      setComments([]);
    }
    setNewSubtaskTitle('');
    setErrors({});
  }, [taskToEdit, isOpen, categories]);

  if (!isOpen) return null;

  const handleValidateAndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Specification Standard Name is strictly required';
    }
    if (!description.trim()) {
      newErrors.description = 'Detailed target guideline or objective is strictly required';
    }
    if (!category) {
      newErrors.category = 'Please match a focus development phase';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      id: taskToEdit?.id,
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      status,
      notes: notes.trim(),
      assignedTo,
      dueDate: dueDate || undefined,
      timeline: timeline.trim() || undefined,
      tags: tagsInput ? tagsInput.split(/\s+/).map(t => {
        let clean = t.trim();
        if (!clean) return '';
        if (!clean.startsWith('#')) clean = '#' + clean;
        return clean;
      }).filter(Boolean) : undefined,
      subtasks: subtasks.length > 0 ? subtasks : undefined,
      comments: comments.length > 0 ? comments : undefined,
      custom: taskToEdit ? taskToEdit.custom : true
    });
    onClose();
  };

  const handleToggleTeammate = (memberId: string) => {
    if (assignedTo.includes(memberId)) {
      setAssignedTo(assignedTo.filter(id => id !== memberId));
    } else {
      setAssignedTo([...assignedTo, memberId]);
    }
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const item: ChecklistItemSubtask = {
      id: `subtask-${crypto.randomUUID()}`,
      title: newSubtaskTitle.trim(),
      completed: false
    };
    setSubtasks([...subtasks, item]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter(s => s.id !== id));
  };

  const handleToggleSubtaskLocal = (id: string) => {
    setSubtasks(subtasks.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
  };

  return (
    <div 
      id="task-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(2px)'
      }}
    >
      <div 
        id="task-modal-form-card"
        className="w-[540px] max-h-[80vh] overflow-y-auto rounded-lg border flex flex-col p-7 animate-fadeInUp select-none"
        style={{
          backgroundColor: 'var(--notion-bg-secondary)',
          borderColor: 'var(--notion-border)',
          color: 'var(--notion-text-primary)'
        }}
      >
        {/* Modal Header */}
        <div className="relative mb-5 flex flex-col items-start w-full">
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--notion-text-primary)' }}>
            {taskToEdit ? "Redefine Standards Clause" : "Add specification checklist item"}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--notion-text-tertiary)' }} className="mt-0.5">
            {taskToEdit ? `Modifying Check #${taskToEdit.id}` : "Appending from scratch"}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center cursor-pointer transition-colors duration-100 font-normal outline-none bg-transparent hover:bg-[var(--notion-bg-hover)] rounded"
            style={{ color: 'var(--notion-text-tertiary)' }}
          >
            ×
          </button>
        </div>

        {/* Modal Fields - Property row style */}
        <form onSubmit={handleValidateAndSubmit} className="space-y-0 w-full text-left">
          
          {/* STANDARD NAME ROW */}
          <div className="flex items-start py-2.5 border-b" style={{ borderColor: 'var(--notion-border)' }}>
            <label className="w-[120px] shrink-0 text-[12px] uppercase tracking-widest font-normal pt-1.5" style={{ color: 'var(--notion-text-secondary)', letterSpacing: '0.06em' }}>
              Standard name
            </label>
            <div className="flex-1 min-w-0">
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)}
                className="w-full text-xs bg-transparent outline-none border-none font-sans"
                style={{ height: '32px', color: 'var(--notion-text-primary)' }}
                placeholder="e.g. CSRF Protection Tokens Validation"
              />
              {errors.title && (
                <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.title}
                </p>
              )}
            </div>
          </div>

          {/* GUIDELINE ROW */}
          <div className="flex items-start py-2.5 border-b" style={{ borderColor: 'var(--notion-border)' }}>
            <label className="w-[120px] shrink-0 text-[12px] uppercase tracking-widest font-normal pt-2" style={{ color: 'var(--notion-text-secondary)', letterSpacing: '0.06em' }}>
              Guideline
            </label>
            <div className="flex-1 min-w-0">
              <textarea 
                rows={3}
                value={description} 
                onChange={e => setDescription(e.target.value)}
                className="w-full text-xs bg-transparent outline-none border-none resize-y font-sans pt-1 min-h-[60px]"
                style={{ color: 'var(--notion-text-primary)' }}
                placeholder="Clearly state what has to be implemented or audited to pass..."
              />
              {errors.description && (
                <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.description}
                </p>
              )}
            </div>
          </div>

          {/* PHASE GROUPING ROW */}
          <div className="flex items-start py-2.5 border-b" style={{ borderColor: 'var(--notion-border)' }}>
            <label className="w-[120px] shrink-0 text-[12px] uppercase tracking-widest font-normal pt-1.5" style={{ color: 'var(--notion-text-secondary)', letterSpacing: '0.06em' }}>
              Phase grouping
            </label>
            <div className="flex-1 min-w-0">
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full text-xs bg-transparent outline-none border-none cursor-pointer font-sans"
                style={{ height: '32px', color: 'var(--notion-text-primary)' }}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id} className="text-stone-900 bg-white dark:text-stone-100 dark:bg-stone-900">
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* RISK LEVEL ROW */}
          <div className="flex items-start py-2.5 border-b" style={{ borderColor: 'var(--notion-border)' }}>
            <label className="w-[120px] shrink-0 text-[12px] uppercase tracking-widest font-normal pt-1.5" style={{ color: 'var(--notion-text-secondary)', letterSpacing: '0.06em' }}>
              Risk level
            </label>
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <span 
                className="w-2 h-2 rounded-full shrink-0" 
                style={{ 
                  backgroundColor: priority === 'high' ? 'var(--notion-red)' : priority === 'medium' ? 'var(--notion-amber)' : 'var(--notion-green)' 
                }} 
              />
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as PriorityType)}
                className="w-full text-xs bg-transparent outline-none border-none cursor-pointer font-sans"
                style={{ height: '32px', color: 'var(--notion-text-primary)' }}
              >
                <option value="high" className="text-stone-900 bg-white dark:text-stone-100 dark:bg-stone-900">High</option>
                <option value="medium" className="text-stone-900 bg-white dark:text-stone-100 dark:bg-stone-900">Med</option>
                <option value="low" className="text-stone-900 bg-white dark:text-stone-100 dark:bg-stone-900">Low</option>
              </select>
            </div>
          </div>

          {/* TASK STATUS ROW */}
          <div className="flex items-start py-2.5 border-b" style={{ borderColor: 'var(--notion-border)' }}>
            <label className="w-[120px] shrink-0 text-[12px] uppercase tracking-widest font-normal pt-1.5" style={{ color: 'var(--notion-text-secondary)', letterSpacing: '0.06em' }}>
              Task status
            </label>
            <div className="flex-1 min-w-0">
              <select
                value={status}
                onChange={e => setStatus(e.target.value as StatusType)}
                className="w-full text-xs bg-transparent outline-none border-none cursor-pointer font-sans"
                style={{ height: '32px', color: 'var(--notion-text-primary)' }}
              >
                <option value="todo" className="text-stone-900 bg-white dark:text-stone-100 dark:bg-stone-900">To Do Backlog</option>
                <option value="in-progress" className="text-stone-900 bg-white dark:text-stone-100 dark:bg-stone-900">Active Validation</option>
                <option value="completed" className="text-stone-900 bg-white dark:text-stone-100 dark:bg-stone-900">Signed Off</option>
              </select>
            </div>
          </div>

          {/* DELEGATE TO CREW ROW */}
          <div className="flex items-start py-2.5 border-b" style={{ borderColor: 'var(--notion-border)' }}>
            <label className="w-[120px] shrink-0 text-[12px] uppercase tracking-widest font-normal pt-1" style={{ color: 'var(--notion-text-secondary)', letterSpacing: '0.06em' }}>
              Delegate to crew
            </label>
            <div className="flex-1 min-w-0 flex flex-col gap-2 pt-1 font-sans">
              {team.map(member => {
                const isChecked = assignedTo.includes(member.id);
                return (
                  <label key={member.id} className="flex items-center gap-2 cursor-pointer text-[13px] select-none py-0.5">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleTeammate(member.id)}
                        className="sr-only"
                      />
                      <div 
                        className="w-3.5 h-3.5 border rounded flex items-center justify-center transition-all duration-150"
                        style={{
                          borderColor: isChecked ? 'var(--notion-accent-blue)' : 'var(--notion-border)',
                          backgroundColor: isChecked ? 'var(--notion-accent-blue)' : 'transparent',
                        }}
                      >
                        {isChecked && (
                          <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span style={{ color: 'var(--notion-text-primary)' }}>
                      {member.name} ({member.role})
                    </span>
                  </label>
                );
              })}
              {team.length === 0 && (
                <p className="text-xs text-neutral-500 italic">No crew members defined.</p>
              )}
            </div>
          </div>

          {/* DEADLINE DATE ROW */}
          <div className="flex items-start py-2.5 border-b" style={{ borderColor: 'var(--notion-border)' }}>
            <label className="w-[120px] shrink-0 text-[12px] uppercase tracking-widest font-normal pt-1.5" style={{ color: 'var(--notion-text-secondary)', letterSpacing: '0.06em' }}>
              Deadline date
            </label>
            <div className="flex-1 min-w-0">
              <input 
                type="date" 
                value={dueDate} 
                onChange={e => setDueDate(e.target.value)}
                className="w-full text-xs bg-transparent outline-none border-none font-sans"
                style={{ height: '32px', color: 'var(--notion-text-primary)' }}
              />
            </div>
          </div>

          {/* TIMELINE DURATION ROW */}
          <div className="flex items-start py-2.5 border-b" style={{ borderColor: 'var(--notion-border)' }}>
            <label className="w-[120px] shrink-0 text-[12px] uppercase tracking-widest font-normal pt-1.5" style={{ color: 'var(--notion-text-secondary)', letterSpacing: '0.06em' }}>
              Timeline duration
            </label>
            <div className="flex-1 min-w-0">
              <input 
                type="text" 
                value={timeline} 
                onChange={e => setTimeline(e.target.value)}
                className="w-full text-xs bg-transparent outline-none border-none font-sans"
                style={{ height: '32px', color: 'var(--notion-text-primary)' }}
                placeholder="e.g. 2 days, Q3"
              />
            </div>
          </div>

          {/* HASHTAG GROUPINGS ROW */}
          <div className="flex items-start py-2.5 border-b" style={{ borderColor: 'var(--notion-border)' }}>
            <label className="w-[120px] shrink-0 text-[12px] uppercase tracking-widest font-normal pt-1.5" style={{ color: 'var(--notion-text-secondary)', letterSpacing: '0.06em' }}>
              Hashtag groupings
            </label>
            <div className="flex-1 min-w-0">
              <input 
                type="text" 
                value={tagsInput} 
                onChange={e => setTagsInput(e.target.value)}
                className="w-full text-xs bg-transparent outline-none border-none font-sans"
                style={{ height: '32px', color: 'var(--notion-text-primary)' }}
                placeholder="e.g. #tag1 #tag2"
              />
            </div>
          </div>

          {/* ACTIONABLE SUBTASKS */}
          <div className="flex items-start py-2.5 border-b" style={{ borderColor: 'var(--notion-border)' }}>
            <label className="w-[120px] shrink-0 text-[12px] uppercase tracking-widest font-normal pt-1.5" style={{ color: 'var(--notion-text-secondary)', letterSpacing: '0.06em' }}>
              Subtasks
            </label>
            <div className="flex-1 min-w-0 flex flex-col gap-2 pt-1 font-sans">
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 text-xs bg-transparent outline-none border rounded border-[var(--notion-border)] px-2.5 py-1"
                  style={{ color: 'var(--notion-text-primary)' }}
                  placeholder="New subtask..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="px-2 rounded-md bg-[var(--notion-accent-blue)] text-white text-xs cursor-pointer flex items-center justify-center"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {subtasks.length > 0 && (
                <div className="space-y-1.5 max-h-[110px] overflow-y-auto pr-1">
                  {subtasks.map(sub => (
                    <div key={sub.id} className="flex items-center justify-between gap-2.5 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0 select-none">
                        <input
                          type="checkbox"
                          checked={sub.completed}
                          onChange={() => handleToggleSubtaskLocal(sub.id)}
                          className="rounded border-neutral-300 text-emerald-500 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className={`truncate font-sans leading-none ${
                          sub.completed ? 'line-through text-neutral-500' : 'text-[var(--notion-text-primary)]'
                        }`}>
                          {sub.title}
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubtask(sub.id)}
                        className="text-neutral-500 hover:text-rose-500 p-1 rounded-md"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* IMPLEMENTATION NOTES / CODE SPECS */}
          <div className="flex items-start py-2.5 border-b" style={{ borderColor: 'var(--notion-border)' }}>
            <label className="w-[120px] shrink-0 text-[12px] uppercase tracking-widest font-normal pt-1.5" style={{ color: 'var(--notion-text-secondary)', letterSpacing: '0.06em' }}>
              Specs & notes
            </label>
            <div className="flex-1 min-w-0">
              <textarea 
                rows={2}
                value={notes} 
                onChange={e => setNotes(e.target.value)}
                className="w-full text-xs bg-transparent outline-none border-none resize-y font-mono min-h-[40px] pt-1"
                style={{ color: 'var(--notion-text-primary)' }}
                placeholder="Implementation guidelines, notes or code details..."
              />
            </div>
          </div>

          {/* COMMENTS & ANNOTATIONS STREAM */}
          <div className="flex flex-col py-4 border-b text-left" style={{ borderColor: 'var(--notion-border)' }}>
            <div className="flex items-center gap-1.5 mb-3">
              <MessageSquare className="w-4 h-4 text-[var(--notion-accent-blue)]" />
              <label 
                className="text-[11px] uppercase tracking-wider font-semibold" 
                style={{ color: 'var(--notion-text-secondary)', letterSpacing: '0.06em' }}
              >
                Auditor Comments & Annotations
              </label>
            </div>

            {/* Comment posting inline controls */}
            <div className="flex flex-col gap-2.5 p-3 rounded-md bg-[var(--notion-bg-hover)] border mb-4" style={{ borderColor: 'var(--notion-border)' }}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11.5px] text-stone-500 font-sans">Posting attribution:</span>
                <select
                  value={commentAuthorId}
                  onChange={e => setCommentAuthorId(e.target.value)}
                  className="bg-[var(--notion-bg-primary)] px-2 py-1 rounded text-xs border border-transparent hover:border-[var(--notion-border)] select-none focus:outline-none"
                  style={{ color: 'var(--notion-text-primary)' }}
                >
                  <option value="admin-host">Lead Auditor (Admin)</option>
                  {team.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.role || 'Teammate'})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Record an observation, block reason, or audit decision..."
                  value={newCommentText}
                  onChange={e => setNewCommentText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                  className="flex-1 bg-[var(--notion-bg-primary)] px-3 py-1.5 rounded text-xs select-text focus:outline-none focus:ring-1 focus:ring-blue-500 border border-neutral-300 dark:border-neutral-700"
                  style={{
                    color: 'var(--notion-text-primary)'
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddComment}
                  className="px-3 py-1.5 rounded bg-[var(--notion-accent-blue)] hover:opacity-90 text-white font-semibold text-xs cursor-pointer flex items-center justify-center shrink-0 transition"
                >
                  Post
                </button>
              </div>
            </div>

            {/* List of comments */}
            {comments.length > 0 ? (
              <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                {comments.map(c => (
                  <div 
                    key={c.id} 
                    className="p-2.5 rounded border text-left flex flex-col gap-1 transition duration-150"
                    style={{
                      borderColor: 'var(--notion-border)',
                      backgroundColor: 'rgba(150,150,150, 0.02)'
                    }}
                  >
                    <div className="flex items-center justify-between gap-2.5 text-[10px] font-mono text-stone-550">
                      <span className="font-semibold text-stone-400 flex items-center gap-1">
                        <User className="w-2.5 h-2.5 text-stone-400 shrink-0" />
                        {c.authorName}
                      </span>
                      <div className="flex items-center gap-2 text-stone-500">
                        <span>{new Date(c.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveComment(c.id)}
                          className="hover:text-rose-500 font-bold ml-1 transition"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <p className="text-[11.5px] font-sans pr-4 select-text leading-normal" style={{ color: 'var(--notion-text-primary)' }}>
                      {c.text}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-500 italic py-2 pr-2 text-left font-sans">
                No auditor comments on this specification yet. Add notes to coordinate decisions.
              </p>
            )}
          </div>

        </form>

        {/* Modal Submit Actions Footer */}
        <div className="pt-4 mt-6 flex items-center justify-end gap-2 border-t w-full" style={{ borderColor: 'var(--notion-border)' }}>
          <button
            type="button"
            onClick={onClose}
            className="px-3 h-8 rounded text-xs transition duration-150 cursor-pointer text-stone-600 dark:text-stone-300 hover:bg-[var(--notion-bg-hover)]"
            style={{
              backgroundColor: 'transparent',
              border: 'none'
            }}
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={(e) => handleValidateAndSubmit(e)}
            className="px-4.5 h-8 rounded text-xs font-semibold cursor-pointer text-white flex items-center justify-center transition"
            style={{
              backgroundColor: 'var(--notion-accent-blue)',
            }}
          >
            <span>{taskToEdit ? "Recommit Spec" : "Commit Spec"}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
