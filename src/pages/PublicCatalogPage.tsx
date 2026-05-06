import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, SlidersHorizontal, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import CatalogCourseCard from '../components/CatalogCourseCard'
import PublicNavbar from '../components/navigation/PublicNavbar'
import Input from '../components/ui/Input'
import Loader from '../components/ui/Loader'
import QueryErrorState from '../components/ui/QueryErrorState'
import { useLanguage } from '../hooks/useLanguage'
import { courseService } from '../services/courseService'
import { normalizeApiError } from '../shared/errors/normalizeApiError'
import {
  buildCatalogPath,
  filterCatalogCourses,
  getCatalogCategories,
  getCatalogLevels,
} from '../utils/catalogFilters'

const PublicCatalogPage = () => {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [categoryKey, setCategoryKey] = useState(searchParams.get('category') ?? '')
  const [levelKey, setLevelKey] = useState(searchParams.get('level') ?? '')
  const deferredQuery = useDeferredValue(query)

  const copy = language === 'tr'
    ? {
      eyebrow: 'Kurs kataloğu',
      title: 'Kursları konu, seviye ve eğitmene göre filtrele.',
      description:
        'Aradığın beceriye uygun kursları tek ekranda incele. Kategori ve seviye filtreleriyle sana en yakın eğitimleri hızlıca bulabilirsin.',
      searchLabel: 'Kurs ara',
      searchPlaceholder: 'Konu, beceri, eğitmen veya etiket ile ara',
      filterLabel: 'Filtreler',
      all: 'Tümü',
      categories: 'Kategoriler',
      levels: 'Seviyeler',
      featured: 'Öne çıkanlar',
      clear: 'Filtreleri temizle',
      results: 'Sonuçlar',
      resultsTitle: 'kurs bulundu',
      resultsDescription: 'Filtrelerine uyan kurslar aşağıda listeleniyor.',
      emptyTitle: 'Sonuç bulunamadı',
      emptyDescription: 'Arama ifadesini değiştirerek veya filtreleri temizleyerek yeniden deneyebilirsin.',
      stats: [
        { label: 'Kategori', getValue: (count: number) => String(count) },
        { label: 'Kurs', getValue: (count: number) => String(count) },
        { label: 'Seviye', getValue: (count: number) => String(count) },
      ],
      chips: [
        { label: 'Tüm kurslar', value: {} },
        { label: 'Başlangıç seviyesi', value: { level: 'beginner' } },
        { label: 'Tasarım ve UX', value: { category: 'design' } },
      ],
      navSections: [{ id: 'course-results', label: 'Kurslar' }],
    }
    : {
      eyebrow: 'Course catalog',
      title: 'Filter courses by topic, level, and instructor.',
      description:
        'Review courses for the skill you want to build. Category and level filters help you narrow the catalog quickly.',
      searchLabel: 'Search courses',
      searchPlaceholder: 'Search by topic, skill, instructor, or tag',
      filterLabel: 'Filters',
      all: 'All',
      categories: 'Categories',
      levels: 'Levels',
      featured: 'Featured',
      clear: 'Clear filters',
      results: 'Results',
      resultsTitle: 'courses found',
      resultsDescription: 'Courses matching your filters are listed below.',
      emptyTitle: 'No results found',
      emptyDescription: 'Try another search phrase or clear the active filters to broaden the results.',
      stats: [
        { label: 'Categories', getValue: (count: number) => String(count) },
        { label: 'Courses', getValue: (count: number) => String(count) },
        { label: 'Levels', getValue: (count: number) => String(count) },
      ],
      chips: [
        { label: 'All courses', value: {} },
        { label: 'Beginner level', value: { level: 'beginner' } },
        { label: 'Design and UX', value: { category: 'design' } },
      ],
      navSections: [{ id: 'course-results', label: 'Courses' }],
    }

  const { data: courses, error, isLoading } = useQuery({
    queryKey: ['public-catalog', language],
    queryFn: () => courseService.getCourses(language),
  })
  const appError = error ? normalizeApiError(error) : null
  const hasRecoverablePublicError = appError?.kind === 'auth' || appError?.kind === 'forbidden'
  const resolvedCourses = courses ?? []

  const categories = useMemo(() => getCatalogCategories(resolvedCourses), [resolvedCourses])
  const levels = useMemo(() => getCatalogLevels(resolvedCourses), [resolvedCourses])
  const featuredCourses = useMemo(() => [...resolvedCourses].sort((left, right) => right.rating - left.rating).slice(0, 3), [resolvedCourses])

  const filteredCourses = useMemo(
    () => filterCatalogCourses(resolvedCourses, { query: deferredQuery, category: categoryKey, level: levelKey }, language),
    [categoryKey, deferredQuery, language, levelKey, resolvedCourses],
  )

  const syncFiltersToUrl = (next: { query: string, category: string, level: string }) => {
    const nextSearchParams = new URLSearchParams()

    if (next.query.trim()) nextSearchParams.set('q', next.query.trim())
    if (next.category) nextSearchParams.set('category', next.category)
    if (next.level) nextSearchParams.set('level', next.level)

    if (nextSearchParams.toString() !== searchParams.toString()) {
      setSearchParams(nextSearchParams, { replace: true })
    }
  }

  useEffect(() => {
    const nextQuery = searchParams.get('q') ?? ''
    const nextCategory = searchParams.get('category') ?? ''
    const nextLevel = searchParams.get('level') ?? ''

    setQuery((current) => current === nextQuery ? current : nextQuery)
    setCategoryKey((current) => current === nextCategory ? current : nextCategory)
    setLevelKey((current) => current === nextLevel ? current : nextLevel)
  }, [searchParams])

  useEffect(() => {
    if (!resolvedCourses.length) return

    const categoryExists = !categoryKey || categories.some((item) => item.key === categoryKey)
    const levelExists = !levelKey || levels.some((item) => item.key === levelKey)

    if (categoryExists && levelExists) return

    const nextCategory = categoryExists ? categoryKey : ''
    const nextLevel = levelExists ? levelKey : ''

    setCategoryKey(nextCategory)
    setLevelKey(nextLevel)
    syncFiltersToUrl({ query, category: nextCategory, level: nextLevel })
  }, [categories, categoryKey, levelKey, levels, query, resolvedCourses.length, searchParams, setSearchParams])

  const handleAnchorClick = (id: string) => {
    const section = document.getElementById(id)

    if (!section) return

    window.scrollTo({
      top: section.getBoundingClientRect().top + window.scrollY - 112,
      behavior: 'smooth',
    })
  }

  if (error && !hasRecoverablePublicError) {
    return <QueryErrorState error={error} fullScreen />
  }

  if (isLoading) {
    return <Loader fullScreen label={t('loader.courseCatalog')} />
  }

  return (
    <div className="public-page theme-app">
      <PublicNavbar
        anchorLinks={copy.navSections}
        categories={categories}
        featuredCourses={featuredCourses}
        onAnchorClick={handleAnchorClick}
      />

      <main className="relative mx-auto max-w-[1480px] px-4 pb-16 pt-8 lg:px-8 lg:pt-10">
        <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
          <div className="public-section-card rounded-lg p-8 md:p-10">
            <span className="inline-flex items-center gap-2 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] theme-heading">
              <Sparkles className="h-3.5 w-3.5 text-[color:var(--primary)]" />
              {copy.eyebrow}
            </span>

            <h1 className="theme-heading mt-6 max-w-4xl text-4xl font-semibold tracking-[-0.04em] md:text-5xl">
              {copy.title}
            </h1>
            <p className="theme-muted mt-5 max-w-2xl text-sm leading-8 md:text-base">
              {copy.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {copy.chips.map((chip) => (
                <Link className="public-outline-button h-11 px-4 text-sm font-semibold" key={chip.label} to={buildCatalogPath(chip.value)}>
                  {chip.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="public-section-card rounded-lg p-7 md:p-8">
            <Input
              className="rounded-md border-[color:var(--border)] bg-[color:var(--surface-muted)] focus-within:border-[color:var(--border-strong)] focus-within:ring-1 focus-within:ring-[color:var(--primary)]/15"
              icon={<Search className="h-4 w-4" />}
              label={copy.searchLabel}
              onChange={(event) => {
                const nextQuery = event.target.value
                setQuery(nextQuery)
                syncFiltersToUrl({ query: nextQuery, category: categoryKey, level: levelKey })
              }}
              placeholder={copy.searchPlaceholder}
              value={query}
            />

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-5 py-5">
                <p className="theme-subtle text-xs uppercase tracking-[0.2em]">{copy.stats[0].label}</p>
                <p className="theme-heading mt-2 text-3xl font-semibold tracking-[-0.04em]">{copy.stats[0].getValue(categories.length)}</p>
              </div>
              <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-5 py-5">
                <p className="theme-subtle text-xs uppercase tracking-[0.2em]">{copy.stats[1].label}</p>
                <p className="theme-heading mt-2 text-3xl font-semibold tracking-[-0.04em]">{copy.stats[1].getValue(resolvedCourses.length)}</p>
              </div>
              <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-5 py-5">
                <p className="theme-subtle text-xs uppercase tracking-[0.2em]">{copy.stats[2].label}</p>
                <p className="theme-heading mt-2 text-3xl font-semibold tracking-[-0.04em]">{copy.stats[2].getValue(levels.length)}</p>
              </div>
            </div>

            <p className="theme-muted mt-5 text-sm leading-7">{copy.resultsDescription}</p>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]" id="course-results">
          <aside className="public-section-card h-fit rounded-lg p-5">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-[color:var(--primary)]" />
              <p className="theme-heading text-sm font-semibold">{copy.filterLabel}</p>
            </div>

            <div className="mt-6">
              <p className="theme-heading text-sm font-semibold">{copy.categories}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className={`rounded-md border px-3 py-2 text-sm transition ${categoryKey ? 'border-[color:var(--border)] bg-[color:var(--surface-muted)] theme-muted hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-hover)]' : 'border-[color:var(--primary)] bg-[color:var(--surface-strong)] text-[color:var(--primary)]'}`}
                  onClick={() => {
                    setCategoryKey('')
                    syncFiltersToUrl({ query, category: '', level: levelKey })
                  }}
                  type="button"
                >
                  {copy.all}
                </button>

                {categories.map((item) => (
                  <button
                    className={`rounded-md border px-3 py-2 text-sm transition ${categoryKey === item.key ? 'border-[color:var(--primary)] bg-[color:var(--surface-strong)] text-[color:var(--primary)]' : 'border-[color:var(--border)] bg-[color:var(--surface-muted)] theme-muted hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-hover)]'}`}
                    key={item.key}
                    onClick={() => {
                      setCategoryKey(item.key)
                      syncFiltersToUrl({ query, category: item.key, level: levelKey })
                    }}
                    type="button"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="theme-heading text-sm font-semibold">{copy.levels}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className={`rounded-md border px-3 py-2 text-sm transition ${levelKey ? 'border-[color:var(--border)] bg-[color:var(--surface-muted)] theme-muted hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-hover)]' : 'border-[color:var(--primary)] bg-[color:var(--surface-strong)] text-[color:var(--primary)]'}`}
                  onClick={() => {
                    setLevelKey('')
                    syncFiltersToUrl({ query, category: categoryKey, level: '' })
                  }}
                  type="button"
                >
                  {copy.all}
                </button>

                {levels.map((item) => (
                  <button
                    className={`rounded-md border px-3 py-2 text-sm transition ${levelKey === item.key ? 'border-[color:var(--primary)] bg-[color:var(--surface-strong)] text-[color:var(--primary)]' : 'border-[color:var(--border)] bg-[color:var(--surface-muted)] theme-muted hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-hover)]'}`}
                    key={item.key}
                    onClick={() => {
                      setLevelKey(item.key)
                      syncFiltersToUrl({ query, category: categoryKey, level: item.key })
                    }}
                    type="button"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 border-t border-[color:var(--border)] pt-6">
              <p className="theme-heading text-sm font-semibold">{copy.featured}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {featuredCourses.map((course) => (
                  <button
                    className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-sm theme-muted transition hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-hover)]"
                    key={course.id}
                    onClick={() => {
                      setQuery(course.title)
                      syncFiltersToUrl({ query: course.title, category: categoryKey, level: levelKey })
                    }}
                    type="button"
                  >
                    {course.title}
                  </button>
                ))}
              </div>
            </div>

            <button className="public-outline-button mt-6 h-11 w-full px-4 text-sm font-semibold" onClick={() => {
              setQuery('')
              setCategoryKey('')
              setLevelKey('')
              syncFiltersToUrl({ query: '', category: '', level: '' })
            }} type="button">
              {copy.clear}
            </button>
          </aside>

          <div className="space-y-5">
            <div className="public-section-card rounded-lg p-6">
              <p className="theme-subtle text-xs uppercase tracking-[0.22em]">{copy.results}</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
                <h2 className="theme-heading text-2xl font-semibold tracking-[-0.03em]">
                  {filteredCourses.length} {copy.resultsTitle}
                </h2>
                {(query || categoryKey || levelKey) ? (
                  <p className="theme-muted text-sm">
                    {copy.resultsDescription}
                  </p>
                ) : null}
              </div>
            </div>

            {filteredCourses.length ? (
              <div className="grid gap-5 md:grid-cols-2">
                {filteredCourses.map((course) => (
                  <CatalogCourseCard course={course} key={course.id} />
                ))}
              </div>
            ) : (
              <div className="public-section-card rounded-lg p-8">
                <h3 className="theme-heading text-2xl font-semibold tracking-[-0.03em]">{copy.emptyTitle}</h3>
                <p className="theme-muted mt-4 text-sm leading-8">{copy.emptyDescription}</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default PublicCatalogPage
