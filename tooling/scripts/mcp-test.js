import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Generic MCP Server Verification Script
 * Usage: node tooling/scripts/mcp-test.ts <path-to-server-js> [test-tool-name] [test-tool-args-json]
 */

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error(
    'Usage: node mcp-test.ts <path-to-server-js> [test-tool-name] [test-tool-args-json]'
  );
  process.exit(1);
}

const serverPath = path.resolve(args[0]);
const testToolName = args[1];
const testToolArgs = args[2] ? JSON.parse(args[2]) : {};

async function testServer() {
  console.log(
    `🚀 Starting MCP Server verification for: ${path.basename(serverPath)}`
  );

  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverPath],
    env: {
      ...process.env,
      NODE_ENV: 'test',
    },
  });

  const client = new Client(
    {
      name: 'aiready-test-client',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  try {
    console.log('⏳ Connecting to server...');
    await client.connect(transport);
    console.log('✅ Connected to MCP Server');

    // 1. Test ListTools
    console.log('📋 Fetching available tools...');
    const toolsResult = await client.listTools();
    const tools = toolsResult.tools || [];

    console.log('Available Tools:');
    tools.forEach((t) =>
      console.log(
        `  - ${t.name}: ${t.description?.split('\n')[0] || 'No description'}`
      )
    );

    if (tools.length === 0) {
      throw new Error('No tools listed by server!');
    }

    // 2. Test specific tool if provided
    if (testToolName) {
      console.log(`🔍 Testing tool execution: '${testToolName}'...`);
      const result = await client.callTool({
        name: testToolName,
        arguments: testToolArgs,
      });

      if (result.isError) {
        console.error(
          '❌ Tool execution failed:',
          result.content?.[0] || 'Unknown error'
        );
      } else {
        console.log('✅ Tool execution success!');
        console.log(
          'Result Preview:',
          JSON.stringify(result.content?.[0], null, 2).slice(0, 500) + '...'
        );
      }
    } else {
      console.log(
        '💡 Tip: Provide a tool name as the second argument to test execution.'
      );
    }
  } catch (error) {
    console.error('💥 Verification failed:', error);
    process.exit(1);
  } finally {
    console.log('🏁 Verification complete.');
    process.exit(0);
  }
}

testServer();
