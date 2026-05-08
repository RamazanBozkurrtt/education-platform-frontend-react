import { useDeferredValue, useEffect, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import CourseCard from '../components/CourseCard'
import PageHeader from '../components/PageHeader'
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

  return (
    <div className="space-y-6">
      <PageHeader
        description={t('searchPage.description')}
        eyebrow={t('searchPage.eyebrow')}
        title={t('searchPage.title')}
      />

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
            <p className="text-sm font-semibold text-white">{t('searchPage.categories')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  category
                    ? 'border-white/10 bg-[color:var(--surface-muted)] text-slate-400 hover:border-white/16 hover:text-white'
                    : 'border-white/14 bg-[color:var(--surface-strong)] text-slate-100'
                }`}
                onClick={() => setCategory('')}
                type="button"
              >
                {t('common.all')}
              </button>
              {data.filters.categories.map((item) => (
                <button
                  key={item}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${
                    category === item
                      ? 'border-white/14 bg-[color:var(--surface-strong)] text-slate-100'
                      : 'border-white/10 bg-[color:var(--surface-muted)] text-slate-400 hover:border-white/16 hover:text-white'
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
            <p className="text-sm font-semibold text-white">{t('searchPage.levels')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  level
                    ? 'border-white/10 bg-[color:var(--surface-muted)] text-slate-400 hover:border-white/16 hover:text-white'
                    : 'border-white/14 bg-[color:var(--surface-strong)] text-slate-100'
                }`}
                onClick={() => setLevel('')}
                type="button"
              >
                {t('common.all')}
              </button>
              {data.filters.levels.map((item) => (
                <button
                  key={item}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${
                    level === item
                      ? 'border-white/14 bg-[color:var(--surface-strong)] text-slate-100'
                      : 'border-white/10 bg-[color:var(--surface-muted)] text-slate-400 hover:border-white/16 hover:text-white'
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
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">{t('searchPage.results')}</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">
                  {t('searchPage.matchingCourses', { count: data.results.length })}
                </h2>
              </div>
              {isFetching ? (
                <span className="rounded-full border border-white/10 bg-[color:var(--surface-muted)] px-3 py-1 text-xs text-slate-200">
                  {t('searchPage.updating')}
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-400">{t('searchPage.resultsDescription')}</p>
          </Card>

          <div className="grid auto-rows-fr gap-6 xl:grid-cols-2">
            {data.results.map((course) => (
              <CourseCard course={course} key={course.id} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default SearchPage
