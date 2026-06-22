import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChecklistItem, CategoryInfo, Teammate, Project, PriorityType, StatusType, Stats, ThemeType, ColorSchemeType } from './types';
import { INITIAL_ITEMS, CATEGORIES, DEFAULT_TEAM } from './data';
import StatsSection from './components/StatsSection';
import CompletionTimeline from './components/CompletionTimeline';
import FilterSection from './components/FilterSection';
import TaskBoard from './components/TaskBoard';
import TaskModal from './components/TaskModal';
import ExecutiveReportModal from './components/ExecutiveReportModal';
import ThemePickerModal from './components/ThemePickerModal';
import ConfirmModal from './components/ConfirmModal';
import NotificationToast, { ToastMessage } from './components/NotificationToast';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, Cloud, Sparkles, Key, AlertTriangle, Hammer, 
  Sun, Moon, Monitor, Palette, Plus, FolderPlus, Trash2, 
  Mail, Share2, FileText, CheckCircle2, ChevronRight, 
  Settings, Users, Layers, Upload, Download, Copy, Check, Info, FileCode,
  Printer, FileCheck
} from 'lucide-react';

const PROJECTS_STORAGE_KEY = 'vibe_to_prod_multi_projects';
const ACTIVE_PROJECT_KEY = 'vibe_to_prod_active_project_id';
const THEME_STORAGE_KEY = 'vibe_to_prod_apple_theme';
const SCHEME_STORAGE_KEY = 'vibe_to_prod_apple_color_scheme';

export function buildShareablePayload(project: Project): Project {
  return {
    ...project,
    items: project.items.map(item => {
      const trimmedDescription = item.description 
        ? (item.description.length > 100 ? item.description.substring(0, 97) + '...' : item.description) 
        : '';
      
      const trimmedItem: ChecklistItem = {
        id: item.id,
        title: item.title,
        description: trimmedDescription,
        category: item.category,
        priority: item.priority,
        status: item.status,
        assignedTo: item.assignedTo,
        tags: item.tags
      };

      if (item.subtasks) {
        trimmedItem.subtasks = item.subtasks.map(sub => ({
          id: sub.id,
          title: sub.title,
          completed: sub.completed
        }));
      }

      return trimmedItem;
    })
  };
}

export function buildShareUrl(project: Project, trim: boolean = false): string {
  const payloadToEncode = trim ? buildShareablePayload(project) : project;
  const base64 = btoa(unescape(encodeURIComponent(JSON.stringify(payloadToEncode))));
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  return `${origin}${pathname}?shared=${base64}`;
}

export default function App() {
  // --- CORE SYSTEM PROJECTS STATE ---
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');

  // --- SELECTION & INTERACTION STATES ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<PriorityType | 'all'>('all');

  // --- UI SWITCHES & DRAWERS ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<ChecklistItem | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // --- ADMINISTRATION DRAWERS ---
  const [currentAdminTab, setCurrentAdminTab] = useState<'none' | 'phases' | 'team' | 'import-export'>('none');

  // --- CUSTOM PROJECT GENERATOR FIELDS ---
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [projectPreset, setProjectPreset] = useState<'empty' | 'blueprint'>('blueprint');
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  // --- CUSTOM PHASE FIELDS ---
  const [phaseName, setPhaseName] = useState('');
  const [phaseDesc, setPhaseDesc] = useState('');
  const [phaseIcon, setPhaseIcon] = useState('Shield');
  const [phaseColor, setPhaseColor] = useState('default');

  // --- CUSTOM TEAM MEMBER FIELDS ---
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberAvatar, setMemberAvatar] = useState('bg-blue-500');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- THEME & DECORATORS ---
  const [theme, setTheme] = useState<ThemeType>(() => {
    return (localStorage.getItem(THEME_STORAGE_KEY) as ThemeType) || 'system';
  });
  const [colorScheme, setColorScheme] = useState<ColorSchemeType>(() => {
    return (localStorage.getItem(SCHEME_STORAGE_KEY) as ColorSchemeType) || 'default';
  });

  // --- MULTI-THEME STATE ---
  const [activeTheme, setActiveTheme] = useState<string>(() => {
    return localStorage.getItem('prodready_theme') || 'default';
  });
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('prodready_theme', activeTheme);
    const root = document.documentElement;
    root.removeAttribute('data-theme');
    if (activeTheme !== 'default') {
      root.setAttribute('data-theme', activeTheme);
    }
  }, [activeTheme]);

  // Handle system color theme preference
  const [systemIsLight, setSystemIsLight] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mql = window.matchMedia('(prefers-color-scheme: light)');
      setSystemIsLight(mql.matches);
      const listener = (e: MediaQueryListEvent) => setSystemIsLight(e.matches);
      mql.addEventListener('change', listener);
      return () => mql.removeEventListener('change', listener);
    }
  }, []);

  const isLightMode = useMemo(() => {
    if (activeTheme !== 'default') return false; // Nord and Tokyo Night are elegant dark themes
    if (theme === 'light') return true;
    if (theme === 'dark') return false;
    return systemIsLight;
  }, [theme, systemIsLight, activeTheme]);

  // Persist settings preferences
  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(SCHEME_STORAGE_KEY, colorScheme);
  }, [colorScheme]);

  // Toast notifier helper
  const showToast = (text: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToast({
      id: crypto.randomUUID(),
      text,
      type
    });
  };

  // --- PROJECT PARSING & INITIAL DATA LOADING ---
  useEffect(() => {
    setIsSyncing(true);
    try {
      // 1. Check for shared project incoming via Magic URL Query string
      const urlParams = new URLSearchParams(window.location.search);
      const sharedPayload = urlParams.get('shared');
      let restoredProjects: Project[] = [];

      const storedProjects = localStorage.getItem(PROJECTS_STORAGE_KEY);
      if (storedProjects) {
        restoredProjects = JSON.parse(storedProjects);
      }

      if (sharedPayload) {
        try {
          const decoded = decodeURIComponent(escape(atob(sharedPayload)));
          const parsedProject = JSON.parse(decoded) as Project;
          if (parsedProject && parsedProject.name && parsedProject.items) {
            // Check if project already stored by matching ID or name
            const existsIdx = restoredProjects.findIndex(p => p.id === parsedProject.id || p.name === parsedProject.name);
            if (existsIdx > -1) {
              restoredProjects[existsIdx] = parsedProject;
            } else {
              restoredProjects.unshift(parsedProject);
            }
            localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(restoredProjects));
            localStorage.setItem(ACTIVE_PROJECT_KEY, parsedProject.id);
            setActiveProjectId(parsedProject.id);
            showToast(`Imported shared project "${parsedProject.name}" instantly!`, 'success');
            
            // Clean up the URL search query without reloading
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          }
        } catch (decErr) {
          console.error("Magic link decay error", decErr);
          showToast("Failed to parse shared team URL.", "warning");
        }
      }

      // 2. Fallbacks if no projects in localStorage
      if (restoredProjects.length === 0) {
        const baselineProject: Project = {
          id: 'project-baseline',
          name: 'Classic ProdReady Baseline',
          description: 'The standard system security, infrastructure, and resilience compliance checklists out-of-the-box.',
          categories: CATEGORIES,
          items: INITIAL_ITEMS,
          team: DEFAULT_TEAM,
          createdAt: new Date().toISOString()
        };
        restoredProjects = [baselineProject];
        localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(restoredProjects));
      }

      setProjects(restoredProjects);

      // 3. Set Active Projects ID
      const storedActiveId = localStorage.getItem(ACTIVE_PROJECT_KEY);
      if (storedActiveId && restoredProjects.some(p => p.id === storedActiveId)) {
        setActiveProjectId(storedActiveId);
      } else {
        setActiveProjectId(restoredProjects[0].id);
      }
    } catch (err) {
      console.error('Initialization crash', err);
      showToast('State synchronization refresh required.', 'warning');
    } finally {
      setTimeout(() => setIsSyncing(false), 250);
    }
  }, []);

  // Sync state changes to projects array
  const persistProjectsList = (updatedProjects: Project[]) => {
    setProjects(updatedProjects);
    setIsSyncing(true);
    try {
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updatedProjects));
      setTimeout(() => setIsSyncing(false), 150);
    } catch (err) {
      console.error('Persistence failure', err);
      showToast('Offline sync synchronization failure.', 'warning');
      setIsSyncing(false);
    }
  };

  // Derive Active Project details safely
  const activeProject = useMemo((): Project => {
    return projects.find(p => p.id === activeProjectId) || projects[0] || {
      id: 'blank',
      name: 'Stray Context',
      description: '',
      categories: [],
      items: [],
      team: [],
      createdAt: ''
    };
  }, [projects, activeProjectId]);

  // Update active project properties
  const updateActiveProjectState = (updatedFields: Partial<Project>) => {
    const nextProjectsList = projects.map(p => {
      if (p.id === activeProject.id) {
        return {
          ...p,
          ...updatedFields
        } as Project;
      }
      return p;
    });
    persistProjectsList(nextProjectsList);
  };

  // Switch Active Project
  const handleSelectActiveProject = (id: string) => {
    setActiveProjectId(id);
    localStorage.setItem(ACTIVE_PROJECT_KEY, id);
    setSelectedCategory('all');
    setSelectedPriority('all');
    showToast(`Switched workspace context to project: ${projects.find(p=>p.id === id)?.name}`, 'info');
  };

  // --- KEYBOARD POWER-USER SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isTyping = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.getAttribute('contenteditable') === 'true'
      );

      if (e.key === 'Escape') {
        setIsAddModalOpen(false);
      }

      if (isTyping) {
        return;
      }

      // 1. N: Create a new standard specification clause card
      if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setTaskToEdit(null);
        setIsAddModalOpen(true);
        showToast("Power-shortcut: Creating new specification standard...", "info");
      }

      // 2. /: Focus Search benchmarks
      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.getElementById('search-standards-input');
        if (searchInput) {
          searchInput.focus();
          showToast("Power-shortcut: Search standards focused.", "info");
        }
      }

      // 3. 1-6: Focus Category/Phase Tabs
      if (['1', '2', '3', '4', '5', '6'].includes(e.key)) {
        e.preventDefault();
        const index = parseInt(e.key, 10);
        if (index === 1) {
          setSelectedCategory('all');
          showToast("Short-tab: Isolated standard group 'ALL PHASES'", "info");
        } else if (activeProject && activeProject.categories) {
          const catIndex = index - 2; // '2' maps to index 0 (first dynamic category), '3' to index 1, etc.
          const targetCat = activeProject.categories[catIndex];
          if (targetCat) {
            setSelectedCategory(targetCat.id);
            showToast(`Short-tab: Isolated standard group '${targetCat.name}'`, "info");
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeProject]);

  // --- PROJECT ACTIONS (CREATE, CLONE, REMOVE) ---
  const handleCreateNewProjectFromScratch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      showToast("Workspace name required to initialize project.", "warning");
      return;
    }

    const brandId = `project-${crypto.randomUUID()}`;
    const freshProject: Project = {
      id: brandId,
      name: newProjectName.trim(),
      description: newProjectDesc.trim() || 'A standalone custom audit workspace built completely from scratch.',
      categories: projectPreset === 'blueprint' ? CATEGORIES : [
        {
          id: 'core-vibe-checks',
          name: 'Staging & Vibes',
          description: 'General system checkpoints and staging audits',
          icon: 'Shield',
          color: 'border-blue-500 text-blue-400 bg-blue-500/10',
          lightColor: 'bg-blue-500/10',
          textColor: 'text-blue-500'
        }
      ],
      items: projectPreset === 'blueprint' ? INITIAL_ITEMS : [],
      team: projectPreset === 'blueprint' ? DEFAULT_TEAM : [
        {
          id: 'teammate-self',
          name: 'Owner (Lead)',
          role: 'Audit Administrator',
          email: 'admin@workspace.com',
          avatarColor: 'bg-indigo-600'
        }
      ],
      createdAt: new Date().toISOString()
    };

    const nextList = [freshProject, ...projects];
    persistProjectsList(nextList);
    setActiveProjectId(brandId);
    localStorage.setItem(ACTIVE_PROJECT_KEY, brandId);
    
    // Clear inputs and close
    setNewProjectName('');
    setNewProjectDesc('');
    setShowNewProjectForm(false);
    showToast(`Successfully booted workspace: ${freshProject.name}`, 'success');
  };

  const handleDeleteProject = (projId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (projects.length <= 1) {
      showToast("Cannot destroy the last remaining workspace. Create another first.", "warning");
      return;
    }
    setProjectToDelete(projId);
  };

  const handleConfirmDeleteProject = () => {
    if (!projectToDelete) return;
    const projId = projectToDelete;
    const remaining = projects.filter(p => p.id !== projId);
    persistProjectsList(remaining);
    if (activeProjectId === projId) {
      const nextActive = remaining[0].id;
      setActiveProjectId(nextActive);
      localStorage.setItem(ACTIVE_PROJECT_KEY, nextActive);
    }
    showToast("Project workspace erased.", "info");
    setProjectToDelete(null);
  };

  // --- DYNAMIC PHASES (CATEGORIES) CRUD CONTROLLER ---
  const handleAddPhase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phaseName.trim()) {
      showToast("Phase name is required.", "warning");
      return;
    }
    const freshId = `phase-${crypto.randomUUID()}`;
    
    // Setup color palette presets
    const paletteMap: Record<string, any> = {
      default: { color: 'border-blue-500 text-blue-400 bg-blue-500/10', light: 'bg-blue-500/10', text: 'text-blue-450' },
      emerald: { color: 'border-emerald-500 text-emerald-400 bg-emerald-500/10', light: 'bg-emerald-505/10 bg-emerald-500/10', text: 'text-emerald-500' },
      sunset: { color: 'border-amber-500 text-amber-400 bg-amber-500/10', light: 'bg-amber-505/10 bg-amber-500/10', text: 'text-amber-500' },
      royal: { color: 'border-indigo-500 text-indigo-400 bg-indigo-500/10', light: 'bg-indigo-505/10 bg-indigo-500/10', text: 'text-indigo-400' },
      neon: { color: 'border-pink-500 text-pink-400 bg-pink-500/10', light: 'bg-pink-505/10 bg-pink-500/10', text: 'text-pink-400' },
      monochrome: { color: 'border-stone-550 text-stone-500 bg-stone-500/10 dark:text-stone-400', light: 'bg-stone-505/10 bg-stone-500/10', text: 'text-stone-500 dark:text-stone-400' }
    };

    const palette = paletteMap[phaseColor] || paletteMap.default;

    const newPhase: CategoryInfo = {
      id: freshId,
      name: phaseName.trim(),
      description: phaseDesc.trim() || 'Custom focus phase details.',
      icon: phaseIcon,
      color: palette.color,
      lightColor: palette.light,
      textColor: palette.text
    };

    const nextPhases = [...activeProject.categories, newPhase];
    updateActiveProjectState({ categories: nextPhases });
    
    // Clear inputs
    setPhaseName('');
    setPhaseDesc('');
    showToast(`Focus Phase "${newPhase.name}" deployed dynamically.`, 'success');
  };

  const handleDeletePhase = (catId: string) => {
    if (activeProject.categories.length <= 1) {
      showToast("A project must maintain at least one Focus Development Phase.", "warning");
      return;
    }
    if (confirm("Are you sure you want to remove this phase grouping? Items under this phase will remain but fall back into General category.")) {
      const remainingPhases = activeProject.categories.filter(c => c.id !== catId);
      const sanitisedItems = activeProject.items.map(item => {
        if (item.category === catId) {
          return { ...item, category: remainingPhases[0].id };
        }
        return item;
      });
      updateActiveProjectState({
        categories: remainingPhases,
        items: sanitisedItems
      });
      showToast("Focus phase deleted successfully.", "info");
    }
  };

  // --- TEAM MEMBER DELEGATION CRUD CONTROLLER ---
  const handleAddTeammate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim() || !memberRole.trim()) {
      showToast("Name and roles are strictly required.", "warning");
      return;
    }

    const newCrew: Teammate = {
      id: `member-${crypto.randomUUID()}`,
      name: memberName.trim(),
      role: memberRole.trim(),
      email: memberEmail.trim() || `${memberName.trim().replace(/\s+/g, '.').toLowerCase()}@workspace.com`,
      avatarColor: memberAvatar
    };

    const nextTeam = [...activeProject.team, newCrew];
    updateActiveProjectState({ team: nextTeam });

    // Reset fields
    setMemberName('');
    setMemberRole('');
    setMemberEmail('');
    showToast(`Assigned online coordinate profile for collaborator: ${newCrew.name}`, 'success');
  };

  const handleDeleteTeammate = (memberId: string) => {
    if (confirm("Remove collaborator from project? All item assignments for this person will be unassigned.")) {
      const nextTeam = activeProject.team.filter(t => t.id !== memberId);
      const sanitisedItems = activeProject.items.map(item => {
        if (item.assignedTo?.includes(memberId)) {
          return {
            ...item,
            assignedTo: item.assignedTo.filter(id => id !== memberId)
          };
        }
        return item;
      });
      updateActiveProjectState({ 
        team: nextTeam,
        items: sanitisedItems
      });
      showToast("Collaborator profile de-registered successfully.", "info");
    }
  };

  // --- JSON EXPORT / IMPORT CONTROLLERS ---
  const importJSONPayload = (jsonText: string) => {
    try {
      const parsed = JSON.parse(jsonText);
      
      // Basic signature validation
      if (!parsed.name || !Array.isArray(parsed.items)) {
        showToast("Invalid JSON schema. Needs 'name' and 'items' array.", "warning");
        return;
      }

      // Format input checklists safely
      const importedItems: ChecklistItem[] = parsed.items.map((i: any, index: number) => ({
        id: i.id || `uploaded-${index}-${crypto.randomUUID()}`,
        title: i.title || i.name || 'Untitled Requirement',
        description: i.description || i.objective || '',
        category: i.category || 'core-vibe-checks',
        priority: i.priority || 'medium',
        status: i.status || 'todo',
        notes: i.notes || i.implementationNotes || '',
        custom: true,
        assignedTo: Array.isArray(i.assignedTo) ? i.assignedTo : [],
        updatedAt: new Date().toISOString()
      }));

      // Map dynamic phases or merge
      const importedPhases: CategoryInfo[] = Array.isArray(parsed.categories) 
        ? parsed.categories 
        : activeProject.categories;

      const importedTeam: Teammate[] = Array.isArray(parsed.team)
        ? parsed.team
        : activeProject.team;

      if (confirm(`Would you like to import this as a COMPLETELY NEW PROJECT workspace named "${parsed.name}"? (Select Cancel to merge items directly into the active project standard checks instead)`)) {
        const brandId = `project-${crypto.randomUUID()}`;
        const fresh: Project = {
          id: brandId,
          name: parsed.name,
          description: parsed.description || 'Imported standards workspace archive.',
          categories: importedPhases,
          team: importedTeam,
          items: importedItems,
          createdAt: new Date().toISOString()
        };
        const nextList = [fresh, ...projects];
        persistProjectsList(nextList);
        setActiveProjectId(brandId);
        localStorage.setItem(ACTIVE_PROJECT_KEY, brandId);
        showToast(`Workspace imported: ${parsed.name}`, 'success');
      } else {
        // Merge directly in currently checked specification space
        const mergedItems = [...importedItems, ...activeProject.items];
        // Deduplicate titles or IDs
        const uniqueItems = mergedItems.filter((v, i, a) => a.findIndex(t => t.id === v.id || t.title === v.title) === i);
        updateActiveProjectState({ 
          items: uniqueItems,
          categories: [...activeProject.categories, ...importedPhases].filter((v, i, a) => a.findIndex(t => t.id === v.id || t.name === v.name) === i)
        });
        showToast(`Merged requirements directly into: ${activeProject.name}`, 'success');
      }

      setCurrentAdminTab('none');
    } catch (err) {
      console.error(err);
      showToast("Failed to parse JSON text. Review file format.", "warning");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const contents = event.target?.result as string;
      if (contents) {
        importJSONPayload(contents);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const exportProjectToJSON = () => {
    try {
      const exportData = {
        name: activeProject.name,
        description: activeProject.description,
        categories: activeProject.categories,
        team: activeProject.team,
        items: activeProject.items
      };
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(exportData, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `${activeProject.name.replace(/\s+/g, '_').toLowerCase()}_standards.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast("Download backup standards spec file triggered.", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to compile export specs.", "warning");
    }
  };

  const downloadTemplateJSON = () => {
    const sample = {
      name: "Staging Custom Workspace",
      description: "Baseline verification standards for cloud launch.",
      categories: [
        {
          id: "custom-checks",
          name: "Vibe Verification",
          description: "Staging and local visual testing",
          icon: "Shield",
          color: "border-purple-500 text-purple-400 bg-purple-500/10",
          lightColor: "bg-purple-500/10",
          textColor: "text-purple-400"
        }
      ],
      team: [
        {
          id: "member-1",
          name: "Jane Dev",
          role: "Quality Assurance",
          email: "jane@workspace.com",
          avatarColor: "bg-purple-500"
        }
      ],
      items: [
        {
          id: "standard-1",
          title: "Aesthetic UI Padding Verification",
          description: "Confirm touch targets are >= 44px with zero spacing overflows in visual frames",
          category: "custom-checks",
          priority: "high",
          status: "todo",
          notes: "Use standard ResizeObserver on testing rigs.",
          assignedTo: ["member-1"]
        }
      ]
    };
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sample, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "compliance-template.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast("Download template JSON triggered.", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to download template JSON.", "warning");
    }
  };

  const safeCopyToClipboard = (text: string): boolean => {
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_) {}
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      console.error('Fallback copy failed', err);
      return false;
    }
  };

  // --- ONLINE SYNC ORCHESTRATION SHARING ---
  const handleGenerateMagicShareLink = () => {
    try {
      const shareUrl = buildShareUrl(activeProject, false);
      
      if (safeCopyToClipboard(shareUrl)) {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 3000);
        showToast("Magic online team sync link generated! Copied to clipboard.", "success");
      } else {
        showToast("Link copy failed.", "warning");
      }
      return shareUrl;
    } catch (err) {
      console.error(err);
      showToast("Share encoding failed.", "warning");
      return null;
    }
  };

  const handleSendDynamicTeamInvitationEmail = () => {
    // Calculate details for summary report
    const done = activeProject.items.filter(i=>i.status==='completed').length;
    const total = activeProject.items.length;
    const uncheckedCriticalList = activeProject.items.filter(i=>i.priority === 'high' && i.status !== 'completed').map(i=>`- ${i.title}`).join('\n');

    // Create teammate specific reports
    const memberBriefs = activeProject.team.map(member => {
      const memberTasks = activeProject.items.filter(i=>i.assignedTo?.includes(member.id));
      const finished = memberTasks.filter(i=>i.status === 'completed').length;
      return `${member.name} (${member.role}): ${finished}/${memberTasks.length} Done`;
    }).join('\n');

    // Generate trimmed magic link specifically for email
    let trimmedMagicLink = "";
    try {
      trimmedMagicLink = buildShareUrl(activeProject, true);
    } catch (err) {
      console.error("Failed to build shareable email link", err);
    }

    const getMailToUrl = (linkToEmbed: string) => {
      const subject = encodeURIComponent(`[Sync Checklist] Action Needed: Project "${activeProject.name}" Staging Audit`);
      const emailBody = encodeURIComponent(
        `Hello Team!\n\nI have configured our staging & production readiness specifications matrix for: "${activeProject.name}".\n\n` +
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

    try {
      window.location.href = finalMailToUrl;
    } catch (err) {
      console.error("Mailto direct invocation failed", err);
      window.open(finalMailToUrl);
    }

    if (linkOmitted) {
      showToast("Project too large to embed in email — link omitted, share it separately", "warning");
    } else {
      showToast("Launching default email dispatch payload...", "info");
    }
  };

  // --- ITEM CHECKS INTEGRATION CONTROLLERS ---
  const handleSaveTask = (taskDetails: Partial<ChecklistItem>) => {
    if (taskDetails.id) {
      // Edit
      const nextItems = activeProject.items.map(item => {
        if (item.id === taskDetails.id) {
          const statusChangedToCompleted = taskDetails.status === 'completed' && item.status !== 'completed';
          const statusChangedFromCompleted = taskDetails.status !== 'completed' && item.status === 'completed';
          
          let completedAtVal = item.completedAt;
          if (statusChangedToCompleted) {
            completedAtVal = new Date().toISOString();
          } else if (statusChangedFromCompleted) {
            completedAtVal = undefined;
          }

          return {
            ...item,
            ...taskDetails,
            completedAt: completedAtVal,
            updatedAt: new Date().toISOString()
          } as ChecklistItem;
        }
        return item;
      });
      updateActiveProjectState({ items: nextItems });
      showToast('Clause successfully redefined.', 'success');
    } else {
      // Append Custom Checklist item
      const newTask: ChecklistItem = {
        id: `custom-${crypto.randomUUID()}`,
        title: taskDetails.title || 'Untitled Specification',
        description: taskDetails.description || '',
        category: taskDetails.category || activeProject.categories[0]?.id || 'general',
        priority: taskDetails.priority || 'medium',
        status: 'todo',
        notes: taskDetails.notes || '',
        assignedTo: taskDetails.assignedTo || [],
        custom: true,
        updatedAt: new Date().toISOString()
      };
      const nextItems = [newTask, ...activeProject.items];
      updateActiveProjectState({ items: nextItems });
      showToast('Specification requirement added to backlog.', 'success');
    }
    setTaskToEdit(null);
  };

  const handleDeleteTask = (id: string) => {
    const target = activeProject.items.find(item => item.id === id);
    if (!target) return;

    if (target.custom) {
      const remaining = activeProject.items.filter(item => item.id !== id);
      updateActiveProjectState({ items: remaining });
      showToast('Spec requirement erased permanently.', 'success');
    } else {
      // Reset default template item instead of standard physical deletion
      const resetList = activeProject.items.map(item => {
        if (item.id === id) {
          return {
            ...item,
            notes: '',
            status: 'todo' as StatusType,
            assignedTo: [],
            updatedAt: new Date().toISOString()
          };
        }
        return item;
      });
      updateActiveProjectState({ items: resetList });
      showToast('Factory item reset. Custom annotations and delegacy erased.', 'info');
    }
  };

  const handleMoveStatus = (id: string, nextStatus: StatusType) => {
    const nextList = activeProject.items.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: nextStatus,
          completedAt: nextStatus === 'completed' ? new Date().toISOString() : undefined,
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    });
    updateActiveProjectState({ items: nextList });

    const taskName = activeProject.items.find(item => item.id === id)?.title || 'Check';
    const statusLabels: Record<StatusType, string> = {
      'todo': 'Backlog',
      'in-progress': 'Active Validation',
      'completed': 'Signed Off Production'
    };
    showToast(`"${taskName}" promoted to ${statusLabels[nextStatus]}`, 'success');
  };

  const handleUpdateTask = (updatedTask: ChecklistItem) => {
    const nextList = activeProject.items.map(item => {
      if (item.id === updatedTask.id) {
        let completedAtVal = updatedTask.completedAt;
        if (updatedTask.status === 'completed' && !completedAtVal) {
          completedAtVal = new Date().toISOString();
        } else if (updatedTask.status !== 'completed') {
          completedAtVal = undefined;
        }
        return {
          ...item,
          ...updatedTask,
          completedAt: completedAtVal,
          updatedAt: new Date().toISOString()
        } as ChecklistItem;
      }
      return item;
    });
    updateActiveProjectState({ items: nextList });
  };

  const handleResetToDefaults = () => {
    if (confirm('Restore default classic benchmarks? This wipes custom checklists in this specific project.')) {
      updateActiveProjectState({
        items: INITIAL_ITEMS,
        categories: CATEGORIES,
        team: DEFAULT_TEAM
      });
      showToast('Benchmarking matrix factory values loaded successfully.', 'info');
    }
  };

  // --- QUERY ORCHESTRATORS ---
  const filteredTasks = useMemo(() => {
    return activeProject.items.filter(task => {
      // Search matching titles, descriptions, notes, and delegated names
      const assignedNames = activeProject.team
        .filter(m => task.assignedTo?.includes(m.id))
        .map(m => m.name.toLowerCase())
        .join(' ');

      const matchesSearch = 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignedNames.includes(searchQuery.toLowerCase()) ||
        (task.notes && task.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === 'all' || task.category === selectedCategory;
      const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority;

      return matchesSearch && matchesCategory && matchesPriority;
    });
  }, [activeProject.items, searchQuery, selectedCategory, selectedPriority, activeProject.team]);

  const calculatedStats = useMemo((): Stats => {
    const total = activeProject.items.length;
    const todo = activeProject.items.filter(i => i.status === 'todo').length;
    const inProgress = activeProject.items.filter(i => i.status === 'in-progress').length;
    const completed = activeProject.items.filter(i => i.status === 'completed').length;
    const highPriorityCount = activeProject.items.filter(i => i.priority === 'high' && i.status !== 'completed').length;
    const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      todo,
      inProgress,
      completed,
      highPriorityCount,
      progressPercentage
    };
  }, [activeProject.items]);

  // Accent selector configurations
  const accent = useMemo(() => {
    switch (colorScheme) {
      case 'emerald':
        return {
          primaryBg: 'bg-emerald-600 hover:bg-emerald-550 hover:scale-[1.01] text-white focus:ring-2 focus:ring-emerald-400/50',
          primaryText: 'text-emerald-600 dark:text-emerald-400',
          bgSubtle: 'bg-emerald-500/10',
          borderAccent: 'border-emerald-500/20 dark:border-emerald-500/10',
          accentBadge: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-450',
          tabActiveBg: 'bg-emerald-600 text-white font-bold shadow-sm shadow-emerald-500/20',
          tabActiveText: 'text-emerald-650 dark:text-emerald-400',
          bodyGradient: 'bg-gradient-to-br from-white to-emerald-50/10 dark:from-neutral-950 dark:via-emerald-950/5 dark:to-neutral-950',
          headerGradient: 'text-emerald-600 dark:bg-gradient-to-r dark:from-emerald-400 dark:to-teal-500 dark:text-transparent dark:bg-clip-text',
          cardRing: 'focus-within:ring-2 focus-within:ring-emerald-500/15 ring-emerald-505/5'
        };
      case 'sunset':
        return {
          primaryBg: 'bg-amber-600 hover:bg-amber-500 hover:scale-[1.01] text-white focus:ring-2 focus:ring-amber-400/50',
          primaryText: 'text-amber-600 dark:text-amber-400',
          bgSubtle: 'bg-amber-500/10',
          borderAccent: 'border-amber-500/20 dark:border-amber-500/10',
          accentBadge: 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-450',
          tabActiveBg: 'bg-amber-600 text-white font-bold shadow-sm shadow-amber-500/20',
          tabActiveText: 'text-amber-655 dark:text-amber-400',
          bodyGradient: 'bg-gradient-to-br from-white to-amber-50/10 dark:from-neutral-950 dark:via-amber-950/5 dark:to-neutral-950',
          headerGradient: 'text-rose-500 dark:bg-gradient-to-r dark:from-rose-500 dark:via-orange-500 dark:to-amber-500 dark:text-transparent dark:bg-clip-text',
          cardRing: 'focus-within:ring-2 focus-within:ring-amber-500/15 ring-amber-505/5'
        };
      case 'monochrome':
        return {
          primaryBg: 'bg-neutral-805 hover:bg-neutral-700 hover:scale-[1.01] dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-950 text-white focus:ring-2 focus:ring-neutral-400/50',
          primaryText: 'text-neutral-900 dark:text-neutral-100',
          bgSubtle: 'bg-neutral-500/10',
          borderAccent: 'border-neutral-250 dark:border-neutral-800',
          accentBadge: 'bg-neutral-500/10 border-neutral-350 dark:border-neutral-800 text-neutral-850 dark:text-neutral-300',
          tabActiveBg: 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-bold shadow-sm',
          tabActiveText: 'text-neutral-950 dark:text-neutral-100',
          bodyGradient: 'bg-gradient-to-br from-neutral-50 to-neutral-100/50 dark:from-neutral-950 dark:to-neutral-950',
          headerGradient: 'text-neutral-800 dark:bg-gradient-to-r dark:from-white dark:to-neutral-400 dark:text-transparent dark:bg-clip-text',
          cardRing: 'focus-within:ring-2 focus-within:ring-neutral-500/15 ring-neutral-500/5'
        };
      case 'royal':
        return {
          primaryBg: 'bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.01] text-white focus:ring-2 focus:ring-indigo-400/50',
          primaryText: 'text-indigo-600 dark:text-indigo-400',
          bgSubtle: 'bg-indigo-505/10',
          borderAccent: 'border-indigo-500/20 dark:border-indigo-500/10',
          accentBadge: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-600 dark:text-indigo-400',
          tabActiveBg: 'bg-indigo-600 text-white font-bold shadow-sm shadow-indigo-500/20',
          tabActiveText: 'text-indigo-605 dark:text-indigo-400',
          bodyGradient: 'bg-gradient-to-br from-white to-indigo-50/10 dark:from-neutral-950 dark:via-indigo-950/10 dark:to-neutral-950',
          headerGradient: 'text-indigo-600 dark:bg-gradient-to-r dark:from-indigo-400 dark:via-purple-400 dark:to-pink-450 dark:text-transparent dark:bg-clip-text',
          cardRing: 'focus-within:ring-2 focus-within:ring-indigo-500/15 ring-indigo-500/5'
        };
      case 'neon':
        return {
          primaryBg: 'bg-pink-600 hover:bg-pink-550 hover:scale-[1.01] text-white focus:ring-2 focus:ring-pink-400/50',
          primaryText: 'text-pink-650 dark:text-pink-400',
          bgSubtle: 'bg-pink-500/10',
          borderAccent: 'border-pink-500/25 dark:border-pink-550/10',
          accentBadge: 'bg-pink-505/15 border-pink-500/30 text-pink-600 dark:text-pink-450',
          tabActiveBg: 'bg-gradient-to-r from-pink-600 to-cyan-550 text-white font-bold shadow-sm shadow-pink-500/20',
          tabActiveText: 'text-pink-600 dark:text-pink-400',
          bodyGradient: 'bg-gradient-to-br from-white via-cyan-50/5 to-pink-50/5 dark:from-neutral-950 dark:via-pink-950/10 dark:to-neutral-950',
          headerGradient: 'text-pink-650 dark:bg-gradient-to-r dark:from-pink-500 dark:via-fuchsia-400 dark:to-cyan-400 dark:text-transparent dark:bg-clip-text',
          cardRing: 'focus-within:ring-2 focus-within:ring-pink-500/15 ring-pink-500/5'
        };
      case 'default':
      default:
        return {
          primaryBg: 'bg-blue-600 hover:bg-blue-550 hover:scale-[1.01] text-white focus:ring-2 focus:ring-blue-400/50',
          primaryText: 'text-blue-600 dark:text-blue-400',
          bgSubtle: 'bg-blue-500/10',
          borderAccent: 'border-blue-500/20 dark:border-blue-550/10',
          accentBadge: 'bg-blue-505/15 border-blue-500/30 text-blue-600 dark:text-blue-450',
          tabActiveBg: 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/20',
          tabActiveText: 'text-blue-600 dark:text-blue-400',
          bodyGradient: 'bg-gradient-to-br from-white to-blue-50/5 dark:from-neutral-950 dark:via-blue-950/5 dark:to-neutral-950',
          headerGradient: 'text-blue-600 dark:bg-gradient-to-r dark:from-blue-600 dark:to-indigo-500 dark:text-transparent dark:bg-clip-text',
          cardRing: 'focus-within:ring-2 focus-within:ring-blue-500/15 ring-blue-500/5'
        };
    }
  }, [colorScheme]);

  return (
    <div className={isLightMode ? 'light' : 'dark'}>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="min-h-screen flex flex-col font-sans transition-colors duration-300"
        style={{
          backgroundColor: 'var(--n-bg)',
          color: 'var(--n-tx1)'
        }}
      >
        {/* =========================================================================
            HEADER PREFERENCES NAVIGATION
            ========================================================================= */}
        <header 
          className="sticky top-0 z-40 backdrop-blur-md px-4 md:px-8 py-1.5 flex flex-row items-center justify-between gap-2 select-none"
          style={{
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            color: 'var(--text-primary)'
          }}
        >
          <div className="flex items-center gap-2">
            {/* Sidebar toggle button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-2xl border transition-all cursor-pointer hover:opacity-95"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)'
              }}
              title="Toggle checklist workspaces dashboard panel"
            >
              <Settings className={`w-4 h-4 ${isSidebarOpen ? 'rotate-90' : 'rotate-0'} transition-transform duration-300`} />
            </button>
          </div>

          {/* Core styling segment bars */}
          <div className="flex items-center gap-3 justify-end">
            
            {/* Segmented iOS theme selector */}
            <div 
              className="p-1 rounded-2xl flex items-center gap-0.5 border"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-default)'
              }}
            >
              <button
                onClick={() => setTheme('light')}
                type="button"
                className="flex items-center justify-center p-2 rounded-xl text-xs transition duration-155 cursor-pointer"
                style={{
                  backgroundColor: theme === 'light' ? 'var(--bg-surface)' : 'transparent',
                  color: theme === 'light' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  boxShadow: theme === 'light' ? 'var(--shadow-sm)' : 'none'
                }}
                title="Force Light Staging"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setTheme('dark')}
                type="button"
                className="flex items-center justify-center p-2 rounded-xl text-xs transition duration-155 cursor-pointer"
                style={{
                  backgroundColor: theme === 'dark' ? 'var(--bg-surface)' : 'transparent',
                  color: theme === 'dark' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  boxShadow: theme === 'dark' ? 'var(--shadow-sm)' : 'none'
                }}
                title="Force Dark Staging"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setTheme('system')}
                type="button"
                className="flex items-center justify-center gap-1.5 p-2 px-2.5 rounded-xl text-xs transition duration-155 cursor-pointer"
                style={{
                  backgroundColor: theme === 'system' ? 'var(--bg-surface)' : 'transparent',
                  color: theme === 'system' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  boxShadow: theme === 'system' ? 'var(--shadow-sm)' : 'none'
                }}
                title="System Lighting Default"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="text-[10px] font-mono leading-none hidden lg:inline">System</span>
              </button>
            </div>

            {/* Multi-theme system swatch selector trigger */}
            <button
              onClick={() => setIsThemePickerOpen(true)}
              type="button"
              className="p-2 rounded-xl flex items-center justify-center border transition-all cursor-pointer hover:opacity-95"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)'
              }}
              title="Open Multi-Theme System Swatches"
            >
              <Palette className="w-4 h-4" />
            </button>

            {/* Live syncing status indicator */}
            <div 
              className="hidden sm:flex items-center gap-1.5 text-[9px] font-mono px-3 py-2 rounded-xl border"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-secondary)'
              }}
            >
              <Cloud className={`w-3.5 h-3.5 ${isSyncing ? 'text-amber-500 animate-spin' : 'text-emerald-500'}`} />
              <span>{isSyncing ? "Saving..." : "Local-First"}</span>
            </div>
          </div>
        </header>

        {/* =========================================================================
            CORE INTERACTIVE CONTAINER
            ========================================================================= */}
        <div className="flex-1 flex flex-col lg:flex-row relative">
          
          {/* =========================================================================
              SIDEBAR WORKSPACE MANAGEMENT CONTROLS
              ========================================================================= */}
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 240, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 26 }}
                style={{
                  backgroundColor: 'var(--notion-bg-secondary)',
                  borderColor: 'var(--notion-border)',
                  borderRight: '1px solid var(--notion-border)',
                  overflow: 'hidden'
                }}
                className="shrink-0 border-r select-none h-full lg:sticky lg:top-[75px] max-h-[calc(100vh-75px)]"
              >
                <div className="w-[240px] p-2 space-y-4 h-full overflow-y-auto overflow-x-hidden">
                  {/* 1. Project workspace switch section */}
                <div className="flex flex-col">
                  <div className="flex items-center justify-between px-3 pt-3 pb-1 select-none shrink-0 text-[11px] uppercase tracking-wider text-stone-500 font-medium">
                    <span style={{ color: 'var(--notion-text-tertiary)', letterSpacing: '0.06em' }}>Active workspace</span>
                    <button
                      type="button"
                      onClick={() => setShowNewProjectForm(!showNewProjectForm)}
                      className="w-5 h-5 flex items-center justify-center rounded hover:bg-[var(--notion-bg-hover)] cursor-pointer text-stone-500 outline-none border-none bg-transparent"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Create project input section */}
                  {showNewProjectForm && (
                    <form 
                      onSubmit={handleCreateNewProjectFromScratch}
                      className="p-3 mx-2 my-1 rounded border space-y-2 transition animate-fadeIn"
                      style={{
                        backgroundColor: 'var(--notion-bg-primary)',
                        borderColor: 'var(--notion-border)'
                      }}
                    >
                      <p className="text-[10px] font-mono font-bold text-stone-500 uppercase">New Workspace</p>
                      <input
                        type="text"
                        className="w-full text-xs p-2 rounded outline-none border focus:border-[var(--notion-accent-blue)] bg-transparent font-sans h-8"
                        style={{ borderColor: 'var(--notion-border)', color: 'var(--notion-text-primary)' }}
                        placeholder="Project name..."
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        required
                      />
                      <input
                        type="text"
                        className="w-full text-xs p-2 rounded outline-none border focus:border-[var(--notion-accent-blue)] bg-transparent font-sans h-8"
                        style={{ borderColor: 'var(--notion-border)', color: 'var(--notion-text-primary)' }}
                        placeholder="Description..."
                        value={newProjectDesc}
                        onChange={(e) => setNewProjectDesc(e.target.value)}
                      />

                      {/* Presets segment toggle */}
                      <div className="grid grid-cols-2 gap-1 p-0.5 rounded bg-[var(--notion-bg-hover)] text-[10px] font-medium font-mono text-center">
                        <button
                          type="button"
                          onClick={() => setProjectPreset('blueprint')}
                          className={`py-1 rounded cursor-pointer ${
                            projectPreset === 'blueprint' 
                              ? 'bg-[var(--notion-bg-primary)] shadow-xs font-semibold' 
                              : 'opacity-60'
                          }`}
                          style={{ color: 'var(--notion-text-primary)' }}
                        >
                          Blueprint
                        </button>
                        <button
                          type="button"
                          onClick={() => setProjectPreset('empty')}
                          className={`py-1 rounded cursor-pointer ${
                            projectPreset === 'empty'
                              ? 'bg-[var(--notion-bg-primary)] shadow-xs font-semibold'
                              : 'opacity-60'
                          }`}
                          style={{ color: 'var(--notion-text-primary)' }}
                        >
                          Scratch
                        </button>
                      </div>

                      <div className="flex gap-2 text-[10px] justify-end">
                        <button
                          type="button"
                          onClick={() => setShowNewProjectForm(false)}
                          className="px-2 py-1 rounded bg-[var(--notion-bg-hover)]"
                          style={{ color: 'var(--notion-text-secondary)' }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-2 py-1 rounded text-white font-semibold"
                          style={{ backgroundColor: 'var(--notion-accent-blue)' }}
                        >
                          Start
                        </button>
                      </div>
                    </form>
                  )}

                  {/* List of active projects toggle buttons */}
                  <div className="space-y-[2px] max-h-[140px] overflow-y-auto px-1 py-1 scrollbar-none">
                    {projects.map(p => {
                      const isActive = p.id === activeProject.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleSelectActiveProject(p.id)}
                          className={`group flex items-center justify-between gap-2 h-7 px-2 rounded cursor-pointer transition-colors duration-100 select-none text-[13px] ${
                            isActive ? 'active-sidebar-item' : 'sidebar-item'
                          }`}
                          style={{
                            backgroundColor: isActive ? 'var(--notion-bg-selected)' : 'transparent',
                            color: isActive ? 'var(--notion-text-primary)' : 'var(--notion-text-secondary)',
                            fontWeight: isActive ? 500 : 400
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive) e.currentTarget.style.backgroundColor = 'var(--notion-bg-hover)';
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: 'inherit' }} />
                            <span className="truncate flex-1 text-left">{p.name}</span>
                          </div>
                          
                          {/* Close Project Button */}
                          {projects.length > 1 && (
                            <button
                              onClick={(e) => handleDeleteProject(p.id, e)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[var(--notion-bg-hover)] text-stone-400 hover:text-stone-750 dark:hover:text-stone-300 outline-none border-none bg-transparent cursor-pointer transition-all duration-100"
                              title="Delete workspace project permanently"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Operations tab configurations */}
                <div className="flex flex-col">
                  {/* Flat Section Divider Header */}
                  <div className="px-3 pt-3 pb-1 select-none text-[11px] uppercase tracking-wider text-stone-500 font-medium" style={{ color: 'var(--notion-text-tertiary)', letterSpacing: '0.06em' }}>
                    Administrative Tuning
                  </div>

                  <div className="space-y-[2px] px-1 py-1">
                    {/* Phases button row */}
                    <div
                      onClick={() => setCurrentAdminTab(currentAdminTab === 'phases' ? 'none' : 'phases')}
                      className={`flex items-center gap-2 h-7 px-2 rounded cursor-pointer transition-colors duration-100 text-[13px] ${
                        currentAdminTab === 'phases' ? 'active-sidebar-item' : 'sidebar-item'
                      }`}
                      style={{
                        backgroundColor: currentAdminTab === 'phases' ? 'var(--notion-bg-selected)' : 'transparent',
                        color: currentAdminTab === 'phases' ? 'var(--notion-text-primary)' : 'var(--notion-text-secondary)',
                      }}
                      onMouseEnter={(e) => {
                        if (currentAdminTab !== 'phases') e.currentTarget.style.backgroundColor = 'var(--notion-bg-hover)';
                      }}
                      onMouseLeave={(e) => {
                        if (currentAdminTab !== 'phases') e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <Layers className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="flex-1 text-left">Phases</span>
                    </div>

                    {/* Roster button row */}
                    <div
                      onClick={() => setCurrentAdminTab(currentAdminTab === 'team' ? 'none' : 'team')}
                      className={`flex items-center gap-2 h-7 px-2 rounded cursor-pointer transition-colors duration-100 text-[13px] ${
                        currentAdminTab === 'team' ? 'active-sidebar-item' : 'sidebar-item'
                      }`}
                      style={{
                        backgroundColor: currentAdminTab === 'team' ? 'var(--notion-bg-selected)' : 'transparent',
                        color: currentAdminTab === 'team' ? 'var(--notion-text-primary)' : 'var(--notion-text-secondary)',
                      }}
                      onMouseEnter={(e) => {
                        if (currentAdminTab !== 'team') e.currentTarget.style.backgroundColor = 'var(--notion-bg-hover)';
                      }}
                      onMouseLeave={(e) => {
                        if (currentAdminTab !== 'team') e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <Users className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="flex-1 text-left">Roster</span>
                    </div>

                    {/* Import button row */}
                    <div
                      onClick={() => setCurrentAdminTab(currentAdminTab === 'import-export' ? 'none' : 'import-export')}
                      className={`flex items-center gap-2 h-7 px-2 rounded cursor-pointer transition-colors duration-100 text-[13px] ${
                        currentAdminTab === 'import-export' ? 'active-sidebar-item' : 'sidebar-item'
                      }`}
                      style={{
                        backgroundColor: currentAdminTab === 'import-export' ? 'var(--notion-bg-selected)' : 'transparent',
                        color: currentAdminTab === 'import-export' ? 'var(--notion-text-primary)' : 'var(--notion-text-secondary)',
                      }}
                      onMouseEnter={(e) => {
                        if (currentAdminTab !== 'import-export') e.currentTarget.style.backgroundColor = 'var(--notion-bg-hover)';
                      }}
                      onMouseLeave={(e) => {
                        if (currentAdminTab !== 'import-export') e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <Upload className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span className="flex-1 text-left">Import</span>
                    </div>
                  </div>
                </div>

                {/* Admin active sheet drawer display */}
                <AnimatePresence mode="wait">
                  {currentAdminTab !== 'none' && (
                    <motion.div
                      key={currentAdminTab}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.15 }}
                      className="p-3 mx-1.5 rounded border space-y-3 transition"
                      style={{
                        backgroundColor: 'var(--notion-bg-primary)',
                        borderColor: 'var(--notion-border)'
                      }}
                    >
                      {/* SUB SECTION: PHASES */}
                      {currentAdminTab === 'phases' && (
                        <div className="space-y-3">
                          <div>
                            <span className="text-[11px] font-mono font-bold text-stone-500 uppercase">Focus Phase Groups ({activeProject.categories.length})</span>
                            <span className="block text-[11px] italic mt-0.5" style={{ color: 'var(--notion-text-secondary)' }}>Add or edit development focus milestones.</span>
                          </div>

                          <form onSubmit={handleAddPhase} className="space-y-1.5 text-[13px]">
                            <input
                              type="text"
                              className="w-full text-xs p-2 rounded outline-none border focus:border-[var(--notion-accent-blue)] bg-transparent font-sans h-8"
                              style={{ borderColor: 'var(--notion-border)', color: 'var(--notion-text-primary)' }}
                              placeholder="Phase Name (e.g. QA Staging)"
                              value={phaseName}
                              onChange={(e) => setPhaseName(e.target.value)}
                              required
                            />
                            <input
                              type="text"
                              className="w-full text-xs p-2 rounded outline-none border focus:border-[var(--notion-accent-blue)] bg-transparent font-sans h-8"
                              style={{ borderColor: 'var(--notion-border)', color: 'var(--notion-text-primary)' }}
                              placeholder="Brief phase objective description"
                              value={phaseDesc}
                              onChange={(e) => setPhaseDesc(e.target.value)}
                            />

                            <div className="grid grid-cols-2 gap-1.5">
                              {/* Icon list dropdown selector */}
                              <select
                                className="text-[11px] font-mono p-1 rounded border cursor-pointer bg-transparent h-8"
                                style={{ borderColor: 'var(--notion-border)', color: 'var(--notion-text-primary)', backgroundColor: 'var(--notion-bg-primary)' }}
                                value={phaseIcon}
                                onChange={(e) => setPhaseIcon(e.target.value)}
                              >
                                <option value="Shield">🛡️ Shield</option>
                                <option value="Server">⚙️ Server</option>
                                <option value="Code2">💻 Code2</option>
                                <option value="CheckSquare">✅ Checklist</option>
                                <option value="Database">🗄️ Database</option>
                                <option value="FileText">📝 Docs</option>
                              </select>

                              {/* Colors list selector */}
                              <select
                                className="text-[11px] font-mono p-1 rounded border cursor-pointer bg-transparent h-8"
                                style={{ borderColor: 'var(--notion-border)', color: 'var(--notion-text-primary)', backgroundColor: 'var(--notion-bg-primary)' }}
                                value={phaseColor}
                                onChange={(e) => setPhaseColor(e.target.value)}
                              >
                                <option value="default">🔵 Classic Blue</option>
                                <option value="emerald">🟢 Security Emerald</option>
                                <option value="sunset">🟡 Amber Sunset</option>
                                <option value="royal">🟣 Custom Royal</option>
                                <option value="neon">💗 Neon Fuchsia</option>
                                <option value="monochrome">⚫ Monochrome Gray</option>
                              </select>
                            </div>

                            <button
                              type="submit"
                              className="w-full h-8 text-white rounded text-xs font-semibold cursor-pointer border-none"
                              style={{ backgroundColor: 'var(--notion-accent-blue)' }}
                            >
                              Deploy Focus Phase
                            </button>
                          </form>

                          {/* List of active project focus groups */}
                          <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1 scrollbar-none border-t pt-2" style={{ borderColor: 'var(--notion-border)' }}>
                            {activeProject.categories.map(c => (
                              <div key={c.id} className="text-[12px] flex items-center justify-between p-1.5 rounded hover:bg-[var(--notion-bg-hover)]">
                                <div className="truncate pr-1 flex flex-col items-start leading-none">
                                  <span className="font-semibold block truncate text-[12px]" style={{ color: 'var(--notion-text-primary)' }}>{c.name}</span>
                                  <span className="text-[10px] font-mono tracking-wider truncate uppercase mt-0.5 text-stone-500">{c.id}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePhase(c.id)}
                                  className="text-[11px] text-stone-500 hover:text-rose-500 p-1 shrink-0 bg-transparent border-none cursor-pointer"
                                >
                                  Del
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* SUB SECTION: TEAM ROSTER */}
                      {currentAdminTab === 'team' && (
                        <div className="space-y-3">
                          <div>
                            <span className="text-[11px] font-mono font-bold text-stone-500 uppercase">Operational Work Crew ({activeProject.team.length})</span>
                            <span className="block text-[11px] italic mt-0.5" style={{ color: 'var(--notion-text-secondary)' }}>Add teammates to delegate compliance standards list.</span>
                          </div>

                          <form onSubmit={handleAddTeammate} className="space-y-1.5">
                            <input
                              type="text"
                              className="w-full text-xs p-2 rounded outline-none border focus:border-[var(--notion-accent-blue)] bg-transparent font-sans h-8"
                              style={{ borderColor: 'var(--notion-border)', color: 'var(--notion-text-primary)' }}
                              placeholder="Full Name (e.g. Marcus Vance)"
                              value={memberName}
                              onChange={(e) => setMemberName(e.target.value)}
                              required
                            />
                            <input
                              type="text"
                              className="w-full text-xs p-2 rounded outline-none border focus:border-[var(--notion-accent-blue)] bg-transparent font-sans h-8"
                              style={{ borderColor: 'var(--notion-border)', color: 'var(--notion-text-primary)' }}
                              placeholder="Project Position (e.g. DevOps Senior)"
                              value={memberRole}
                              onChange={(e) => setMemberRole(e.target.value)}
                              required
                            />
                            <input
                              type="email"
                              className="w-full text-xs p-2 rounded outline-none border focus:border-[var(--notion-accent-blue)] bg-transparent font-sans h-8"
                              style={{ borderColor: 'var(--notion-border)', color: 'var(--notion-text-primary)' }}
                              placeholder="Delegate email (optional)"
                              value={memberEmail}
                              onChange={(e) => setMemberEmail(e.target.value)}
                            />

                            {/* Avatar selector options */}
                            <select
                              className="w-full text-[11px] font-mono p-1 rounded border cursor-pointer bg-transparent h-8"
                              style={{ borderColor: 'var(--notion-border)', color: 'var(--notion-text-primary)', backgroundColor: 'var(--notion-bg-primary)' }}
                              value={memberAvatar}
                              onChange={(e) => setMemberAvatar(e.target.value)}
                            >
                              <option value="bg-blue-500">🔵 Classic Blue</option>
                              <option value="bg-emerald-500">🟢 Security Emerald</option>
                              <option value="bg-amber-500">🟡 Amber Sunset</option>
                              <option value="bg-indigo-500">🟣 Custom Royal</option>
                              <option value="bg-pink-500">💗 Neon Fuchsia</option>
                              <option value="bg-stone-500">⚫ Monochrome Gray</option>
                            </select>

                            <button
                              type="submit"
                              className="w-full h-8 text-white rounded text-xs font-semibold cursor-pointer border-none"
                              style={{ backgroundColor: 'var(--notion-green)' }}
                            >
                              Register Collaborator
                            </button>
                          </form>

                          {/* Crew member listings list */}
                          <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1 scrollbar-none border-t pt-2" style={{ borderColor: 'var(--notion-border)' }}>
                            {activeProject.team.map(m => (
                              <div key={m.id} className="text-[12px] flex items-center justify-between p-1.5 rounded hover:bg-[var(--notion-bg-hover)]">
                                <div className="flex items-center gap-2 truncate">
                                  <div className={`w-5 h-5 rounded-full ${m.avatarColor} text-white font-mono flex items-center justify-center font-bold text-[8px] shrink-0`}>
                                    {m.name.split(' ').map(n=>n[0]).join('')}
                                  </div>
                                  <div className="truncate pr-1 flex flex-col items-start leading-none">
                                    <span className="font-semibold block truncate text-[12px]" style={{ color: 'var(--notion-text-primary)' }}>{m.name}</span>
                                    <span className="text-[9px] mt-0.5 block truncate text-stone-500">{m.role}</span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTeammate(m.id)}
                                  className="text-[11px] text-stone-500 hover:text-rose-500 p-1 shrink-0 bg-transparent border-none cursor-pointer"
                                >
                                  Del
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* SUB SECTION: EXPORT / IMPORT MATRICES */}
                      {currentAdminTab === 'import-export' && (
                        <div className="space-y-3">
                          <div>
                            <span className="text-[11px] font-mono font-bold text-stone-500 uppercase">JSON Checklist Porting</span>
                            <span className="block text-[11px] italic mt-0.5" style={{ color: 'var(--notion-text-secondary)' }}>Import checklists from scratch or backup current settings.</span>
                          </div>

                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={downloadTemplateJSON}
                              className="flex-1 h-7 text-[10px] font-mono font-bold rounded flex items-center justify-center gap-1 border cursor-pointer hover:bg-[var(--notion-bg-hover)] bg-transparent px-1"
                              style={{ borderColor: 'var(--notion-border)', color: 'var(--notion-text-secondary)' }}
                            >
                              <Download className="w-3 h-3 shrink-0" /> Download Example JSON
                            </button>

                            <button
                              type="button"
                              onClick={exportProjectToJSON}
                              className="flex-1 h-7 text-[10px] font-mono font-medium rounded flex items-center justify-center gap-1 cursor-pointer hover:opacity-90 text-white border-none px-1"
                              style={{ backgroundColor: 'var(--notion-accent-blue)' }}
                            >
                              <Download className="w-3 h-3 shrink-0" /> Export DB
                            </button>
                          </div>

                          {/* drag and drop file simulation container */}
                          <div 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="border border-dashed rounded p-3 text-center cursor-pointer hover:bg-[var(--notion-bg-hover)] transition duration-150"
                            style={{ borderColor: 'var(--notion-border)' }}
                          >
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileUpload}
                              className="hidden"
                              accept=".json"
                            />
                            <Upload className="w-4 h-4 mx-auto mb-1 text-natural-500" style={{ color: 'var(--notion-text-secondary)' }} />
                            <span className="text-[10px] font-mono block font-bold" style={{ color: 'var(--notion-text-primary)' }}>Select .json file</span>
                            <span className="text-[8px] block leading-none mt-1" style={{ color: 'var(--notion-text-tertiary)' }}>Accepts raw standards files</span>
                          </div>
                        </div>
                      )}

                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 3. Team online sharing orchestration magic */}
                <div className="flex flex-col pt-2">
                  {/* Flat Section Divider Header */}
                  <div className="px-3 pt-3 pb-1 select-none text-[11px] uppercase tracking-wider text-stone-500 font-medium" style={{ color: 'var(--notion-text-tertiary)', letterSpacing: '0.06em' }}>
                    Live Team Orchestration
                  </div>

                  <div className="px-3 py-1.5 space-y-2.5">
                    <p className="text-[13px] leading-relaxed text-left select-none" style={{ color: 'var(--notion-text-secondary)' }}>
                      Compile active specs and dispatch roster email.
                    </p>

                    <div className="flex flex-col gap-1.5 border-none bg-transparent">
                      {/* Dispatch roster email: standard secondary button */}
                      <button
                        onClick={handleSendDynamicTeamInvitationEmail}
                        className="w-full h-8 text-[12px] font-medium tracking-tight rounded cursor-pointer transition duration-125 text-stone-700 dark:text-stone-300 border hover:bg-[var(--notion-bg-hover)] flex items-center justify-center gap-1.5"
                        style={{
                          borderColor: 'var(--notion-border)',
                          backgroundColor: 'transparent',
                          color: 'var(--notion-text-primary)'
                        }}
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Dispatch Roster Email</span>
                      </button>

                      {/* Copy live magic link: ghost text link (no border, no bg unless hover) */}
                      <button
                        onClick={handleGenerateMagicShareLink}
                        className="w-full h-8 text-[12px] font-medium tracking-tight rounded cursor-pointer transition duration-125 flex items-center justify-center gap-1.5 border-none bg-transparent hover:bg-[var(--notion-bg-hover)]"
                        style={{
                          color: copiedLink ? 'var(--notion-green)' : 'var(--notion-text-primary)'
                        }}
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedLink ? "Link Placed in Clipboard!" : "Copy Magic Link"}</span>
                      </button>
                    </div>
                  </div>
                </div>
                </div>

              </motion.aside>
            )}
          </AnimatePresence>

          {/* =========================================================================
              MAIN PORTFOLIO VELOCITY VIEWPORT PANEL
              ========================================================================= */}
          <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
            
            {/* Top Workspace Greetings Banner */}
            <div 
              className={`p-6 rounded-3xl relative overflow-hidden transition-all duration-300 card-theme-target ${
                isLightMode 
                  ? 'bg-white shadow-sm shadow-neutral-100' 
                  : 'bg-radial from-neutral-900/40 to-transparent'
              }`}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: 'none'
              }}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 relative">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      isLightMode 
                        ? 'bg-blue-50 text-blue-800' 
                        : 'bg-blue-900 text-blue-200'
                    }`}>
                      Active Workspace Specs
                    </span>
                    <span className={`text-xs font-mono block ${isLightMode ? 'text-neutral-500' : 'text-neutral-400'}`}>
                      Launched on: {activeProject.createdAt ? new Date(activeProject.createdAt).toLocaleDateString() : 'N/A'} • Workspace Tag
                    </span>
                  </div>
                  <h2 className={`text-2xl font-medium tracking-tight mt-2 flex items-center gap-1.5 ${
                    isLightMode ? 'text-neutral-950' : 'text-white'
                  }`}>
                    {activeProject.name}
                  </h2>
                  <p className={`text-xs max-w-2xl mt-1.5 leading-normal ${
                    isLightMode ? 'text-neutral-600' : 'text-neutral-400'
                  }`}>
                    {activeProject.description}
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Print Executive Report Action Button */}
                  <button
                    onClick={() => setIsReportOpen(true)}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition transform hover:scale-[1.01] cursor-pointer shadow-md text-white bg-blue-600 hover:bg-blue-550 btn-primary"
                  >
                    <Printer className="w-4 h-4 shrink-0" />
                    <span>Executive Audit PDF Report</span>
                  </button>

                  {/* Active Outstanding risk counter badge */}
                  <div className="flex items-center gap-3 px-1 py-1.5 danger-risk-badge">
                    <div className="p-1 rounded-full bg-rose-500/15 text-rose-500">
                      <AlertTriangle className="w-4 h-4 animate-bounce" />
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] font-mono text-neutral-550 block uppercase font-black">Velocity risk cap</span>
                      <span className="text-xs font-black font-mono text-rose-500">{calculatedStats.highPriorityCount} High Blockers</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic notification inline helper */}
              <div className={`mt-4 pt-3.5 border-t text-[11px] font-mono flex items-start gap-1.5 ${
                isLightMode ? 'border-neutral-100 text-neutral-500' : 'border-neutral-850/40 text-neutral-500'
              }`}>
                <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Tip:</strong> Click on <span className="underline select-none">"Administrative Tuning" / Roster / Phases</span> inside the side configurations dashboard panel to inject custom team crews, focus groupings, or import standards from scratch!
                </span>
              </div>
            </div>

            {/* Overall progress dashboard section */}
            <StatsSection
              stats={calculatedStats}
              items={activeProject.items}
              categories={activeProject.categories}
              team={activeProject.team}
              onSelectCategory={(cat) => setSelectedCategory(cat)}
              selectedCategory={selectedCategory}
              isLightMode={isLightMode}
              accent={accent}
              onAssignClick={(memberId) => {
                const unassignedTasks = activeProject.items.filter(item => !item.assignedTo?.includes(memberId));
                if (unassignedTasks.length === 0) {
                  showToast("All current specifications are already delegated to this collaborator!", "info");
                  return;
                }
                
                const taskListString = unassignedTasks.map((t, index) => `${index + 1}. [${activeProject.categories.find(c=>c.id===t.category)?.name || t.category}] ${t.title}`).join('\n');
                const indexStr = window.prompt(
                  `Select a standard specification to delegate to this team member:\n\n${taskListString}\n\nType the number to assign (1 - ${unassignedTasks.length}):`
                );
                
                if (indexStr === null) return; // User canceled
                const idx = parseInt(indexStr.trim(), 10) - 1;
                if (isNaN(idx) || idx < 0 || idx >= unassignedTasks.length) {
                  showToast("Invalid choice entered.", "warning");
                  return;
                }
                
                const targetTask = unassignedTasks[idx];
                const updatedItems = activeProject.items.map(item => {
                  if (item.id === targetTask.id) {
                    const nextAssigned = item.assignedTo ? [...item.assignedTo] : [];
                    if (!nextAssigned.includes(memberId)) {
                      nextAssigned.push(memberId);
                    }
                    return {
                      ...item,
                      assignedTo: nextAssigned,
                      updatedAt: new Date().toISOString()
                    };
                  }
                  return item;
                });
                
                updateActiveProjectState({ items: updatedItems });
                showToast(`Successfully delegated compliance spec "${targetTask.title}"!`, "success");
              }}
            />

            {/* Velocity Timeline for task completion metrics over past 2 weeks */}
            <CompletionTimeline items={activeProject.items} />

            {/* Filter and searching row */}
            <FilterSection
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedPriority={selectedPriority}
              setSelectedPriority={setSelectedPriority}
              onOpenAddModal={() => {
                setTaskToEdit(null);
                setIsAddModalOpen(true);
              }}
              onResetToDefaults={handleResetToDefaults}
              items={activeProject.items}
              categories={activeProject.categories}
              isLightMode={isLightMode}
              accent={accent}
            />

            {/* Main Interactive Kanban Workspace Grid Board */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className={`text-xs font-mono uppercase tracking-widest flex items-center gap-1.5 font-black ${
                  isLightMode ? 'text-neutral-500' : 'text-neutral-500'
                }`}>
                  <Hammer className="w-3.5 h-3.5 text-neutral-400" /> General Projects Matrix Board
                </h3>
                <span className={`text-[10px] font-mono ${isLightMode ? 'text-neutral-500' : 'text-neutral-500'}`}>
                  Isolating {filteredTasks.length} out of {activeProject.items.length} checklist requirements
                </span>
              </div>

              <TaskBoard
                tasks={filteredTasks}
                categories={activeProject.categories}
                team={activeProject.team}
                onEdit={(task) => {
                  setTaskToEdit(task);
                  setIsAddModalOpen(true);
                }}
                onDelete={handleDeleteTask}
                onMoveStatus={handleMoveStatus}
                onUpdateTask={handleUpdateTask}
                isLightMode={isLightMode}
                onNewCard={(status) => {
                  setTaskToEdit(null);
                  setIsAddModalOpen(true);
                }}
              />
            </div>

          </main>

        </div>

        {/* =========================================================================
            FOOTER SYSTEM NOTATIONS
            ========================================================================= */}
        <footer 
          className="w-full py-5 px-4 md:px-8 border-t select-none text-center"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-secondary)'
          }}
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-[9px] md:text-[10px] font-mono">
            <div>
              &copy; 2026 Production Readiness Checklist Console - Apple Minimalist Staging Layout.
            </div>
            <div className="flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-blue-500" />
              Dynamic offline-first persistent multi-project sync engines.
            </div>
            <div className="flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              Never share secret API credential keys with client-facing browser layers.
            </div>
          </div>
        </footer>

        {/* POPUP FORMS DIALOG */}
        <TaskModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setTaskToEdit(null);
          }}
          onSave={handleSaveTask}
          taskToEdit={taskToEdit}
          categories={activeProject.categories}
          team={activeProject.team}
          isLightMode={isLightMode}
        />

        {/* PRINT EXECUTIVE SUMMARY REPORT */}
        <ExecutiveReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          project={activeProject}
          isLightMode={isLightMode}
        />

        {/* MULTI-THEME SELECTOR DIALOG */}
        <ThemePickerModal
          isOpen={isThemePickerOpen}
          onClose={() => setIsThemePickerOpen(false)}
          activeTheme={activeTheme}
          setActiveTheme={setActiveTheme}
          isLightMode={isLightMode}
        />

        {/* WORKSPACE DESTRUCTION CONFIRMATION DIALOG */}
        <ConfirmModal
          isOpen={projectToDelete !== null}
          onClose={() => setProjectToDelete(null)}
          onConfirm={handleConfirmDeleteProject}
          title="Delete Workspace"
          message={`Are you absolutely sure you want to permanently erase the "${projects.find(p => p.id === projectToDelete)?.name || ''}" workspace? This will permanently delete all custom checklists, team details, and specifications, and cannot be undone.`}
          confirmText="Yes, Erase Permanently"
          cancelText="Cancel"
          danger={true}
        />

        {/* SNACKBAR ALERTS */}
        <NotificationToast
          toast={toast}
          onClose={() => setToast(null)}
          isLightMode={isLightMode}
        />

      </motion.div>
    </div>
  );
}
