# Data Flow Architecture

## Current System Architecture (After Migration)

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Login                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  AuthContext    │
                    │  Role Detection │
                    └─────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
    ┌───────────────────┐       ┌───────────────────┐
    │  Demo Work Role   │       │   Real Roles      │
    │  (demo-work)      │       │  (principal, hod, │
    │                   │       │   registrar, etc) │
    └───────────────────┘       └───────────────────┘
                │                           │
                ▼                           ▼
    ┌───────────────────┐       ┌───────────────────┐
    │  MOCK_RECIPIENTS  │       │ RecipientService  │
    │  (AuthContext)    │       │  (Supabase)       │
    └───────────────────┘       └───────────────────┘
                │                           │
                ▼                           ▼
    ┌───────────────────┐       ┌───────────────────┐
    │  Mock Data        │       │  Real-Time Data   │
    │  - Dr. John Doe   │       │  - Actual Users   │
    │  - Dr. Jane Smith │       │  - From Database  │
    │  - (5 users)      │       │  - Live Updates   │
    └───────────────────┘       └───────────────────┘
                │                           │
                ▼                           ▼
    ┌───────────────────┐       ┌───────────────────┐
    │ RecipientSelector │       │ RecipientSelector │
    │ dataSource: mock  │       │ dataSource: real  │
    └───────────────────┘       └───────────────────┘
                │                           │
                ▼                           ▼
    ┌───────────────────┐       ┌───────────────────┐
    │  Storage Scope    │       │  Storage Scope    │
    │  demo-work:*      │       │  real:*           │
    └───────────────────┘       └───────────────────┘
```

---

## Storage Isolation

```
┌─────────────────────────────────────────────────────────────────┐
│                      localStorage                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Demo Work Namespace (demo-work:)                               │
│  ├─ demo-work:pending-approvals                                 │
│  ├─ demo-work:submitted-documents                               │
│  ├─ demo-work:approval-history-new                              │
│  ├─ demo-work:channels                                          │
│  └─ demo-work:recipients                                        │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  Real Roles Namespace (real:)                                   │
│  ├─ real:pending-approvals                                      │
│  ├─ real:submitted-documents                                    │
│  ├─ real:approval-history-new                                   │
│  ├─ real:channels                                               │
│  └─ real:recipients                                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

✅ No cross-contamination
✅ Clear ownership
✅ Easy to debug
```

---

## RecipientSelector Decision Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    RecipientSelector.tsx                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Check userRole │
                    └─────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
    ┌───────────────────┐       ┌───────────────────┐
    │ Is Demo Work?     │       │ Is Real Role?     │
    │ (demo-work)       │       │ (principal, etc)  │
    └───────────────────┘       └───────────────────┘
                │                           │
                ▼                           ▼
    ┌───────────────────┐       ┌───────────────────┐
    │ Load Mock Data    │       │ Fetch from        │
    │ from AuthContext  │       │ Supabase          │
    └───────────────────┘       └───────────────────┘
                │                           │
                ▼                           ▼
    ┌───────────────────┐       ┌───────────────────┐
    │ Set dataSource:   │       │ Set dataSource:   │
    │ 'mock'            │       │ 'real' or 'empty' │
    └───────────────────┘       └───────────────────┘
                │                           │
                ▼                           ▼
    ┌───────────────────┐       ┌───────────────────┐
    │ Show Recipients   │       │ Show Recipients   │
    │ + Demo Badge      │       │ or Empty State    │
    └───────────────────┘       └───────────────────┘
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Real Role Data Fetch                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ recipientService│
                    │ .fetchRecipients│
                    └─────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
    ┌───────────────┐ ┌──────────┐ ┌──────────────┐
    │   Success     │ │  Empty   │ │    Error     │
    │ (data found)  │ │ (no data)│ │ (network)    │
    └───────────────┘ └──────────┘ └──────────────┘
                │             │             │
                ▼             ▼             ▼
    ┌───────────────┐ ┌──────────┐ ┌──────────────┐
    │ Show          │ │ Show     │ │ Show Error   │
    │ Recipients    │ │ Empty    │ │ Message +    │
    │               │ │ State    │ │ Retry Button │
    └───────────────┘ └──────────┘ └──────────────┘
                │             │             │
                ▼             ▼             ▼
    ┌───────────────┐ ┌──────────┐ ┌──────────────┐
    │ dataSource:   │ │dataSource│ │ dataSource:  │
    │ 'real'        │ │ 'empty'  │ │ 'empty'      │
    └───────────────┘ └──────────┘ └──────────────┘

❌ NO FALLBACK TO MOCK DATA
✅ Transparent error handling
✅ User always knows the state
```

---

## Component Usage Map

```
RecipientSelector Component
├─ Used in 3 locations:
│
├─ 1. DocumentUploader.tsx
│     Label: "Document Management Recipients"
│     Purpose: Regular document submissions
│     Behavior: Role-based data loading
│
├─ 2. EmergencyWorkflowInterface.tsx
│     Label: "Emergency Management Recipients"
│     Purpose: Emergency document submissions
│     Behavior: Role-based data loading
│
└─ 3. WorkflowConfiguration.tsx
      Label: "Approval Chain with Bypass Recipients"
      Purpose: Workflow configuration
      Behavior: Role-based data loading

All three locations now:
✅ Respect role-based data loading
✅ Use role-scoped storage
✅ Show appropriate states
```

---

## Migration Safety Checks

```
┌─────────────────────────────────────────────────────────────────┐
│                    Safety Mechanisms                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Role Detection                                              │
│     ✅ Normalized role comparison (lowercase, no spaces)        │
│     ✅ Explicit demo-work check                                 │
│                                                                  │
│  2. No Silent Fallback                                          │
│     ✅ Real roles NEVER get mock data                           │
│     ✅ Error state instead of fallback                          │
│                                                                  │
│  3. Storage Isolation                                           │
│     ✅ Automatic key prefixing                                  │
│     ✅ Role-switch cleanup                                      │
│                                                                  │
│  4. Data Source Tracking                                        │
│     ✅ dataSource state: 'mock' | 'real' | 'empty'             │
│     ✅ Visual indicator for demo mode                           │
│                                                                  │
│  5. Console Logging                                             │
│     ✅ Every data load logged                                   │
│     ✅ Easy debugging                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Supabase Integration (Phase 3)

```
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase Setup                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Create Project  │
                    │ on supabase.com │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Create users    │
                    │ table (SQL)     │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Add real users  │
                    │ to database     │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Configure .env  │
                    │ with credentials│
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Install         │
                    │ @supabase/      │
                    │ supabase-js     │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Update          │
                    │ RecipientService│
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ ✅ Real-time    │
                    │    data ready   │
                    └─────────────────┘
```

---

## State Transitions

```
Demo Work Role:
  Loading → Mock Data Loaded → Recipients Displayed
  
Real Role (Supabase Configured):
  Loading → Real Data Loaded → Recipients Displayed
  
Real Role (Supabase Not Configured):
  Loading → Empty State → "No recipients available"
  
Real Role (Network Error):
  Loading → Error State → "Failed to load" + Retry
```

---

This architecture ensures:
- ✅ Clear separation between demo and real data
- ✅ No accidental data mixing
- ✅ Transparent error handling
- ✅ Easy to debug and maintain
- ✅ Ready for production use
