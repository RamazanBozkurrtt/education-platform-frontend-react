import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Menu, Search, ShoppingCart } from 'lucide-react'
import { useDeferredValue, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { resolveServiceUrl } from '../../config/api'
import { useCart } from '../../hooks/useCart'
import { useLanguage } from '../../hooks/useLanguage'
import { API_ENDPOINTS } from '../../services/endpoints'
import { searchService } from '../../services/searchService'
import { getCourseCategoryLabels } from '../../utils/courseCategory'
import { ROUTES } from '../../utils/constants'
import type { User } from '../../utils/types'
import Button from '../ui/Button'
import LanguageSwitcher from '../ui/LanguageSwitcher'
import ThemeToggle from '../ui/ThemeToggle'

interface TopNavbarProps {
  onOpenMobileMenu: () => void
  user: User
  title: string
}

const TopNavbar = ({ onOpenMobileMenu, title, user }: TopNavbarProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { language } = useLanguage()
  const { itemCount } = useCart()
  const profileRoleLabel = user.headline?.trim() || t(user.roleLabelKey)
  const [searchValue, setSearchValue] = useState('')
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement | null>(null)
  const normalizedQuery = searchValue.trim()
  const deferredQuery = useDeferredValue(normalizedQuery)

  const { data: searchData, isFetching: isSearchFetching } = useQuery({
    queryKey: ['top-navbar-search', language, deferredQuery],
    queryFn: () => searchService.search({
      query: deferredQuery,
      category: '',
      level: '',
    }, language),
    enabled: deferredQuery.length > 0,
    placeholderData: keepPreviousData,
  })

  const topResults = useMemo(() => searchData?.results.slice(0, 3) ?? [], [searchData?.results])

  useEffect(() => {
    const handleDocumentMouseDown = (event: MouseEvent) => {
      const container = searchContainerRef.current
      const target = event.target as Node | null

      if (!container || !target || container.contains(target)) {
        return
      }

      setIsSuggestionsOpen(false)
    }

    document.addEventListener('mousedown', handleDocumentMouseDown)

    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown)
    }
  }, [])

  const handleSubmitSearch = () => {
    if (!normalizedQuery) {
      return
    }

    setIsSuggestionsOpen(false)
    navigate(`${ROUTES.search}?q=${encodeURIComponent(normalizedQuery)}`)
  }

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleSubmitSearch()
      return
    }

    if (event.key === 'Escape') {
      setIsSuggestionsOpen(false)
    }
  }

  const handleSelectCourse = (slug: string) => {
    setIsSuggestionsOpen(false)
    setSearchValue('')
    navigate(ROUTES.courseDetail(slug))
  }

  const showSuggestions = isSuggestionsOpen && normalizedQuery.length > 0

  return (
    <header className="sticky top-2 z-20 flex flex-wrap items-center justify-between gap-3 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-3 shadow-none lg:flex-nowrap lg:px-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <Button aria-label="Open menu" className="lg:hidden" onClick={onOpenMobileMenu} size="sm" variant="ghost">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <p className="theme-subtle text-[11px] font-semibold uppercase tracking-[0.2em]">{t('nav.overview')}</p>
          <h1 className="theme-heading truncate text-lg font-semibold md:text-xl">{title}</h1>
        </div>
      </div>

      <div className="order-3 flex w-full justify-center lg:order-none lg:flex-1 lg:px-4">
        <div className="relative w-full max-w-2xl" ref={searchContainerRef}>
          <div className="theme-surface-soft theme-muted flex h-10 w-full items-center gap-3 rounded-sm border border-[color:var(--border)] px-3.5 transition focus-within:border-[color:var(--border-strong)] focus-within:bg-[color:var(--surface-hover)]">
            <Search className="h-4 w-4" />
            <input
              aria-label={t('nav.searchPlaceholder')}
              className="theme-text theme-placeholder w-full bg-transparent text-sm outline-none"
              onChange={(event) => {
                setSearchValue(event.target.value)
                setIsSuggestionsOpen(true)
              }}
              onFocus={() => {
                if (normalizedQuery.length > 0) {
                  setIsSuggestionsOpen(true)
                }
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder={t('nav.searchPlaceholder')}
              type="search"
              value={searchValue}
            />
          </div>

          {showSuggestions ? (
            <div className="absolute top-[calc(100%+0.4rem)] z-30 w-full rounded-sm border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-1.5 shadow-[var(--shadow-sm)]">
              {isSearchFetching ? (
                <p className="theme-muted px-3 py-2 text-xs">
                  {language === 'tr' ? 'Araniyor...' : 'Searching...'}
                </p>
              ) : topResults.length > 0 ? (
                <ul className="space-y-1">
                  {topResults.map((course) => {
                    const fallbackImageUrl = resolveServiceUrl(API_ENDPOINTS.courses.image.public(course.id))
                    const courseImageUrl = course.imageUrl || fallbackImageUrl
                    const tags = getCourseCategoryLabels(course).slice(0, 2)

                    return (
                      <li key={course.id}>
                      <button
                        className="w-full rounded-sm px-3 py-2 text-left transition hover:bg-[color:var(--surface-hover)]"
                        onClick={() => handleSelectCourse(course.slug)}
                        type="button"
                      >
                        <div className="flex items-start gap-3">
                          <img
                            alt={course.title}
                            className="h-12 w-18 shrink-0 rounded-sm border border-[color:var(--border)] object-cover"
                            loading="lazy"
                            onError={(event) => {
                              const target = event.currentTarget

                              if (target.dataset.fallbackApplied === 'true') {
                                return
                              }

                              target.dataset.fallbackApplied = 'true'
                              target.src = fallbackImageUrl
                            }}
                            src={courseImageUrl}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-[color:var(--text-heading)]">{course.title}</p>
                            <p className="mt-0.5 truncate text-xs text-[color:var(--text-muted)]">{course.instructor.name}</p>
                            {tags.length > 0 ? (
                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {tags.map((tag) => (
                                  <span
                                    className="rounded-sm border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-1.5 py-0.5 text-[10px] font-medium text-[color:var(--text-muted)]"
                                    key={`${course.id}-${tag}`}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </button>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="theme-muted px-3 py-2 text-xs">
                  {language === 'tr' ? 'Sonuc bulunamadi' : 'No results found'}
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="hidden xl:block">
          <LanguageSwitcher compact />
        </div>
        <ThemeToggle compact />
        <Link
          className="hidden items-center gap-2 rounded-sm border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2 text-sm text-[color:var(--text)] transition hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-hover)] sm:flex"
          to={ROUTES.cart}
        >
          <ShoppingCart className="h-4 w-4" />
          {t('cart.courseCount', { count: itemCount })}
        </Link>
        <Link
          className="theme-surface-soft flex items-center gap-3 rounded-sm border border-[color:var(--border)] px-2.5 py-2 transition hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-hover)]"
          to={ROUTES.profile}
        >
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-sm border border-[color:var(--border)] bg-[color:var(--primary)] text-sm font-semibold text-white">
            {user.avatarUrl ? (
              <img alt={user.name} className="h-full w-full object-cover" src={user.avatarUrl} />
            ) : (
              user.initials
            )}
          </div>
          <div className="hidden text-left sm:block">
            <p className="theme-heading text-sm font-semibold">{user.name}</p>
            <p className="theme-muted text-xs">{profileRoleLabel}</p>
          </div>
        </Link>
      </div>
    </header>
  )
}

export default TopNavbar
