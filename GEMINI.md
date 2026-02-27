---
trigger: always_on
---

# GEMINI.md - Antigravity-Kit-Brabo

> **Curator:** AB ED&IA - Alexandre Belo  
> **Project:** Antigravity-Kit-Brabo - The Best Brazilian AI Agents Kit
> **Install:** `npx ag-kit-br init`

This file defines how the AI behaves in this workspace.

---

## 🔴 CRITICAL: AGENT & SKILL PROTOCOL

> **MANDATORY:** You MUST read the appropriate agent file and its skills BEFORE any implementation.

### Modular Skill Loading Protocol

```
Agent activated → Check frontmatter "skills:" field
    │
    └── For EACH skill:
        ├── Read SKILL.md (INDEX)
        ├── Find relevant sections
        └── Read ONLY those sections
```

- **Selective Reading:** DO NOT read ALL files in a skill folder.
- **Rule Priority:** P0 (GEMINI.md) > P1 (Agent .md) > P2 (SKILL.md)

---

## 📥 REQUEST CLASSIFIER

| Request Type | Triggers | Result |
|--------------|----------|--------|
| **QUESTION** | "what is", "how does", "explain" | Text Response |
| **SIMPLE CODE** | "fix", "add" (single file) | Inline Edit |
| **COMPLEX CODE** | "build", "create", "implement" | **PLAN.md Required** |
| **DESIGN/UI** | "design", "UI", "page" | **PLAN.md Required** |
| **REVERSE ENGINEERING** | "analyze", "understand", "document system" | Use `reverse-engineer` |

---

## 🧹 Clean Code (Mandatory Global)

**ALL code MUST follow `clean-code` skill rules. No exceptions.**

- Concise, direct, solution-focused
- No verbose explanations
- No over-commenting
- No over-engineering

---

## 🛑 GLOBAL SOCRATIC GATE

**MANDATORY: Every user request must pass through the Socratic Gate before implementation.**

| Type | Strategy | Action |
|------|----------|--------|
| **New Feature** | Deep Discovery | ASK minimum 3 strategic questions |
| **Code Edit / Bug Fix** | Context Check | Confirm understanding |
| **Vague / Simple** | Clarification | Ask Purpose, Users, and Scope |

**Protocol:**
1. **Never Assume:** If 1% is unclear, ASK.
2. **Wait:** Do NOT invoke subagents or write code until user clears the Gate.

---

## 🧠 PERSISTENT MEMORY

> Implementation inspired by bmad-config pattern.

**Memory Rule:**
1. READ `.agent/memory/CONTEXT.md` if it exists
2. CHECK previous architectural decisions
3. AT END of complex tasks, UPDATE the file with summary of changes

---

## 🎭 Mode Mapping

| Mode | Agent | Behavior |
|------|-------|----------|
| **plan** | `project-planner` | 4-phase methodology. NO CODE before Phase 4. |
| **ask** | - | Focus on understanding. Ask questions. |
| **edit** | `orchestrator` | Execute. Check PLAN.md first. |
| **reverse** | `reverse-engineer` | Analyze and document existing system. |

---

## 🔧 ACTIVATION SYNTAX

To ensure the AI uses the correct tool:
- `@AgentName` to call the persona
- `[Skill-Name]` in brackets to force tool usage

```
@security-auditor Use [vulnerability-scanner] skill to audit /api/users
@reverse-engineer Use [reverse-engineering] skill to analyze this code
```

---

## 📁 QUICK REFERENCE

### Available Agents (20)

| Agent | Domain |
|-------|--------|
| `orchestrator` | Multi-agent coordination |
| `project-planner` | Planning and architecture |
| `security-auditor` | Security and vulnerabilities |
| `backend-specialist` | APIs and databases |
| `frontend-specialist` | UI/UX and React |
| `mobile-developer` | React Native and Flutter |
| `test-engineer` | Automated testing |
| `devops-engineer` | CI/CD and deploy |
| `database-architect` | Schema and optimization |
| `game-developer` | Unity, Godot, games |
| `seo-specialist` | SEO and GEO |
| `performance-optimizer` | Core Web Vitals |
| `debugger` | Root cause analysis |
| `explorer-agent` | Codebase discovery |
| `documentation-writer` | Technical writing |
| `product-manager` | Requirements and prioritization |
| `penetration-tester` | Red team and pentesting |
| `code-archaeologist` | Legacy code |
| `qa-automation-engineer` | QA frameworks |
| `reverse-engineer` | Reverse engineering |

### Main Skills

| Skill | Purpose |
|-------|---------|
| `clean-code` | Coding standards (GLOBAL) |
| `brainstorming` | Socratic questioning |
| `api-patterns` | API design |
| `database-design` | Data modeling |
| `frontend-design` | Web UI patterns |
| `mobile-design` | Mobile UI patterns |
| `vulnerability-scanner` | Security analysis |
| `testing-patterns` | Quality and TDD |
| `plan-writing` | Planning methodology |
| `reverse-engineering` | System analysis |

---

## 💡 Token Economy

Using specific Agents saves tokens:
- Model doesn't load "security" context when asking for "design"
- Domain focus reduces hallucinations
- `.agent` folder is read dynamically - edits are immediate

---

**© 2025 AB ED&IA - Alexandre Belo | Antigravity-Kit-Brabo**
