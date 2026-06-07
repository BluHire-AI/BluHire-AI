const fs = require('fs');
const path = require('path');

const files = [
  'page.tsx',
  'jobs/page.tsx',
  'pipeline/page.tsx',
  'candidates/page.tsx'
];

const basePath = path.join(__dirname, 'frontend', 'bluhire-ai-frontend', 'src', 'app', 'dashboard', 'recruitment');

files.forEach(file => {
  const filePath = path.join(basePath, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // We want to insert the new link after the Candidates link.
  // The Candidates link ends with: Candidates\n            </span>\n          </Link>
  
  // Create the new link with standard classes
  const newLink = `
          <Link href="/dashboard/recruitment/ai-interviews">
            <span className="text-xs font-bold px-4 py-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer block transition-colors">
              AI Interviews
            </span>
          </Link>`;

  // Use a regex to find the end of the Candidates link block
  // We match <Link href="/dashboard/recruitment/candidates"> ... </Link>
  const candidateRegex = /(<Link href="\/dashboard\/recruitment\/candidates">[\s\S]*?<\/Link>)/;
  
  if (candidateRegex.test(content) && !content.includes('/dashboard/recruitment/ai-interviews')) {
    content = content.replace(candidateRegex, `$1${newLink}`);
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  } else {
    console.log(`Skipped ${file} (already updated or pattern not found)`);
  }
});
