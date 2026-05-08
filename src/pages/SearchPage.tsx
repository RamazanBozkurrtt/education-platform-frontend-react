import { useDeferredValue, useEffect, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import CourseCard from '../components/CourseCard'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Loader from '../components/ui/Loader'
import QueryErrorState from '../components/ui/QueryErrorState'
import { useLanguage } from '../hooks/useLanguage'
import { searchService } from '../services/searchService'

const SearchPage = () => {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [level, setLevel] = useState('')
  const deferredQuery = useDeferredValue(query)

  const { data, error, isFetching, isLoading } = useQuery({
    queryKey: ['search-results', language, deferredQuery, category, level],
    queryFn: () =>
      searchService.search({
        query: deferredQuery,
        category,
        level,
      }, language),
    placeholderData: keepPreviousData,
  })

  useEffect(() => {
    setCategory('')
    setLevel('')
  }, [language])

  if (error) {
    return <QueryErrorState error={error} />
  }

  if (isLoading || !data) {
    return <Loader label={t('loader.searchExperience')} />
  }

  const hasFilters = Boolean(query.trim() || category || level)

  return (
    <div className="space-y-6">
      <Card>
        <p className="theme-subtle text-xs font-semibold uppercase tracking-[0.16em]">{t('searchPage.eyebrow')}</p>
        <h1 className="theme-heading mt-2 text-3xl font-semibold tracking-tight">{t('searchPage.title')}</h1>
        <p className="theme-muted mt-3 text-sm leading-7">{t('searchPage.description')}</p>
      </Card>

      <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="h-fit min-w-0">
          <Input
            icon={<Search className="h-4 w-4" />}
            label={t('searchPage.search')}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('searchPage.searchPlaceholder')}
            value={query}
          />

          <div className="mt-6">
            <p className="theme-heading text-sm font-semibold">{t('searchPage.categories')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className={`rounded-[var(--radius-badges)] border px-3 py-1.5 text-sm transition ${
                  category
                    ? 'border-[color:var(--border)] bg-[color:var(--surface-strong)] theme-muted hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-hover)]'
                    : 'border-[color:var(--primary)] bg-[color:var(--surface-muted)] text-[color:var(--primary)]'
                }`}
                onClick={() => setCategory('')}
                type="button"
              >
                {t('common.all')}
              </button>
              {data.filters.categories.map((item) => (
                <button
                  key={item}
                  className={`rounded-[var(--radius-badges)] border px-3 py-1.5 text-sm transition ${
                    category === item
                      ? 'border-[color:var(--primary)] bg-[color:var(--surface-muted)] text-[color:var(--primary)]'
                      : 'border-[color:var(--border)] bg-[color:var(--surface-strong)] theme-muted hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-hover)]'
                  }`}
                  onClick={() => setCategory(item)}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="theme-heading text-sm font-semibold">{t('searchPage.levels')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className={`rounded-[var(--radius-badges)] border px-3 py-1.5 text-sm transition ${
                  level
                    ? 'border-[color:var(--border)] bg-[color:var(--surface-strong)] theme-muted hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-hover)]'
                    : 'border-[color:var(--primary)] bg-[color:var(--surface-muted)] text-[color:var(--primary)]'
                }`}
                onClick={() => setLevel('')}
                type="button"
              >
                {t('common.all')}
              </button>
              {data.filters.levels.map((item) => (
                <button
                  key={item}
                  className={`rounded-[var(--radius-badges)] border px-3 py-1.5 text-sm transition ${
                    level === item
                      ? 'border-[color:var(--primary)] bg-[color:var(--surface-muted)] text-[color:var(--primary)]'
                      : 'border-[color:var(--border)] bg-[color:var(--surface-strong)] theme-muted hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-hover)]'
                  }`}
                  onClick={() => setLevel(item)}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <div className="min-w-0 space-y-4">
          <Card>
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
              <div>
                <p className="theme-subtle text-xs font-medium uppercase tracking-[0.16em]">{t('searchPage.results')}</p>
                <h2 className="theme-heading mt-1 text-2xl font-semibold">
                  {t('searchPage.matchingCourses', { count: data.results.length })}
                </h2>
              </div>
              {isFetching ? (
                <span className="rounded-[var(--radius-badges)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-1 text-xs theme-muted">
                  {t('searchPage.updating')}
                </span>
              ) : null}
            </div>
            <p className="theme-muted mt-3 text-sm leading-6">{t('searchPage.resultsDescription')}</p>
          </Card>

          {data.results.length > 0 ? (
            <div className="grid auto-rows-fr gap-6 xl:grid-cols-2">
              {data.results.map((course) => (
                <CourseCard course={course} key={course.id} />
              ))}
            </div>
          ) : (
            <Card>
              <h3 className="theme-heading text-xl font-semibold">{hasFilters ? 'Sonuc bulunamadi' : 'Arama yap'}</h3>
              <p className="theme-muted mt-2 text-sm">
                {hasFilters
                  ? 'Arama filtresini degistirip yeniden dene.'
                  : 'Kurslari bulmak icin arama ifadesi veya filtre kullan.'}
              </p>
            </Card>
          )}
        </div>
      </section>
    </div>
  )
}

export default SearchPage
