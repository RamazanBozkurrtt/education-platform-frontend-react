import { useEffect, useState } from 'react'
import { ArrowRight, ChevronDown, House, Languages, Layers3, Menu, X } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import LanguageSwitcher from '../ui/LanguageSwitcher'
import { useLanguage } from '../../hooks/useLanguage'
import { APP_NAME, ROUTES } from '../../utils/constants'
import { buildCatalogPath } from '../../utils/catalogFilters'
import { cn } from '../../utils/helpers'
import type { CatalogCategorySummary } from '../../utils/catalogFilters'
import type { Course } from '../../utils/types'

interface PublicNavbarProps {
  anchorLinks?: Array<{
    id: string
    label: string
  }>
  categories: CatalogCategorySummary[]
  featuredCourses: Course[]
  onAnchorClick?: (id: string) => void
}

const PublicNavbar = ({
  anchorLinks = [],
  categories,
  featuredCourses,
  onAnchorClick,
}: PublicNavbarProps) => {
  const { language } = useLanguage()
  const location = useLocation()
  const [openDesktopMenu, setOpenDesktopMenu] = useState<string | null>(null)
  const [openMobileMenu, setOpenMobileMenu] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  const copy = language === 'tr'
    ? {
      home: 'Ana sayfa',
      courses: 'Kurslar',
      categories: 'Kategoriler',
      allCourses: 'T\u00fcm kurslar',
      allCoursesDescription: 'Arama ve filtrelerle katalo\u011fu incele',
      featuredCourses: '\u00d6ne \u00e7\u0131kan kurslar',
      featuredCoursesDescription: 'En \u00e7ok incelenen e\u011fitimler',
      categoryDescription: 'Bu kategoriye ait kurslar\u0131 g\u00f6r',
      menu: 'Men\u00fc',
      close: 'Kapat',
      platformLabel: 'Online e\u011fitim',
      mobileCoursesLabel: 'Kurs men\u00fcs\u00fc',
      mobileCategoriesLabel: 'Kategori men\u00fcs\u00fc',
      signIn: 'Giri\u015f yap',
      register: 'Hesap olu\u015ftur',
    }
    : {
      home: 'Home',
      courses: 'Courses',
      categories: 'Categories',
      allCourses: 'View all courses',
      allCoursesDescription: 'Browse the full catalog with search and filters',
      featuredCourses: 'Featured courses',
      featuredCoursesDescription: 'Courses learners review most often',
      categoryDescription: 'View courses in this category',
      menu: 'Menu',
      close: 'Close',
      platformLabel: 'Online learning',
      mobileCoursesLabel: 'Course menu',
      mobileCategoriesLabel: 'Category menu',
      signIn: 'Sign in',
      register: 'Create account',
    }

  const normalizedPath = location.pathname
  const isHome = normalizedPath === ROUTES.home
  const isCatalog = normalizedPath === ROUTES.catalog
  const shouldShowHomeNavLink = !isHome

  useEffect(() => {
    setMobileOpen(false)
    setOpenDesktopMenu(null)
    setOpenMobileMenu(null)
  }, [location.pathname, location.search])

  const handleAnchorClick = (id: string) => {
    setMobileOpen(false)
    setOpenDesktopMenu(null)
    setOpenMobileMenu(null)
    onAnchorClick?.(id)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--border)] bg-[color:var(--surface-white)]">
      <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4 px-4 py-4 lg:px-8">
        <Link className="flex items-center gap-3" to={ROUTES.home}>
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] text-[color:var(--primary)]">
            <Layers3 className="h-5 w-5" />
          </div>
          <div>
            <p className="theme-subtle text-[11px] font-semibold uppercase tracking-[0.28em]">{copy.platformLabel}</p>
            <p className="theme-heading text-lg font-semibold tracking-[-0.02em]">{APP_NAME}</p>
          </div>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
          {shouldShowHomeNavLink ? (
            <Link className="public-nav-link public-nav-home-link" to={ROUTES.home}>
              <House className="h-4 w-4" />
              {copy.home}
            </Link>
          ) : null}

          {anchorLinks.map((item) => (
            <button className="public-nav-link" key={item.id} onClick={() => handleAnchorClick(item.id)} type="button">
              {item.label}
            </button>
          ))}

          <div className="relative" onMouseEnter={() => setOpenDesktopMenu('courses')} onMouseLeave={() => setOpenDesktopMenu((current) => current === 'courses' ? null : current)}>
            <button
              aria-expanded={openDesktopMenu === 'courses'}
              aria-haspopup="menu"
              className={cn(
                'public-nav-link',
                isCatalog && 'public-nav-link-active',
              )}
              type="button"
            >
              {copy.courses}
              <ChevronDown className="h-4 w-4" />
            </button>

            <div className={cn('public-nav-panel right-0 w-[520px]', openDesktopMenu === 'courses' ? 'opacity-100' : 'pointer-events-none opacity-0')}>
              <div className="grid gap-4 md:grid-cols-[190px_1fr]">
                <Link className="public-dropdown-feature" to={ROUTES.catalog}>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--primary)]">{copy.allCourses}</span>
                  <span className="theme-heading mt-3 block text-lg font-semibold">{copy.featuredCourses}</span>
                  <span className="theme-muted mt-2 block text-sm leading-6">{copy.allCoursesDescription}</span>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--primary)]">
                    {copy.allCourses}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>

                <div className="grid gap-2">
                  {featuredCourses.slice(0, 3).map((course) => (
                    <Link
                      className="public-dropdown-link"
                      key={course.id}
                      to={buildCatalogPath({ query: course.title })}
                    >
                      <div>
                        <span className="theme-heading block text-sm font-semibold">{course.title}</span>
                        <span className="theme-muted mt-1 block text-sm">{course.category}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-[color:var(--primary)]" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="relative" onMouseEnter={() => setOpenDesktopMenu('categories')} onMouseLeave={() => setOpenDesktopMenu((current) => current === 'categories' ? null : current)}>
            <button
              aria-expanded={openDesktopMenu === 'categories'}
              aria-haspopup="menu"
              className="public-nav-link"
              type="button"
            >
              {copy.categories}
              <ChevronDown className="h-4 w-4" />
            </button>

            <div className={cn('public-nav-panel right-0 w-[560px]', openDesktopMenu === 'categories' ? 'opacity-100' : 'pointer-events-none opacity-0')}>
              <div className="grid gap-2 sm:grid-cols-2">
                {categories.map((category) => (
                  <Link
                    className="public-dropdown-link"
                    key={category.key}
                    to={buildCatalogPath({ category: category.key })}
                  >
                    <div>
                      <span className="theme-heading block text-sm font-semibold">{category.label}</span>
                      <span className="theme-muted mt-1 block text-sm">
                        {category.count} / {category.highlight}
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[color:var(--primary)]" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <div className="flex items-center gap-2 rounded-[var(--radius-navigation)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-2 py-1">
            <Languages className="h-4 w-4 text-[color:var(--primary)]" />
            <LanguageSwitcher compact />
          </div>
          <Link to={ROUTES.login}>
            <span className="public-outline-button h-10 px-4 text-sm font-semibold">{copy.signIn}</span>
          </Link>
          <Link to={ROUTES.register}>
            <span className="public-primary-button h-10 px-4 text-sm font-semibold">{copy.register}</span>
          </Link>
        </div>

        <button
          aria-label={mobileOpen ? copy.close : copy.menu}
          aria-controls="public-mobile-menu"
          aria-expanded={mobileOpen}
          className="public-outline-button h-11 w-11 px-0 lg:hidden"
          onClick={() => setMobileOpen((current) => !current)}
          type="button"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-[color:var(--border)] bg-[color:var(--surface-white)] px-4 py-4 lg:hidden" id="public-mobile-menu">
          <div className="mx-auto max-w-[1480px] space-y-3">
            {shouldShowHomeNavLink ? (
              <Link className="public-mobile-link" to={ROUTES.home}>
                {copy.home}
              </Link>
            ) : null}

            {anchorLinks.map((item) => (
              <button className="public-mobile-link w-full text-left" key={item.id} onClick={() => handleAnchorClick(item.id)} type="button">
                {item.label}
              </button>
            ))}

            <div className="public-mobile-group">
              <button
                aria-controls="public-mobile-courses"
                aria-expanded={openMobileMenu === 'courses'}
                className="public-mobile-toggle"
                onClick={() => setOpenMobileMenu((current) => current === 'courses' ? null : 'courses')}
                type="button"
              >
                <span>{copy.mobileCoursesLabel}</span>
                <ChevronDown className={cn('h-4 w-4 transition-transform', openMobileMenu === 'courses' && 'rotate-180')} />
              </button>
              {openMobileMenu === 'courses' ? (
                <div className="space-y-2 px-2 pb-2" id="public-mobile-courses">
                  <Link className="public-mobile-subitem" to={ROUTES.catalog}>
                    {copy.allCourses}
                  </Link>
                  {featuredCourses.slice(0, 3).map((course) => (
                    <Link className="public-mobile-subitem" key={course.id} to={buildCatalogPath({ query: course.title })}>
                      {course.title}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="public-mobile-group">
              <button
                aria-controls="public-mobile-categories"
                aria-expanded={openMobileMenu === 'categories'}
                className="public-mobile-toggle"
                onClick={() => setOpenMobileMenu((current) => current === 'categories' ? null : 'categories')}
                type="button"
              >
                <span>{copy.mobileCategoriesLabel}</span>
                <ChevronDown className={cn('h-4 w-4 transition-transform', openMobileMenu === 'categories' && 'rotate-180')} />
              </button>
              {openMobileMenu === 'categories' ? (
                <div className="space-y-2 px-2 pb-2" id="public-mobile-categories">
                  {categories.map((category) => (
                    <Link className="public-mobile-subitem" key={category.key} to={buildCatalogPath({ category: category.key })}>
                      {category.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 border-t border-[color:var(--border)] pt-3">
              <LanguageSwitcher compact />
              <div className="flex items-center gap-2">
                <Link className="flex-1" to={ROUTES.login}>
                  <span className="public-outline-button h-10 w-full px-4 text-sm font-semibold">{copy.signIn}</span>
                </Link>
                <Link className="flex-1" to={ROUTES.register}>
                  <span className="public-primary-button h-10 w-full px-4 text-sm font-semibold">{copy.register}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}

export default PublicNavbar

