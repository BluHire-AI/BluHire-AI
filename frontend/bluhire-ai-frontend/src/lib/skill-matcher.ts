/**
 * Centralized Skill Normalization and Matching Engine
 * Used to compare candidate skills with job requirements accurately.
 */

/**
 * Normalizes a skill string for comparison.
 * - Trims whitespace
 * - Converts to lowercase
 * - Maps known standard aliases without aggressive false matching (e.g. Java !== JavaScript)
 */
export function normalizeSkill(rawSkill: string): string {
  if (!rawSkill || typeof rawSkill !== 'string') return '';

  let skill = rawSkill.trim().toLowerCase();

  // Strip extraneous surrounding punctuation if any (quotes, parentheses, brackets)
  skill = skill.replace(/^['"([{]+|['")\]}]+$/g, '').trim();

  // Normalize multiple spaces into single space
  skill = skill.replace(/\s+/g, ' ');

  // Canonical skill alias dictionary
  const aliasMap: Record<string, string> = {
    // JavaScript (Do NOT map to Java)
    'js': 'javascript',
    'javascript': 'javascript',
    'vanilla js': 'javascript',
    'vanillajs': 'javascript',

    // TypeScript
    'ts': 'typescript',
    'typescript': 'typescript',

    // React Native vs React (strictly distinct)
    'react-native': 'react native',
    'reactnative': 'react native',
    'react native': 'react native',

    // React (strictly distinct from React Native)
    'react': 'react',
    'reactjs': 'react',
    'react.js': 'react',

    // Node.js
    'node': 'node.js',
    'nodejs': 'node.js',
    'node.js': 'node.js',
    'node js': 'node.js',

    // Vue.js
    'vue': 'vue.js',
    'vuejs': 'vue.js',
    'vue.js': 'vue.js',

    // Angular
    'angular': 'angular',
    'angularjs': 'angular',
    'angular.js': 'angular',

    // Spring Boot
    'springboot': 'spring boot',
    'spring-boot': 'spring boot',
    'spring boot': 'spring boot',

    // Golang
    'golang': 'go',
    'go': 'go',

    // PostgreSQL
    'postgres': 'postgresql',
    'postgresql': 'postgresql',

    // MongoDB
    'mongo': 'mongodb',
    'mongodb': 'mongodb',

    // Kubernetes
    'k8s': 'kubernetes',
    'kubernetes': 'kubernetes',

    // Docker
    'docker': 'docker',

    // Build Tools
    'gradle': 'gradle',

    // Cloud Providers
    'aws': 'aws',
    'amazon web services': 'aws',
    'gcp': 'gcp',
    'google cloud': 'gcp',
    'google cloud platform': 'gcp',
    'azure': 'azure',
    'microsoft azure': 'azure',

    // Languages
    'c#': 'c#',
    'csharp': 'c#',
    'c-sharp': 'c#',
    'c++': 'c++',
    'cpp': 'c++',
    'python': 'python',
    'python3': 'python',
    'java': 'java',
    'kotlin': 'kotlin',
    'swift': 'swift',

    // Domains
    'data analytics': 'data analytics',
    'data-analytics': 'data analytics',
  };

  return aliasMap[skill] || skill;
}

export function areSkillsEquivalent(skillA: string, skillB: string): boolean {
  if (!skillA || !skillB) return false;
  const normA = normalizeSkill(skillA);
  const normB = normalizeSkill(skillB);
  if (!normA || !normB) return false;
  return normA === normB;
}

export interface SkillMatchResult {
  matched: string[];
  missing: string[];
  matchPercentage: number;
  totalRequirements: number;
}

/**
 * Computes deterministic skill match between candidate skills and required skills.
 * - Single source of truth for matched skills, missing skills, and match percentage.
 * - The denominator for the percentage is strictly total unique requirements.
 */
export function computeSkillMatch(
  candidateSkills: string[] = [],
  requiredSkills: string[] = []
): SkillMatchResult {
  // Normalize candidate skills into a map for fast canonical lookup
  const normCandidateSkills = new Map<string, string>();
  for (const cs of candidateSkills) {
    if (cs && typeof cs === 'string' && cs.trim()) {
      const norm = normalizeSkill(cs);
      if (norm && !normCandidateSkills.has(norm)) {
        normCandidateSkills.set(norm, cs.trim());
      }
    }
  }

  const matched: string[] = [];
  const missing: string[] = [];
  const processedRequirements = new Set<string>();

  for (const req of requiredSkills) {
    if (!req || typeof req !== 'string' || !req.trim()) continue;
    const trimmedReq = req.trim();
    const normReq = normalizeSkill(trimmedReq);

    // Prevent duplicate requirements from skewing denominator
    if (processedRequirements.has(normReq)) continue;
    processedRequirements.add(normReq);

    if (normCandidateSkills.has(normReq)) {
      matched.push(trimmedReq);
    } else {
      missing.push(trimmedReq);
    }
  }

  const totalRequirements = matched.length + missing.length;
  const matchPercentage =
    totalRequirements > 0
      ? Math.round((matched.length / totalRequirements) * 1000) / 10
      : 0;

  return {
    matched,
    missing,
    matchPercentage,
    totalRequirements,
  };
}
