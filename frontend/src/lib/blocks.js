export function parseBlocks(content) {
  if (!content) return [{ type: 'text', value: '' }]
  if (content.startsWith('[')) {
    try { return JSON.parse(content) } catch { /* fall through */ }
  }
  return [{ type: 'text', value: content }]
}

export function blocksToContent(blocks) {
  if (blocks.length === 1 && blocks[0].type === 'text' && !blocks[0].value) return ''
  return JSON.stringify(blocks)
}
