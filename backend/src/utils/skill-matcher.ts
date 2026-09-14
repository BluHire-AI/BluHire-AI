/**
 * Centralized Skill Normalization and Matching Engine (Backend)
 */

export function normalizeSkill(rawSkill: string): string {
  if (!rawSkill || typeof rawSkill !== 'string') return '';

  let skill = rawSkill.trim().toLowerCase();
  skill = skill.replace(/^['"([{]+|['")\]}]+$/g, '').trim();
  skill = skill.replace(/\s+/g, ' ');

  const aliasMap: Record<string, string> = {
    'js': 'javascript',
    'javascript': 'javascript',
    'vanilla js': 'javascript',
    'vanillajs': 'javascript',
    'ts': 'typescript',
    'typescript': 'typescript',
    'react-native': 'react native',
    'reactnative': 'react native',
    'react native': 'react native',
    'react': 'react',
    'reactjs': 'react',
    'react.js': 'react',
    'node': 'node.js',
    'nodejs': 'node.js',
    'node.js': 'node.js',
    'node js': 'node.js',
    'vue': 'vue.js',
    'vuejs': 'vue.js',
    'vue.js': 'vue.js',
    'angular': 'angular',
    'angularjs': 'angular',
    'angular.js': 'angular',
    'springboot': 'spring boot',
    'spring-boot': 'spring boot',
    'spring boot': 'spring boot',
    'golang': 'go',
    'go': 'go',
    'postgres': 'postgresql',
    'postgresql': 'postgresql',
    'mongo': 'mongodb',
    'mongodb': 'mongodb',
    'k8s': 'kubernetes',
    'kubernetes': 'kubernetes',
    'docker': 'docker',
    'gradle': 'gradle',
    'aws': 'aws',
    'amazon web services': 'aws',
    'gcp': 'gcp',
    'google cloud': 'gcp',
    'google cloud platform': 'gcp',
    'azure': 'azure',
    'microsoft azure': 'azure',
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

export function computeSkillMatch(
  candidateSkills: string[] = [],
  requiredSkills: string[] = []
): SkillMatchResult {
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
