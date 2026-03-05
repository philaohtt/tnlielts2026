/**
 * core/rules.ts
 * Shared constants and rules for the IELTS testing system
 */

export const SKILL_ORDER = [
    'listening',
    'reading',
    'writing',
    'speaking'
] as const;

export type Skill = typeof SKILL_ORDER[number];

export const DEFAULT_SKILL: Skill = 'listening';

export const DEFAULT_TIME_RULES: Record<Skill, number> = {
    listening: 30,
    reading: 60,
    writing: 60,
    speaking: 15
};

export const ANSWER_TYPES = [
    'gap',
    'mcq',
    'tfng',
    'matching',
    'writing',
    'speaking'
] as const;

export const AUTO_SCORABLE_BLOCK_TYPES = [
    'gap_fill',
    'gap_fill_visual',
    'tfng',
    'mcq_set',
    'matching',
    'matching_visual',
    'matching_headings'
] as const;

export const MANUAL_GRADING_BLOCK_TYPES = [
    'writing_task',
    'speaking_task'
] as const;

export const ALL_BLOCK_TYPES = [
    ...AUTO_SCORABLE_BLOCK_TYPES,
    ...MANUAL_GRADING_BLOCK_TYPES
] as const;

export function isValidSkill(skill: string): skill is Skill {
    if (!skill) return false;
    const normalized = skill.toLowerCase().trim();
    return (SKILL_ORDER as readonly string[]).includes(normalized);
}

export function isAutoScorable(blockOrType: string | { type: string }): boolean {
    let type: string;
    if (typeof blockOrType === 'string') {
        type = blockOrType;
    } else if (blockOrType && blockOrType.type) {
        type = blockOrType.type;
    } else {
        return false;
    }
    const normalizedType = type.toLowerCase().trim();
    return (AUTO_SCORABLE_BLOCK_TYPES as readonly string[]).includes(normalizedType);
}

export function requiresManualGrading(blockOrType: string | { type: string }): boolean {
    let type: string;
    if (typeof blockOrType === 'string') {
        type = blockOrType;
    } else if (blockOrType && blockOrType.type) {
        type = blockOrType.type;
    } else {
        return false;
    }
    const normalizedType = type.toLowerCase().trim();
    return (MANUAL_GRADING_BLOCK_TYPES as readonly string[]).includes(normalizedType);
}

export function normalizeSkill(skill?: string): Skill {
    const s = String(skill || DEFAULT_SKILL).toLowerCase().trim();
    return isValidSkill(s) ? s : DEFAULT_SKILL;
}

export function getNextSkillInOrder(currentSkill: string): Skill | null {
    const normalized = normalizeSkill(currentSkill);
    const currentIndex = SKILL_ORDER.indexOf(normalized);
    if (currentIndex === -1 || currentIndex === SKILL_ORDER.length - 1) {
        return null;
    }
    return SKILL_ORDER[currentIndex + 1];
}

export function getDefaultTimeForSkill(skill: string): number {
    const normalized = normalizeSkill(skill);
    return DEFAULT_TIME_RULES[normalized] || 60;
}
