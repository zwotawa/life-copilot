# Life Copilot

Life Copilot is a personal planning and execution app designed to act more like a **copilot** than a passive tracker. It helps users define goals, choose what matters this week, generate a realistic daily menu, and break goals down into milestones and tiny tasks that can be completed from day to day.

## Current stack

### Front end
- Angular
- Angular Material
- RxJS
- Observable-based repositories and store services
- Loadable + view-model patterns on key pages

### Back end
- C# Minimal API
- EF Core
- PostgreSQL
- JWT authentication

### Deployment
- Front end deployed on Vercel
- API deployed on Azure App Service
- PostgreSQL hosted in Azure

---

## Product direction

Life Copilot is built around a few core ideas:

- A goal should not just be stored; it should be **guided forward**.
- Weekly planning should help decide what matters now.
- Daily planning should turn structure into **real next actions**.
- Milestones and tiny tasks should make progress concrete.
- The app should feel interactive and helpful, not like a static form system.

The current UX principle is:

- **Goal form = what the goal is**
- **Milestone section = how the goal gets done**

---

## Current feature set

## Authentication
- User registration and login
- JWT-based auth
- Protected API endpoints
- Auth-aware front-end routing and session restore

## Goals
- Create, edit, view, and manage goals
- Goal metadata includes lane, type, due style, touch frequency, session size, and related planning/surfacing inputs
- Goals page supports filtering and loadable patterns

## Weekly Review
- Select weekly:
  - anchors
  - infrastructure goal
  - maintenance goals
  - creative goal
- Weekly candidate rows include:
  - surfacing score and reasons
  - roadmap status summary
  - planning-needed warnings when relevant
- Weekly roadmap warnings include actionable navigation to the milestone section of a goal

## Daily Rotation
- Generates a daily menu of goal-backed items
- Supports replacing items
- Supports generating additional daily options after completing the day
- Uses **local date keys** so the day resets at the user’s local midnight rather than UTC midnight
- Daily items are roadmap-aware:
  - prefer next unfinished tiny task from the active milestone
  - otherwise guide the user to define the next tiny action or next milestone
- Completing a tiny-task-backed daily item syncs back to the linked tiny task

## Inbox
- Capture ideas first, process later
- Convert inbox items into goals
- Status filtering and management

## Goal Detail / Execution Planning
- Goal form handles goal definition only
- Milestone section handles execution planning

### Milestones
- Load milestones for a goal
- Add milestones
- Set active milestone
- Complete milestones manually
- Delete milestones
- Inline edit milestones
- Reorder milestones
- Milestone progress summary shown in goal detail
- Milestone section supports direct navigation via `#milestones`

### Tiny Tasks
- Show tiny tasks under the active milestone
- Add tiny tasks
- Complete tiny tasks
- Delete tiny tasks
- Inline edit tiny tasks
- Reorder tiny tasks
- Tiny-task progress summary shown under the active milestone

## Dashboard
- Overview cards for key planning and execution state
- Roadmap Progress card shows:
  - goals with active milestones
  - completed milestones
  - completed tiny tasks
  - active roadmap snapshots
  - planning-needed cues
- Dashboard roadmap warnings include direct navigation to the milestone section of a goal

## Progress History
- Goal progress events are append-only
- Reversals create new events instead of deleting old ones
- Progress history is roadmap-aware, including milestone and tiny-task-related events
- Goal detail timeline updates in real time

## Surfacing and decision history
- Surfacing logic powers Weekly Review and Daily Rotation candidate ranking
- Surfacing decision events are persisted for later analysis and future tuning
- Weekly role influences daily selection through a soft role-to-category alignment layer

---

## Architecture patterns used in the front end

### Repository pattern
Abstract repositories are bound to API-backed implementations.

Examples include:
- GoalRepository
- WeeklyReviewRepository
- GoalProgressRepository
- SurfacingDecisionRepository
- GoalMilestoneRepository
- GoalTinyTaskRepository

### Store services
Store services wrap repositories and provide a stable place for app-facing data operations.

### Loadable pattern
Pages use loadable state objects for:
- loading
- success
- error

This makes the UI easier to reason about and keeps async behavior explicit.

### View-model pattern
Pages like Goal Detail, Dashboard, and Weekly Review derive a `vm$` observable from several smaller observables.

This keeps:
- template logic simpler
- loading/error handling centralized
- state easier to extend safely

### Shared roadmap data pattern
Where multiple derived roadmap views are needed, the app prefers:
- **one fetch path**
- **multiple derived observables**

For example:
- one shared roadmap data loadable
- derive dashboard insights
- derive per-goal roadmap status

This avoids duplicate requests and keeps logic easier to maintain.

---

## Current roadmap philosophy

The app now treats roadmap structure as the preferred source of execution truth.

### Current source of truth
- **Milestones** define the phases of a goal
- **Tiny tasks** define the current actionable steps within the active milestone
- **Daily Rotation** should pull from that structure whenever possible

### Important product decisions already made
- Do **not** auto-complete milestones just because all current tiny tasks are complete
- Instead, treat that as a review/planning cue:
  - add another tiny task
  - or mark the milestone complete
- Active milestones with zero tiny tasks are also treated as planning-needed
- Progress history is append-only and should preserve reversals as real history

---

## Repo structure

Adjust this section if your folders change, but the project currently follows a split similar to:

```text
apps/
  api/
    LifeCopilot.Api/
  web/
    ...Angular app...
```

Common front-end folders include:
- `src/app/core/models`
- `src/app/core/repositories`
- `src/app/core/services`
- `src/app/core/utils`
- feature page folders for Dashboard, Goals, Weekly Review, Daily Rotation, and Inbox

---

## Local development

## Front end
Run the Angular app with your normal local dev command.

## API
Run the C# API with your normal local dev command.

## Database
PostgreSQL is used locally and in Azure.
DBeaver has already been confirmed as a good way to inspect both local and Azure databases.

---

## Testing

The project includes integration tests for major backend endpoint groups, including:
- auth
- surfacing decisions
- milestones
- tiny tasks

The preferred approach is to add integration tests for endpoint behavior rather than isolated backend service-only tests.
