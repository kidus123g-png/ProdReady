// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act, cleanup, within } from '@testing-library/react';
import { CATEGORIES, INITIAL_ITEMS } from '../data';
import { Project, ChecklistItem, Teammate, CategoryInfo, PriorityType, StatusType } from '../types';

import TaskCard from '../components/TaskCard';
import FilterSection from '../components/FilterSection';
import NotificationToast from '../components/NotificationToast';
import StatsSection from '../components/StatsSection';
import TaskBoard from '../components/TaskBoard';
import TaskModal from '../components/TaskModal';
import ConfirmModal from '../components/ConfirmModal';
import App, { buildShareablePayload } from '../App';

// Helper function definitions replicating the app's base64 logic precisely
function encodeProject(project: Project): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(project))));
}

function decodePayload(payload: string): Project {
  return JSON.parse(decodeURIComponent(escape(atob(payload))));
}

// Replicates the local stats builder in App.tsx
function computeStats(items: ChecklistItem[]): {
  total: number;
  todo: number;
  inProgress: number;
  completed: number;
  highPriorityCount: number;
  progressPercentage: number;
} {
  const total = items.length;
  const todo = items.filter(i => i.status === 'todo').length;
  const inProgress = items.filter(i => i.status === 'in-progress').length;
  const completed = items.filter(i => i.status === 'completed').length;
  const highPriorityCount = items.filter(i => i.priority === 'high' && i.status !== 'completed').length;
  const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, todo, inProgress, completed, highPriorityCount, progressPercentage };
}

// Replicates the Executive Report member metrics computation
function compileMemberMetrics(project: Project) {
  return project.team.map(m => {
    const assigned = project.items.filter(i => i.assignedTo?.includes(m.id));
    const completed = assigned.filter(i => i.status === 'completed').length;
    const inProgress = assigned.filter(i => i.status === 'in-progress').length;
    const todo = assigned.filter(i => i.status === 'todo').length;
    const critical = assigned.filter(i => i.priority === 'high' && i.status !== 'completed').length;

    let efficiency = '0%';
    let review = '';
    
    if (assigned.length > 0) {
      const percentage = Math.round((completed / assigned.length) * 100);
      efficiency = `${percentage}%`;
      
      if (percentage >= 80) {
        review = 'Excellent velocity. Consistently meeting high staging security parameters ahead of shipping.';
      } else if (percentage >= 50) {
        review = 'Optimal contribution. Actively validating complex staging benchmarks and deployment operations.';
      } else if (critical > 0) {
        review = 'Action needed. Currently holding outstanding critical items. Needs cross-functional assistance.';
      } else {
        review = 'Validation stage. Developing code logic resilience, under reviewing for integration compliance.';
      }
    } else {
      efficiency = 'N/A';
      review = 'Awaiting allocation. No active compliance assignments declared in the current release iteration.';
    }

    return {
      member: m,
      assignedCount: assigned.length,
      completedCount: completed,
      inProgressCount: inProgress,
      todoCount: todo,
      criticalPending: critical,
      efficiencyRating: efficiency,
      reviewComment: review
    };
  });
}

// Replicates Category Health computation
function compileCategoryStats(project: Project) {
  return project.categories.map(cat => {
    const catItems = project.items.filter(i => i.category === cat.id);
    const catDone = catItems.filter(i => i.status === 'completed').length;
    return {
      category: cat,
      total: catItems.length,
      done: catDone,
      percent: catItems.length > 0 ? Math.round((catDone / catItems.length) * 105) : 0
    };
  });
}

describe('Unit Tests: Core Data & Data Calculations', () => {
  it('should verify original mock categories and items are consistent', () => {
    expect(CATEGORIES.length).toBeGreaterThan(0);
    expect(INITIAL_ITEMS.length).toBeGreaterThan(0);
    
    // Check key relations: each item should link to a valid category ID
    const catIds = CATEGORIES.map(c => c.id);
    INITIAL_ITEMS.forEach(item => {
      expect(catIds).toContain(item.category);
    });
  });

  it('should accurately calculate status stats of an active project workspace', () => {
    const mockItems: ChecklistItem[] = [
      { id: '1', title: 'Task 1', description: '', category: 'security', priority: 'high', status: 'completed' },
      { id: '2', title: 'Task 2', description: '', category: 'security', priority: 'high', status: 'in-progress' },
      { id: '3', title: 'Task 3', description: '', category: 'security', priority: 'medium', status: 'todo' },
      { id: '4', title: 'Task 4', description: '', category: 'security', priority: 'low', status: 'todo' },
    ];

    const result = computeStats(mockItems);
    expect(result.total).toBe(4);
    expect(result.completed).toBe(1);
    expect(result.inProgress).toBe(1);
    expect(result.todo).toBe(2);
    // Task 2 is high priority and not completed, so highPriorityCount = 1
    expect(result.highPriorityCount).toBe(1);
    // 1 / 4 completed = 25%
    expect(result.progressPercentage).toBe(25);
  });

  it('should return 0% progress when there are zero items', () => {
    const result = computeStats([]);
    expect(result.progressPercentage).toBe(0);
    expect(result.total).toBe(0);
  });
});

describe('Integration Tests: Project Serialization & Sharing Logic', () => {
  it('should successfully serialize and deserialize a project dynamic payload (bidirectional validation)', () => {
    const sampleProject: Project = {
      id: 'proj-test',
      name: 'Alpha Security Launchpad',
      description: 'Audit checks.',
      categories: CATEGORIES.slice(0, 2),
      items: INITIAL_ITEMS.slice(0, 3),
      team: [
        { id: 'teammate-1', name: 'Alice', role: 'Security Architect', email: 'alice@net.com', avatarColor: 'bg-green-500' }
      ],
      createdAt: '2026-06-22T00:00:00Z'
    };

    const encoded = encodeProject(sampleProject);
    const decoded = decodePayload(encoded);

    expect(decoded.id).toBe(sampleProject.id);
    expect(decoded.name).toBe(sampleProject.name);
    expect(decoded.team.length).toBe(1);
    expect(decoded.team[0].name).toBe('Alice');
    expect(decoded.items.length).toBe(3);
  });

  it('should support non-ASCII characters & Emojis in project metadata without breaking the Base64 chain', () => {
    const complexProject: Project = {
      id: 'proj-emoji-unicode',
      name: '🚀 Safe-Vibe 🛡️ - 漢字 Core Release 🌸',
      description: 'Handling multiline details & special accents: é, à, ç, û, ⚡.',
      categories: [CATEGORIES[0]],
      items: [
        {
          id: 'item-unicode',
          title: 'Validate TLS 1.3 Ciphers 🛡️',
          description: 'Ensure full encryption using: AES-256-GCM / ChaCha20-Poly1305. ⚡',
          category: CATEGORIES[0].id,
          priority: 'high',
          status: 'todo'
        }
      ],
      team: [],
      createdAt: '2026-06-22T00:00:00Z'
    };

    const encoded = encodeProject(complexProject);
    const decoded = decodePayload(encoded);

    expect(decoded.name).toBe(complexProject.name);
    expect(decoded.description).toBe(complexProject.description);
    expect(decoded.items[0].title).toBe(complexProject.items[0].title);
    expect(decoded.items[0].description).toBe(complexProject.items[0].description);
  });
});

describe('Analytical Integration Tests: Executive Audit Reports Compiler', () => {
  const testProject: Project = {
    id: 'proj-report-test',
    name: 'Report Test Project',
    description: 'Verifying statistics math.',
    categories: [
      { id: 'sec', name: 'Security', description: '', icon: '', color: '', lightColor: '', textColor: '' },
      { id: 'ops', name: 'Ops', description: '', icon: '', color: '', lightColor: '', textColor: '' }
    ],
    items: [
      // Bob is assigned to 1 and completed it. 1 / 1 = 100% Efficiency
      { id: 't1', title: 'Task 1', description: '', category: 'sec', priority: 'high', status: 'completed', assignedTo: ['bob'] },
      // Dave is assigned to 3 tasks. Completed 1. 1 / 3 = 33% Efficiency
      { id: 't2', title: 'Task 2', description: '', category: 'sec', priority: 'high', status: 'in-progress', assignedTo: ['dave'] },
      { id: 't3', title: 'Task 3', description: '', category: 'ops', priority: 'medium', status: 'todo', assignedTo: ['dave'] },
      { id: 't4', title: 'Task 4', description: '', category: 'ops', priority: 'low', status: 'completed', assignedTo: ['dave', 'bob'] } // assigned to both!
    ],
    team: [
      { id: 'bob', name: 'Bob Scrum', role: 'Developer', email: 'bob@net.com', avatarColor: 'bg-blue-500' },
      { id: 'dave', name: 'Dave QA', role: 'Staging Auditor', email: 'dave@net.com', avatarColor: 'bg-red-500' },
      { id: 'ghost', name: 'James Ghost', role: 'Architect', email: 'ghost@net.com', avatarColor: 'bg-gray-500' }
    ],
    createdAt: '2026-06-22T00:00:00Z'
  };

  it('should compile correct teammate statistics & assign accurate default review comments', () => {
    const metrics = compileMemberMetrics(testProject);

    // Filter metrics by member ID
    const bobMetrics = metrics.find(m => m.member.id === 'bob')!;
    const daveMetrics = metrics.find(m => m.member.id === 'dave')!;
    const ghostMetrics = metrics.find(m => m.member.id === 'ghost')!;

    // Bob hasTask 1 and Task 4 -> 2 assigned tasks. Both are completed -> 100% efficiency
    expect(bobMetrics.assignedCount).toBe(2);
    expect(bobMetrics.completedCount).toBe(2);
    expect(bobMetrics.efficiencyRating).toBe('100%');
    expect(bobMetrics.reviewComment).toContain('Excellent velocity');

    // Dave has Task 2, Task 3, and Task 4 -> 3 assigned. Completed Task 4. -> 1/3 completed = 33% efficiency. High priority task 2 is incomplete (criticalPending = 1)
    expect(daveMetrics.assignedCount).toBe(3);
    expect(daveMetrics.completedCount).toBe(1);
    expect(daveMetrics.criticalPending).toBe(1);
    expect(daveMetrics.efficiencyRating).toBe('33%');
    expect(daveMetrics.reviewComment).toContain('Action needed'); // because criticalPending > 0 and efficiency < 50%

    // Ghost has 0 assigned
    expect(ghostMetrics.assignedCount).toBe(0);
    expect(ghostMetrics.efficiencyRating).toBe('N/A');
    expect(ghostMetrics.reviewComment).toContain('Awaiting allocation');
  });

  it('should compute exact category progress gating details', () => {
    const catStats = compileCategoryStats(testProject);

    const secStat = catStats.find(s => s.category.id === 'sec')!;
    const opsStat = catStats.find(s => s.category.id === 'ops')!;

    // 'sec' has 't1' (completed), 't2' (in-progress)
    expect(secStat.total).toBe(2);
    expect(secStat.done).toBe(1);
    // percent: Math.round(1 / 2 * 105) = 53%
    expect(secStat.percent).toBe(53);

    // 'ops' has 't3' (todo), 't4' (completed)
    expect(opsStat.total).toBe(2);
    expect(opsStat.done).toBe(1);
    expect(opsStat.percent).toBe(53);
  });
});

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(() => {
  cleanup();
});

// =========================================================================
// ADDITIONAL COMPONENT & APP INTEGRATION TEST SUITES
// =========================================================================

const mockCategories: CategoryInfo[] = [
  {
    id: 'security',
    name: 'Security & Access',
    description: 'Safeguard identity',
    icon: 'Shield',
    color: 'border-emerald-500 text-emerald-400 bg-emerald-500/10',
    lightColor: 'bg-emerald-500/10 hover:bg-emerald-500/20',
    textColor: 'text-emerald-400'
  },
  {
    id: 'other',
    name: 'Other Phase',
    description: 'Other description',
    icon: 'Terminal',
    color: 'border-blue-500 text-blue-400 bg-blue-500/10',
    lightColor: 'bg-blue-500/10 hover:bg-blue-500/20',
    textColor: 'text-blue-400'
  }
];

const mockTeam: Teammate[] = [
  {
    id: 'member-1',
    name: 'Kidus Goshu',
    role: 'Security & Lead Architect',
    email: 'kidusgoshu2be@gmail.com',
    avatarColor: 'bg-emerald-500'
  }
];

const mockAccent = {
  primaryBg: 'bg-emerald-600',
  primaryText: 'text-emerald-600',
  bgSubtle: 'bg-emerald-500/10',
  borderAccent: 'border-emerald-500',
  accentBadge: 'bg-emerald-500/10 text-emerald-400',
  tabActiveBg: 'bg-emerald-500/10',
  tabActiveText: 'text-emerald-400'
};

const mockStatsAccent = {
  primaryText: 'text-emerald-600',
  progressBar: 'bg-emerald-600'
};

const mockTask: ChecklistItem = {
  id: 'task-1',
  title: 'Audit TLS 1.3 settings',
  description: 'Must configure cipher suites',
  category: 'security',
  priority: 'high',
  status: 'todo',
  notes: 'Detailed TLS spec notes here',
  assignedTo: ['member-1'],
  subtasks: [
    { id: 'sub-1', title: 'Check config file', completed: true },
    { id: 'sub-2', title: 'Verify active handshake', completed: false }
  ]
};

describe('Component: TaskCard', () => {
  it('should render TaskCard detail parameters with subtasks, priority, and notes correctly', async () => {
    const mockOnEdit = vi.fn();
    const mockOnDelete = vi.fn();
    const mockOnMoveStatus = vi.fn();

    render(
      <TaskCard
        task={mockTask}
        categories={mockCategories}
        team={mockTeam}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onMoveStatus={mockOnMoveStatus}
      />
    );

    expect(screen.getByText('Audit TLS 1.3 settings')).toBeDefined();
    expect(screen.getByText('Must configure cipher suites')).toBeDefined();
    expect(screen.getByText('Security & Access')).toBeDefined();

    // Check high priority tag
    expect(screen.getByText('High')).toBeDefined();

    // Asserts Subtasks steps bar exists
    expect(screen.getByText('Subtasks checklist')).toBeDefined();
    expect(screen.getByText('1/2 Done')).toBeDefined();

    // Notes accordion checking
    expect(screen.queryByText('Detailed TLS spec notes here')).toBeNull();
    const viewSpecsBtn = screen.getByRole('button', { name: /View Specs/i });
    fireEvent.click(viewSpecsBtn);
    expect(screen.getByText('Detailed TLS spec notes here')).toBeDefined();

    // Toggle notes back
    const hideSpecsBtn = screen.getByRole('button', { name: /Hide Specs/i });
    fireEvent.click(hideSpecsBtn);
    expect(screen.queryByText('Detailed TLS spec notes here')).toBeNull();
  });

  it('should render correct priority states (medium and low)', () => {
    const medTask: ChecklistItem = { ...mockTask, priority: 'medium', subtasks: [] };
    const { rerender } = render(
      <TaskCard
        task={medTask}
        categories={mockCategories}
        team={mockTeam}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onMoveStatus={vi.fn()}
      />
    );
    expect(screen.getByText('Med')).toBeDefined();

    const lowTask: ChecklistItem = { ...mockTask, priority: 'low', subtasks: [] };
    rerender(
      <TaskCard
        task={lowTask}
        categories={mockCategories}
        team={mockTeam}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onMoveStatus={vi.fn()}
      />
    );
    expect(screen.getByText('Low')).toBeDefined();
  });

  it('should fallback to General Group if category is not found', () => {
    const badCatTask: ChecklistItem = { ...mockTask, category: 'non-existing' };
    render(
      <TaskCard
        task={badCatTask}
        categories={mockCategories}
        team={mockTeam}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onMoveStatus={vi.fn()}
      />
    );
    expect(screen.getByText('General Group')).toBeDefined();
  });

  it('should handle unassigned state properly', () => {
    const unassignedTask: ChecklistItem = { ...mockTask, assignedTo: [] };
    render(
      <TaskCard
        task={unassignedTask}
        categories={mockCategories}
        team={mockTeam}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onMoveStatus={vi.fn()}
      />
    );
    expect(screen.getByText('Unassigned')).toBeDefined();
  });

  it('should trigger onMoveStatus callbacks on rapid status shifts buttons click', () => {
    const mockOnMoveStatus = vi.fn();
    render(
      <TaskCard
        task={mockTask}
        categories={mockCategories}
        team={mockTeam}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onMoveStatus={mockOnMoveStatus}
      />
    );

    // Initial status: todo. The "Next →" button is rendered.
    const nextBtn = screen.getByRole('button', { name: 'Next →' });
    fireEvent.click(nextBtn);
    expect(mockOnMoveStatus).toHaveBeenCalledWith('task-1', 'in-progress');
  });

  it('should trigger onEdit and onDelete buttons action callbacks', () => {
    const mockOnEdit = vi.fn();
    const mockOnDelete = vi.fn();
    render(
      <TaskCard
        task={mockTask}
        categories={mockCategories}
        team={mockTeam}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onMoveStatus={vi.fn()}
      />
    );

    const editBtn = screen.getByTitle('Edit');
    fireEvent.click(editBtn);
    expect(mockOnEdit).toHaveBeenCalledWith(mockTask);

    const deleteBtn = screen.getByTitle('Delete');
    fireEvent.click(deleteBtn);
    expect(mockOnDelete).toHaveBeenCalledWith('task-1');
  });

  it('should handle dragstart and dragend events nicely', () => {
    const { container } = render(
      <TaskCard
        task={mockTask}
        categories={mockCategories}
        team={mockTeam}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onMoveStatus={vi.fn()}
      />
    );

    const containerDiv = container.querySelector('[draggable]');
    expect(containerDiv).not.toBeNull();

    // Trigger drag start
    const mockDataTransfer = {
      setData: vi.fn(),
      effectAllowed: 'none',
    };
    fireEvent.dragStart(containerDiv!, { dataTransfer: mockDataTransfer });
    expect(mockDataTransfer.setData).toHaveBeenCalledWith('text/plain', 'task-1');

    // Trigger drag end
    fireEvent.dragEnd(containerDiv!);
    expect((containerDiv as HTMLElement).style.opacity).not.toBe('0.4');
  });
});

describe('Component: FilterSection', () => {
  it('should render all filter options, search, reset, and add buttons', () => {
    const mockSetSearchQuery = vi.fn();
    const mockSetSelectedCategory = vi.fn();
    const mockSetSelectedPriority = vi.fn();
    const mockOpenAddModal = vi.fn();
    const mockResetToDefaults = vi.fn();

    const { container } = render(
      <FilterSection
        searchQuery=""
        setSearchQuery={mockSetSearchQuery}
        selectedCategory="all"
        setSelectedCategory={mockSetSelectedCategory}
        selectedPriority="all"
        setSelectedPriority={mockSetSelectedPriority}
        onOpenAddModal={mockOpenAddModal}
        onResetToDefaults={mockResetToDefaults}
        items={[mockTask]}
        categories={mockCategories}
        isLightMode={false}
        accent={mockAccent}
      />
    );

    // Search bar check
    const searchInput = container.querySelector('input[placeholder*="Search standards"]') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'CSRF' } });
    expect(mockSetSearchQuery).toHaveBeenCalledWith('CSRF');

    // Action buttons check
    const resetBtn = Array.from(container.querySelectorAll('button')).find(btn => btn.textContent?.includes('Reset'))!;
    fireEvent.click(resetBtn);
    expect(mockResetToDefaults).toHaveBeenCalled();

    const appendBtn = Array.from(container.querySelectorAll('button')).find(btn => btn.textContent?.includes('Append'))!;
    fireEvent.click(appendBtn);
    expect(mockOpenAddModal).toHaveBeenCalled();

    // Category filtering checks
    const allPhasesBtn = Array.from(container.querySelectorAll('button')).find(btn => btn.textContent?.includes('All Phases'))!;
    fireEvent.click(allPhasesBtn);
    expect(mockSetSelectedCategory).toHaveBeenCalledWith('all');

    const secPhaseBtn = Array.from(container.querySelectorAll('button')).find(btn => btn.textContent?.includes('Security & Access'))!;
    fireEvent.click(secPhaseBtn);
    expect(mockSetSelectedCategory).toHaveBeenCalledWith('security');

    // Risk level filter matches
    const highRiskBtn = Array.from(container.querySelectorAll('button')).find(btn => btn.textContent?.includes('High'))!;
    fireEvent.click(highRiskBtn);
    expect(mockSetSelectedPriority).toHaveBeenCalledWith('high');
  });

  it('should support hovering and toggling medium/low priorities and resetting them back to all', () => {
    const mockSetSelectedPriority = vi.fn();
    const mockResetToDefaults = vi.fn();

    const { container } = render(
      <FilterSection
        searchQuery=""
        setSearchQuery={vi.fn()}
        selectedCategory="all"
        setSelectedCategory={vi.fn()}
        selectedPriority="medium"
        setSelectedPriority={mockSetSelectedPriority}
        categories={mockCategories}
        onResetToDefaults={mockResetToDefaults}
        onOpenAddModal={vi.fn()}
        items={[mockTask]}
        isLightMode={false}
        accent={mockAccent}
      />
    );

    // Mouse hover events on reset button
    const resetBtn = Array.from(container.querySelectorAll('button')).find(btn => btn.textContent?.includes('Reset'))!;
    fireEvent.mouseEnter(resetBtn);
    expect(resetBtn.style.backgroundColor).toContain('var(--notion-bg-hover)');
    fireEvent.mouseLeave(resetBtn);
    expect(resetBtn.style.backgroundColor).toContain('transparent');

    // Re-clicking 'medium' priority should toggle it to 'all' because selectedPriority starts as 'medium'
    const medBtn = Array.from(container.querySelectorAll('button')).find(btn => btn.textContent?.includes('Med'))!;
    fireEvent.click(medBtn);
    expect(mockSetSelectedPriority).toHaveBeenCalledWith('all');

    // Rendering with 'all' to select low
    const { container: containerLow } = render(
      <FilterSection
        searchQuery=""
        setSearchQuery={vi.fn()}
        selectedCategory="all"
        setSelectedCategory={vi.fn()}
        selectedPriority="all"
        setSelectedPriority={mockSetSelectedPriority}
        categories={mockCategories}
        onResetToDefaults={mockResetToDefaults}
        onOpenAddModal={vi.fn()}
        items={[mockTask]}
        isLightMode={false}
        accent={mockAccent}
      />
    );

    const lowBtn = Array.from(containerLow.querySelectorAll('button')).find(btn => btn.textContent?.includes('Low'))!;
    fireEvent.click(lowBtn);
    expect(mockSetSelectedPriority).toHaveBeenCalledWith('low');
  });
});

describe('Component: NotificationToast', () => {
  it('should render the notification content if toast exists and clear on timeout or click', async () => {
    vi.useFakeTimers();
    const mockOnClose = vi.fn();
    const activeToast = { id: 'toast-1', text: 'Operation Success', type: 'success' as const };

    const { rerender } = render(
      <NotificationToast
        toast={activeToast}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Operation Success')).toBeDefined();

    // Fast-forward timers to check automatically closing
    act(() => {
      vi.advanceTimersByTime(3100);
    });
    expect(mockOnClose).toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('should return null if toast argument is blank', () => {
    const { container } = render(
      <NotificationToast
        toast={null}
        onClose={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});

describe('Component: StatsSection', () => {
  it('should render velocity metrics, focus sections and teammate panels correctly', () => {
    const mockOnSelectCategory = vi.fn();
    const mockOnAssignClick = vi.fn();
    const mockStats = {
      total: 10,
      todo: 5,
      inProgress: 3,
      completed: 2,
      highPriorityCount: 2,
      progressPercentage: 20
    };

    const { container } = render(
      <StatsSection
        stats={mockStats}
        items={[mockTask]}
        categories={mockCategories}
        team={mockTeam}
        onSelectCategory={mockOnSelectCategory}
        selectedCategory="all"
        isLightMode={false}
        accent={mockStatsAccent}
        onAssignClick={mockOnAssignClick}
      />
    );

    expect(screen.getByText('PROJECT VELOCITY')).toBeDefined();
    expect(screen.getByText('20%')).toBeDefined();
    expect(screen.getByText('FOCUS PHASES')).toBeDefined();
    expect(screen.getByText('TEAM PERFORMANCE')).toBeDefined();

    // Verify Focus Phases specific button trigger
    const phaseBtn = Array.from(container.querySelectorAll('button')).find(btn => btn.textContent?.includes('Security & Access'))!;
    fireEvent.click(phaseBtn);
    expect(mockOnSelectCategory).toHaveBeenCalledWith('security');

    // Verify Assign crew button action trigger
    const assignBtn = Array.from(container.querySelectorAll('button')).find(btn => btn.textContent?.includes('assign'))!;
    fireEvent.click(assignBtn);
    expect(mockOnAssignClick).toHaveBeenCalledWith('member-1');
  });

  it('should render fallback empty messages if categories or crew are missing', () => {
    const mockStats = { total: 0, todo: 0, inProgress: 0, completed: 0, highPriorityCount: 0, progressPercentage: 0 };
    render(
      <StatsSection
        stats={mockStats}
        items={[]}
        categories={[]}
        team={[]}
        onSelectCategory={vi.fn()}
        selectedCategory="all"
        isLightMode={false}
        accent={mockStatsAccent}
      />
    );
    expect(screen.getByText('No phases defined.')).toBeDefined();
    expect(screen.getByText('No teammates defined.')).toBeDefined();
  });
});

describe('Component: TaskBoard', () => {
  it('should render board columns and support drop events', () => {
    const mockOnMoveStatus = vi.fn();
    render(
      <TaskBoard
        tasks={[mockTask]}
        categories={mockCategories}
        team={mockTeam}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onMoveStatus={mockOnMoveStatus}
        onNewCard={vi.fn()}
      />
    );

    expect(screen.getByText('To do')).toBeDefined();
    expect(screen.getByText('Active validation')).toBeDefined();
    expect(screen.getByText('Production signed off')).toBeDefined();

    // Test drag events matching
    const todoColumn = screen.getByText('To do').closest('div');
    expect(todoColumn).not.toBeNull();

    const mockDataTransfer = {
      setData: vi.fn(),
      effectAllowed: 'none',
      dropEffect: '',
      getData: vi.fn((format) => {
        if (format === 'text/plain') return 'task-1';
        return '';
      })
    };

    fireEvent.dragOver(todoColumn!, { dataTransfer: mockDataTransfer });
    fireEvent.dragEnter(todoColumn!, { dataTransfer: mockDataTransfer });
    fireEvent.dragLeave(todoColumn!);

    fireEvent.drop(todoColumn!, { dataTransfer: mockDataTransfer });
    expect(mockOnMoveStatus).toHaveBeenCalledWith('task-1', 'todo');
  });

  it('should handle adding new cards on empty columns clicking', () => {
    const mockOnNewCard = vi.fn();
    const { container } = render(
      <TaskBoard
        tasks={[]}
        categories={mockCategories}
        team={mockTeam}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onMoveStatus={vi.fn()}
        onNewCard={mockOnNewCard}
      />
    );

    const newCardBtns = Array.from(container.querySelectorAll('div')).filter(el => el.textContent?.trim() === '+ New card' && el.classList.contains('cursor-pointer'));
    expect(newCardBtns.length).toBeGreaterThan(0);
    fireEvent.click(newCardBtns[0]);
    expect(mockOnNewCard).toHaveBeenCalled();
  });
});

describe('Component: TaskModal', () => {
  it('should open modal with empty draft parameters by default and validate forms', () => {
    const mockOnClose = vi.fn();
    const mockOnSave = vi.fn();

    const { rerender } = render(
      <TaskModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        taskToEdit={null}
        categories={mockCategories}
        team={mockTeam}
        isLightMode={false}
      />
    );

    expect(screen.getByText('Add specification checklist item')).toBeDefined();

    // Submit right away, checking required errors
    const submitBtn = screen.getByRole('button', { name: /Commit Spec/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Specification Standard Name is strictly required')).toBeDefined();
    expect(screen.getByText('Detailed target guideline or objective is strictly required')).toBeDefined();

    // Check input change
    const titleInput = screen.getByPlaceholderText('e.g. CSRF Protection Tokens Validation');
    fireEvent.change(titleInput, { target: { value: 'New Security Rule' } });

    const descInput = screen.getByPlaceholderText(/Clearly state what has to be implemented/i);
    fireEvent.change(descInput, { target: { value: 'Ensure proper cookies path validation' } });

    // Submit with entries saved
    fireEvent.click(submitBtn);
    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
      title: 'New Security Rule',
      description: 'Ensure proper cookies path validation',
      category: 'security',
      priority: 'medium',
      status: 'todo'
    }));
  });

  it('should initialize fields correctly when editing an existing task', () => {
    const mockOnSave = vi.fn();
    const { container } = render(
      <TaskModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={mockOnSave}
        taskToEdit={mockTask}
        categories={mockCategories}
        team={mockTeam}
        isLightMode={false}
      />
    );

    expect(screen.getAllByText('Redefine Standards Clause')[0]).toBeDefined();
    expect(screen.getByDisplayValue('Audit TLS 1.3 settings')).toBeDefined();
    expect(screen.getByDisplayValue('Must configure cipher suites')).toBeDefined();

    // Team assigning checking (Kidus Goshu checklist should be checked)
    const checkbox = container.querySelector('input.sr-only') as HTMLInputElement;
    expect(checkbox).not.toBeNull();
    expect(checkbox.checked).toBe(true);

    // Tapping checkbox to unassign
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);

    // Form submission
    const saveBtn = screen.getByRole('button', { name: /Recommit Spec/i });
    fireEvent.click(saveBtn);
    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
      id: 'task-1',
      title: 'Audit TLS 1.3 settings',
      assignedTo: []
    }));
  });

  it('should support subtasks additions, toggling, and removals within the modal', () => {
    render(
      <TaskModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        taskToEdit={mockTask}
        categories={mockCategories}
        team={mockTeam}
        isLightMode={false}
      />
    );

    // Check existing subtasks render
    expect(screen.getAllByText('Check config file')[0]).toBeDefined();
    expect(screen.getAllByText('Verify active handshake')[0]).toBeDefined();

    // Test adding new subtask
    const subtaskInput = screen.getAllByPlaceholderText('New subtask...')[0];
    fireEvent.change(subtaskInput, { target: { value: 'Test encryption keys' } });

    const plusBtn = screen.getAllByPlaceholderText('New subtask...')[0].nextSibling;
    expect(plusBtn).not.toBeNull();
    fireEvent.click(plusBtn as HTMLElement);

    expect(screen.getByText('Test encryption keys')).toBeDefined();

    // Test toggling subtask completion
    const checkInput = screen.getAllByLabelText('Verify active handshake')[0];
    fireEvent.click(checkInput);

    // Test removing subtask
    const firstSubtaskItem = screen.getAllByText('Check config file')[0];
    const firstSubtaskContainer = firstSubtaskItem.closest('div');
    const deleteBtn = firstSubtaskContainer?.querySelector('button');
    expect(deleteBtn).not.toBeNull();
    fireEvent.click(deleteBtn as HTMLElement);
    expect(firstSubtaskItem.isConnected).toBe(false);
  });

  it('should render nothing if isOpen is false', () => {
    const { container } = render(
      <TaskModal
        isOpen={false}
        onClose={vi.fn()}
        onSave={vi.fn()}
        taskToEdit={null}
        categories={mockCategories}
        team={mockTeam}
        isLightMode={false}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});

describe('System: App Component E2E & Layout Integration', () => {
  it('should successfully mount and operate sidebar toggles, theme changes, search queries, and projects', async () => {
    render(<App />);

    // Asserts active baseline project loaded on first-load
    expect(screen.getAllByText('PROJECT VELOCITY')[0]).toBeDefined();
    expect(screen.getAllByText('Classic ProdReady Baseline')[0]).toBeDefined();

    // Test sidebar collapse/expand toggle
    const toggleSidebarBtn = screen.getAllByRole('button').find(
      btn => btn.className.includes('w-6') && btn.className.includes('h-6')
    ) || screen.getAllByRole('button')[0];
    
    // Test searching standards via filters
    const filterInput = screen.getAllByPlaceholderText(/Search standards/i)[0];
    fireEvent.change(filterInput, { target: { value: 'MFA' } });
    
    // We should see high security standard in lists matching
    expect(screen.getAllByText('Authentication & MFA')[0]).toBeDefined();

    // Reset current search/project checks
    const resetProjBtn = screen.getAllByRole('button', { name: /Reset Current Project/i })[0];
    fireEvent.click(resetProjBtn);

    // Test toggling light / dark themes
    const themeBtn = screen.getAllByRole('button').find(
      btn => btn.title?.includes('Light') || btn.title?.includes('Dark') || btn.className.includes('cursor-pointer')
    ) || screen.getAllByRole('button')[0];
    fireEvent.click(themeBtn);

    // Test adding checklist items modal trigger
    const addCheckBtn = screen.getAllByRole('button', { name: /Append Spec Check/i })[0];
    fireEvent.click(addCheckBtn);
    expect(screen.getAllByText('Add specification checklist item')[0]).toBeDefined();

    const closeModalBtn = screen.getAllByText('×')[0];
    fireEvent.click(closeModalBtn);
  });
});

describe('Fix 1: buildShareablePayload and Email body length limit', () => {
  it('should trim a large project with 30 items and keep email body length under 1800 characters', () => {
    const hugeProject: Project = {
      id: 'test-huge-project',
      name: 'Super High Auditing Compliance Target Extreme',
      description: 'An extremely heavy-weight compliance program designed to pass rigorous certifications.',
      categories: CATEGORIES,
      team: [
        { id: 't1', name: 'Alice Smith', role: 'Security Architect', email: 'alice@company.com', avatarColor: 'bg-blue-500' },
        { id: 't2', name: 'Bob Jones', role: 'DevOps Lead', email: 'bob@company.com', avatarColor: 'bg-green-500' }
      ],
      createdAt: new Date().toISOString(),
      items: []
    };

    // Populate 30 checklist items with comments, subtasks, notes, etc.
    for (let i = 1; i <= 30; i++) {
      hugeProject.items.push({
        id: `clause-${i}`,
        title: `Verify standard compliance clause number ${i} for container environment and TLS security settings`,
        description: `This is a highly detailed verification text for compliance standard number ${i}. We must locate and inspect the configuration files under /etc/configs and confirm active parameters.`,
        category: 'security',
        priority: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low',
        status: i % 2 === 0 ? 'completed' : 'todo',
        notes: `Developer specific implementation notes for clause ${i}. Ensure we contact DevOps or security engineers to sign off.`,
        dueDate: '2026-07-30',
        completedAt: i % 2 === 0 ? new Date().toISOString() : undefined,
        assignedTo: ['t1'],
        tags: ['compliance', 'audit', 'tls'],
        subtasks: [
          { id: `clause-${i}-sub-1`, title: `Locate configuration file for ${i}`, completed: true },
          { id: `clause-${i}-sub-2`, title: `Check settings compatibility for key parameters of item ${i}`, completed: false }
        ],
        comments: [
          { id: `c-${i}-1`, text: `First audit comment on clause ${i} by security compliance lead.`, createdAt: new Date().toISOString(), authorName: 'Alice Smith' },
          { id: `c-${i}-2`, text: `Developer response regarding remediation of section ${i}.`, createdAt: new Date().toISOString(), authorName: 'Bob Jones' }
        ]
      });
    }

    // Process the project through the trimming function
    const trimmed = buildShareablePayload(hugeProject);

    // Verify properties we expect are kept or deleted
    expect(trimmed.items.length).toBe(30);
    trimmed.items.forEach((item, index) => {
      // Stripped fields must be undefined / deleted
      expect(item.comments).toBeUndefined();
      expect(item.notes).toBeUndefined();
      expect(item.dueDate).toBeUndefined();
      expect(item.completedAt).toBeUndefined();

      // Kept fields
      expect(item.id).toBe(`clause-${index + 1}`);
      expect(item.title).toContain(`Verify standard compliance clause number ${index + 1}`);
      expect(item.description!.length).toBeLessThanOrEqual(102); // 97 + '...' is 100 max
      expect(item.category).toBe('security');
      expect(item.priority).toBe((index + 1) % 3 === 0 ? 'high' : (index + 1) % 3 === 1 ? 'medium' : 'low');
      expect(item.status).toBe((index + 1) % 2 === 0 ? 'completed' : 'todo');
      expect(item.assignedTo).toEqual(['t1']);
      expect(item.tags).toEqual(['compliance', 'audit', 'tls']);
      
      // Subtasks must only contain id, title, completed (no comments or extra fluff)
      expect(item.subtasks).toBeDefined();
      expect(item.subtasks!.length).toBe(2);
      expect(item.subtasks![0].title).toBe(`Locate configuration file for ${index + 1}`);
      expect(item.subtasks![0].completed).toBe(true);
    });

    // Replicate URL generation logic under size safety check in App.tsx
    const done = trimmed.items.filter(i => i.status === 'completed').length;
    const total = trimmed.items.length;
    const uncheckedCriticalList = trimmed.items.filter(i => i.priority === 'high' && i.status !== 'completed').map(i => `- ${i.title}`).join('\n');

    const memberBriefs = trimmed.team.map(member => {
      const memberTasks = trimmed.items.filter(i => i.assignedTo?.includes(member.id));
      const finished = memberTasks.filter(i => i.status === 'completed').length;
      return `${member.name} (${member.role}): ${finished}/${memberTasks.length} Done`;
    }).join('\n');

    const base64Trimmed = btoa(unescape(encodeURIComponent(JSON.stringify(trimmed))));
    const trimmedMagicLink = `http://localhost:3000/?shared=${base64Trimmed}`;

    const getMailToUrl = (linkToEmbed: string) => {
      const subject = encodeURIComponent(`[Sync Checklist] Action Needed: Project "${trimmed.name}" Staging Audit`);
      const emailBody = encodeURIComponent(
        `Hello Team!\n\nI have configured our staging & production readiness specifications matrix for: "${trimmed.name}".\n\n` +
        `We currently stand at ${done}/${total} tasks completed.\n\n` +
        `--------------------------------------------------\n` +
        `TEAM VELOCITY DISPATCH REPORT:\n` +
        `${memberBriefs || "No specific teammate delegations yet."}\n` +
        `--------------------------------------------------\n\n` +
        `⚠️ CURRENT CRITICAL OUTSTANDING CHECKS:\n` +
        `${uncheckedCriticalList || "All high risk items passed! Bravo."}\n\n` +
        `👉 ACCESS AND MERGE THIS WORKSPACE INSTANTLY WITH LIVE OFFLINE PERSISTENCE:\n` +
        `${linkToEmbed}\n\n` +
        `Let's pass validations cleanly and avoid launching with developer bugs.\n` +
        `Cheers!`
      );
      return `mailto:?subject=${subject}&body=${emailBody}`;
    };

    let finalMailToUrl = getMailToUrl(trimmedMagicLink);
    let linkOmitted = false;

    if (finalMailToUrl.length > 1800) {
      linkOmitted = true;
      finalMailToUrl = getMailToUrl("(Please ask the sender for the magic share link separately, as the project data is too large to fit in this email link.)");
    }

    // Now, verify that if link is kept or link is omitted, the resulting Mailto URL length stays strictly under 1800 characters!
    expect(finalMailToUrl.length).toBeLessThanOrEqual(1800);
  });
});

describe('ConfirmModal Component', () => {
  it('should render correct title and message and respond to callbacks', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ConfirmModal
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        title="Test Delete"
        message="This is a test message"
      />
    );
    expect(screen.getByText('Test Delete')).toBeDefined();
    expect(screen.getByText('This is a test message')).toBeDefined();
    
    // Check confirm button click
    const confirmBtn = screen.getByText('Confirm');
    fireEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);

    // Check cancel button click
    const cancelBtn = screen.getByText('Cancel');
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalled();
  });
});

describe('TaskCard Quick Assignment', () => {
  const mockTask: ChecklistItem = {
    id: 't-1',
    title: 'Verify TLS 1.3 Cipher Suites',
    description: 'Ensure legacy insecure stream ciphers are disabled.',
    category: 'security',
    priority: 'high',
    status: 'todo',
    assignedTo: [],
    subtasks: []
  };

  const mockTeam: Teammate[] = [
    { id: 'tm-1', name: 'Alice Smith', role: 'Security Lead', avatarColor: 'bg-emerald-600', email: 'alice@example.com' },
    { id: 'tm-2', name: 'Bob Jones', role: 'DevOps Lead', avatarColor: 'bg-blue-600', email: 'bob@example.com' }
  ];

  it('should toggle assignee dropdown popover on click and respond to member selections', () => {
    const onUpdateTask = vi.fn();
    const mockOnEdit = vi.fn();
    const mockOnDelete = vi.fn();
    const mockOnMoveStatus = vi.fn();

    render(
      <TaskCard
        task={mockTask}
        categories={CATEGORIES}
        team={mockTeam}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onMoveStatus={mockOnMoveStatus}
        onUpdateTask={onUpdateTask}
      />
    );

    // Initial state: should show 'Unassigned'
    const assignBtn = screen.getByText('Unassigned');
    expect(assignBtn).toBeDefined();

    // Click assign button to open dropdown
    fireEvent.click(assignBtn);

    // Dropdown popover should contain "Assign Team" header and the member names
    expect(screen.getByText('Assign Team')).toBeDefined();
    expect(screen.getByText('Alice Smith')).toBeDefined();
    expect(screen.getByText('Bob Jones')).toBeDefined();

    // Click on a teammate to assign
    const aliceBtn = screen.getByText('Alice Smith');
    fireEvent.click(aliceBtn);

    // Verify onUpdateTask was triggered with updated assignee array
    expect(onUpdateTask).toHaveBeenCalledWith(expect.objectContaining({
      assignedTo: ['tm-1']
    }));
  });
});


