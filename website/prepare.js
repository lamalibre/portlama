#!/usr/bin/env node

/**
 * Prepares the VitePress source directory:
 * 1. Copies markdown docs from the panel-client public directory into website/src/
 * 2. Generates the sidebar config from _index.json
 * 3. Writes the landing page (index.md)
 *
 * Run before `vitepress build` or `vitepress dev`.
 */

import { readFileSync, writeFileSync, cpSync, mkdirSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const docsSource = resolve(__dirname, '..', 'packages', 'panel-client', 'public', 'docs');
const srcDir = resolve(__dirname, 'src');

// 1. Clean and copy docs into src/
rmSync(srcDir, { recursive: true, force: true });
mkdirSync(srcDir, { recursive: true });
cpSync(docsSource, srcDir, { recursive: true });

// Remove _index.json from the copy (not a page)
rmSync(resolve(srcDir, '_index.json'), { force: true });

console.log('Copied docs into website/src/');

// 2. Generate sidebar from _index.json
const index = JSON.parse(readFileSync(resolve(docsSource, '_index.json'), 'utf-8'));

// Omit `collapsed` so every section is permanently expanded — full tree always visible
const sidebar = index.sections.map((section) => ({
  text: section.title,
  items: section.pages.map((page) => ({
    text: page.title,
    link: `/${page.file.replace(/\.md$/, '')}`,
  })),
}));

const sidebarPath = resolve(__dirname, '.vitepress', 'sidebar.json');
writeFileSync(sidebarPath, JSON.stringify(sidebar, null, 2) + '\n');
console.log(`Wrote ${sidebar.length} sidebar sections`);

// 3. Write landing page
const landingPage = `---
layout: home

hero:
  name: Portlama
  text: Self-hosted secure tunneling
  tagline: Expose local web apps through a cheap VPS. Zero-login admin via client certificates. Never SSH again.
  actions:
    - theme: brand
      text: Get Started
      link: /00-introduction/what-is-portlama
    - theme: alt
      text: Quick Start
      link: /00-introduction/quickstart
    - theme: alt
      text: API Reference
      link: /04-api-reference/overview

features:
  - title: Zero-Config Setup
    details: One npx command provisions a VPS. Onboarding wizard handles domain, DNS, and certificates through the browser.
  - title: mTLS Security
    details: Admin panel protected by client certificates. No passwords, no SSH keys. Hardware-bound certificates via macOS Keychain.
  - title: Plugin Ecosystem
    details: Shell, Sync, Herd, and Caravana plugins extend the platform. Each works standalone or integrated via the tunnel.
  - title: Self-Hosted
    details: Your data stays on your machines. The VPS is just a relay. Local-first, cost-aware, encryption by default.
---
`;

writeFileSync(resolve(srcDir, 'index.md'), landingPage);
console.log('Wrote landing page');
