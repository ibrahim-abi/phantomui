# Project Proposal: AI-Powered UI Testing SDK with MCP Server

**Author:** Muhammad Ibrahim
**Role:** Full Stack / AI Engineer
**Date:** March 19, 2026
**Version:** 1.0

---

## Table of Contents

1. [Overview](#1-overview)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Objectives](#3-goals--objectives)
4. [Scope](#4-scope)
5. [Tech Stack](#5-tech-stack)
6. [Architecture](#6-architecture)
7. [SDK API Contract](#7-sdk-api-contract)
8. [MCP Tool Definitions](#8-mcp-tool-definitions)
9. [Features](#9-features)
10. [Timeline & Milestones](#10-timeline--milestones)
11. [Team](#11-team)
12. [Risks & Mitigations](#12-risks--mitigations)
13. [Success Metrics](#13-success-metrics)
14. [Distribution & Monetization](#14-distribution--monetization)
15. [Open Questions & Decisions](#15-open-questions--decisions)

---

## 1. Overview

This project builds an **AI-powered UI Testing SDK backed by a real MCP (Model Context Protocol) server**, enabling fully automated testing of web applications — without DOM crawling, fragile selectors, or manual scripting.

A **lightweight JavaScript SDK** is embedded in the frontend. It instruments UI elements with structured semantic metadata (`data-ai-*` attributes), producing a clean, machine-readable snapshot of the interface. This snapshot is served through an **MCP-compliant server** that exposes it as tools consumable by AI agents (Claude). Claude then analyzes the UI, generates test scenarios, and triggers a **Playwright automation runner** to execute them.

The result is a **plug-and-play testing layer** any developer can drop into their project to get intelligent, adaptive UI testing with minimal configuration.

> **MCP Compliance Note:** This server implements Anthropic's [Model Context Protocol](https://modelcontextprotocol.io) specification — it is not a custom-style API. This ensures compatibility with any MCP-capable AI client, not just Claude.

---

## 2. Problem Statement

Modern UI testing tools are fundamentally reactive — they rely on brittle, developer-maintained scripts that break whenever the UI changes.

| Pain Point | Impact |
|---|---|
| Fragile CSS/XPath selectors | Tests break on every UI refactor |
| Manual scripting overhead | Slow test coverage, high maintenance cost |
| DOM crawling | Slow, noisy, and context-unaware |
| No intelligent generation | Edge cases and flows are missed |
| Poor dynamic UI support | SPAs and reactive UIs cause flakiness |

**No existing tool combines:**
- Semantic UI understanding (not raw HTML parsing)
- AI-driven test scenario generation
- Self-healing test execution
- A standard AI protocol (MCP) as the interface layer

---

## 3. Goals & Objectives

- Build a **zero-dependency frontend SDK** that makes any UI self-describing via `data-ai-*` attributes
- Implement a **spec-compliant MCP server** that exposes UI snapshots and test controls as AI tools
- Integrate **Claude** as the AI reasoning layer for test generation and result analysis
- Deliver an **automated test execution engine** via Playwright, including session/auth handling
- Package and publish the SDK to **NPM** for easy adoption
- Expose a **cloud API** for teams that cannot self-host
- Support **React, Vue, Angular, and plain JavaScript** from day one

---

## 4. Scope

### In Scope

- Frontend SDK with `data-ai-*` instrumentation (manual tagging + auto-tagging fallback)
- MCP-compliant backend server (Node.js)
- Structured UI snapshot schema with Zod validation
- AI-based test case generation (functional, edge cases, negative cases)
- Playwright-based test runner with session/auth support
- Test result feedback loop — results sent back to Claude for analysis and retry decisions
- Test reports in JSON, HTML, and JUnit XML formats (for CI/CD compatibility)
- Cloud API with multi-tenancy-ready design
- NPM package for SDK distribution

### Out of Scope (v1)

- Full visual regression / pixel-diff testing
- Native mobile app testing (iOS / Android)
- Advanced anti-bot bypass
- Deep backend / API penetration testing
- SaaS dashboard UI (API-only in v1)

---

## 5. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend SDK | JavaScript (Vanilla, zero deps) | UI instrumentation |
| Schema Validation | Zod | Validate SDK metadata snapshots |
| Backend Server | Node.js + Express | MCP server + REST API |
| MCP Protocol | `@modelcontextprotocol/sdk` | Standard AI tool interface |
| AI Engine | Claude API (`claude-sonnet-4-6`) | Test generation + result analysis |
| Automation | Playwright | Test execution |
| Report Formats | JSON / HTML / JUnit XML | CI/CD & human-readable output |
| Packaging | NPM | SDK distribution |
| Cloud Hosting | AWS / Vercel / Docker | Deployment |

---

## 6. Architecture

### High-Level Flow

```
┌─────────────────────────────────────┐
│  Frontend App (any framework)       │
│  <button data-ai-id="submit-order"  │
│          data-ai-role="action"      │
│          data-ai-action="submit" /> │
└────────────────┬────────────────────┘
                 │ SDK snapshot (JSON)
                 ▼
┌─────────────────────────────────────┐
│  MCP Server (Node.js)               │
│  Tools: get_ui_snapshot,            │
│         run_test, get_results       │
└────────────────┬────────────────────┘
                 │ MCP tool calls
                 ▼
┌─────────────────────────────────────┐
│  Claude (AI Engine)                 │
│  - Analyzes UI snapshot             │
│  - Generates test scenarios         │
│  - Decides on retry / escalation    │
└────────────────┬────────────────────┘
                 │ test instructions
                 ▼
┌─────────────────────────────────────┐
│  Playwright Runner                  │
│  - Executes tests                   │
│  - Handles auth / session           │
└────────────────┬────────────────────┘
                 │ results
                 ▼
┌─────────────────────────────────────┐
│  Results → Claude (feedback loop)   │
│  → Report (JSON / HTML / JUnit XML) │
└─────────────────────────────────────┘
```

### Key Design Principles

- **No crawling** — UI is self-describing via SDK attributes
- **AI operates on structured data**, not raw HTML
- **Feedback loop** — test results are returned to Claude for intelligent retry and failure analysis
- **Auth-aware** — Playwright session handles login flows before test execution
- **Multi-tenant ready** — cloud API designed for tenant isolation from the start

---

## 7. SDK API Contract

The SDK instruments elements using `data-ai-*` attributes. These form the core contract between the frontend and the MCP server.

### Attribute Reference

| Attribute | Required | Description | Example |
|---|---|---|---|
| `data-ai-id` | Yes | Unique stable identifier for the element | `"submit-order"` |
| `data-ai-role` | Yes | Semantic role: `input`, `action`, `display`, `nav` | `"action"` |
| `data-ai-action` | No | The action this element performs | `"submit"`, `"navigate"`, `"toggle"` |
| `data-ai-label` | No | Human-readable label (falls back to visible text) | `"Place Order"` |
| `data-ai-context` | No | Parent context / page section | `"checkout-form"` |
| `data-ai-required` | No | Whether the element is required in a form | `"true"` |
| `data-ai-state` | No | Current state of the element | `"disabled"`, `"loading"` |

### Example Snapshot Output (JSON)

```json
{
  "url": "https://app.example.com/checkout",
  "timestamp": "2026-03-19T10:00:00Z",
  "elements": [
    {
      "id": "email-input",
      "role": "input",
      "label": "Email Address",
      "context": "login-form",
      "required": true,
      "state": "empty",
      "selector": "[data-ai-id='email-input']"
    },
    {
      "id": "submit-order",
      "role": "action",
      "action": "submit",
      "label": "Place Order",
      "context": "checkout-form",
      "state": "active",
      "selector": "[data-ai-id='submit-order']"
    }
  ]
}
```

### Auto-Tagging Fallback

For untagged elements, the SDK applies heuristic auto-tagging as a fallback:
- `<input>`, `<textarea>`, `<select>` → role: `input`
- `<button>`, `[type="submit"]` → role: `action`
- `<a>` → role: `nav`
- `<h1>`–`<h6>`, `<p>` → role: `display`

> Auto-tagged elements are flagged in the snapshot as `"source": "auto"` so Claude can treat them with lower confidence.

---

## 8. MCP Tool Definitions

The MCP server exposes the following tools to Claude:

| Tool | Description | Key Parameters |
|---|---|---|
| `get_ui_snapshot` | Returns the current structured UI snapshot from the SDK | `url`, `auth_token?` |
| `run_test` | Executes a specific test scenario via Playwright | `scenario`, `session?` |
| `get_results` | Returns results of the last or a specific test run | `run_id` |
| `list_elements` | Lists all instrumented elements on a page | `url`, `filter_role?` |
| `retry_failed` | Re-runs failed tests with optional modified parameters | `run_id`, `overrides?` |

---

## 9. Features

### Core Features (v1)

- SDK with manual `data-ai-*` instrumentation + auto-tagging fallback
- Zod-validated structured UI snapshot schema
- MCP-compliant server with 5 tool definitions
- Claude-powered test case generation (functional, edge case, negative)
- Playwright runner with auth/session support
- Result feedback loop to Claude for analysis and retry decisions
- Reports in JSON, HTML, and JUnit XML
- Multi-framework SDK support (React, Vue, Angular, Vanilla JS)
- NPM package

### Nice-to-Have (v2+)

- Visual regression via screenshot diffing
- AI-generated bug reports with reproduction steps
- Dashboard for test history and analytics
- GitHub Actions / CI integration templates
- Plugin system for custom test rules
- SaaS platform with multi-tenant dashboard

---

## 10. Timeline & Milestones

| Phase | Description | Deliverables | Target |
|---|---|---|---|
| Phase 1 | Vanilla JS SDK | `data-ai-*` attributes, snapshot serializer, auto-tagging fallback | Week 1 |
| Phase 2 | Framework adapters + MCP server | React/Vue/Angular wrappers, MCP server with 5 tools, Zod schema | Week 2 |
| Phase 3 | AI integration | Claude test generation, prompt design, scenario output format | Week 3 |
| Phase 4 | Playwright runner | Test execution, auth/session handling, feedback loop to Claude | Week 4 |
| Phase 5 | Reports + Cloud API | JSON/HTML/JUnit reports, multi-tenant cloud API, NPM publish | Week 5 |
| Phase 6 | Testing + Docs | End-to-end tests, SDK docs, API reference, README | Week 6 |

---

## 11. Team

| Name | Role | Responsibilities |
|---|---|---|
| Muhammad Ibrahim | Full Stack / AI Engineer | Architecture, SDK, MCP server, AI integration, Playwright runner |

---

## 12. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Incorrect or missing UI tagging by developers | High | Medium | Provide SDK validation helpers + auto-tagging fallback + clear docs |
| AI misinterpretation of UI snapshot | Medium | Low | Use strict Zod-validated schema; include element context and state |
| Dynamic/reactive UI changes during test run | Medium | High | Re-fetch snapshot before each test step; use stable `data-ai-id` selectors |
| Auth complexity blocking test execution | High | Medium | Playwright session management; support cookie/token injection |
| Security exposure of SDK test hooks in production | High | Low | SDK auto-disables in `NODE_ENV=production`; strip attributes at build time |
| Claude API rate limits under heavy load | Medium | Medium | Request batching, retry logic with exponential backoff |

---

## 13. Success Metrics

| Metric | Target (v1) |
|---|---|
| SDK integration time for a new project | < 30 minutes |
| AI test case accuracy (valid, executable tests) | > 80% |
| Test execution success rate | > 90% on instrumented UIs |
| Reduction in manual scripting time | > 60% vs. baseline |
| NPM weekly downloads (3 months post-launch) | 500+ |
| Frameworks supported | 4 (React, Vue, Angular, Vanilla JS) |

---

## 14. Distribution & Monetization

### v1 — Open Source
- SDK published to NPM under MIT license
- MCP server self-hostable (Docker image provided)
- Drives adoption and community feedback

### v2+ — Cloud / SaaS Option
- Hosted MCP server with managed Claude API access
- Per-seat or usage-based pricing
- Multi-tenant dashboard, team management, test history
- Priority support tier

> **Design Implication:** The cloud API must be built with tenant isolation in mind from day one, even if the SaaS layer ships later. Retrofitting multi-tenancy is significantly more costly.

---

## 15. Open Questions & Decisions

| Question | Status | Decision / Notes |
|---|---|---|
| Auto-tagging vs. manual-only? | **Decided** | Both: manual as primary contract, auto-tagging as fallback (flagged in snapshot) |
| How much AI control over test execution? | **Decided** | Claude generates + reviews; Playwright executes. Claude decides on retries. No autonomous destructive actions. |
| SaaS evolution? | **Decided** | Plan for it in architecture now; ship as open source first |
| MCP standard vs. custom API? | **Decided** | Full MCP spec compliance — enables any MCP-capable AI client, not just Claude |
| Report formats? | **Decided** | JSON (machine), HTML (human), JUnit XML (CI/CD) |
| SDK bundle size target? | **Open** | Needs benchmarking — aim for < 5KB gzipped |
| Should SDK support SSR / hydration environments? | **Open** | Next.js / Nuxt compatibility needs investigation |

---
