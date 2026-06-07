const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'bluhire-ai-frontend', 'src', 'app', 'dashboard', 'recruitment', 'pipeline', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const replacements = [
  { from: /bg-\[#050811\]/g, to: 'bg-zinc-50 dark:bg-[#050811]' },
  { from: /bg-\[#0e1422\]/g, to: 'bg-white dark:bg-[#0e1422]' },
  { from: /bg-\[#161f30\]/g, to: 'bg-zinc-100 dark:bg-[#161f30]' },
  { from: /bg-\[#0a0f18\]/g, to: 'bg-zinc-50 dark:bg-[#0a0f18]' },
  { from: /border-zinc-800\/80/g, to: 'border-zinc-200/80 dark:border-zinc-800/80' },
  { from: /border-zinc-850/g, to: 'border-zinc-200 dark:border-zinc-850' },
  { from: /text-zinc-100/g, to: 'text-zinc-900 dark:text-zinc-100' },
  { from: /text-zinc-200/g, to: 'text-zinc-800 dark:text-zinc-200' },
  { from: /text-zinc-350/g, to: 'text-zinc-600 dark:text-zinc-350' },
  { from: /text-zinc-400/g, to: 'text-zinc-500 dark:text-zinc-400' },
  { from: /text-zinc-250/g, to: 'text-zinc-800 dark:text-zinc-250' },
  { from: /text-zinc-550/g, to: 'text-zinc-500 dark:text-zinc-550' },
  { from: /bg-zinc-950\/45/g, to: 'bg-zinc-100/50 dark:bg-zinc-950/45' },
  { from: /bg-zinc-950\/60/g, to: 'bg-white dark:bg-zinc-950/60' },
  { from: /bg-\[#111827\]\/60/g, to: 'bg-zinc-50 dark:bg-[#111827]/60' },
  { from: /bg-\[#111827\]\/40/g, to: 'bg-zinc-50/50 dark:bg-[#111827]/40' },
  { from: /bg-zinc-900\/50/g, to: 'bg-zinc-100 dark:bg-zinc-900/50' },
  { from: /bg-zinc-800\/50/g, to: 'bg-zinc-100 dark:bg-zinc-800/50' },
  { from: /text-white/g, to: 'text-zinc-900 dark:text-white' },
];

replacements.forEach(({ from, to }) => {
  content = content.replace(from, to);
});

fs.writeFileSync(filePath, content);
console.log('Fixed pipeline UI classes!');
