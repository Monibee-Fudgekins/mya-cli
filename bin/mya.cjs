#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

// Use the HTTP CLI implementation
const cliPath = path.resolve(__dirname, '../dist/cli-http.js');

// Use a single process execution with stdio inheritance
// This ensures proper handling of interactive prompts
const child = spawn(process.execPath, [cliPath, ...process.argv.slice(2)], {
  stdio: 'inherit',
  // Ensure environment variables are passed through
  env: process.env,
});

// Handle process exit
child.on('exit', (code) => process.exit(code));
