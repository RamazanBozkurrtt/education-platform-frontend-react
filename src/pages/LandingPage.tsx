import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  BadgeCheck,
  Blocks,
  BriefcaseBusiness,
  Building2,
  ChartColumnIncreasing,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react'
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
import { formatCurrency } from '../utils/helpers'

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
        { id: 'platform', label: 'Nasıl işler' },
        { id: 'results', label: 'Neden Edubase' },
      ],
      eyebrow: 'Online eğitim ve mesleki gelişim',
      title: 'İhtiyacına uygun kursları keşfet, eğitmenleri incele ve öğrenmeye bugün başla.',
      description:
        'Teknik becerilerden ürün ve tasarıma kadar farklı alanlardaki kursları tek katalogda inceleyebilir, seviyene uygun programları kolayca bulabilirsin.',
      primaryCta: 'Kursları keşfet',
      secondaryCta: 'Hesap oluştur',
      proof: 'Seviye, eğitmen, süre ve içerik bilgileri baştan görünür.',
      heroStats: [
        { value: '12', label: 'Kurs alanı' },
        { value: '4.8', label: 'Ortalama puan' },
        { value: '24/7', label: 'Katalog erişimi' },
      ],
      heroPanelEyebrow: 'Kursları keşfet',
      heroPanelTitle: 'Kurs, eğitmen ve seviye bilgilerine tek bakışta ulaş.',
      heroPanelDescription:
        'Kategoriye göre gezebilir, öne çıkan kursları inceleyebilir ve ilgilendiğin eğitimin detaylarına kolayca geçebilirsin.',
      heroHighlights: [
        'Kursları kategori, seviye veya konuya göre hızlıca filtrele.',
        'Eğitmen, süre, puan ve fiyat bilgilerini kart üzerinde gör.',
        'Mobilde ve masaüstünde aynı sade akışla ilerle.',
      ],
      featuredMetrics: {
        learners: 'Katılımcı',
        rating: 'Puan',
        duration: 'Süre',
      },
      leadershipLabel: 'Öğrenme deneyimi',
      leadershipTitle: 'Kendi hızında ilerlemek isteyenler için düzenli bir kurs kataloğu',
      leadershipDescription:
        'Edubase, farklı seviyelerdeki kursları anlaşılır bir yapıda sunar. Böylece hangi kursun sana uygun olduğunu hızlıca görebilir ve öğrenmeye zaman kaybetmeden başlayabilirsin.',
      leadershipCards: [
        {
          title: 'Açık kurs bilgisi',
          description: 'Her kursta seviye, süre, eğitmen ve içerik bilgileri net şekilde yer alır.',
        },
        {
          title: 'Kolay karşılaştırma',
          description: 'Benzer kursları süre, puan ve fiyat bilgileriyle rahatça değerlendirebilirsin.',
        },
        {
          title: 'Düzenli öğrenme takibi',
          description: 'Satın aldığın kurslara panelinden dönebilir, kaldığın yerden devam edebilirsin.',
        },
      ],
      categoryEyebrow: 'Kategoriler',
      categoryTitle: 'İlgilendiğin alana göre kursları keşfet',
      categoryDescription:
        'Ürün, veri, tasarım ve mühendislik gibi alanlarda kursları filtreleyerek sana uygun içeriklere ulaşabilirsin.',
      categoryButton: 'Tüm kurslar',
      categoryFocus: 'Odak',
      categoryCourses: 'kurs',
      showcaseEyebrow: 'Öne çıkan kurslar',
      showcaseTitle: 'Popüler kursları hızlıca karşılaştır',
      showcaseDescription:
        'Kurs kartlarında süre, katılımcı sayısı, puan, fiyat ve eğitmen bilgisi yer alır. Böylece karar vermeden önce temel bilgileri kolayca görebilirsin.',
      showcaseButton: 'Kataloğu aç',
      resultsEyebrow: 'Neden Edubase',
      resultsTitle: 'Kurs seçimini kolaylaştıran sade bir deneyim',
      resultsDescription:
        'Edubase, kursları gereksiz karmaşa olmadan incelemeni sağlar. Kategorileri gezebilir, seviyeleri karşılaştırabilir ve detay sayfasında ne öğreneceğini görebilirsin.',
      resultStats: [
        { value: '4+', label: 'Öğrenme alanı' },
        { value: '4.8', label: 'Ortalama kurs puanı' },
        { value: '24/7', label: 'Katalog erişimi' },
      ],
      roadmapTitle: 'Öğrenmeye başlamadan önce neleri görebilirsin?',
      roadmap: [
        'Kursların seviyesi, süresi ve eğitmeni kartlarda açıkça yer alır.',
        'Kategori ve seviye filtreleriyle ilgini çeken programlara daha hızlı ulaşırsın.',
        'Kurs detayında içerik, kazanımlar ve modüller tek sayfada gösterilir.',
      ],
      summaryMetrics: {
        programs: 'Program',
        learners: 'Katılımcı',
        rating: 'Ortalama puan',
      },
      systemNotes: 'Kurs seçimi',
      ctaEyebrow: 'Öğrenmeye hazır mısın?',
      ctaTitle: 'Kendine uygun kursu seç ve ilk dersine başla.',
      ctaDescription:
        'Kataloğu incele, detayları karşılaştır ve hesabını oluşturarak öğrenmeye devam et.',
      finalPrimary: 'Kursları gör',
      finalSecondary: 'Giriş yap',
    }
    : {
      navSections: [
        { id: 'platform', label: 'How it works' },
        { id: 'results', label: 'Why Edubase' },
      ],
      eyebrow: 'Online learning and professional development',
      title: 'Find the right course, review the instructor, and start learning today.',
      description:
        'Explore courses across technical skills, product, data, and design. Filter by level or topic and choose the program that fits your next goal.',
      primaryCta: 'Explore courses',
      secondaryCta: 'Create account',
      proof: 'Level, instructor, duration, and content details are visible before you enroll.',
      heroStats: [
        { value: '12', label: 'Learning areas' },
        { value: '4.8', label: 'Average rating' },
        { value: '24/7', label: 'Catalog access' },
      ],
      heroPanelEyebrow: 'Course discovery',
      heroPanelTitle: 'See course, instructor, and level details at a glance.',
      heroPanelDescription:
        'Browse by category, review featured courses, and open the details page when a course looks right for you.',
      heroHighlights: [
        'Filter courses by category, level, or topic.',
        'Check instructor, duration, rating, and price on each card.',
        'Move through the same simple flow on desktop and mobile.',
      ],
      featuredMetrics: {
        learners: 'Learners',
        rating: 'Rating',
        duration: 'Duration',
      },
      leadershipLabel: 'Learning experience',
      leadershipTitle: 'A clear course catalog for people who want to learn at their own pace',
      leadershipDescription:
        'Edubase presents courses in a simple structure, so you can understand what each program covers and choose without digging through extra pages.',
      leadershipCards: [
        {
          title: 'Clear course details',
          description: 'Each course shows level, duration, instructor, and content information up front.',
        },
        {
          title: 'Easy comparison',
          description: 'Compare similar courses by duration, rating, and price before you decide.',
        },
        {
          title: 'Learning progress',
          description: 'Return to purchased courses from your dashboard and continue where you left off.',
        },
      ],
      categoryEyebrow: 'Categories',
      categoryTitle: 'Explore courses by the topic you care about',
      categoryDescription:
        'Filter courses in product, data, design, engineering, and other practical learning areas.',
      categoryButton: 'All courses',
      categoryFocus: 'Focus',
      categoryCourses: 'courses',
      showcaseEyebrow: 'Featured courses',
      showcaseTitle: 'Compare popular courses quickly',
      showcaseDescription:
        'Each card shows duration, learners, rating, price, and instructor details so you can review the essentials before opening the course.',
      showcaseButton: 'Open catalog',
      resultsEyebrow: 'Why Edubase',
      resultsTitle: 'A simpler way to choose your next course',
      resultsDescription:
        'Edubase keeps the course search focused. Browse categories, compare levels, and check what you will learn on the course detail page.',
      resultStats: [
        { value: '4+', label: 'Learning areas' },
        { value: '4.8', label: 'Average course rating' },
        { value: '24/7', label: 'Catalog availability' },
      ],
      roadmapTitle: 'What you can review before you start',
      roadmap: [
        'Course level, duration, and instructor details are visible on the cards.',
        'Category and level filters help you reach relevant courses faster.',
        'Course detail pages show content, outcomes, and modules in one place.',
      ],
      summaryMetrics: {
        programs: 'Programs',
        learners: 'Learners',
        rating: 'Average rating',
      },
      systemNotes: 'Course choice',
      ctaEyebrow: 'Ready to learn?',
      ctaTitle: 'Choose a course that fits your goal and start your first lesson.',
      ctaDescription:
        'Explore the catalog, compare course details, and create an account when you are ready to continue.',
      finalPrimary: 'View courses',
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
    return <main className="flex min-h-screen items-center justify-center px-4 theme-muted">{t('loader.restoringWorkspace')}</main>
  }

  if (error && !hasRecoverablePublicError) {
    return <QueryErrorState error={error} fullScreen />
  }

  if (isLoading) {
    return <main className="flex min-h-screen items-center justify-center px-4 theme-muted">{t('loader.courseCatalog')}</main>
  }

  const featuredCourse = content.featuredCourses[0]

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
          <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
            <div className="public-section-card overflow-hidden rounded-lg p-7 md:p-10">
              <span className="inline-flex items-center gap-2 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] theme-heading">
                <Building2 className="h-3.5 w-3.5 text-[color:var(--primary)]" />
                {copy.eyebrow}
              </span>

              <h1 className="theme-heading mt-6 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.05em] md:text-6xl">
                {copy.title}
              </h1>

              <p className="theme-muted mt-6 max-w-2xl text-base leading-8 md:text-lg">
                {copy.description}
              </p>

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

              <div className="mt-8 flex flex-wrap items-center gap-3 text-sm theme-muted">
                <BadgeCheck className="h-4 w-4 text-emerald-500" />
                <span>{copy.proof}</span>
              </div>

              <div className="mt-10 grid gap-4 md:grid-cols-3">
                {copy.heroStats.map((item) => (
                  <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-5 py-5" key={item.label}>
                    <p className="theme-heading text-3xl font-semibold tracking-[-0.04em]">{item.value}</p>
                    <p className="theme-subtle mt-2 text-xs font-semibold uppercase tracking-[0.22em]">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6">
              <div className="public-section-card rounded-lg p-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--primary)]">
                  {copy.heroPanelEyebrow}
                </p>
                <h2 className="theme-heading mt-4 max-w-lg text-3xl font-semibold tracking-[-0.04em]">
                  {copy.heroPanelTitle}
                </h2>
                <p className="theme-muted mt-4 max-w-xl text-sm leading-8">
                  {copy.heroPanelDescription}
                </p>

                <div className="mt-8 grid gap-3">
                  {copy.heroHighlights.map((item) => (
                    <div
                      className="flex items-start gap-3 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-4"
                      key={item}
                    >
                      <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-[color:var(--accent)]" />
                      <p className="theme-text text-sm leading-7">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              {featuredCourse ? (
                <div className="public-section-card rounded-lg p-7">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="theme-subtle text-[11px] font-semibold uppercase tracking-[0.16em]">{featuredCourse.category}</p>
                      <h3 className="theme-heading mt-2 text-2xl font-semibold tracking-[-0.03em]">{featuredCourse.title}</h3>
                    </div>
                    <div className="rounded-md bg-[color:var(--surface-muted)] px-4 py-2 text-sm font-semibold theme-heading">
                      {formatCurrency(featuredCourse.price)}
                    </div>
                  </div>

                  <p className="theme-muted mt-4 text-sm leading-8">{featuredCourse.summary}</p>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-4">
                      <p className="theme-subtle text-xs uppercase tracking-[0.18em]">{copy.featuredMetrics.learners}</p>
                      <p className="theme-heading mt-2 text-lg font-semibold">{featuredCourse.students}</p>
                    </div>
                    <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-4">
                      <p className="theme-subtle text-xs uppercase tracking-[0.18em]">{copy.featuredMetrics.rating}</p>
                      <p className="theme-heading mt-2 text-lg font-semibold">{featuredCourse.rating}</p>
                    </div>
                    <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-4">
                      <p className="theme-subtle text-xs uppercase tracking-[0.18em]">{copy.featuredMetrics.duration}</p>
                      <p className="theme-heading mt-2 text-lg font-semibold">{featuredCourse.duration}</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1480px] px-4 py-6 lg:px-8" id="platform">
          <div className="grid gap-5 lg:grid-cols-[0.86fr_1.14fr]">
            <div className="public-section-card rounded-lg p-7 md:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--primary)]">{copy.leadershipLabel}</p>
              <h2 className="theme-heading mt-4 text-3xl font-semibold tracking-[-0.04em] md:text-4xl">{copy.leadershipTitle}</h2>
              <p className="theme-muted mt-5 text-sm leading-8">{copy.leadershipDescription}</p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-5">
                  <p className="theme-subtle text-xs uppercase tracking-[0.22em]">{copy.summaryMetrics.programs}</p>
                  <p className="theme-heading mt-2 text-3xl font-semibold tracking-[-0.04em]">{resolvedCourses.length}</p>
                </div>
                <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-5">
                  <p className="theme-subtle text-xs uppercase tracking-[0.22em]">{copy.summaryMetrics.learners}</p>
                  <p className="theme-heading mt-2 text-3xl font-semibold tracking-[-0.04em]">
                    {content.totalLearners.toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US')}
                  </p>
                </div>
                <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-5 sm:col-span-2">
                  <p className="theme-subtle text-xs uppercase tracking-[0.22em]">{copy.summaryMetrics.rating}</p>
                  <p className="theme-heading mt-2 text-3xl font-semibold tracking-[-0.04em]">{content.averageRating.toFixed(1)}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {[Building2, BriefcaseBusiness, ChartColumnIncreasing].map((Icon, index) => {
                const item = copy.leadershipCards[index]

                return (
                  <article className="public-section-card rounded-lg p-6" key={item.title}>
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[color:var(--surface-muted)] text-[color:var(--primary)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="theme-heading mt-5 text-xl font-semibold tracking-[-0.03em]">{item.title}</h3>
                    <p className="theme-muted mt-3 text-sm leading-8">{item.description}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1480px] px-4 py-10 lg:px-8" id="categories">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--primary)]">{copy.categoryEyebrow}</p>
              <h2 className="theme-heading mt-4 text-3xl font-semibold tracking-[-0.04em] md:text-4xl">{copy.categoryTitle}</h2>
              <p className="theme-muted mt-5 text-sm leading-8">{copy.categoryDescription}</p>
            </div>

            <Link to={ROUTES.catalog}>
              <span className="public-outline-button h-11 px-4 text-sm font-semibold">
                {copy.categoryButton}
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {content.categories.map((category) => (
              <Link className="group" key={category.key} to={buildCatalogPath({ category: category.key })}>
                <article className="public-section-card h-full rounded-lg p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[color:var(--surface-muted)] text-[color:var(--primary)]">
                      <Blocks className="h-5 w-5" />
                    </div>
                    <span className="rounded-md border border-[color:var(--border)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] theme-subtle">
                      {category.count} {copy.categoryCourses}
                    </span>
                  </div>

                  <h3 className="theme-heading mt-6 text-2xl font-semibold tracking-[-0.03em]">{category.label}</h3>
                  <div className="mt-6 border-t border-[color:var(--border)] pt-4">
                    <p className="theme-subtle text-[11px] font-semibold uppercase tracking-[0.16em]">{copy.categoryFocus}</p>
                    <p className="theme-muted mt-2 text-sm leading-7">{category.highlight}</p>
                  </div>

                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--primary)] transition-colors group-hover:text-[color:var(--primary-strong)]">
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--primary)]">{copy.showcaseEyebrow}</p>
              <h2 className="theme-heading mt-4 text-3xl font-semibold tracking-[-0.04em] md:text-4xl">{copy.showcaseTitle}</h2>
              <p className="theme-muted mt-5 text-sm leading-8">{copy.showcaseDescription}</p>
            </div>

            <Link to={ROUTES.catalog}>
              <span className="public-outline-button h-11 px-4 text-sm font-semibold">
                {copy.showcaseButton}
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
            <div className="public-section-card rounded-lg p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--primary)]">{copy.resultsEyebrow}</p>
              <h2 className="theme-heading mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.04em] md:text-4xl">{copy.resultsTitle}</h2>
              <p className="theme-muted mt-5 max-w-2xl text-sm leading-8">{copy.resultsDescription}</p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {copy.resultStats.map((item) => (
                  <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-5 py-5" key={item.label}>
                    <p className="theme-heading text-3xl font-semibold tracking-[-0.04em]">{item.value}</p>
                    <p className="theme-subtle mt-2 text-xs uppercase tracking-[0.16em]">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="public-section-card rounded-lg p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[color:var(--surface-muted)] text-[color:var(--primary)]">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <p className="theme-subtle text-[11px] font-semibold uppercase tracking-[0.16em]">{copy.systemNotes}</p>
                  <h3 className="theme-heading mt-1 text-2xl font-semibold tracking-[-0.03em]">{copy.roadmapTitle}</h3>
                </div>
              </div>

              <div className="mt-7 space-y-4">
                {copy.roadmap.map((item) => (
                  <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-5 py-5" key={item}>
                    <p className="theme-muted text-sm leading-8">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1480px] px-4 pb-16 pt-10 lg:px-8 lg:pb-20">
          <div className="public-section-card rounded-lg p-8 md:p-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--primary)]">{copy.ctaEyebrow}</p>
            <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="max-w-3xl">
                <h2 className="theme-heading text-3xl font-semibold tracking-[-0.04em] md:text-4xl">{copy.ctaTitle}</h2>
                <p className="theme-muted mt-5 text-sm leading-8">{copy.ctaDescription}</p>
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
