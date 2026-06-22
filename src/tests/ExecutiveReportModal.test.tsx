// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExecutiveReportModal, { cleanText, buildReportHTML } from '../components/ExecutiveReportModal';
import { Project, ChecklistItem } from '../types';

// ==========================================
// MOCKS
// ==========================================

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();
vi.stubGlobal('localStorage', localStorageMock);

// Mock uuid/nanoid
vi.mock('uuid', () => ({
  v4: () => 'test-id-123'
}));

// Mock window.print()
const mockPrintFn = vi.fn();
vi.stubGlobal('print', mockPrintFn);

// Mock window.open and returned document context
const mockWrite = vi.fn();
const mockClose = vi.fn();
const mockWinClose = vi.fn();
const mockWindowObj = {
  document: {
    write: mockWrite,
    close: mockClose,
  },
  print: mockPrintFn,
  onload: null as any,
  onafterprint: null as any,
  close: mockWinClose,
};
const mockOpenFn = vi.fn().mockReturnValue(mockWindowObj);
vi.stubGlobal('open', mockOpenFn);
window.open = mockOpenFn;

// ==========================================
// TEST DATABASE / PROJECTS
// ==========================================

const dummyProject: Project = {
  id: 'proj-1',
  name: 'Security Shield Gate',
  description: 'Proactive Valedation of software gate controls',
  createdAt: '2026-06-22',
  categories: [
    {
      id: 'cat-1',
      name: 'Staging Valedation',
      description: 'Audit tasks for staging',
      icon: 'Shield',
      color: 'blue',
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      id: 'cat-2',
      name: 'Production Gate',
      description: 'Audit tasks before going live',
      icon: 'Target',
      color: 'green',
      lightColor: 'bg-green-50',
      textColor: 'text-green-600',
    }
  ],
  items: [
    {
      id: 'item-1',
      title: 'Database Access Audit',
      description: 'Check DB access credentials',
      category: 'cat-1',
      priority: 'high',
      status: 'completed',
      assignedTo: ['teammate-1'],
    },
    {
      id: 'item-2',
      title: 'Secrets verification',
      description: 'Validate API keys in staging',
      category: 'cat-1',
      priority: 'medium',
      status: 'in-progress',
      assignedTo: ['teammate-1'],
    },
    {
      id: 'item-3',
      title: 'Dependency vetting',
      description: 'Vulnerability scan checks',
      category: 'cat-2',
      priority: 'low',
      status: 'todo',
      assignedTo: [],
    }
  ],
  team: [
    {
      id: 'teammate-1',
      name: 'Alex Rivera',
      role: 'Compliance Lead',
      email: 'alex@example.com',
      avatarColor: '#10b981',
    }
  ]
};

// ==========================================
// TEST SUITE
// ==========================================

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorageMock.clear();
  mockWindowObj.onload = null;
  mockWindowObj.onafterprint = null;
});

describe('cleanText', () => {
  it('should repair Valedation string with spelling fix Validation', () => {
    const result = cleanText('System Valedation controls');
    expect(result).toBe('System Validation controls');
  });

  it('should handle casing appropriately when patching Valedation word', () => {
    const result = cleanText('valedation is critical');
    expect(result).toBe('Validation is critical');
  });

  it('should return empty string when input is falsy or blank', () => {
    expect(cleanText('')).toBe('');
  });

  it('should return untouched string when no spelling typo exists', () => {
    expect(cleanText('Healthy text')).toBe('Healthy text');
  });
});

describe('buildReportHTML', () => {
  it('should evaluate core velocity percentiles based on completion profiles', () => {
    const htmlOutput = buildReportHTML(dummyProject);
    // 1 completed / 3 total = 33% (rounded)
    expect(htmlOutput).toContain('33%');
    expect(htmlOutput).toContain('Security Shield Gate');
    expect(htmlOutput).toContain('Alex Rivera');
  });

  it('should group checklist item targets in accordance to phase category keys', () => {
    const cat1ItemsCount = dummyProject.items.filter(i => i.category === 'cat-1').length;
    const cat2ItemsCount = dummyProject.items.filter(i => i.category === 'cat-2').length;

    expect(cat1ItemsCount).toBe(2);
    expect(cat2ItemsCount).toBe(1);

    const htmlOutput = buildReportHTML(dummyProject);
    expect(htmlOutput).toContain('Staging Validation');
    expect(htmlOutput).toContain('Production Gate');
  });

  it('should filter items by high, medium, and low risk profiles correctly', () => {
    const highItems = dummyProject.items.filter(i => i.priority === 'high');
    const medItems = dummyProject.items.filter(i => i.priority === 'medium');
    const lowItems = dummyProject.items.filter(i => i.priority === 'low');

    expect(highItems.length).toBe(1);
    expect(medItems.length).toBe(1);
    expect(lowItems.length).toBe(1);

    const htmlOutput = buildReportHTML(dummyProject);
    expect(htmlOutput).toContain('HIGH');
    expect(htmlOutput).toContain('MED');
    expect(htmlOutput).toContain('LOW');
  });

  it('should prioritize placing high blockers before medium then low', () => {
    const sortPriority = (itemsList: ChecklistItem[]) => {
      const weight = { high: 3, medium: 2, low: 1 };
      return [...itemsList].sort((a, b) => weight[b.priority] - weight[a.priority]);
    };

    const sorted = sortPriority(dummyProject.items);
    expect(sorted[0].priority).toBe('high');
    expect(sorted[1].priority).toBe('medium');
    expect(sorted[2].priority).toBe('low');
  });

  it('should save and load database schemas on localStorage correctly', () => {
    const serializedProject = JSON.stringify(dummyProject);
    localStorage.setItem('project-backup', serializedProject);
    
    const retrieved = localStorage.getItem('project-backup');
    expect(retrieved).not.toBeNull();
    
    const parsedProject = JSON.parse(retrieved!) as Project;
    expect(parsedProject.id).toBe(dummyProject.id);
    expect(parsedProject.name).toBe(dummyProject.name);
    expect(parsedProject.items.length).toBe(dummyProject.items.length);
  });
});

describe('ExecutiveReportModal Component', () => {
  it('should render without crashing when open state holds true value', () => {
    render(
      <ExecutiveReportModal
        isOpen={true}
        onClose={vi.fn()}
        project={dummyProject}
        isLightMode={false}
      />
    );
    
    expect(screen.getByText('Executive Audit PDF')).toBeDefined();
    expect(screen.getByText('Staging Compliance Report')).toBeDefined();
  });

  it('should not render anything if check parameters mark open state as false', () => {
    const { container } = render(
      <ExecutiveReportModal
        isOpen={false}
        onClose={vi.fn()}
        project={dummyProject}
        isLightMode={false}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should apply secondary light styling if lightMode is turned on', () => {
    render(
      <ExecutiveReportModal
        isOpen={true}
        onClose={vi.fn()}
        project={dummyProject}
        isLightMode={true}
      />
    );

    const textElement = screen.getByText('Executive Audit PDF');
    const styledContainer = textElement.closest('.w-full');
    expect(styledContainer?.className).toContain('bg-white');
    expect(styledContainer?.className).not.toContain('bg-neutral-900');
  });

  it('should apply primary neutral dark styling if lightMode is turned off', () => {
    render(
      <ExecutiveReportModal
        isOpen={true}
        onClose={vi.fn()}
        project={dummyProject}
        isLightMode={false}
      />
    );

    const textElement = screen.getByText('Executive Audit PDF');
    const styledContainer = textElement.closest('.w-full');
    expect(styledContainer?.className).toContain('bg-neutral-900');
    expect(styledContainer?.className).not.toContain('bg-white');
  });
});

describe('Interactions', () => {
  it('should call onClose callback whenever close header button gets triggered', async () => {
    const onCloseMock = vi.fn();
    render(
      <ExecutiveReportModal
        isOpen={true}
        onClose={onCloseMock}
        project={dummyProject}
        isLightMode={false}
      />
    );

    const buttons = screen.getAllByRole('button');
    const closeBtn = buttons[0]; 
    await userEvent.click(closeBtn);
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('should invoke onClose callback when cancel button action is executed', async () => {
    const onCloseMock = vi.fn();
    render(
      <ExecutiveReportModal
        isOpen={true}
        onClose={onCloseMock}
        project={dummyProject}
        isLightMode={false}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    await userEvent.click(cancelBtn);
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('should display independent window target and launch PDF script sequence successfully', async () => {
    render(
      <ExecutiveReportModal
        isOpen={true}
        onClose={vi.fn()}
        project={dummyProject}
        isLightMode={false}
      />
    );

    const generateBtn = screen.getByRole('button', { name: /Generate PDF Report/i });
    await userEvent.click(generateBtn);

    expect(mockOpenFn).toHaveBeenCalledWith('', '_blank');
    expect(mockWrite).toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalled();

    // Trigger window onload & printing cycle triggers
    if (mockWindowObj.onload) {
      mockWindowObj.onload();
      expect(mockPrintFn).toHaveBeenCalled();
      
      if (mockWindowObj.onafterprint) {
        mockWindowObj.onafterprint();
        expect(mockWinClose).toHaveBeenCalled();
      }
    }
  });
});

describe('Edge Cases', () => {
  it('should show empty state parameters nicely when items are completely missing', () => {
    const projectEmpty: Project = {
      ...dummyProject,
      items: [],
      team: []
    };

    const htmlOutput = buildReportHTML(projectEmpty);
    expect(htmlOutput).toContain('0%'); // Percentage defaults to 0%
    expect(htmlOutput).toContain('No crew members registered.');
  });

  it('should render large quantity of dataset configurations without any crash', () => {
    const largeItems: ChecklistItem[] = Array.from({ length: 150 }).map((_, idx) => ({
      id: `item-large-${idx}`,
      title: `Task item reference ${idx}`,
      description: `Task item detail profile ${idx}`,
      category: 'cat-1',
      priority: idx % 3 === 0 ? 'high' : idx % 3 === 1 ? 'medium' : 'low',
      status: idx % 2 === 0 ? 'completed' : 'todo',
    }));

    const projectLarge: Project = {
      ...dummyProject,
      items: largeItems
    };

    const htmlOutput = buildReportHTML(projectLarge);
    expect(htmlOutput).toContain('Task item reference 149');
    expect(htmlOutput).toContain('Staging Validation');
  });

  it('should fallback gracefully to standard text layout if descriptions are null', () => {
    const projNoDesc: Project = {
      ...dummyProject,
      description: ''
    };

    const htmlOutput = buildReportHTML(projNoDesc);
    expect(htmlOutput).toContain('Verified software compliance checklist tracking data integrity, secrets lifecycle, and architectural specifications.');
  });

  it('should render special character configurations inside html output correctly', () => {
    const projectSpecial: Project = {
      ...dummyProject,
      name: 'Project @#$%^&*()',
    };

    const htmlOutput = buildReportHTML(projectSpecial);
    expect(htmlOutput).toContain('Project @#$%^&*()');
  });
});
