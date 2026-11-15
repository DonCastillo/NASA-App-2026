import { describe, expect, it } from 'vitest'
import { ARTICLES } from './articles'

// Keeps src/data/articles.ts in sync with the front matter of plan/articles/*.md
const files = import.meta.glob<string>('../../plan/articles/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const frontMatter = (text: string) => {
  const block = text.split('---')[1]
  const field = (name: string) => block.match(new RegExp(`^${name}:\\s*(.+)$`, 'm'))?.[1]
  return { title: JSON.parse(field('title')!), url: field('source') }
}

describe('articles', () => {
  it('lists every article in plan/articles/ with the title and page from its front matter', () => {
    const expected = Object.fromEntries(
      Object.entries(files).map(([path, text]) => [
        path.split('/').pop()!.replace(/\.md$/, ''),
        frontMatter(text),
      ]),
    )
    const actual = Object.fromEntries(
      Object.entries(ARTICLES).map(([slug, a]) => [slug, { title: a.title, url: a.url }]),
    )
    expect(actual).toEqual(expected)
  })

  it('tags CSA pages as CSA and the rest as NASA', () => {
    for (const article of Object.values(ARTICLES)) {
      expect(article.agency).toBe(article.url?.includes('asc-csa.gc.ca') ? 'CSA' : 'NASA')
    }
  })
})
