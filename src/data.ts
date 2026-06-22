import { ChecklistItem, CategoryInfo } from './types';

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'security',
    name: 'Security & Access',
    description: 'Safeguard identity, prevent injections, and enforce restrictive data compliance.',
    icon: 'Shield',
    color: 'border-emerald-500 text-emerald-400 bg-emerald-500/10',
    lightColor: 'bg-emerald-500/10 hover:bg-emerald-500/20',
    textColor: 'text-emerald-400'
  },
  {
    id: 'infrastructure',
    name: 'Infrastructure & Operations',
    description: 'Networks, deployment automation, scale, and disaster recovery strategies.',
    icon: 'Server',
    color: 'border-blue-500 text-blue-400 bg-blue-500/10',
    lightColor: 'bg-blue-500/10 hover:bg-blue-500/20',
    textColor: 'text-blue-400'
  },
  {
    id: 'code-logic',
    name: 'Code-Level Resilience',
    description: 'Fault-tolerant coding patterns, retry fallbacks, and state sanity checks.',
    icon: 'Code2',
    color: 'border-purple-500 text-purple-400 bg-purple-500/10',
    lightColor: 'bg-purple-500/10 hover:bg-purple-500/20',
    textColor: 'text-purple-400'
  },
  {
    id: 'testing-ci',
    name: 'Testing & Continuous Integration',
    description: 'Verification pipelines from localized tests to automated integration and stress tests.',
    icon: 'CheckSquare',
    color: 'border-orange-500 text-orange-400 bg-orange-500/10',
    lightColor: 'bg-orange-500/10 hover:bg-orange-500/20',
    textColor: 'text-orange-400'
  },
  {
    id: 'data-integrity',
    name: 'Data Integrity & Lifecycle',
    description: 'Durable data isolation, precise retention timelines, and race condition prevention.',
    icon: 'Database',
    color: 'border-pink-500 text-pink-400 bg-pink-500/10',
    lightColor: 'bg-pink-500/10 hover:bg-pink-500/20',
    textColor: 'text-pink-400'
  },
  {
    id: 'documentation',
    name: 'Architecture & Docs',
    description: 'System architectural blueprint mapping, API specifications, and standard playbooks.',
    icon: 'FileText',
    color: 'border-amber-500 text-amber-400 bg-amber-500/10',
    lightColor: 'bg-amber-500/10 hover:bg-amber-500/20',
    textColor: 'text-amber-400'
  }
];

// Helper functions to generate dynamic relative dates so that demo completion events
// and due dates always align with the current date, sustaining a live velocity graph.
const getRelativeDateISO = (offsetDays: number, hour: number = 12, min: number = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
};

const getRelativeDateYMD = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
};

export const INITIAL_ITEMS: ChecklistItem[] = [
  // --- SECURITY REGION ---
  {
    id: 'sec-input-sanitization',
    title: 'Input Sensitization & Injection Prevention',
    description: 'Ensure absolute protection against XSS, SQLi, and commands execution. Validate and sanitize every request schema (using Zod, Joi, etc.) and sanitize HTML/raw-text parameters before any DB entry or display.',
    category: 'security',
    priority: 'high',
    status: 'todo',
    dueDate: getRelativeDateYMD(-3),
    subtasks: [
      { id: 'sub-1', title: 'Validate query params with Zod schema', completed: true },
      { id: 'sub-2', title: 'Sanitize HTML text in user bio inputs', completed: false },
      { id: 'sub-3', title: 'Verify parameter encapsulation in DB queries', completed: false }
    ]
  },
  {
    id: 'sec-authentication',
    title: 'Authentication & MFA',
    description: 'Secure credentials at rest with strong hashing (e.g. bcrypt/argon2). Integrate dynamic OAuth flows, social sign-ins, and support for multi-factor authentication (MFA) on sensitive operations.',
    category: 'security',
    priority: 'high',
    status: 'completed',
    completedAt: getRelativeDateISO(4, 14, 30),
    dueDate: getRelativeDateYMD(4)
  },
  {
    id: 'sec-authorization',
    title: 'Authorization, Roles, and Permissions',
    description: 'Establish attribute-based or role-based access control (RBAC/ABAC). Guard client-server routes, database tables, and API execution contexts behind verified privilege schemas.',
    category: 'security',
    priority: 'high',
    status: 'completed',
    completedAt: getRelativeDateISO(3, 11, 20),
    dueDate: getRelativeDateYMD(3)
  },
  {
    id: 'sec-session-management',
    title: 'Session Management & Token Expiry',
    description: 'Enforce short-lived JWT (JSON Web Tokens) or secure session cookies. Implement sliding sessions, automatic refresh token rotation protocols, and comprehensive server-side token revocation.',
    category: 'security',
    priority: 'medium',
    status: 'todo',
    dueDate: getRelativeDateYMD(2)
  },
  {
    id: 'sec-secrets-mgmt',
    title: 'Secrets Management & Environment Auditing',
    description: 'Strictly avoid hardcoded passwords, tokens, or API credentials. Store all private metadata inside secure keyvaults or environment variables, and verify they are kept hidden from browser client runtimes.',
    category: 'security',
    priority: 'high',
    status: 'completed',
    completedAt: getRelativeDateISO(7, 9, 0),
    dueDate: getRelativeDateYMD(7)
  },
  {
    id: 'sec-dep-scanning',
    title: 'Dependency Scanning & Vulnerability Patching',
    description: 'Configure automated auditing pipelines (e.g., Snyk, npm audit, GitHub Dependabot) to continuously analyze imported node modules. Schedule automated vulnerability alerts and dependency upgrades.',
    category: 'security',
    priority: 'medium',
    status: 'todo'
  },
  {
    id: 'sec-pii-handling',
    title: 'PII Handling & Masking',
    description: 'Enforce strict field-level column encryption for Personally Identifiable Information (PII) like names, emails, and phone numbers. Mask user metadata in logger payloads.',
    category: 'security',
    priority: 'high',
    status: 'todo'
  },
  {
    id: 'sec-regulatory',
    title: 'Regulatory Compliance Standards',
    description: 'Audit database systems, operations, and cookies to comply with global data regulations (e.g., GDPR, CCPA, HIPAA, or SOC2). Setup required data access banners and clear user concent portals.',
    category: 'security',
    priority: 'medium',
    status: 'todo'
  },
  {
    id: 'sec-audit-trails',
    title: 'Audit Trails & Tamper-Evident History Logs',
    description: 'Create an immutable structured logging system targeting crucial read, write, and authorization actions. Establish secure write-once archives to capture full user and admin audit trails.',
    category: 'security',
    priority: 'medium',
    status: 'todo'
  },

  // --- INFRASTRUCTURE REGION ---
  {
    id: 'infra-https',
    title: 'HTTPS, TLS Encryption & Certificate Rotation',
    description: 'Force TLS 1.3 for all web services. Automate secure SSL/TLS certificate issuing and silent renewal. Set up Content Security Policies (HSTS) with standard automatic cert/keys rotation.',
    category: 'infrastructure',
    priority: 'high',
    status: 'completed',
    completedAt: getRelativeDateISO(10, 16, 45),
    dueDate: getRelativeDateYMD(10)
  },
  {
    id: 'infra-rate-limiting',
    title: 'Rate Limiting & Abuse Prevention',
    description: 'Defend public API routes from brute-force incursions. Setup redis/in-memory token bucket rate limiters, configure standard Captchas on standard signup lines, and mitigate scale DDOS.',
    category: 'infrastructure',
    priority: 'high',
    status: 'todo',
    dueDate: getRelativeDateYMD(-1)
  },
  {
    id: 'infra-multitenancy',
    title: 'Multi-Tenancy & Data Isolation',
    description: 'If handling multiple corporate/user workspaces, assure logical or physical separation. Use database tenant schemas, tenant-keyed row-level security (RLS), and partitioned caches.',
    category: 'infrastructure',
    priority: 'medium',
    status: 'todo'
  },
  {
    id: 'infra-caching',
    title: 'Caching Strategy & Active Invalidation',
    description: 'Store high-load content in Redis/CDN caches. Define precise TTL (Time To Live) periods, and design reliable webhook/event-driven dynamic storage cache eviction policies to avoid stale data.',
    category: 'infrastructure',
    priority: 'medium',
    status: 'todo'
  },
  {
    id: 'infra-rto-rpo',
    title: 'RTO & RPO Operational SLAs',
    description: 'Define clear service metrics for Recovery Time Objective (allowable outage duration) and Recovery Point Objective (allowable data loss offset during disaster events) with target KPIs.',
    category: 'infrastructure',
    priority: 'low',
    status: 'todo'
  },
  {
    id: 'infra-disaster-recovery',
    title: 'Disaster Recovery Plan',
    description: 'Design step-by-step restoration scripts for server failure, region outages, or db corruption. Establish encrypted multi-region database replication and verify nightly automated backups operate properly.',
    category: 'infrastructure',
    priority: 'high',
    status: 'todo'
  },

  // --- CODE & LOGIC RESILIENCE REGION ---
  {
    id: 'code-error-handling',
    title: 'Comprehensive Error Handling',
    description: 'Build safe global try-catch frameworks on custom API routes. Deliver neat, localized UX error notifications to users instead of printing cryptic developer stack traces or raw server errors in the browser console.',
    category: 'code-logic',
    priority: 'high',
    status: 'todo'
  },
  {
    id: 'code-graceful-degradation',
    title: 'Graceful Degradation Protocols',
    description: 'Assure fallback paths for third-party services. If non-critical services (like analytics tools, profile counters, or recommender maps) fail, preserve the system core features intact for the customer.',
    category: 'code-logic',
    priority: 'medium',
    status: 'todo'
  },
  {
    id: 'code-retry-backoff',
    title: 'Retry Loops with Back-off & Idempotency',
    description: 'Also known in production as "HR logic with back-off and item potency". Guard external API requests with exponential back-off and randomized jitter to prevent overloading services. Enforce unique idempotency keys on write endpoints.',
    category: 'code-logic',
    priority: 'medium',
    status: 'todo'
  },
  {
    id: 'code-circuit-breakers',
    title: 'Circuit Breakers & Custom API Fallbacks',
    description: 'Track network failures to third-party integrations automatically. If an external service times out repeatedly, trip the circuit breaker immediately to serve local static fallback results.',
    category: 'code-logic',
    priority: 'medium',
    status: 'todo'
  },
  {
    id: 'code-concurrency',
    title: 'Concurrency Handling & Race Prevention',
    description: 'Prevent concurrent write corruption in high-volume environments. Use optimistic locking, transaction isolation blocks, or localized atomic queues to handle overlapping data transformations safely.',
    category: 'code-logic',
    priority: 'high',
    status: 'todo'
  },
  {
    id: 'code-reviews',
    title: 'Code Review Guidelines & Standards',
    description: 'Enforce pull-request standards with automated linting rules and peer manual inspections. Check for complex loops, nested queries, security gaps, and general performance before deployments occur.',
    category: 'code-logic',
    priority: 'low',
    status: 'todo'
  },

  // --- TESTING & CI REGION ---
  {
    id: 'test-unit',
    title: 'Unit Testing System',
    description: 'Write isolated tests using modern execution suites (e.g., Vitest, Jest) for crucial mathematical operations, utility transformations, raw input format validations, and status mappings.',
    category: 'testing-ci',
    priority: 'high',
    status: 'todo'
  },
  {
    id: 'test-integration',
    title: 'Integration Testing Pipeline',
    description: 'Confirm components, DB connections, and API endpoints communicate harmoniously. Implement mock-free database integration checks utilizing SQLite memory structures or localized local containers.',
    category: 'testing-ci',
    priority: 'medium',
    status: 'todo'
  },
  {
    id: 'test-e2e',
    title: 'End-to-End (E2E) Browser Testing',
    description: 'Simulate realistic user interface journeys (clicks, form completions, drag layouts, and page redirects) on various screen ratios using testing frameworks like Playwright or Cypress.',
    category: 'testing-ci',
    priority: 'medium',
    status: 'todo'
  },
  {
    id: 'test-regression',
    title: 'Regression Testing Workflows',
    description: 'Enforce pre-commit or pre-merge automation loops verifying that newly committed features do not break existing production routes, visual elements, or user dashboards.',
    category: 'testing-ci',
    priority: 'medium',
    status: 'todo'
  },
  {
    id: 'test-load-stress',
    title: 'Load & Stress Testing Benchmarks',
    description: 'Stress-test standard backend routes with high mock volumes. Determine performance limits, max latency curves, memory exhaustion nodes, and peak concurrency thresholds.',
    category: 'testing-ci',
    priority: 'low',
    status: 'todo'
  },
  {
    id: 'test-chaos',
    title: 'Chaos Engineering & Mock Failure Injectors',
    description: 'Verify system resilience under fire. Deliberately drop database connectivity, introduce mock request latency, terminate server nodes randomly, and confirm auto-recovery workflows operate smoothly.',
    category: 'testing-ci',
    priority: 'low',
    status: 'todo'
  },
  {
    id: 'test-metrics-thresholds',
    title: 'Test Coverage, Alerts, & CI Enforcement',
    description: 'Also called "disk coverage, thresholds, and force and CI". Enforce test coverage minimum safeguards (e.g., >= 80% coverage) on CI commits. Set up custom metrics on servers and disk limit alert bounds.',
    category: 'testing-ci',
    priority: 'medium',
    status: 'todo'
  },

  // --- DATA INTEGRITY REGION ---
  {
    id: 'data-retention',
    title: 'Data Retention & Dynamic Deletion Policies',
    description: 'Define clear timelines for database archival or purging. Automate deletion criteria for expired sessions, deactivated profiles, or debug system logs to maintain clean databases.',
    category: 'data-integrity',
    priority: 'medium',
    status: 'todo'
  },

  // --- DOCUMENTATION REGION ---
  {
    id: 'doc-accessibility',
    title: 'Accessibility Audits & Screen Reader Tuning',
    description: 'Enforce WCAG 2.1 compliance. Audit color contrast, keyboard-only system tab-traverses, complete aria attributes, responsive screen scaling, and layout resizing behavior.',
    category: 'documentation',
    priority: 'medium',
    status: 'todo'
  },
  {
    id: 'doc-adrs',
    title: 'Architectural Decision Records (ADRs)',
    description: 'Catalog essential system architectural turns, database choice reasons, or custom frameworks chosen. Document reasoning, tradeoffs, and consequences to save time for new hires.',
    category: 'documentation',
    priority: 'low',
    status: 'todo'
  },
  {
    id: 'doc-diagrams',
    title: 'System Architecture Diagrams',
    description: 'Design interactive, easily-updated vector architecture maps outlining network ingress, load balancers, caching nodes, database clusters, and cloud-worker patterns.',
    category: 'documentation',
    priority: 'low',
    status: 'todo'
  },
  {
    id: 'doc-api-contracts',
    title: 'Strict API Contracts & Swagger Specs',
    description: 'Document exact endpoints, request params, response objects, authentication needs, and failure states. Support static integrations using reliable OpenAPI schemas or tRPC types.',
    category: 'documentation',
    priority: 'medium',
    status: 'todo'
  }
];

export const DEFAULT_TEAM = [
  {
    id: 'team-1',
    name: 'Kidus Goshu',
    role: 'Security & Lead Architect',
    email: 'kidusgoshu2be@gmail.com',
    avatarColor: 'bg-emerald-500'
  },
  {
    id: 'team-2',
    name: 'Sarah Chen',
    role: 'DevOps & Site Reliability',
    email: 'sarah.chen@example.com',
    avatarColor: 'bg-blue-500'
  },
  {
    id: 'team-3',
    name: 'Marcus Vance',
    role: 'Full Stack Engineer',
    email: 'marcus.vance@example.com',
    avatarColor: 'bg-purple-500'
  }
];
