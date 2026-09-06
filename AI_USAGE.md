# AI Usage & Agentic Workflow Documentation

## Overview
This document outlines my agentic workflow and how I utilized AI tools to accelerate the development of the DevCircle application while maintaining full control over the architecture, code quality, and final execution.

## 1. AI Tools Used
I used **Google Antigravity (Gemini)** as an autonomous coding agent directly within my IDE to handle scaffolding, boilerplate generation, and rapid iteration of both the React frontend and Express backend.

## 2. How I Instructed the Agent
Instead of asking the AI to "build a whole app," I managed the agent using a phased, iterative workflow:
- **Phase 1 (Scaffolding):** I instructed the agent to initialize the monorepo, set up `create-vite-app` for the frontend, and configure `Express` and `Prisma` for the backend.
- **Phase 2 (Data Modeling):** I provided the agent with the exact Prisma schema requirements from the assignment PDF and instructed it to generate the schema and run migrations against my PostgreSQL database.
- **Phase 3 (Core Logic):** I prompted the agent component-by-component. For example, for the ranking system, I explicitly provided the formula: *"Implement a ranking system in `posts.controller.ts` where score = (likes - dislikes) + (commentCount * 2), resolving ties with createdAt."*
- **Phase 4 (UI Polish):** I requested the agent to refine the responsive Tailwind layouts, specifically instructing it not to break my container max-widths, but rather just stack elements using `flex-col` on mobile viewports.

## 3. What I Personally Reviewed, Rejected, or Rewrote
While the AI was excellent at generating boilerplate, I actively intervened in several areas:
- **Rejected UI Designs:** The agent initially proposed using a modal for editing the Community details. I rejected this and instructed it to rip out the modal component (`EditCommunityModal.tsx`) and instead build an inline-editing experience directly inside the header of `CommunityDetail.tsx`.
- **Reviewed Auth Flow:** I manually reviewed the JWT authentication logic, specifically ensuring that the `refreshToken` was being set as an `httpOnly` cookie and not exposed in the JSON response payload.
- **Rewrote Styling:** The agent initially applied arbitrary `dark:` utility classes for dark mode. I stopped it and rewrote the global `index.css` to use CSS variables for a much cleaner, maintainable theme system.

## 4. Bugs and Bad Suggestions Caught
1. **Recursive Prisma Typing Error:**
   - **The Bug:** When the agent implemented the nested comment replies, it attempted to fetch deep relations using Prisma's `include`, but failed to properly type the recursive structure in TypeScript (`CommentNode`), leading to strict mode compilation errors in the frontend.
   - **The Fix:** I caught the compiler error and instructed the agent to define a recursive `Comment` interface with `replies: Comment[]` so that the React components could safely recurse through the tree.

2. **Test Framework Incompatibility:**
   - **The Bug:** The agent tried to set up `ts-jest` for the unit tests, but it crashed because our project uses a newer version of TypeScript that `ts-jest` was incompatible with.
   - **The Fix:** Instead of trying to hack the `tsconfig`, I instructed the agent to drop `ts-jest` entirely and switch to `@swc/jest` which is much faster and bypasses the compiler API issue completely.

3. **In-Memory Sorting Limitation:**
   - **The Bug:** The agent suggested writing a complex raw SQL query to handle the ranking formula at the database level.
   - **The Fix:** Knowing this was a small-scale assignment, I rejected the raw SQL (which breaks Prisma's type safety) and instructed the agent to perform the ranking computation in memory on the Node.js server. I documented this decision in the `README.md` as a known scaling limitation.
