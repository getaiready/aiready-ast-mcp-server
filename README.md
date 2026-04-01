# @aiready/ast-mcp-server

AST-aware codebase exploration tools for Model Context Protocol. Explore and navigate multi-project TypeScript/JavaScript codebases with high precision using AST and type information.

## Installation & Distribution Channels

You can install and use the AIReady AST MCP server through several supported channels.

### 1. Dedicated MCP Registries

- **[Smithery](https://smithery.ai/server/@aiready/ast-mcp-server)**: Discover and install our server directly via the Smithery CLI:
  ```bash
  npx @smithery/cli install @aiready/ast-mcp-server
  ```
- **[Glama](https://glama.ai/mcp/@aiready/ast-mcp-server)**: View our listing and integration options on the Glama directory.
- **[Pulsar](https://gotopulsar.com)**: Find us on the Pulsar registry for MCP servers.

### 2. Direct IDE / Assistant Integrations

#### Claude Desktop App

To use the AIReady AST MCP server in the Claude Desktop app, add the following configuration to your `claude_desktop_config.json`:

```json
"mcpServers": {
  "aiready-ast": {
    "command": "npx",
    "args": ["-y", "@aiready/ast-mcp-server"]
  }
}
```

#### Cursor IDE

1. Open Cursor Settings.
2. Navigate to **Features** -> **MCP Servers**.
3. Add a new server.
4. Set the command to: `npx -y @aiready/ast-mcp-server`

#### Windsurf IDE

1. Open Windsurf Settings or local environment configuration.
2. Add a new MCP Server integration.
3. Configure the execution command: `npx -y @aiready/ast-mcp-server`

## Features

- **Resolve Definition**: Pinpoint exactly where symbols are defined using TypeScript's type system.
- **Find References**: Locate every usage of a function, class, or variable.
- **Find Implementations**: Discover concrete implementations of interfaces and abstract classes.
- **File Structure overview**: Get a high-level summary of imports, exports, and declarations.
- **Search Code**: Blazingly fast regex search powered by Ripgrep.
- **Symbol Documentation**: Instantly fetch JSDoc/TSDoc for any symbol.
- **Symbol Indexing**: Project-wide symbol indexing for rapid navigation.

## Tools

### 1. `resolve_definition`

Find where a symbol is defined.

- `symbol`: Name of the symbol.
- `path`: Project root or target directory.

### 2. `find_references`

Find all usages of a symbol.

- `symbol`: Symbol name.
- `path`: Project root.

### 3. `find_implementations`

Find implementations for interfaces/abstract classes.

- `symbol`: Symbol name.
- `path`: Project root.

### 4. `get_file_structure`

Overview of a file's structure.

- `file`: Path to the file.

### 5. `search_code`

Fast regex search via bundled ripgrep.

- `pattern`: Regex pattern.
- `path`: Directory to search.
- `filePattern`: Optional glob filter.

### 6. `get_symbol_docs`

Retrieve only documentation for a symbol.

- `symbol`: Symbol name.
- `path`: Project root.

### 7. `build_symbol_index`

Build/Warm project-wide index.

- `path`: Project root to index.

## Quick Start

```bash
npx @aiready/ast-mcp-server
```

## Development

```bash
pnpm install
npm run build
npm run test
```
