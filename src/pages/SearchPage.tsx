import { useDeferredValue, useEffect, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import CourseCatalogList from '../components/dashboard/CourseCatalogList'
import DashboardPageHeader from '../components/dashboard/DashboardPageHeader'
import DashboardSection from '../components/dashboard/DashboardSection'
import EmptyState from '../components/dashboard/EmptyState'
import RecommendationSection from '../components/recommendations/RecommendationSection'
import StatusBadge from '../components/dashboard/StatusBadge'
import Input from '../components/ui/Input'
import Loader from '../components/ui/Loader'
import QueryErrorState from '../components/ui/QueryErrorState'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import { recommendationService } from '../services/recommendationService'
import { searchService } from '../services/searchService'

const chipClass = (active: boolean) => {
  if (active) {
    return 'rounded-sm border border-[color:var(--primary)] bg-[color:var(--surface-soft)] px-3 py-1.5 text-sm font-medium text-[color:var(--primary)]'
  }

  return 'rounded-sm border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-1.5 text-sm font-medium theme-muted transition hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-hover)]'
}

const SearchPage = () => {
  const { t } = useTranslation()
  const { isAuthenticated, isBootstrapping, user } = useAuth()
  const { language } = useLanguage()
  const [searchParams] = useSearchParams()
  const queryFromUrl = searchParams.get('q')?.trim() ?? ''
  const [query, setQuery] = useState(queryFromUrl)
  const [category, setCategory] = useState('')
  const [level, setLevel] = useState('')
  const deferredQuery = useDeferredValue(query)
  const recommendationQuery = deferredQuery.trim()
  const shouldLoadSearchRecommendations =
    !isBootstrapping &&
    isAuthenticated &&
    recommendationQuery.length > 0

  useEffect(() => {
    setQuery(queryFromUrl)
  }, [queryFromUrl])

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

  const {
    data: searchRecommendationData,
    isLoading: isSearchRecommendationLoading,
    isError: isSearchRecommendationError,
  } = useQuery({
    queryKey: ['search-recommendations', user?.id, language, recommendationQuery],
    queryFn: () => recommendationService.getSearchRecommendations(recommendationQuery, 6),
    enabled: shouldLoadSearchRecommendations,
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
    <div className="space-y-8">
      <DashboardPageHeader
        description={t('searchPage.description')}
        eyebrow={t('searchPage.eyebrow')}
        title={t('searchPage.title')}
      />

      <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="h-fit min-w-0 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-4 xl:sticky xl:top-24">
          <Input
            icon={<Search className="h-4 w-4" />}
            label={t('searchPage.search')}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('searchPage.searchPlaceholder')}
            value={query}
          />

          <div className="mt-5 border-t border-[color:var(--border)] pt-4">
            <p className="theme-heading text-sm font-semibold">{t('searchPage.categories')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                aria-pressed={!category}
                className={chipClass(!category)}
                onClick={() => setCategory('')}
                type="button"
              >
                {t('common.all')}
              </button>
              {data.filters.categories.map((item) => (
                <button
                  aria-pressed={category === item}
                  className={chipClass(category === item)}
                  key={item}
                  onClick={() => setCategory(item)}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 border-t border-[color:var(--border)] pt-4">
            <p className="theme-heading text-sm font-semibold">{t('searchPage.levels')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                aria-pressed={!level}
                className={chipClass(!level)}
                onClick={() => setLevel('')}
                type="button"
              >
                {t('common.all')}
              </button>
              {data.filters.levels.map((item) => (
                <button
                  aria-pressed={level === item}
                  className={chipClass(level === item)}
                  key={item}
                  onClick={() => setLevel(item)}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="min-w-0 space-y-5">
          {recommendationQuery ? (
            <RecommendationSection
              description={language === 'tr'
                ? 'Arama ifaden ve ogrenme gecmisine gore one cikan kurslar.'
                : 'Courses highlighted for your query and learning history.'}
              emptyDescription={language === 'tr'
                ? 'Bu arama icin ek oneri bulunamadi. Sonuclari inceleyebilirsin.'
                : 'No extra recommendation was found for this search yet. You can still review regular results.'}
              emptyTitle={language === 'tr' ? 'Akilli oneri bulunamadi' : 'No smart recommendations found'}
              errorMessage={isSearchRecommendationError ? 'failed' : null}
              isLoading={isSearchRecommendationLoading}
              language={language}
              recommendations={searchRecommendationData?.recommendations ?? []}
              title={language === 'tr' ? 'Aramana Gore Akilli Oneriler' : 'Smart Recommendations For Your Search'}
            />
          ) : null}

          <DashboardSection
            action={isFetching ? <StatusBadge>{t('searchPage.updating')}</StatusBadge> : null}
            description={t('searchPage.resultsDescription')}
            title={t('searchPage.matchingCourses', { count: data.results.length })}
          >
            {data.results.length > 0 ? (
              <CourseCatalogList courses={data.results} />
            ) : (
              <EmptyState
                description={hasFilters
                  ? language === 'tr' ? 'Filtrelerini guncelleyip yeniden dene.' : 'Adjust your filters and try again.'
                  : language === 'tr' ? 'Kurs bulmak icin arama veya filtre kullan.' : 'Use search or filters to find courses.'}
                title={hasFilters
                  ? language === 'tr' ? 'Sonuc bulunamadi' : 'No results found'
                  : language === 'tr' ? 'Arama yap' : 'Start searching'}
              />
            )}
          </DashboardSection>
        </div>
      </section>
    </div>
  )
}

export default SearchPage
