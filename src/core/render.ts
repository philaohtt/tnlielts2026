import { AUTO_SCORABLE_BLOCK_TYPES } from "./rules";

// Map of block types to their render functions
// For now, we'll use placeholders since the actual renderers aren't built yet
export const blockRenderers: Record<string, (block: any, ctx: any) => string> = {
    gap_fill: (block) => `<div class="block-gap-fill">${block.data?.title || 'Gap Fill'}</div>`,
    gap_fill_visual: (block) => `<div class="block-gap-fill-visual">${block.data?.title || 'Gap Fill Visual'}</div>`,
    mcq_set: (block) => `<div class="block-mcq-set">${block.data?.title || 'MCQ Set'}</div>`,
    matching: (block) => `<div class="block-matching">${block.data?.title || 'Matching'}</div>`,
    matching_visual: (block) => `<div class="block-matching-visual">${block.data?.title || 'Matching Visual'}</div>`,
    matching_headings: (block) => `<div class="block-matching-headings">${block.data?.title || 'Matching Headings'}</div>`,
    tfng: (block) => `<div class="block-tfng">${block.data?.title || 'TFNG'}</div>`
};

export function renderBlock(block: any, ctx: any) {
    if (!block || !block.type) return '';
    const type = String(block.type || '').toLowerCase().trim();
    const renderer = blockRenderers[type];
    if (typeof renderer !== 'function') return '';
    return renderer(block, ctx);
}
