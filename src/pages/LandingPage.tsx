import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import LandingBenefitsSection from '../components/landing/LandingBenefitsSection'
import LandingDiscoverySection from '../components/landing/LandingDiscoverySection'
import LandingFeatureSection from '../components/landing/LandingFeatureSection'
import LandingFinalCta from '../components/landing/LandingFinalCta'
import LandingHero from '../components/landing/LandingHero'
import LandingValueSection from '../components/landing/LandingValueSection'
import PublicNavbar from '../components/navigation/PublicNavbar'
import QueryErrorState from '../components/ui/QueryErrorState'
import '../components/landing/landing.css'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import { courseService } from '../services/courseService'
import { normalizeApiError } from '../shared/errors/normalizeApiError'
import { buildCatalogPath, getCatalogCategories } from '../utils/catalogFilters'
import { ROUTES } from '../utils/constants'
import { getCourseCategoryFilterKeys, getCourseCategoryLabel } from '../utils/courseCategory'

const parseStudentCount = (value: string) => {
  const normalized = value.trim().toLowerCase()

  if (normalized.endsWith('k')) {
    const parsed = Math.round(Number.parseFloat(normalized) * 1000)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const parsed = Number.parseInt(value.replace(/,/g, ''), 10)
  return Number.isFinite(parsed) ? parsed : 0
}

const LandingPage = () => {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const { isBootstrapping } = useAuth()

  const copy = language === 'tr'
    ? {
      navSections: [
        { id: 'discovery', label: 'Kurs Kesfi' },
        { id: 'institutions', label: 'Kurumlar' },
        { id: 'features', label: 'Ozellikler' },
      ],
      heroEyebrow: 'EduBase | Kurumsal Dijital Egitim Altyapisi',
      heroTitle: 'Kurs operasyonlarini ve ogrenme surecini tek platformda yonetin.',
      heroDescription: 'EduBase; ogrenci, egitmen ve kurum ekipleri icin kurs kesfi, ders yapisi ve ilerleme takibini net bir urun deneyiminde birlestirir.',
      heroPrimaryCta: 'Hesap Olustur',
      heroSecondaryCta: 'Kurslari Incele',
      heroQuickCardsTitle: 'Platform Gorunumu',
      heroVisualTitle: 'Programlar, kategoriler ve ogrenme akislari ayni merkezde',
      heroVisualDescription: 'Kurs seciminden ders ilerlemesine kadar her adim izlenebilir ve raporlanabilir bir duzende ilerler.',
      heroTrackActionLabel: 'Detaya Git',
      heroSecurityLabel: 'Guvenli Altyapi',
      heroStructureLabel: 'Program Yapisi',
      heroAnalyticsLabel: 'Ilerleme Analizi',
      heroProofPoints: ['Duzenli ders yapisi', 'Olculebilir ogrenci ilerlemesi'],
      heroLearnersLabel: 'Toplam Ogrenci',
      heroRatingLabel: 'Ortalama Puan',
      heroCoursesLabel: 'Aktif Kurs',
      trustTitle: 'Kurumsal ogrenme icin net ve guvenilir bir temel',
      trustDescription: 'Platform, gunluk operasyonlarda hiz kadar tutarlilik ve denetlenebilirlik ihtiyacini da gozetir.',
      trustItems: [
        {
          id: 'discover',
          title: 'Yapisal kurs kesfi',
          description: 'Ogrenciler kurslari konu, seviye ve kapsam bilgisiyle karsilastirir.',
          icon: 'discover' as const,
        },
        {
          id: 'track',
          title: 'Ilerleme takibi',
          description: 'Ders bazli durum gorunur, ogrenme sureci kesintisiz izlenir.',
          icon: 'track' as const,
        },
        {
          id: 'instructor',
          title: 'Egitmen verimliligi',
          description: 'Icerik planlama, ders duzeni ve ogrenci yonlendirmesi tek panelde ilerler.',
          icon: 'instructor' as const,
        },
        {
          id: 'secure',
          title: 'Guvenli platform deneyimi',
          description: 'Tutarli erisim akislariyla kurumsal kullanima uygun bir deneyim sunulur.',
          icon: 'secure' as const,
        },
      ],
      discoveryTitle: 'Kurs kesfi sade, karar sureci hizli',
      discoveryDescription: 'Katalog deneyimi; arama, filtreleme ve karsilastirma adimlarini tek bir akista birlestirir.',
      discoverySteps: [
        'Konuya gore ara, seviyeye gore daralt, hedefe gore sec.',
        'Kurs ozetlerini ve ders kapsamlarini tek ekranda degerlendir.',
        'Uygun kursu belirle ve detay sayfasina tek adimda gec.',
      ],
      discoveryCategoriesTitle: 'One Cikan Kategoriler',
      discoveryCoursesTitle: 'Degerlendirme Listesi',
      discoveryCatalogCta: 'Tum Kataloga Git',
      institutionTitle: 'Kurum ve egitmen ekipleri icin operasyonel netlik',
      institutionDescription: 'EduBase, egitim ekiplerinin kurs yasam dongusunu standart bir yapida yonetmesine yardimci olur.',
      institutionMainTitle: 'Kurum Olceginde Yonetim',
      institutionMainDescription: 'Kurs acma, icerik duzeni ve ogrenci izleme surecleri daginik araclar yerine tek platformda toplanir.',
      instructorTitle: 'Egitmen Yonetim Paneli',
      instructorDescription: 'Egitmenler ders akislarini, icerik seviyelerini ve ogrenci ilerlemesini odakli bir duzende yonetir.',
      institutionHighlights: [
        'Program bazli kurs organizasyonu',
        'Tutarli ders yapisi ve icerik standartlari',
        'Kurum ici raporlama ve izlenebilirlik',
      ],
      instructorCapabilities: [
        'Kurs ve ders icerigini merkezi yonetme',
        'Ogrenci ilerlemesini ders bazinda izleme',
        'Yayin surecini sade adimlarla surdurme',
      ],
      featureTitle: 'Uretimde kullanima hazir ozellik seti',
      featureDescription: 'Gereksiz gorsel kalabalik yerine islevsel, olgun ve kurumsal bir urun dili sunar.',
      featureItems: [
        {
          id: 'workflow',
          title: 'Akis odakli arayuz',
          description: 'Kesiften kayda kadar kullaniciyi dogal bir adim sirasinda ilerletir.',
          icon: 'workflow' as const,
        },
        {
          id: 'insight',
          title: 'Karar destekleyen gorunurluk',
          description: 'Kurs ozetleri ve ilerleme bilgileri karar aninda erisilebilir durumdadir.',
          icon: 'insight' as const,
        },
        {
          id: 'quality',
          title: 'Akademik ciddiyet',
          description: 'Kurs ve ders sunumu, profesyonel egitim ortamina uygun bicimde kurgulanir.',
          icon: 'quality' as const,
        },
        {
          id: 'security',
          title: 'Guvenilir deneyim',
          description: 'Platform geneli tutarli etkilesim dili, guven ve sureklilik hissini destekler.',
          icon: 'security' as const,
        },
      ],
      finalTitle: 'EduBase ile ogrenme operasyonlarini bugun baslatin',
      finalDescription: 'Kurslari inceleyin, platform akisini gorun ve ekibinize uygun dijital egitim altyapisini degerlendirin.',
      finalPrimaryCta: 'Hesap Olustur',
      finalSecondaryCta: 'Kurslari Incele',
      coursesLabel: 'kurs',
      lessonsLabel: 'ders',
      emptyCategoryHighlight: 'Kurs kapsamlarini goruntule',
    }
    : {
      navSections: [
        { id: 'discovery', label: 'Discovery' },
        { id: 'institutions', label: 'Institutions' },
        { id: 'features', label: 'Features' },
      ],
      heroEyebrow: 'EduBase | Enterprise Digital Learning Platform',
      heroTitle: 'Manage course operations and learning progress in one product.',
      heroDescription: 'EduBase brings course discovery, lesson structure, and learner progress into a focused experience for learners, instructors, and institutions.',
      heroPrimaryCta: 'Create Account',
      heroSecondaryCta: 'Browse Courses',
      heroQuickCardsTitle: 'Platform View',
      heroVisualTitle: 'Programs, categories, and learning flows in one center',
      heroVisualDescription: 'From course selection to lesson progress, every step stays visible and measurable.',
      heroTrackActionLabel: 'View Details',
      heroSecurityLabel: 'Secure Foundation',
      heroStructureLabel: 'Program Structure',
      heroAnalyticsLabel: 'Progress Analytics',
      heroProofPoints: ['Structured learning paths', 'Measurable learner progress'],
      heroLearnersLabel: 'Total Learners',
      heroRatingLabel: 'Average Rating',
      heroCoursesLabel: 'Active Courses',
      trustTitle: 'A reliable foundation for structured online education',
      trustDescription: 'The product supports day-to-day speed while preserving consistency and accountability.',
      trustItems: [
        {
          id: 'discover',
          title: 'Structured discovery',
          description: 'Learners compare courses with clear topic, level, and scope context.',
          icon: 'discover' as const,
        },
        {
          id: 'track',
          title: 'Progress visibility',
          description: 'Lesson-level completion data keeps learning outcomes transparent.',
          icon: 'track' as const,
        },
        {
          id: 'instructor',
          title: 'Instructor efficiency',
          description: 'Content planning and learner guidance stay aligned in one workspace.',
          icon: 'instructor' as const,
        },
        {
          id: 'secure',
          title: 'Trusted platform experience',
          description: 'Consistent access and interaction patterns support enterprise use.',
          icon: 'secure' as const,
        },
      ],
      discoveryTitle: 'Simple course discovery, faster decisions',
      discoveryDescription: 'The catalog flow combines search, filtering, and comparison in one path.',
      discoverySteps: [
        'Search by topic, narrow by level, and match to a clear learning goal.',
        'Review course summaries and lesson scope in one focused view.',
        'Move to course details in one step and continue with confidence.',
      ],
      discoveryCategoriesTitle: 'Featured Categories',
      discoveryCoursesTitle: 'Evaluation List',
      discoveryCatalogCta: 'Open Full Catalog',
      institutionTitle: 'Operational clarity for institutions and instructors',
      institutionDescription: 'EduBase helps education teams manage the full course lifecycle with a consistent structure.',
      institutionMainTitle: 'Institution-Scale Management',
      institutionMainDescription: 'Course creation, content structure, and learner tracking are centralized in one platform.',
      instructorTitle: 'Instructor Operations Panel',
      instructorDescription: 'Instructors manage lesson flow, content depth, and learner progress with less overhead.',
      institutionHighlights: [
        'Program-level course organization',
        'Consistent lesson structure and standards',
        'Internal reporting and traceability',
      ],
      instructorCapabilities: [
        'Manage courses and lessons from one center',
        'Track learner progress at lesson level',
        'Publish and maintain content with a clean workflow',
      ],
      featureTitle: 'A production-ready enterprise feature set',
      featureDescription: 'A mature interface language focused on clarity, control, and operational confidence.',
      featureItems: [
        {
          id: 'workflow',
          title: 'Flow-driven interface',
          description: 'Guides users naturally from discovery to enrollment actions.',
          icon: 'workflow' as const,
        },
        {
          id: 'insight',
          title: 'Decision-ready visibility',
          description: 'Course summaries and progress context remain accessible at key moments.',
          icon: 'insight' as const,
        },
        {
          id: 'quality',
          title: 'Academic seriousness',
          description: 'Course and lesson presentation is aligned with professional education standards.',
          icon: 'quality' as const,
        },
        {
          id: 'security',
          title: 'Trusted consistency',
          description: 'Platform-wide interaction patterns reinforce trust and continuity.',
          icon: 'security' as const,
        },
      ],
      finalTitle: 'Start evaluating EduBase today',
      finalDescription: 'Browse courses, review the platform flow, and assess a digital education foundation for your team.',
      finalPrimaryCta: 'Create Account',
      finalSecondaryCta: 'Browse Courses',
      coursesLabel: 'courses',
      lessonsLabel: 'lessons',
      emptyCategoryHighlight: 'View course scope',
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
          count: resolvedCourses.filter((course) => getCourseCategoryFilterKeys(course).includes(category.id)).length,
          highlight: resolvedCourses.find((course) => getCourseCategoryFilterKeys(course).includes(category.id))?.tags.slice(0, 2).join(' / ')
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
  const coursesValue = resolvedCourses.length.toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US')

  const heroCards = categories.slice(0, 4).map((category) => ({
    id: category.key,
    title: category.label,
    summary: category.highlight,
    href: buildCatalogPath({ category: category.key }),
  }))

  const discoveryCategories = categories.slice(0, 6).map((category) => ({
    id: category.key,
    label: category.label,
    countLabel: `${category.count} ${copy.coursesLabel}`,
    highlight: category.highlight,
    href: buildCatalogPath({ category: category.key }),
  }))

  const discoveryCourses = content.featuredCourses.slice(0, 4).map((course) => ({
    id: course.id,
    title: course.title,
    summary: course.summary,
    meta: `${course.level.levelName} | ${course.lessons} ${copy.lessonsLabel}`,
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
          analyticsLabel={copy.heroAnalyticsLabel}
          coursesLabel={copy.heroCoursesLabel}
          coursesValue={coursesValue}
          description={copy.heroDescription}
          eyebrow={copy.heroEyebrow}
          learnersLabel={copy.heroLearnersLabel}
          learnersValue={learnersValue}
          primaryCta={copy.heroPrimaryCta}
          primaryHref={ROUTES.register}
          proofPoints={copy.heroProofPoints}
          quickCards={heroCards}
          quickCardsTitle={copy.heroQuickCardsTitle}
          ratingLabel={copy.heroRatingLabel}
          ratingValue={ratingValue}
          secondaryCta={copy.heroSecondaryCta}
          secondaryHref={ROUTES.catalog}
          securityLabel={copy.heroSecurityLabel}
          structureLabel={copy.heroStructureLabel}
          title={copy.heroTitle}
          trackActionLabel={copy.heroTrackActionLabel}
          visualDescription={copy.heroVisualDescription}
          visualTitle={copy.heroVisualTitle}
        />

        <LandingValueSection
          description={copy.trustDescription}
          items={copy.trustItems}
          sectionId="overview"
          title={copy.trustTitle}
        />

        <LandingDiscoverySection
          catalogCta={copy.discoveryCatalogCta}
          catalogHref={ROUTES.catalog}
          categories={discoveryCategories}
          categoriesTitle={copy.discoveryCategoriesTitle}
          courses={discoveryCourses}
          coursesTitle={copy.discoveryCoursesTitle}
          description={copy.discoveryDescription}
          steps={copy.discoverySteps}
          title={copy.discoveryTitle}
        />

        <LandingBenefitsSection
          capabilities={copy.instructorCapabilities}
          description={copy.institutionDescription}
          highlights={copy.institutionHighlights}
          institutionDescription={copy.institutionMainDescription}
          institutionTitle={copy.institutionMainTitle}
          instructorDescription={copy.instructorDescription}
          instructorTitle={copy.instructorTitle}
          sectionId="institutions"
          title={copy.institutionTitle}
        />

        <LandingFeatureSection
          description={copy.featureDescription}
          items={copy.featureItems}
          sectionId="features"
          title={copy.featureTitle}
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
