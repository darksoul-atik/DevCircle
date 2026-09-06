# AI Usage & Agentic Workflow Documentation

## Overview

This document outlines my agentic workflow and how I utilized AI tools to accelerate the development of the DevCircle application while maintaining full control over the architecture, implementation, code quality, and final execution.

The AI agents were primarily used as development assistants rather than as fully autonomous developers. I continuously reviewed, tested, corrected, and refined their output throughout the development process.

## 1. AI Tools Used

I used **Google Antigravity** as my primary autonomous coding agent directly within my IDE. It was mainly used for scaffolding, boilerplate generation, implementation, debugging assistance, and rapid iteration across both the React frontend and Express backend.

The AI models and tools I used during development included:

- **Gemini 3.1 Pro** through Google Antigravity — Used as the primary coding agent for implementing features, refactoring code, debugging, and handling repetitive development tasks.
- **Claude** — Used primarily to refine and improve prompts, helping me communicate requirements to the coding agent more clearly and precisely.
- **ChatGPT** — Used for exploring implementation ideas, finding inspiration, comparing possible approaches, understanding technical concepts, and brainstorming solutions when I encountered development challenges.

I did not rely on AI-generated code blindly. The generated implementation was continuously reviewed, tested, modified, and corrected based on the actual requirements of the application.

## 2. How I Instructed the Agent

Instead of asking the AI to "build the whole application," I managed the agent through a phased and iterative workflow. I broke the development process into smaller tasks and provided specific instructions for each feature.

- **Phase 1 (Scaffolding):** I instructed the agent to initialize the monorepo, set up `create-vite-app` for the frontend, and configure `Express` and `Prisma` for the backend.

- **Phase 2 (Data Modeling):** I provided the agent with the exact Prisma schema requirements from the assignment PDF and instructed it to generate the schema and run migrations against my PostgreSQL database.

- **Phase 3 (Core Logic):** I prompted the agent component-by-component instead of requesting entire features at once. For example, for the ranking system, I explicitly provided the formula:  
  *"Implement a ranking system in `posts.controller.ts` where score = (likes - dislikes) + (commentCount * 2), resolving ties with createdAt."*

- **Phase 4 (UI Development & Polish):** I instructed the agent to refine responsive Tailwind layouts while following the existing design structure. For example, I specifically instructed it not to break the container max-widths and to use appropriate responsive layouts such as `flex-col` on smaller viewports.

- **Phase 5 (Iterative Refinement):** After each major implementation, I reviewed the generated code, ran the application, checked the browser console and Antigravity terminal, and provided follow-up instructions to fix issues or improve the implementation.

## 3. What I Personally Reviewed, Rejected, or Rewrote

Although the AI agents significantly accelerated development, I remained actively involved in reviewing and making technical decisions throughout the project.

- **Rejected UI Designs:** The agent initially proposed using a modal for editing Community details. I rejected this approach and instructed it to remove the `EditCommunityModal.tsx` component and instead implement an inline-editing experience directly inside the header of `CommunityDetail.tsx`.

- **Reviewed Authentication Flow:** I manually reviewed the JWT authentication logic, specifically ensuring that the `refreshToken` was stored using an `httpOnly` cookie and was not exposed in the JSON response payload.

- **Rewrote Styling:** The agent initially applied arbitrary `dark:` utility classes for dark mode. I stopped this approach and rewrote the global `index.css` to use CSS variables, resulting in a cleaner and more maintainable theme system.

- **Manually Verified AI-Generated Code:** I did not rely solely on whether the application appeared to work in the browser. In several cases, the application appeared to function correctly locally, but errors or warnings were still present in the Antigravity terminal or browser console. I manually checked both environments, identified these issues, and corrected them instead of assuming that working UI behavior meant the implementation was error-free.

- **Verified Feature Completeness:** I also manually checked whether the agent had actually completed the requested functionality. When an agent stopped after implementing only part of a feature, I identified the missing portions and instructed it to complete and verify the remaining work.

## 4. Bugs and Bad Suggestions Caught

During development, I encountered several situations where the AI-generated implementation required correction or additional refinement.



1. **Test Framework Incompatibility:**
   - **The Bug:** The agent initially attempted to configure `ts-jest` for unit testing, but the setup failed because the project's TypeScript version was incompatible with the selected `ts-jest` configuration.
   - **The Fix:** Instead of modifying the TypeScript configuration to work around the issue, I instructed the agent to remove `ts-jest` and switch to `@swc/jest`, which provided a faster and more compatible approach for the project's testing setup.

2. **Unrealistic or Non-User-Friendly Tailwind Classes:**
   - **The Issue:** The AI agents sometimes generated Tailwind CSS classes that were technically valid but resulted in unrealistic, visually inconsistent, or non-user-friendly layouts. In other cases, the agent forgot to add necessary responsive, spacing, sizing, or positioning classes.
   - **The Fix:** I manually reviewed the UI and corrected these classes where necessary. I adjusted spacing, sizing, alignment, responsiveness, and other styling details to ensure that the final interface was practical and user-friendly rather than simply accepting the generated implementation.

3. **Incomplete Implementation Due to Forgotten Instructions:**
   - **The Issue:** In some cases, the AI agent would forget previously provided instructions or proceed after implementing only part of a requested feature. This sometimes resulted in unfinished functionality even though the agent considered the task complete.
   - **The Fix:** I continuously verified the implementation against the original requirements and re-checked each feature after the agent reported completion. When I found missing or incomplete functionality, I provided additional instructions and required the agent to finish and verify the implementation.

4. **Errors Not Immediately Visible in the UI:**
   - **The Issue:** Some implementations appeared to work correctly when tested through the browser UI, even though errors or warnings were present in the Antigravity terminal or browser console.
   - **The Fix:** I regularly inspected both the application UI and the underlying terminal/console output. This allowed me to catch issues that were not immediately visible from the user interface and fix them before considering the feature complete.

## 5. Human Oversight & Final Validation

AI agents were used to accelerate development, but the final implementation was not accepted solely based on AI output.

My workflow consistently followed this cycle:

**Plan → Prompt → Generate → Review → Run → Inspect → Debug → Refine → Re-test**

I personally reviewed the generated code, checked the application in the browser, monitored the Antigravity terminal and browser console for errors, verified feature completeness, and made architectural or implementation decisions whenever the AI's approach did not align with the application's requirements.

This approach allowed me to benefit from the speed and productivity of agentic AI while maintaining human oversight over the application's architecture, usability, correctness, and final quality.
