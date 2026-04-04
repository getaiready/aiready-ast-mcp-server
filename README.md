# @aiready/ast-mcp-server

**Best-in-Class TypeScript/JavaScript Codebase Exploration for AI Agents.**

This Model Context Protocol (MCP) server provides high-precision, AST-aware tools for navigating complex codebases. Unlike standard search tools, it understands imports, exports, types, and references.

## 🚀 Key Features

- **Hybrid Indexing**: Combines `ripgrep` speed with `ts-morph` precision. Only loads relevant files into memory to handle massive monorepos.
- **O(1) Symbol Resolution**: Instantly find where any function, class, or type is defined using a pre-built disk cache.
- **Surgical Reference Finding**: Uses a two-stage lookup (Regex + AST) to find every usage of a symbol across the project without OOM crashes.
- **Monorepo Intelligent**: Automatically discovers `tsconfig.json` boundaries and respects TypeScript project references.
- **Zero Configuration**: Bundles the `ripgrep` binary and handles all TypeScript parsing out-of-the-box.
- **Path Security**: Hardened against path traversal and malicious agent inputs.

## 🛠 Tools Provided

| Tool                   | Purpose                                                         |
| ---------------------- | --------------------------------------------------------------- |
| `resolve_definition`   | Find where a symbol is defined (file, line, signature, JSDoc).  |
| `find_references`      | Find all usages of a symbol across the project (paged).         |
| `find_implementations` | Find concrete classes implementing an interface/abstract class. |
| `get_file_structure`   | Return a structural tree of a file (classes, methods, enums).   |
| `search_code`          | Blazingly fast regex search via bundled ripgrep.                |
| `get_symbol_docs`      | Extract full JSDoc/TSDoc metadata for any symbol.               |
| `get_call_hierarchy`   | Find callers and callees for a symbol (incoming/outgoing).      |
| `build_symbol_index`   | Warm the disk cache for a project (highly recommended).         |

## 📦 Installation

```bash
npx -y @aiready/ast-mcp-server
```

## ⚙️ Configuration

### Environment Variables

- `AST_WORKSPACE_ROOT`: Path to the root of the allowed workspace (default: `cwd`).
- `AST_MAX_HEAP_MB`: Max memory allowed for AST Projects (default: `1536`).
- `AST_WORKER_POOL_SIZE`: Number of worker threads for parsing (default: `2`).

### Agent Configuration (Cursor/Claude Desktop)

```json
{
  "mcpServers": {
    "ast-explorer": {
      "command": "npx",
      "args": ["-y", "@aiready/ast-mcp-server"],
      "env": {
        "AST_WORKSPACE_ROOT": "/path/to/your/project"
      }
    }
  }
}
```

## 🛡 Security

All tool arguments are strictly validated. Any attempt by an agent to access files outside the `AST_WORKSPACE_ROOT` will result in a hard rejection.

## 📄 License

MIT © [AIReady](https://getaiready.dev)
