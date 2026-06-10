import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Filter, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import CatalogCourseCard from '../components/CatalogCourseCard'
import '../components/catalog/catalog.css'
import PublicNavbar from '../components/navigation/PublicNavbar'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Loader from '../components/ui/Loader'
import QueryErrorState from '../components/ui/QueryErrorState'
import { useLanguage } from '../hooks/useLanguage'
import { courseService } from '../services/courseService'
import { normalizeApiError } from '../shared/errors/normalizeApiError'
import { getCourseCategoryFilterKeys } from '../utils/courseCategory'
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
      eyebrow: 'EduBase Katalog',
      title: 'Kurs kesfini hedef odakli yonetin',
      description: 'Konu, seviye ve kapsam bilgisine gore kurslari karsilastirin; ekip ve bireysel ogrenme hedeflerine uygun secimi daha hizli yapin.',
      searchLabel: 'Kurs ara',
      searchPlaceholder: 'Kurs adi, beceri, egitmen veya etiket',
      filterLabel: 'Filtreler',
      all: 'Tumu',
      categories: 'Kategoriler',
      levels: 'Seviyeler',
      featured: 'One cikan basliklar',
      clear: 'Filtreleri temizle',
      results: 'Sonuclar',
      resultsTitle: 'kurs bulundu',
      resultsDescription: 'Secili filtrelere uygun kurslar asagida listeleniyor.',
      emptyTitle: 'Sonuc bulunamadi',
      emptyDescription: 'Arama ifadesini degistirip tekrar deneyin veya filtreleri sifirlayin.',
      stats: [
        { label: 'Kategori', getValue: (count: number) => String(count) },
        { label: 'Kurs', getValue: (count: number) => String(count) },
        { label: 'Seviye', getValue: (count: number) => String(count) },
      ],
      chips: {
        all: 'Tum kurslar',
        beginner: 'Baslangic seviyesi',
        categoryPrefix: 'Kategori',
      },
      navSections: [{ id: 'course-results', label: 'Kurslar' }],
      categoryLoadFailed: 'Kategoriler yuklenemedi.',
      retryCategoryLoad: 'Tekrar dene',
    }
    : {
      eyebrow: 'EduBase Catalog',
      title: 'Run course discovery with clear structure',
      description: 'Compare courses by topic, level, and scope to make faster decisions for individual and team learning goals.',
      searchLabel: 'Search courses',
      searchPlaceholder: 'Course title, skill, instructor, or tag',
      filterLabel: 'Filters',
      all: 'All',
      categories: 'Categories',
      levels: 'Levels',
      featured: 'Featured topics',
      clear: 'Clear filters',
      results: 'Results',
      resultsTitle: 'courses found',
      resultsDescription: 'Courses matching your selected filters are listed below.',
      emptyTitle: 'No results found',
      emptyDescription: 'Try a different search phrase or reset your filters.',
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
      categoryLoadFailed: 'Categories could not be loaded.',
      retryCategoryLoad: 'Retry',
    }

  const { data: courses, error, isLoading } = useQuery({
    queryKey: ['public-catalog', language],
    queryFn: () => courseService.getCourses(language),
  })
  const {
    data: categoriesFromApi = [],
    error: categoriesError,
    refetch: refetchCategories,
    isFetching: isFetchingCategories,
  } = useQuery({
    queryKey: ['public-catalog-categories'],
    queryFn: () => courseService.getPublicCategories(),
    staleTime: 0,
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
      count: resolvedCourses.filter((course) => getCourseCategoryFilterKeys(course).includes(category.id)).length,
      highlight: resolvedCourses.find((course) => getCourseCategoryFilterKeys(course).includes(category.id))?.tags.slice(0, 2).join(' / ')
        ?? (language === 'tr' ? 'Kurslari incele' : 'Explore courses'),
    })).sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
  }, [categoriesFromApi, language, resolvedCourses])

  const levels = useMemo(() => getCatalogLevels(resolvedCourses), [resolvedCourses])
  const featuredCourses = useMemo(() => [...resolvedCourses].sort((left, right) => right.rating - left.rating).slice(0, 3), [resolvedCourses])

  const chips = useMemo(() => {
    const firstCategory = categories[0]
    const beginnerLevel = levels.find((item) => {
      const normalized = item.label.toLocaleLowerCase('tr-TR')
      return normalized.includes('beginner') || normalized.includes('başlangıç') || normalized.includes('baslangic')
    }) ?? levels[0]
    const nextChips: Array<{ label: string; value: { category?: string; level?: string } }> = [
      { label: copy.chips.all, value: {} },
      { label: copy.chips.beginner, value: beginnerLevel ? { level: beginnerLevel.key } : {} },
    ]

    if (firstCategory) {
      nextChips.push({
        label: `${copy.chips.categoryPrefix}: ${firstCategory.label}`,
        value: { category: firstCategory.key },
      })
    }

    return nextChips
  }, [categories, copy.chips.all, copy.chips.beginner, copy.chips.categoryPrefix, levels])

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

      <main className="catalog-main">
        {categoriesError ? (
          <section className="mx-auto mb-4 w-full max-w-[1200px] px-5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-cards)] border border-[color:var(--danger)] bg-[color:var(--surface-soft-peach)] px-4 py-3">
              <p className="theme-text text-sm font-medium">{copy.categoryLoadFailed}</p>
              <Button disabled={isFetchingCategories} onClick={() => void refetchCategories()} size="sm" type="button" variant="secondary">
                {copy.retryCategoryLoad}
              </Button>
            </div>
          </section>
        ) : null}

        <section className="catalog-hero">
          <div className="catalog-hero-copy">
            <p className="catalog-eyebrow">{copy.eyebrow}</p>
            <h1 className="catalog-title">{copy.title}</h1>
            <p className="catalog-description">{copy.description}</p>

            <div className="catalog-quick-links">
              {chips.map((chip) => (
                <Link className="public-outline-button h-10 px-4 text-sm font-semibold" key={chip.label} to={buildCatalogPath(chip.value)}>
                  {chip.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="catalog-hero-panel">
            <Input
              className="catalog-search-shell"
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

            <div className="catalog-stats-strip">
              <div className="catalog-stat">
                <p className="catalog-stat-label">{copy.stats[0].label}</p>
                <p className="catalog-stat-value">{copy.stats[0].getValue(categories.length)}</p>
              </div>
              <div className="catalog-stat">
                <p className="catalog-stat-label">{copy.stats[1].label}</p>
                <p className="catalog-stat-value">{copy.stats[1].getValue(resolvedCourses.length)}</p>
              </div>
              <div className="catalog-stat">
                <p className="catalog-stat-label">{copy.stats[2].label}</p>
                <p className="catalog-stat-value">{copy.stats[2].getValue(levels.length)}</p>
              </div>
            </div>

            <p className="catalog-hero-note">{copy.resultsDescription}</p>
          </div>
        </section>

        <section className="catalog-layout" id="course-results">
          <aside className="catalog-filter-panel">
            <p className="catalog-filter-title">
              <Filter className="h-4 w-4" />
              {copy.filterLabel}
            </p>

            <div className="catalog-filter-group">
              <h3>{copy.categories}</h3>
              <div className="catalog-filter-chips">
                <button
                  className={`catalog-chip ${categoryKey ? '' : 'catalog-chip-active'}`}
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
                    className={`catalog-chip ${categoryKey === item.key ? 'catalog-chip-active' : ''}`}
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

            <div className="catalog-filter-group">
              <h3>{copy.levels}</h3>
              <div className="catalog-filter-chips">
                <button
                  className={`catalog-chip ${levelKey ? '' : 'catalog-chip-active'}`}
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
                    className={`catalog-chip ${levelKey === item.key ? 'catalog-chip-active' : ''}`}
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

            <div className="catalog-filter-group">
              <h3>{copy.featured}</h3>
              <div className="catalog-filter-chips">
                {featuredCourses.map((course) => (
                  <button
                    className="catalog-chip"
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

            <button
              className="public-outline-button h-10 px-4 text-sm font-semibold catalog-clear-button"
              onClick={() => {
                setQuery('')
                setCategoryKey('')
                setLevelKey('')
                syncFiltersToUrl({ query: '', category: '', level: '' })
              }}
              type="button"
            >
              {copy.clear}
            </button>
          </aside>

          <div className="catalog-results">
            <div className="catalog-results-head">
              <p className="catalog-results-label">{copy.results}</p>
              <div className="catalog-results-row">
                <h2 className="catalog-results-title">
                  {filteredCourses.length} {copy.resultsTitle}
                </h2>
                {(query || categoryKey || levelKey) ? (
                  <p className="catalog-results-description">{copy.resultsDescription}</p>
                ) : null}
              </div>
            </div>

            {filteredCourses.length ? (
              <div className="catalog-course-grid">
                {filteredCourses.map((course) => (
                  <CatalogCourseCard course={course} key={course.id} />
                ))}
              </div>
            ) : (
              <div className="catalog-empty-state">
                <h3>{copy.emptyTitle}</h3>
                <p>{copy.emptyDescription}</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default PublicCatalogPage
