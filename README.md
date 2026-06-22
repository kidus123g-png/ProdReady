# ProdReady Documentation

> **Version:** v1.0.0 | **Last updated:** 2026-06-22 | **Status:** Published

---

## How to use this template

This documentation acts as the definitive user manual, integration guide, and deployment manual for **ProdReady**. It is structured for three primary audiences:
- 🟢 **End Users** — Developers, Quality Auditors, and Release Managers tracking production-readiness benchmarks.
- 🔵 **Developers** — Technical professionals configuring, extending, or maintaining the React/Vite source code.
- 🟣 **Admins/Internal** — System coordinators, compliance leads, or operations engineers deploying the workspace.

---

## 0. Document Control

| Field | Value |
|---|---|
| **Owner** | Compliance & Quality Operations Team |
| **Last reviewed** | 2026-06-22 |
| **Applies to version(s)** | v1.0.0 |
| **Feedback / report an issue** | Submit a ticket via GitHub Issues or contact our support desk |

---

## 1. Overview *(All audiences)*

### What is this app?
**ProdReady** is a high-performance, local-first compliance audit and team delegation workspace. It serves as a definitive validation buffer between rapid application development (the "vibes") and continuous production deployment (the "release"). 

ProdReady allows software engineering teams to track, categorize, sign off on, and delegate critical system reliability checklists (e.g., Security, Infrastructure, Data Integrity) so that nothing gets missed before shipping.

### Key features
*   **Multi-Project Workspaces**: Manage distinct configurations and architectures side-by-side with secure workspace eraser safety models and custom confirmation popups.
*   **2-Click Quick Assignment Popovers**: Highly responsive team assignment select panels immediately within each backlog task card for effortless, fast team delegations in just two clicks.
*   **Custom Phases & Domain Constructors**: Add, configure, and dynamically color-code custom compliance streams.
*   **Urgency-Sorted Kanban Boards**: Visualizes verification states (*Backlog*, *Active Validation*, *Signed Off*) automatically sorted by overdue-status and priority.
*   **2-Week Velocity & Completion Logs**: An interactive SVG-driven timeline tracking daily completed benchmarks to measure momentum.
*   **Team Velocity & Email Dispatch Report**: Auto-compiles team velocity metrics and provides an instant corporate mail-to trigger to escalate blockers.
*   **Zero-Backend Magic URLs**: Instantly export/share workspaces with baseline configurations encoded as clean, URL-safe Base64 hashes. No databases or logins required.
*   **Power-User Keyboard Controls**: Accelerate navigation with global key bindings for adding cards, filtering, and focusing search inputs.

---

## 2. 🟢 Getting Started (End Users)

### 2.1 Quickstart
Get to your first certified standard in under 1 minute:
1. Load **ProdReady** in your dynamic browser environment.
2. Select any active preset project (e.g., *SaaS Compliance Audit*) from the **Project Navigation** sidebar.
3. Click on any compliance card to expand its details, assign it to a teammate, or set a due date.
4. Drag a card from the **Backlog (Todo)** column to **Signed Off (Completed)**.
5. In the bottom-right corner, check your updated **Completion velocity timeline** to verify that your completion count for today has increased!

### 2.2 Core Workflows

#### 1. Managing Dynamic Specifications (Task Board)
*   **When to use this:** To track and move compliance clauses through validation states.
*   **Steps:**
    1. Identify the clause on the three-column **Kanban Matrix** (*Todo / In-Progress / Completed*).
    2. Click on the checklist indicator on any card to interactively check off nested subtasks directly from the board.
    3. Drag the card or use quick-action buttons inside the card's header area to promote status or demote if verification fails.
    4. Completed tasks will immediately write a timestamp (`completedAt`) backing your velocity history.

#### 2. Creating & Customizing Audit Categories
*   **When to use this:** To dynamically align checklist domains with your organizational standard operating procedures.
*   **Steps:**
    1. Scroll to the **Interactive Architecture Controllers** at the bottom of the workspace.
    2. Click **Create New Category / Phase**.
    3. Input a standard name, choose an icon (e.g., *Check, Shield, Key*), and designate a custom theme color.
    4. Save to instantaneously updates cards, filters, and priority structures.

#### 3. Generating Team Velocity Dispatch Reports
*   **When to use this:** For stand-up reviews, stakeholder alignment, or when signaling critical high-priority security blockers.
*   **Steps:**
    1. Navigate to the sidebar or project statistics panel and locate **Dispatch Reports**.
    2. Click **Generate Live Workspace Report** to view a clean summary of team activity and unresolved high-risk checklists.
    3. Click **Dispatch via corporate email** to auto-compose a formatted report directly inside your desktop or mobile mail client.

#### 4. Sharing Workspaces via Magic Share Links
*   **When to use this:** To hand off a certified checklist to another auditor or clone a template across systems with zero central server storage.
*   **Steps:**
    1. Click the **Magic Share Link** action button in the header toolbar.
    2. A popup displays a generated Base64 share URL.
    3. Copy this hash link and send it to your team. When opened, it automatically unpacks the exact board configuration straight to their browser's persistent database.

### 2.3 FAQ / Troubleshooting

| Question / Error | Answer / Fix |
|---|---|
| *"Why did my dashboard revert back to default values?"* | Click **Reset / Clear State** only if you want to restore baseline benchmarks. To prevent accidental loss, ensure you use the **Export Configuration (JSON)** feature regularly to save your custom schemas. |
| *"Why isn't the magic link loading on another browser?"* | Magic links use standard Base64 encoding. Ensure you copy the entire query string (`?shared=...`). If a link gets clipped in chats or emails, the decoding process may fail. |
| *"Can multiple users collaborate on the same board in real-time?"* | ProdReady acts as a local-first application. To collaborate, simply send updated **Magic Share Links** or share `.json` save-states as you check off benchmarks! |

---

## 3. 🔵 Developer Documentation

### 3.1 Quickstart (Workspace Commands)

```bash
# Clone or locate the source code repository
cd prodready-workspace

# Install dependencies from package.json
npm install

# Launch Vite development preview locally
npm run dev
```

### 3.2 Power-User Keyboard Shortcuts
ProdReady comes with built-in speed handles for quick execution. These handlers are globally bound within `src/App.tsx`:

*   `N` Key (Lowercase): Triggers the modal to **Create a New Standard Checklist Clause** instantly.
*   `/` Key: Auto-focuses the **Search benchmarks** input, clearing secondary highlights.
*   `1` Key: Sets category filters to **"All Phases"**.
*   `2 - 6` Keys: Isolates dynamic checklist sections corresponding to custom compliance categories in numerical order.

*(These keystroke commands automatically bypass when typing on `input`, `textarea`, or `contenteditable` objects).*

### 3.3 State Schema & Types
Data contracts are declared in `/src/types.ts`. Key data structures:

```typescript
export interface TaskComment {
  id: string;
  text: string;
  createdAt: string;
  authorName: string;
  authorEmail?: string;
}

export interface ChecklistItemSubtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in-progress' | 'completed';
  dueDate?: string;
  completedAt?: string;
  subtasks?: ChecklistItemSubtask[];
  tags?: string[];
  comments?: TaskComment[];
}
```

---

## 4. 🟣 Admin / Internal Documentation

### 4.1 Deployment & Production Build

The application compiles into static files optimized for continuous integration (CI) or deployment to platforms like Cloud Run, Netlify, or AWS:

```bash
# Compile and optimize raw assets for high-speed edge distribution
npm run build
```

This generates compiled, production-ready static assets (HTML, bundle JS, minified CSS) in the `/dist` directory. Host this directory via standard Nginx, CDN caches, or internal systems.

### 4.2 Local Storage Configuration Keys
ProdReady utilizes specific localized configuration namespaces inside the browser database to maintain isolation:

| Key | Default / Fallback | Purpose |
|---|---|---|
| `vibe_to_prod_multi_projects` | Standard 25+ default elements | Restores active Multi-Project settings and categories |
| `vibe_to_prod_active_project_id` | Falls back to first project ID | Persists the active/focused project selection across reloads |
| `vibe_to_prod_apple_theme` | `'theme-system'` or `'dark'` | Default user layout theme selection |
| `vibe_to_prod_apple_color_scheme` | `'sapphire'` | User accent palette configurations |

---

## 5. Security & Compliance
*   **Zero Remote Storage Friction**: No private client data, proprietary software architecture text, or vulnerability descriptions are ever written to remote servers. All evaluations happen entirely on-device inside your sandboxed browser.
*   **Base64 Portability**: URL compression parameters are parsed entirely client-side using native Base64 protocols.
*   **Open-Source Security posture**: Built with robust type-safety mechanisms (`typescript`) to eliminate runtime exception patterns.

---

## 6. Support & Feedback
*   **Documentation Owner**: Infrastructure Compliance Group
*   **Incident Escalation Plan**: If audit configurations fail standard checks, use the **Team Velocity Dispatch Report** feature to directly escalate blockers to your engineering lead.

---

## 7. Glossary

| Term | Definition |
|---|---|
| **STG** | Staging environment. A non-production environment used to run end-to-end tests and security scans. |
| **Backlog (Todo)** | Target metrics or security constraints that have been benchmarked but are awaiting operational verification. |
| **Active Validation** | Checklist tasks undergoing testing, static analysis checks, or manual review sessions. |
| **Signed Off** | Complete, validated, verified compliance certifications safe for immediate production exposure. |
