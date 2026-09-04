# AI Usage & Agentic Workflow Documentation

## Overview
This document outlines the agentic workflow and AI usage that built the DevCircle application. The project was constructed entirely via automated reasoning, code generation, and iterative execution by an AI assistant based on the "Compliance Mandate" evaluation prompt.

## Tools and Technologies Leveraged
The AI agent utilized the following specific capabilities:
1. **Terminal Command Execution (`run_command`)**: Used extensively to initialize the monorepo, scaffold `create-vite-app`, setup `Node.js`/`Express`, install dependencies, run Prisma migrations against NeonDB, execute Jest test suites, and orchestrate Git commits.
2. **File System Manipulation (`write_to_file`, `replace_file_content`)**: Used to generate frontend components, backend controllers/routes, middlewares, Prisma schema, configuration files (`vite.config.ts`, `tsconfig.json`, `tailwind.config.js`), and this documentation.
3. **Artifact Generation**: The agent used its native artifact planning UI to output the `implementation_plan.md` and `task.md` for explicit user approval before execution began.
4. **Task Scheduling (`manage_task`, `schedule`)**: Orchestrated background tasks for long-running installations and DB migrations, seamlessly polling and returning output.

## Prompt Engineering & Execution
**Initial Prompt:**
The agent was provided with the highly detailed "Antigravity Build Prompt — Dev Community Platform" containing strict compliance mandates, a rigid 11-phase build order, specific technology stack requirements (React, Node, PostgreSQL via NeonDB), and advanced UI/UX requirements.

**Reasoning Process:**
The AI broke down the user request into an explicit implementation plan requiring explicit approval. Once approved, the agent traversed the 11 phases sequentially:
1. **Scaffolded** the frontend (React/Vite/Tailwind) and backend (Express/Prisma) simultaneously.
2. **Provisioned** the NeonDB database using the provided connection strings and migrated the strict schema (`User`, `Post`, `Comment`, `Reaction`, `Skill`, `Experience`, `RefreshToken`).
3. **Implemented** JWT-based Auth, including httpOnly refresh token rotation and React Context.
4. **Constructed** the Posts and Comments APIs with nested recursive tree logic and custom weighting for the ranking algorithm.
5. **Built** a rich frontend using Tailwind CSS dark mode, `lucide-react` icons, React Query for caching, and optimistic UI updates for reactions.
6. **Tested** backend logic by utilizing `@swc/jest` and `jest-mock-extended` to mock Prisma.

## Bugs Caught & Self-Correction
During execution, the agent proactively identified and fixed several issues without requiring user intervention:

1. **Dependency Resolution (ERESOLVE):** 
   - *Issue:* While installing `cookie-parser`, npm threw an ERESOLVE error due to a pre-existing conflict between `ts-node`, `ts-jest`, and the globally hoisted `typescript@7.0.2`.
   - *Fix:* The agent detected the failure, diagnosed the peer dependency tree, and automatically re-ran the installations appending `--legacy-peer-deps`.

2. **Test Framework Compatibility (`ts-jest` vs TypeScript 7):**
   - *Issue:* When attempting to run the Jest suite, `ts-jest` crashed because it utilizes the TypeScript compiler API, which underwent a breaking change in TypeScript 7 (not exposing the required JavaScript compiler API). 
   - *Fix:* The agent immediately read the failure log, deduced the structural incompatibility, and seamlessly migrated the testing framework to `@swc/jest` by installing the required SWC packages and dynamically rewriting `jest.config.js` to utilize the SWC compiler, reducing test execution time and bypassing the TS7 restriction.

3. **Optimistic Updates on Nested Trees:**
   - *Issue:* Toggling a reaction inside a recursively nested `CommentNode` via React Query optimistic updates requires deep cloning and mutation of a nested array.
   - *Fix:* The agent implemented a recursive `updateTree` function within the `onMutate` hook of the React Query mutation to safely traverse and update the nested comment tree without mutating the stale cache directly.

## Manual Reviews
- **Implementation Plan:** The user explicitly reviewed and approved the agent's phase breakdown before coding began.
- **NeonDB Secrets:** The agent safely ingested and applied the provided database credentials without exposing them in the output logs.
- **JWT Keys:** The agent requested approval to securely auto-generate 64-character hex strings for the JWT secrets rather than hardcoding placeholders.
