import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import QueryErrorState from '../components/ui/QueryErrorState'
import LandingBenefitsSection from '../components/landing/LandingBenefitsSection'
import LandingDiscoverySection from '../components/landing/LandingDiscoverySection'
import LandingFinalCta from '../components/landing/LandingFinalCta'
import LandingHero from '../components/landing/LandingHero'
import LandingValueSection from '../components/landing/LandingValueSection'
import PublicNavbar from '../components/navigation/PublicNavbar'
import '../components/landing/landing.css'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import { courseService } from '../services/courseService'
import { normalizeApiError } from '../shared/errors/normalizeApiError'
import { buildCatalogPath, getCatalogCategories } from '../utils/catalogFilters'
import { ROUTES } from '../utils/constants'
import { getCourseCategoryFilterKey, getCourseCategoryLabel } from '../utils/courseCategory'

const parseStudentCount = (value: string) => {
  const normalized = value.trim().toLowerCase()

  if (normalized.endsWith('k')) {
    const parsed = Math.round(Number.parseFloat(normalized) * 1000)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const parsed = Number.parseInt(value.replace(/,/g, ''), 10)
  return Number.isFinite(parsed) ? parsed : 0
}

const heroCardTones = ['violet', 'sky', 'peach', 'slate'] as const

const LandingPage = () => {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const { isBootstrapping } = useAuth()

  const copy = language === 'tr'
    ? {
      navSections: [
        { id: 'overview', label: 'Platform' },
        { id: 'benefits', label: 'Faydalar' },
      ],
      heroEyebrow: 'EduBase ogrenme platformu',
      heroTitle: 'Bugun ne ogrenmek istiyorsun?',
      heroDescription: 'EduBase ile kurslari kesfet, ders iceriklerini takip et ve ogrenme surecini sade bir platform uzerinden yonet.',
      heroPrimaryCta: 'Ucretsiz basla',
      heroSecondaryCta: 'Kurslari kesfet',
      heroQuickCardsTitle: 'One cikan kategoriler',
      heroLearnersLabel: 'Toplam ogrenci',
      heroRatingLabel: 'Ortalama puan',
      overviewTitle: 'Online ogrenmeyi daha duzenli ve erisilebilir hale getir.',
      overviewDescription: 'Kurs kesfi, ders takibi ve egitmen icerik yonetimi ayni akista birlesir.',
      overviewItems: [
        {
          id: 'discover',
          title: 'Kurs kesfini hizlandir',
          description: 'Kategori, seviye ve etiket bilgileriyle uygun kursu hizli bul.',
          icon: 'discover' as const,
        },
        {
          id: 'track',
          title: 'Ders surecini takip et',
          description: 'Icerik yapisini, dersleri ve ilerleme durumunu tek sayfada gor.',
          icon: 'track' as const,
        },
        {
          id: 'instructor',
          title: 'Egitmen akisini netlestir',
          description: 'Egitmenlerin kurs icerigi yonetimini sade bir panelde tut.',
          icon: 'instructor' as const,
        },
      ],
      discoveryTitle: 'Kategorilere gore kurs kesfi',
      discoveryDescription: 'Ilgilendigin alana dogrudan git ve kurs secimini kolaylastir.',
      discoveryCategoriesTitle: 'Kategori alanlari',
      discoveryCoursesTitle: 'Kurs onerileri',
      discoveryCatalogCta: 'Katalogu ac',
      benefitsTitle: 'Ogrenci ve egitmenler icin net bir deneyim',
      benefitsDescription: 'Platformun temel akislarini gereksiz karmasiklik olmadan sunar.',
      studentTitle: 'Ogrenciler icin',
      instructorTitle: 'Egitmenler icin',
      studentBenefits: [
        'Kurslari kategoriye gore karsilastirma',
        'Ders iceriklerini ve ilerlemeyi duzenli takip',
        'Tek platformda daha sakin bir ogrenme deneyimi',
      ],
      instructorBenefits: [
        'Kurs ve ders icerigini tutarli yapida yonetme',
        'Ogrenci ilerlemesini daha kolay izleme',
        'Icerik operasyonunu daginik araclar olmadan surdurme',
      ],
      finalTitle: 'Ogrenmeye hemen basla',
      finalDescription: 'Ucretsiz hesapla platforma giris yap ve sana uygun kursu sec.',
      finalPrimaryCta: 'Ucretsiz basla',
      finalSecondaryCta: 'Kurslari kesfet',
      coursesLabel: 'kurs',
      lessonsLabel: 'ders',
      emptyCategoryHighlight: 'Kurslari incele',
    }
    : {
      navSections: [
        { id: 'overview', label: 'Platform' },
        { id: 'benefits', label: 'Benefits' },
      ],
      heroEyebrow: 'EduBase learning platform',
      heroTitle: 'What do you want to learn today?',
      heroDescription: 'Discover courses, follow lesson content, and manage your learning flow through a focused platform.',
      heroPrimaryCta: 'Start free',
      heroSecondaryCta: 'Explore courses',
      heroQuickCardsTitle: 'Featured categories',
      heroLearnersLabel: 'Total learners',
      heroRatingLabel: 'Average rating',
      overviewTitle: 'Make online learning more organized and accessible.',
      overviewDescription: 'Course discovery, lesson tracking, and instructor operations are aligned in one flow.',
      overviewItems: [
        {
          id: 'discover',
          title: 'Speed up course discovery',
          description: 'Use category, level, and tag context to find the right course quickly.',
          icon: 'discover' as const,
        },
        {
          id: 'track',
          title: 'Track lesson progress',
          description: 'Review content structure, lessons, and progress details in one place.',
          icon: 'track' as const,
        },
        {
          id: 'instructor',
          title: 'Clarify instructor workflows',
          description: 'Keep instructor content management inside a clean and focused panel.',
          icon: 'instructor' as const,
        },
      ],
      discoveryTitle: 'Discover by category',
      discoveryDescription: 'Jump into your focus area and simplify the next course decision.',
      discoveryCategoriesTitle: 'Category lanes',
      discoveryCoursesTitle: 'Course picks',
      discoveryCatalogCta: 'Open catalog',
      benefitsTitle: 'A clear experience for learners and instructors',
      benefitsDescription: 'The core product flows stay visible and easy to follow.',
      studentTitle: 'For learners',
      instructorTitle: 'For instructors',
      studentBenefits: [
        'Compare courses by category',
        'Follow lessons and progress with less noise',
        'Keep learning activity in one consistent place',
      ],
      instructorBenefits: [
        'Manage courses and lesson structure consistently',
        'Review learner progress with less overhead',
        'Run content operations without tool sprawl',
      ],
      finalTitle: 'Start learning now',
      finalDescription: 'Create your free account and pick a course that matches your goals.',
      finalPrimaryCta: 'Start free',
      finalSecondaryCta: 'Explore courses',
      coursesLabel: 'courses',
      lessonsLabel: 'lessons',
      emptyCategoryHighlight: 'Explore courses',
    }

  const { data: courses, error, isLoading } = useQuery({
    queryKey: ['landing-courses', language],
    queryFn: () => courseService.getCourses(language),
  })
  const { data: categoriesFromApi = [] } = useQuery({
    queryKey: ['landing-categories'],
    queryFn: () => courseService.getPublicCategories(),
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
      featuredCourses: sortedCourses.slice(0, 4),
      categories: categoriesFromApi.length > 0
        ? categoriesFromApi.map((category) => ({
          key: category.id,
          label: category.categoryName,
          count: resolvedCourses.filter((course) => getCourseCategoryFilterKey(course) === category.id).length,
          highlight: resolvedCourses.find((course) => getCourseCategoryFilterKey(course) === category.id)?.tags.slice(0, 2).join(' / ')
            ?? copy.emptyCategoryHighlight,
        })).sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
        : getCatalogCategories(resolvedCourses).map((category) => ({
          ...category,
          label: getCourseCategoryLabel({
            category: category.label,
            categoryId: category.key,
          }),
        })),
    }
  }, [categoriesFromApi, copy.emptyCategoryHighlight, resolvedCourses])

  const fallbackCategories = useMemo(() => [
    { key: 'software-development', label: language === 'tr' ? 'Yazilim Gelistirme' : 'Software Development', count: 0, highlight: copy.emptyCategoryHighlight },
    { key: 'data-science', label: language === 'tr' ? 'Veri Bilimi' : 'Data Science', count: 0, highlight: copy.emptyCategoryHighlight },
    { key: 'mobile-development', label: language === 'tr' ? 'Mobil Uygulama' : 'Mobile Development', count: 0, highlight: copy.emptyCategoryHighlight },
    { key: 'cyber-security', label: language === 'tr' ? 'Siber Guvenlik' : 'Cyber Security', count: 0, highlight: copy.emptyCategoryHighlight },
  ], [copy.emptyCategoryHighlight, language])

  const categories = content.categories.length ? content.categories : fallbackCategories
  const learnersValue = content.totalLearners.toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US')
  const ratingValue = content.averageRating ? content.averageRating.toFixed(1) : '0.0'

  const heroCards = categories.slice(0, 4).map((category, index) => ({
    id: category.key,
    title: category.label,
    summary: category.highlight,
    href: buildCatalogPath({ category: category.key }),
    tone: heroCardTones[index % heroCardTones.length],
  }))

  const discoveryCategories = categories.slice(0, 6).map((category, index) => ({
    id: category.key,
    label: category.label,
    countLabel: `${category.count} ${copy.coursesLabel}`,
    highlight: category.highlight,
    href: buildCatalogPath({ category: category.key }),
    tone: heroCardTones[index % heroCardTones.length],
  }))

  const discoveryCourses = content.featuredCourses.slice(0, 4).map((course) => ({
    id: course.id,
    title: course.title,
    summary: course.summary,
    meta: `${course.level} - ${course.lessons} ${copy.lessonsLabel}`,
    href: buildCatalogPath({ query: course.title }),
  }))

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

      <main className="landing-main">
        <LandingHero
          description={copy.heroDescription}
          eyebrow={copy.heroEyebrow}
          learnersLabel={copy.heroLearnersLabel}
          learnersValue={learnersValue}
          primaryCta={copy.heroPrimaryCta}
          primaryHref={ROUTES.register}
          quickCards={heroCards}
          quickCardsTitle={copy.heroQuickCardsTitle}
          ratingLabel={copy.heroRatingLabel}
          ratingValue={ratingValue}
          secondaryCta={copy.heroSecondaryCta}
          secondaryHref={ROUTES.catalog}
          title={copy.heroTitle}
        />

        <LandingValueSection
          description={copy.overviewDescription}
          items={copy.overviewItems}
          sectionId="overview"
          title={copy.overviewTitle}
        />

        <LandingDiscoverySection
          catalogCta={copy.discoveryCatalogCta}
          catalogHref={ROUTES.catalog}
          categories={discoveryCategories}
          categoriesTitle={copy.discoveryCategoriesTitle}
          courses={discoveryCourses}
          coursesTitle={copy.discoveryCoursesTitle}
          description={copy.discoveryDescription}
          title={copy.discoveryTitle}
        />

        <LandingBenefitsSection
          description={copy.benefitsDescription}
          instructorBenefits={copy.instructorBenefits}
          instructorTitle={copy.instructorTitle}
          sectionId="benefits"
          studentBenefits={copy.studentBenefits}
          studentTitle={copy.studentTitle}
          title={copy.benefitsTitle}
        />

        <LandingFinalCta
          description={copy.finalDescription}
          primaryCta={copy.finalPrimaryCta}
          primaryHref={ROUTES.register}
          secondaryCta={copy.finalSecondaryCta}
          secondaryHref={ROUTES.catalog}
          title={copy.finalTitle}
        />
      </main>
    </div>
  )
}

export default LandingPage
