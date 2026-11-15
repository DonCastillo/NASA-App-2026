import { ARTICLES, OTHER_SOURCES } from '../data/articles'
import type { ArticleRef, SystemDef } from '../types'

/**
 * Every source behind a system: its own sources, then its indicators' sources, without repeats,
 * resolved to titles and links. Unknown slugs are skipped (src/data tests make sure there are none).
 */
export function systemSources(system: SystemDef): (ArticleRef & { slug: string })[] {
  const slugs = [...system.sources, ...system.indicators.flatMap((indicator) => indicator.sources)]
  const unique = [...new Set(slugs)]
  return unique.flatMap((slug) => {
    const ref = ARTICLES[slug] ?? OTHER_SOURCES[slug]
    return ref ? [{ slug, ...ref }] : []
  })
}
