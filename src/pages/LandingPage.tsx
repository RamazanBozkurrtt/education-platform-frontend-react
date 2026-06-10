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
import Button from '../components/ui/Button'
import QueryErrorState from '../components/ui/QueryErrorState'
import '../components/landing/landing.css'
import { useLanguage } from '../hooks/useLanguage'
import { courseService } from '../services/courseService'
import { normalizeApiError } from '../shared/errors/normalizeApiError'
import { buildCatalogPath, getCatalogCategories } from '../utils/catalogFilters'
import { ROUTES } from '../utils/constants'
import { getCourseCategoryFilterKeys, getCourseCategoryLabel } from '../utils/courseCategory'
import { parseStudentCount } from '../utils/helpers'

const LandingPage = () => {
  const { t } = useTranslation()
  const { language } = useLanguage()

  const copy = language === 'tr'
    ? {
      navSections: [
        { id: 'discovery', label: 'Kurs Keşfi' },
        { id: 'institutions', label: 'Kurumlar' },
        { id: 'features', label: 'Özellikler' },
      ],
      heroEyebrow: 'EduBase | Kurumsal Dijital Eğitim Altyapısı',
      heroTitle: 'Kurs operasyonlarını ve öğrenme sürecini tek platformda yönetin.',
      heroDescription: 'EduBase; öğrenci, eğitmen ve kurum ekipleri için kurs keşfi, ders yapısı ve ilerleme takibini net bir ürün deneyiminde birleştirir.',
      heroPrimaryCta: 'Hesap Oluştur',
      heroSecondaryCta: 'Kursları İncele',
      heroQuickCardsTitle: 'Platform Görünümü',
      heroVisualTitle: 'Programlar, kategoriler ve öğrenme akışları aynı merkezde',
      heroVisualDescription: 'Kurs seçiminden ders ilerlemesine kadar her adım izlenebilir ve raporlanabilir bir düzende ilerler.',
      heroTrackActionLabel: 'Detaya Git',
      heroSecurityLabel: 'Güvenli Altyapı',
      heroStructureLabel: 'Program Yapısı',
      heroAnalyticsLabel: 'İlerleme Analizi',
      heroProofPoints: ['Düzenli ders yapısı', 'Ölçülebilir öğrenci ilerlemesi'],
      heroLearnersLabel: 'Toplam Öğrenci',
      heroRatingLabel: 'Ortalama Puan',
      heroCoursesLabel: 'Aktif Kurs',
      trustTitle: 'Kurumsal öğrenme için net ve güvenilir bir temel',
      trustDescription: 'Platform, günlük operasyonlarda hız kadar tutarlılık ve denetlenebilirlik ihtiyacını da gözetir.',
      trustItems: [
        {
          id: 'discover',
          title: 'Yapısal kurs keşfi',
          description: 'Öğrenciler kursları konu, seviye ve kapsam bilgisiyle karşılaştırır.',
          icon: 'discover' as const,
        },
        {
          id: 'track',
          title: 'İlerleme takibi',
          description: 'Ders bazlı durum görünür, öğrenme süreci kesintisiz izlenir.',
          icon: 'track' as const,
        },
        {
          id: 'instructor',
          title: 'Eğitmen verimliliği',
          description: 'İçerik planlama, ders düzeni ve öğrenci yönlendirmesi tek panelde ilerler.',
          icon: 'instructor' as const,
        },
        {
          id: 'secure',
          title: 'Güvenli platform deneyimi',
          description: 'Tutarlı erişim akışlarıyla kurumsal kullanıma uygun bir deneyim sunulur.',
          icon: 'secure' as const,
        },
      ],
      discoveryTitle: 'Kurs keşfi sade, karar süreci hızlı',
      discoveryDescription: 'Katalog deneyimi; arama, filtreleme ve karşılaştırma adımlarını tek bir akışta birleştirir.',
      discoverySteps: [
        'Konuya göre ara, seviyeye göre daralt, hedefe göre seç.',
        'Kurs özetlerini ve ders kapsamlarını tek ekranda değerlendir.',
        'Uygun kursu belirle ve detay sayfasına tek adımda geç.',
      ],
      discoveryCategoriesTitle: 'Öne Çıkan Kategoriler',
      discoveryCoursesTitle: 'Değerlendirme Listesi',
      discoveryCatalogCta: 'Tüm Kataloğa Git',
      institutionTitle: 'Kurum ve eğitmen ekipleri için operasyonel netlik',
      institutionDescription: 'EduBase, eğitim ekiplerinin kurs yaşam döngüsünü standart bir yapıda yönetmesine yardımcı olur.',
      institutionMainTitle: 'Kurum Ölçeğinde Yönetim',
      institutionMainDescription: 'Kurs açma, içerik düzeni ve öğrenci izleme süreçleri dağınık araçlar yerine tek platformda toplanır.',
      instructorTitle: 'Eğitmen Yönetim Paneli',
      instructorDescription: 'Eğitmenler ders akışlarını, içerik seviyelerini ve öğrenci ilerlemesini odaklı bir düzende yönetir.',
      institutionHighlights: [
        'Program bazlı kurs organizasyonu',
        'Tutarlı ders yapısı ve içerik standartları',
        'Kurum içi raporlama ve izlenebilirlik',
      ],
      instructorCapabilities: [
        'Kurs ve ders içeriğini merkezi yönetme',
        'Öğrenci ilerlemesini ders bazında izleme',
        'Yayın sürecini sade adımlarla sürdürme',
      ],
      featureTitle: 'Üretimde kullanıma hazır özellik seti',
      featureDescription: 'Gereksiz görsel kalabalık yerine işlevsel, olgun ve kurumsal bir ürün dili sunar.',
      featureItems: [
        {
          id: 'workflow',
          title: 'Akış odaklı arayüz',
          description: 'Keşiften kayda kadar kullanıcıyı doğal bir adım sırasında ilerletir.',
          icon: 'workflow' as const,
        },
        {
          id: 'insight',
          title: 'Kararı destekleyen görünürlük',
          description: 'Kurs özetleri ve ilerleme bilgileri karar anında erişilebilir durumdadır.',
          icon: 'insight' as const,
        },
        {
          id: 'quality',
          title: 'Akademik ciddiyet',
          description: 'Kurs ve ders sunumu, profesyonel eğitim ortamına uygun biçimde kurgulanır.',
          icon: 'quality' as const,
        },
        {
          id: 'security',
          title: 'Güvenilir deneyim',
          description: 'Platform geneli tutarlı etkileşim dili, güven ve süreklilik hissini destekler.',
          icon: 'security' as const,
        },
      ],
      finalTitle: 'EduBase ile öğrenme operasyonlarını bugün başlatın',
      finalDescription: 'Kursları inceleyin, platform akışını görün ve ekibinize uygun dijital eğitim altyapısını değerlendirin.',
      finalPrimaryCta: 'Hesap Oluştur',
      finalSecondaryCta: 'Kursları İncele',
      coursesLabel: 'kurs',
      lessonsLabel: 'ders',
      emptyCategoryHighlight: 'Kurs kapsamlarını görüntüle',
      categoryLoadFailed: 'Kategoriler yüklenemedi.',
      retryCategoryLoad: 'Tekrar dene',
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
      categoryLoadFailed: 'Categories could not be loaded.',
      retryCategoryLoad: 'Retry',
    }

  const { data: courses, error, isLoading } = useQuery({
    queryKey: ['landing-courses', language],
    queryFn: () => courseService.getCourses(language),
  })
  const {
    data: categoriesFromApi = [],
    error: categoriesError,
    refetch: refetchCategories,
    isFetching: isFetchingCategories,
  } = useQuery({
    queryKey: ['landing-categories'],
    queryFn: () => courseService.getPublicCategories(),
    staleTime: 0,
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

    const sortedCourses = [...resolvedCourses].sort((left, right) => (
      (right.studentsCount ?? parseStudentCount(right.students) ?? 0)
      - (left.studentsCount ?? parseStudentCount(left.students) ?? 0)
    ))
    const totalLearners = resolvedCourses.reduce((sum, course) => sum + (course.studentsCount ?? parseStudentCount(course.students) ?? 0), 0)
    const ratedCourses = resolvedCourses.filter((course) => (course.ratingCount ?? 0) > 0 || course.rating > 0)
    const averageRating = ratedCourses.length > 0
      ? ratedCourses.reduce((sum, course) => sum + course.rating, 0) / ratedCourses.length
      : 0

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
    { key: 'software-development', label: language === 'tr' ? 'Yazılım Geliştirme' : 'Software Development', count: 0, highlight: copy.emptyCategoryHighlight },
    { key: 'data-science', label: language === 'tr' ? 'Veri Bilimi' : 'Data Science', count: 0, highlight: copy.emptyCategoryHighlight },
    { key: 'mobile-development', label: language === 'tr' ? 'Mobil Uygulama' : 'Mobile Development', count: 0, highlight: copy.emptyCategoryHighlight },
    { key: 'cyber-security', label: language === 'tr' ? 'Siber Güvenlik' : 'Cyber Security', count: 0, highlight: copy.emptyCategoryHighlight },
  ], [copy.emptyCategoryHighlight, language])

  const categories = content.categories.length ? content.categories : fallbackCategories
  const learnersValue = content.totalLearners.toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US')
  const ratingValue = content.averageRating ? content.averageRating.toFixed(1) : (language === 'tr' ? 'Yok' : 'N/A')
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
        {categoriesError ? (
          <section className="mx-auto w-full max-w-[1200px] px-5 pt-8">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-cards)] border border-[color:var(--danger)] bg-[color:var(--surface-soft-peach)] px-4 py-3">
              <p className="theme-text text-sm font-medium">{copy.categoryLoadFailed}</p>
              <Button disabled={isFetchingCategories} onClick={() => void refetchCategories()} size="sm" type="button" variant="secondary">
                {copy.retryCategoryLoad}
              </Button>
            </div>
          </section>
        ) : null}

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
