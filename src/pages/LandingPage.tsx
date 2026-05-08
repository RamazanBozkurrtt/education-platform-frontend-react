import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, BookOpenText, ChartColumnIncreasing, ShieldCheck, Star, Users2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import CatalogCourseCard from '../components/CatalogCourseCard'
import PublicNavbar from '../components/navigation/PublicNavbar'
import QueryErrorState from '../components/ui/QueryErrorState'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import { courseService } from '../services/courseService'
import { normalizeApiError } from '../shared/errors/normalizeApiError'
import { buildCatalogPath, getCatalogCategories } from '../utils/catalogFilters'
import { ROUTES } from '../utils/constants'

const parseStudentCount = (value: string) => {
  if (value.trim().toLowerCase().endsWith('k')) {
    return Math.round(Number.parseFloat(value) * 1000)
  }

  return Number.parseInt(value.replace(/,/g, ''), 10)
}

const LandingPage = () => {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const { isBootstrapping } = useAuth()

  const copy = language === 'tr'
    ? {
      navSections: [
        { id: 'platform', label: 'Nasil calisir' },
        { id: 'results', label: 'Neden Edubase' },
      ],
      eyebrow: 'Kursları keşfet',
      title: 'Kursları keşfet ve sana uygun eğitimi seç.',
      description: 'Kurslari kategori, seviye ve egitmene gore inceleyebilirsin.',
      primaryCta: 'Kursları keşfet',
      secondaryCta: 'Kayit ol',
      proof: 'Kurslarda sure, seviye, puan ve egitmen bilgisi acikca yer alir.',
      heroStats: [
        { value: '12+', label: 'Kurs alani' },
        { value: '4.8', label: 'Ortalama puan' },
        { value: '24/7', label: 'Katalog erisimi' },
      ],
      platformTitle: 'Kurs secimini kolaylastiran sade akis',
      platformDescription: 'Filtreleri kullan, kurslari karsilastir ve detay sayfasinda ders yapisini gor.',
      platformItems: [
        'Kurslari kategori ve seviyeye gore filtrele.',
        'Kurs kartlarinda temel bilgileri tek bakista gor.',
        'Detay sayfasinda dersler ve degerlendirmeleri incele.',
      ],
      categoryTitle: 'Kategoriler',
      categoryDescription: 'Ilgilendigin alana gore kurslara ulas.',
      categoryCourses: 'kurs',
      showcaseTitle: 'One cikan kurslar',
      showcaseDescription: 'Populer kurslari hizlica incele.',
      resultsTitle: 'Edubase ile ne gorebilirsin?',
      resultsDescription: 'Kursa baslamadan once temel bilgileri net sekilde inceleyebilirsin.',
      roadmapTitle: 'Kurs detaylarinda neler var?',
      roadmap: [
        'Kurs detaylari',
        'Dersler',
        'Degerlendirmeler',
      ],
      ctaTitle: 'Hemen basla',
      ctaDescription: 'Katalogu ac ve sana uygun kursu sec.',
      finalPrimary: 'Kursları keşfet',
      finalSecondary: 'Giriş yap',
    }
    : {
      navSections: [
        { id: 'platform', label: 'How it works' },
        { id: 'results', label: 'Why Edubase' },
      ],
      eyebrow: 'Explore courses',
      title: 'Explore courses and choose what fits your goal.',
      description: 'Browse courses by category, level, and instructor.',
      primaryCta: 'Explore courses',
      secondaryCta: 'Create account',
      proof: 'Course cards show duration, level, rating, and instructor clearly.',
      heroStats: [
        { value: '12+', label: 'Learning areas' },
        { value: '4.8', label: 'Average rating' },
        { value: '24/7', label: 'Catalog access' },
      ],
      platformTitle: 'A clear flow for course discovery',
      platformDescription: 'Use filters, compare courses, and review lesson structure on the detail page.',
      platformItems: [
        'Filter by category and level.',
        'See key details directly on course cards.',
        'Review lessons and ratings on the detail page.',
      ],
      categoryTitle: 'Categories',
      categoryDescription: 'Open courses by your focus area.',
      categoryCourses: 'courses',
      showcaseTitle: 'Featured courses',
      showcaseDescription: 'Review popular courses quickly.',
      resultsTitle: 'What can you review?',
      resultsDescription: 'See key information before you start a course.',
      roadmapTitle: 'Inside course details',
      roadmap: [
        'Course details',
        'Lessons',
        'Reviews',
      ],
      ctaTitle: 'Start now',
      ctaDescription: 'Open the catalog and pick your course.',
      finalPrimary: 'Explore courses',
      finalSecondary: 'Sign in',
    }

  const { data: courses, error, isLoading } = useQuery({
    queryKey: ['landing-courses', language],
    queryFn: () => courseService.getCourses(language),
  })
  const appError = error ? normalizeApiError(error) : null
  const hasRecoverablePublicError = appError?.kind === 'auth' || appError?.kind === 'forbidden'
  const resolvedCourses = courses ?? []

  const content = useMemo(() => {
    if (!resolvedCourses.length) {
      return {
        totalLearners: 0,
        averageRating: 0,
        featuredCourses: [],
        categories: [],
      }
    }

    const sortedCourses = [...resolvedCourses].sort((left, right) => parseStudentCount(right.students) - parseStudentCount(left.students))
    const totalLearners = resolvedCourses.reduce((sum, course) => sum + parseStudentCount(course.students), 0)
    const averageRating = resolvedCourses.reduce((sum, course) => sum + course.rating, 0) / resolvedCourses.length

    return {
      totalLearners,
      averageRating,
      featuredCourses: sortedCourses.slice(0, 3),
      categories: getCatalogCategories(resolvedCourses),
    }
  }, [resolvedCourses])

  const handleAnchorClick = (id: string) => {
    const section = document.getElementById(id)

    if (!section) return

    window.scrollTo({
      top: section.getBoundingClientRect().top + window.scrollY - 112,
      behavior: 'smooth',
    })
  }

  if (isBootstrapping) {
    return <main className="theme-muted flex min-h-screen items-center justify-center px-4">{t('loader.restoringWorkspace')}</main>
  }

  if (error && !hasRecoverablePublicError) {
    return <QueryErrorState error={error} fullScreen />
  }

  if (isLoading) {
    return <main className="theme-muted flex min-h-screen items-center justify-center px-4">{t('loader.courseCatalog')}</main>
  }

  return (
    <div className="public-page theme-app">
      <PublicNavbar
        anchorLinks={copy.navSections}
        categories={content.categories}
        featuredCourses={content.featuredCourses}
        onAnchorClick={handleAnchorClick}
      />

      <main className="relative">
        <section className="mx-auto max-w-[1480px] px-4 pb-10 pt-8 lg:px-8 lg:pb-14 lg:pt-12">
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="public-section-card rounded-[var(--radius-cards)] p-8 md:p-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--primary)]">{copy.eyebrow}</p>
              <h1 className="theme-heading mt-4 text-4xl font-semibold leading-tight tracking-[-0.03em] md:text-5xl">
                {copy.title}
              </h1>
              <p className="theme-muted mt-5 max-w-2xl text-sm leading-8 md:text-base">{copy.description}</p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to={ROUTES.catalog}>
                  <span className="public-primary-button h-12 px-5 text-sm font-semibold">
                    {copy.primaryCta}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>

                <Link to={ROUTES.register}>
                  <span className="public-outline-button h-12 px-5 text-sm font-semibold">
                    {copy.secondaryCta}
                  </span>
                </Link>
              </div>

              <div className="theme-muted mt-8 flex items-center gap-3 text-sm">
                <ShieldCheck className="h-4 w-4 text-[color:var(--primary)]" />
                <span>{copy.proof}</span>
              </div>
            </div>

            <div className="public-section-card rounded-[var(--radius-cards)] p-8">
              <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
                <div className="rounded-[var(--radius-cards)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-5 py-5">
                  <p className="theme-heading text-3xl font-semibold">{copy.heroStats[0].value}</p>
                  <p className="theme-subtle mt-2 text-xs font-semibold uppercase tracking-[0.2em]">{copy.heroStats[0].label}</p>
                </div>
                <div className="rounded-[var(--radius-cards)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-5 py-5">
                  <p className="theme-heading text-3xl font-semibold">{copy.heroStats[1].value}</p>
                  <p className="theme-subtle mt-2 text-xs font-semibold uppercase tracking-[0.2em]">{copy.heroStats[1].label}</p>
                </div>
                <div className="rounded-[var(--radius-cards)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-5 py-5">
                  <p className="theme-heading text-3xl font-semibold">{copy.heroStats[2].value}</p>
                  <p className="theme-subtle mt-2 text-xs font-semibold uppercase tracking-[0.2em]">{copy.heroStats[2].label}</p>
                </div>
              </div>

              <div className="mt-5 border-t border-[color:var(--border)] pt-5">
                <p className="theme-subtle text-xs uppercase tracking-[0.16em]">Toplam ogrenci</p>
                <p className="theme-heading mt-2 text-2xl font-semibold">
                  {content.totalLearners.toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US')}
                </p>
                <p className="theme-muted mt-2 text-sm">Ortalama puan: {content.averageRating.toFixed(1)}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1480px] px-4 py-10 lg:px-8" id="platform">
          <div className="public-section-card rounded-[var(--radius-cards)] p-8">
            <h2 className="theme-heading text-3xl font-semibold tracking-[-0.03em] md:text-4xl">{copy.platformTitle}</h2>
            <p className="theme-muted mt-4 max-w-3xl text-sm leading-8">{copy.platformDescription}</p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <article className="rounded-[var(--radius-cards)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-5">
                <BookOpenText className="h-5 w-5 text-[color:var(--primary)]" />
                <p className="theme-text mt-3 text-sm leading-7">{copy.platformItems[0]}</p>
              </article>
              <article className="rounded-[var(--radius-cards)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-5">
                <Users2 className="h-5 w-5 text-[color:var(--primary)]" />
                <p className="theme-text mt-3 text-sm leading-7">{copy.platformItems[1]}</p>
              </article>
              <article className="rounded-[var(--radius-cards)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-5">
                <ChartColumnIncreasing className="h-5 w-5 text-[color:var(--primary)]" />
                <p className="theme-text mt-3 text-sm leading-7">{copy.platformItems[2]}</p>
              </article>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1480px] px-4 py-10 lg:px-8" id="categories">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h2 className="theme-heading text-3xl font-semibold tracking-[-0.03em] md:text-4xl">{copy.categoryTitle}</h2>
              <p className="theme-muted mt-4 text-sm leading-8">{copy.categoryDescription}</p>
            </div>
            <Link to={ROUTES.catalog}>
              <span className="public-outline-button h-11 px-4 text-sm font-semibold">
                {copy.primaryCta}
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {content.categories.map((category) => (
              <Link className="group" key={category.key} to={buildCatalogPath({ category: category.key })}>
                <article className="public-section-card h-full rounded-[var(--radius-cards)] p-6">
                  <span className="theme-subtle text-xs font-semibold uppercase tracking-[0.14em]">
                    {category.count} {copy.categoryCourses}
                  </span>
                  <h3 className="theme-heading mt-4 text-2xl font-semibold tracking-[-0.02em]">{category.label}</h3>
                  <p className="theme-muted mt-3 text-sm leading-7">{category.highlight}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--primary)] transition-colors group-hover:text-[color:var(--primary-strong)]">
                    {copy.primaryCta}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </article>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1480px] px-4 py-10 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h2 className="theme-heading text-3xl font-semibold tracking-[-0.03em] md:text-4xl">{copy.showcaseTitle}</h2>
              <p className="theme-muted mt-4 text-sm leading-8">{copy.showcaseDescription}</p>
            </div>
            <Link to={ROUTES.catalog}>
              <span className="public-outline-button h-11 px-4 text-sm font-semibold">
                {copy.finalPrimary}
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {content.featuredCourses.map((course) => (
              <CatalogCourseCard compact course={course} key={course.id} />
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1480px] px-4 py-10 lg:px-8" id="results">
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="public-section-card rounded-[var(--radius-cards)] p-8">
              <h2 className="theme-heading text-3xl font-semibold tracking-[-0.03em] md:text-4xl">{copy.resultsTitle}</h2>
              <p className="theme-muted mt-4 text-sm leading-8">{copy.resultsDescription}</p>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-[var(--radius-badges)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-1 text-xs theme-muted">
                  <Star className="mr-1 inline h-3.5 w-3.5 text-[color:var(--primary)]" />
                  {content.averageRating.toFixed(1)}
                </span>
                <span className="rounded-[var(--radius-badges)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-1 text-xs theme-muted">
                  <Users2 className="mr-1 inline h-3.5 w-3.5 text-[color:var(--primary)]" />
                  {content.totalLearners.toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US')}
                </span>
              </div>
            </div>

            <div className="public-section-card rounded-[var(--radius-cards)] p-8">
              <h3 className="theme-heading text-2xl font-semibold tracking-[-0.02em]">{copy.roadmapTitle}</h3>
              <div className="mt-6 space-y-3">
                {copy.roadmap.map((item) => (
                  <div className="rounded-[var(--radius-cards)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-5 py-4" key={item}>
                    <p className="theme-text text-sm leading-7">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1480px] px-4 pb-16 pt-10 lg:px-8 lg:pb-20">
          <div className="public-section-card rounded-[var(--radius-cards)] p-8 md:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="max-w-3xl">
                <h2 className="theme-heading text-3xl font-semibold tracking-[-0.03em] md:text-4xl">{copy.ctaTitle}</h2>
                <p className="theme-muted mt-4 text-sm leading-8">{copy.ctaDescription}</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link to={ROUTES.catalog}>
                  <span className="public-primary-button h-12 px-5 text-sm font-semibold">
                    {copy.finalPrimary}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>

                <Link to={ROUTES.login}>
                  <span className="public-outline-button h-12 px-5 text-sm font-semibold">
                    {copy.finalSecondary}
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default LandingPage
