import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Filter, Search } from 'lucide-react'
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
import { getCourseCategoryFilterKey } from '../utils/courseCategory'
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
      eyebrow: 'Kursları keşfet',
      title: 'Kurs kataloğu',
      description: 'Kursları arama, kategori ve seviye filtreleriyle incele.',
      searchLabel: 'Kurs ara',
      searchPlaceholder: 'Kurs adı, beceri, eğitmen veya etiket',
      filterLabel: 'Filtreler',
      all: 'Tümü',
      categories: 'Kategoriler',
      levels: 'Seviyeler',
      featured: 'Öne çıkanlar',
      clear: 'Filtreleri temizle',
      results: 'Sonuçlar',
      resultsTitle: 'kurs bulundu',
      resultsDescription: 'Filtrelerine uyan kurslar listeleniyor.',
      emptyTitle: 'Sonuç bulunamadı',
      emptyDescription: 'Aramayı değiştir veya filtreleri temizleyip yeniden dene.',
      stats: [
        { label: 'Kategori', getValue: (count: number) => String(count) },
        { label: 'Kurs', getValue: (count: number) => String(count) },
        { label: 'Seviye', getValue: (count: number) => String(count) },
      ],
      chips: {
        all: 'Tüm kurslar',
        beginner: 'Başlangıç seviyesi',
        categoryPrefix: 'Kategori',
      },
      navSections: [{ id: 'course-results', label: 'Kurslar' }],
    }
    : {
      eyebrow: 'Explore courses',
      title: 'Course catalog',
      description: 'Browse courses with search, category, and level filters.',
      searchLabel: 'Search courses',
      searchPlaceholder: 'Course title, skill, instructor, or tag',
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
      emptyDescription: 'Try another search phrase or clear filters.',
      stats: [
        { label: 'Categories', getValue: (count: number) => String(count) },
        { label: 'Courses', getValue: (count: number) => String(count) },
        { label: 'Levels', getValue: (count: number) => String(count) },
      ],
      chips: {
        all: 'All courses',
        beginner: 'Beginner level',
        categoryPrefix: 'Category',
      },
      navSections: [{ id: 'course-results', label: 'Courses' }],
    }

  const { data: courses, error, isLoading } = useQuery({
    queryKey: ['public-catalog', language],
    queryFn: () => courseService.getCourses(language),
  })
  const { data: categoriesFromApi = [] } = useQuery({
    queryKey: ['public-catalog-categories'],
    queryFn: () => courseService.getPublicCategories(),
  })
  const appError = error ? normalizeApiError(error) : null
  const hasRecoverablePublicError = appError?.kind === 'auth' || appError?.kind === 'forbidden'
  const resolvedCourses = courses ?? []

  const categories = useMemo(() => {
    if (categoriesFromApi.length === 0) {
      return getCatalogCategories(resolvedCourses)
    }

    return categoriesFromApi.map((category) => ({
      key: category.id,
      label: category.categoryName,
      count: resolvedCourses.filter((course) => getCourseCategoryFilterKey(course) === category.id).length,
      highlight: resolvedCourses.find((course) => getCourseCategoryFilterKey(course) === category.id)?.tags.slice(0, 2).join(' / ')
        ?? (language === 'tr' ? 'Kursları incele' : 'Explore courses'),
    })).sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
  }, [categoriesFromApi, language, resolvedCourses])
  const levels = useMemo(() => getCatalogLevels(resolvedCourses), [resolvedCourses])
  const featuredCourses = useMemo(() => [...resolvedCourses].sort((left, right) => right.rating - left.rating).slice(0, 3), [resolvedCourses])
  const chips = useMemo(() => {
    const firstCategory = categories[0]
    const nextChips: Array<{ label: string; value: { category?: string; level?: string } }> = [
      { label: copy.chips.all, value: {} },
      { label: copy.chips.beginner, value: { level: 'beginner' } },
    ]

    if (firstCategory) {
      nextChips.push({
        label: `${copy.chips.categoryPrefix}: ${firstCategory.label}`,
        value: { category: firstCategory.key },
      })
    }

    return nextChips
  }, [categories, copy.chips.all, copy.chips.beginner, copy.chips.categoryPrefix])

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
          <div className="public-section-card rounded-[var(--radius-cards)] p-8 md:p-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--primary)]">{copy.eyebrow}</p>
            <h1 className="theme-heading mt-4 text-4xl font-semibold tracking-[-0.03em] md:text-5xl">{copy.title}</h1>
            <p className="theme-muted mt-5 max-w-2xl text-sm leading-8 md:text-base">{copy.description}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              {chips.map((chip) => (
                <Link className="public-outline-button h-11 px-4 text-sm font-semibold" key={chip.label} to={buildCatalogPath(chip.value)}>
                  {chip.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="public-section-card rounded-[var(--radius-cards)] p-7 md:p-8">
            <Input
              className="rounded-[var(--radius-buttons)] border-[color:var(--border)] bg-[color:var(--surface-soft)]"
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
              <div className="rounded-[var(--radius-cards)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-5 py-5">
                <p className="theme-subtle text-xs uppercase tracking-[0.2em]">{copy.stats[0].label}</p>
                <p className="theme-heading mt-2 text-3xl font-semibold tracking-[-0.04em]">{copy.stats[0].getValue(categories.length)}</p>
              </div>
              <div className="rounded-[var(--radius-cards)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-5 py-5">
                <p className="theme-subtle text-xs uppercase tracking-[0.2em]">{copy.stats[1].label}</p>
                <p className="theme-heading mt-2 text-3xl font-semibold tracking-[-0.04em]">{copy.stats[1].getValue(resolvedCourses.length)}</p>
              </div>
              <div className="rounded-[var(--radius-cards)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-5 py-5">
                <p className="theme-subtle text-xs uppercase tracking-[0.2em]">{copy.stats[2].label}</p>
                <p className="theme-heading mt-2 text-3xl font-semibold tracking-[-0.04em]">{copy.stats[2].getValue(levels.length)}</p>
              </div>
            </div>

            <p className="theme-muted mt-5 text-sm leading-7">{copy.resultsDescription}</p>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]" id="course-results">
          <aside className="public-section-card h-fit rounded-[var(--radius-cards)] p-5">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-[color:var(--primary)]" />
              <p className="theme-heading text-sm font-semibold">{copy.filterLabel}</p>
            </div>

            <div className="mt-6">
              <p className="theme-heading text-sm font-semibold">{copy.categories}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className={`rounded-[var(--radius-badges)] border px-3 py-2 text-sm transition ${categoryKey ? 'border-[color:var(--border)] bg-[color:var(--surface-soft)] theme-muted hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-hover)]' : 'border-[color:var(--primary)] bg-[color:var(--surface-muted)] text-[color:var(--primary)]'}`}
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
                    className={`rounded-[var(--radius-badges)] border px-3 py-2 text-sm transition ${categoryKey === item.key ? 'border-[color:var(--primary)] bg-[color:var(--surface-muted)] text-[color:var(--primary)]' : 'border-[color:var(--border)] bg-[color:var(--surface-soft)] theme-muted hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-hover)]'}`}
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
                  className={`rounded-[var(--radius-badges)] border px-3 py-2 text-sm transition ${levelKey ? 'border-[color:var(--border)] bg-[color:var(--surface-soft)] theme-muted hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-hover)]' : 'border-[color:var(--primary)] bg-[color:var(--surface-muted)] text-[color:var(--primary)]'}`}
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
                    className={`rounded-[var(--radius-badges)] border px-3 py-2 text-sm transition ${levelKey === item.key ? 'border-[color:var(--primary)] bg-[color:var(--surface-muted)] text-[color:var(--primary)]' : 'border-[color:var(--border)] bg-[color:var(--surface-soft)] theme-muted hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-hover)]'}`}
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
                    className="rounded-[var(--radius-badges)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2 text-sm theme-muted transition hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-hover)]"
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
            <div className="public-section-card rounded-[var(--radius-cards)] p-6">
              <p className="theme-subtle text-xs uppercase tracking-[0.22em]">{copy.results}</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
                <h2 className="theme-heading text-2xl font-semibold tracking-[-0.03em]">
                  {filteredCourses.length} {copy.resultsTitle}
                </h2>
                {(query || categoryKey || levelKey) ? (
                  <p className="theme-muted text-sm">{copy.resultsDescription}</p>
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
              <div className="public-section-card rounded-[var(--radius-cards)] p-8">
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


