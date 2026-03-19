# Contributing to ai-ui

All skill levels welcome. Whether you're fixing a typo in the docs or adding a new MCP tool,
the process is the same.

---

## Quick Links

| Resource | Description |
|---|---|
| [Getting Started](./docs/getting-started.md) | Full setup walkthrough |
| [SDK Reference](./docs/sdk-reference.md) | `data-ai-*` attributes and snapshot shape |
| [MCP Tools](./docs/mcp-tools.md) | All 7 tools — inputs, outputs, examples |
| [Reports](./docs/reports.md) | Report formats and CI integration |

---

## Related Projects / Inspiration

| Project | Why it's relevant |
|---|---|
| [Playwright](https://playwright.dev) | The test runner ai-ui generates code for |
| [Model Context Protocol](https://modelcontextprotocol.io) | The protocol the MCP server implements |
| [mcp-playwright](https://github.com/microsoft/mcp-playwright) | Prior art — Playwright via MCP |
| [Claude API](https://docs.anthropic.com/en/api/getting-started) | The AI layer powering test generation and analysis |

---

## How to Contribute

### Bug Reports

Open an issue with:
- What you expected to happen
- What actually happened
- Steps to reproduce (minimal HTML or command sequence)
- Node version and OS

### Feature Requests

Open an issue describing:
- The use case (not just the feature)
- Which package it belongs to (`sdk`, `server`, `runner`, `reports`)

### Pull Requests

1. Fork the repo and create a branch: `git checkout -b feat/my-feature`
2. Make your changes (see Development Setup below)
3. Add or update tests for anything you changed
4. Run the full test suite: `npm test`
5. Open a PR against `main` with a clear description

---

## Development Setup

```bash
# Clone
git clone https://github.com/muhammad-ibrahim/ai-ui.git
cd ai-ui

# Install all workspace deps
npm install

# Build the MCP server (TypeScript → dist/)
npm run build --workspace=server

# Build the SDK (bundles src/ai-sdk.js → dist/ai-sdk.js)
npm run build --workspace=sdk

# Run all tests
npm test
```

To run only one workspace's tests:

```bash
npm test --workspace=server
npm test --workspace=sdk
```

---

## Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org):

| Prefix | When to use |
|---|---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `test:` | Adding or fixing tests |
| `refactor:` | Code change with no behaviour change |
| `chore:` | Build scripts, deps, config |

Examples:
```
feat(server): add list_reports MCP tool
fix(sdk): handle shadowDOM elements in auto-tagger
docs: update MCP tools reference for save_report
```

---

## Package Layout

```
ai-ui/
├── sdk/          @ai-ui/sdk     — frontend SDK, zero deps
├── server/       @ai-ui/server  — MCP server + HTTP API + reporters
├── runner/                      — Playwright runner helpers
├── examples/                    — Demo HTML pages
└── docs/                        — Guides and API reference
```

Each workspace has its own `package.json` and test suite. Root `package.json` wires them together
as an npm workspace.

---

## License

By contributing you agree that your contributions will be licensed under the [MIT License](./LICENSE).
