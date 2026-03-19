#!/usr/bin/env node

import { install } from '../src/install.js';

install().catch((err) => {
  console.error(`\n  Error: ${err.message}\n`);
  process.exit(1);
});
