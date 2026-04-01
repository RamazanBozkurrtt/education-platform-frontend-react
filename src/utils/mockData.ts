import { getInitials } from './helpers'
import type {
  AppLanguage,
  Course,
  CourseModule,
  DashboardOverview,
  LocalizedField,
  SearchFilters,
  SearchResponse,
  User,
} from './types'

const localized = <T>(en: T, tr: T): LocalizedField<T> => ({ en, tr })

const pick = <T>(field: LocalizedField<T>, language: AppLanguage) => field[language]

type LocalizedCourseModule = Omit<CourseModule, 'title' | 'duration' | 'type'> & {
  title: LocalizedField<string>
  duration: LocalizedField<string>
  type: LocalizedField<string>
}

type LocalizedCourse = Omit<
  Course,
  | 'title'
  | 'category'
  | 'level'
  | 'duration'
  | 'summary'
  | 'description'
  | 'outcomes'
  | 'tags'
  | 'modules'
  | 'instructor'
> & {
  title: LocalizedField<string>
  category: LocalizedField<string>
  level: LocalizedField<string>
  duration: LocalizedField<string>
  summary: LocalizedField<string>
  description: LocalizedField<string>
  outcomes: Array<LocalizedField<string>>
  tags: Array<LocalizedField<string>>
  modules: LocalizedCourseModule[]
  instructor: {
    name: string
    role: LocalizedField<string>
    bio: LocalizedField<string>
  }
}

type LocalizedMetric = {
  label: LocalizedField<string>
  value: string
  change: string
  trend: 'up' | 'down'
  tone: 'cyan' | 'emerald' | 'amber' | 'indigo'
}

type LocalizedActivity = {
  id: string
  title: LocalizedField<string>
  description: LocalizedField<string>
  time: LocalizedField<string>
  tag: LocalizedField<string>
}

type LocalizedMilestone = {
  id: string
  label: LocalizedField<string>
  due: LocalizedField<string>
  status: LocalizedField<string>
}

export const currentUser: User = {
  id: 'usr_01',
  name: 'Avery Coleman',
  email: 'avery@lumaacademy.dev',
  roleLabelKey: 'user.roles.learningLead',
  avatarColor: 'from-cyan-400 to-blue-500',
  initials: getInitials('Avery Coleman'),
}

const localizedCourses: LocalizedCourse[] = [
  {
    id: 'course_01',
    slug: 'product-strategy-foundations',
    title: localized('Product Strategy Foundations', 'Urun Stratejisi Temelleri'),
    category: localized('Product', 'Urun'),
    level: localized('Intermediate', 'Orta'),
    duration: localized('6 weeks', '6 hafta'),
    lessons: 18,
    progress: 72,
    students: '1.2k',
    rating: 4.9,
    price: 249,
    accent: 'from-cyan-500/30 via-sky-500/10 to-transparent',
    summary: localized(
      'Build a product operating model that ties roadmap choices to business outcomes.',
      'Yol haritasi kararlarini is sonuclarina baglayan bir urun isletim modeli kur.',
    ),
    description: localized(
      'A structured program for product teams who want clearer prioritization, sharper customer discovery, and measurable roadmap planning.',
      'Daha net onceliklendirme, daha guclu musteri kesfi ve olculebilir yol haritasi planlamasi isteyen urun ekipleri icin yapilandirilmis bir program.',
    ),
    outcomes: [
      localized('Design a repeatable prioritization workflow', 'Tekrarlanabilir bir onceliklendirme akisi tasarla'),
      localized('Map initiatives to company-level OKRs', 'Inisiyatifleri sirket seviyesindeki OKR lara bagla'),
      localized('Run customer discovery loops with confidence', 'Musteri kesif dongulerini guvenle yurut'),
      localized('Create quarterly roadmap reviews stakeholders trust', 'Paydaslarin guvendigi ceyreklik yol haritasi degerlendirmeleri olustur'),
    ],
    tags: [
      localized('Roadmapping', 'Yol Haritasi'),
      localized('OKRs', 'OKR'),
      localized('Discovery', 'Kesif'),
    ],
    modules: [
      {
        id: 'm1',
        title: localized('Market signals and opportunity sizing', 'Pazar sinyalleri ve firsat boyutlandirma'),
        duration: localized('42 min', '42 dk'),
        type: localized('Workshop', 'Atolye'),
        completed: true,
      },
      {
        id: 'm2',
        title: localized('Building a lean product thesis', 'Yalin urun tezi olusturma'),
        duration: localized('36 min', '36 dk'),
        type: localized('Lesson', 'Ders'),
        completed: true,
      },
      {
        id: 'm3',
        title: localized('Prioritization frameworks in practice', 'Pratikte onceliklendirme cerceveleri'),
        duration: localized('55 min', '55 dk'),
        type: localized('Case study', 'Vaka analizi'),
        completed: true,
      },
      {
        id: 'm4',
        title: localized('Executive communication and roadmap rituals', 'Yonetici iletisimi ve yol haritasi ritulleri'),
        duration: localized('48 min', '48 dk'),
        type: localized('Workshop', 'Atolye'),
        completed: false,
      },
    ],
    instructor: {
      name: 'Maya Patel',
      role: localized('VP Product, Northstar Labs', 'Urun Baskan Yardimcisi, Northstar Labs'),
      bio: localized(
        'Maya helps product organizations align strategy, discovery, and execution across high-growth SaaS teams.',
        'Maya, yuksek buyume gosteren SaaS ekiplerinde strateji, kesif ve uygulamayi hizalamaya yardimci olur.',
      ),
    },
  },
  {
    id: 'course_02',
    slug: 'data-analytics-for-growth',
    title: localized('Data Analytics for Growth', 'Buyume Icin Veri Analitigi'),
    category: localized('Analytics', 'Analitik'),
    level: localized('Advanced', 'Ileri'),
    duration: localized('8 weeks', '8 hafta'),
    lessons: 24,
    progress: 41,
    students: '980',
    rating: 4.8,
    price: 329,
    accent: 'from-indigo-500/30 via-cyan-500/10 to-transparent',
    summary: localized(
      'Turn dashboards into decision systems with strong experimentation and reporting habits.',
      'Dashboard lari guclu deney ve raporlama aliskanliklariyla karar sistemlerine donustur.',
    ),
    description: localized(
      'A practical analytics journey covering instrumentation, experiment design, stakeholder reporting, and action-oriented storytelling.',
      'Enstrumantasyon, deney tasarimi, paydas raporlama ve aksiyon odakli hikayelestirmeyi kapsayan pratik bir analitik yolculugu.',
    ),
    outcomes: [
      localized('Define north-star metrics and supporting KPIs', 'North-star metrikleri ve destekleyici KPI lari tanimla'),
      localized('Audit event tracking for product surfaces', 'Urun yuzeyleri icin event tracking denetimi yap'),
      localized('Plan experiments with statistical confidence', 'Istatistiksel guvenle deneyler planla'),
      localized('Create executive-ready reporting narratives', 'Yoneticiye hazir raporlama anlatilari olustur'),
    ],
    tags: [
      localized('Dashboards', 'Dashboard'),
      localized('Experimentation', 'Deney'),
      localized('SQL', 'SQL'),
    ],
    modules: [
      {
        id: 'm1',
        title: localized('Instrumentation maturity audit', 'Enstrumantasyon olgunluk denetimi'),
        duration: localized('31 min', '31 dk'),
        type: localized('Lesson', 'Ders'),
        completed: true,
      },
      {
        id: 'm2',
        title: localized('Experiment design and guardrail metrics', 'Deney tasarimi ve koruyucu metrikler'),
        duration: localized('44 min', '44 dk'),
        type: localized('Workshop', 'Atolye'),
        completed: false,
      },
      {
        id: 'm3',
        title: localized('Analytics storytelling for leadership', 'Liderlik icin analitik hikayelestirme'),
        duration: localized('39 min', '39 dk'),
        type: localized('Case study', 'Vaka analizi'),
        completed: false,
      },
      {
        id: 'm4',
        title: localized('Scaling reporting processes', 'Raporlama sureclerini olceklendirme'),
        duration: localized('33 min', '33 dk'),
        type: localized('Lesson', 'Ders'),
        completed: false,
      },
    ],
    instructor: {
      name: 'Jonas Reed',
      role: localized('Growth Analytics Director, Beacon', 'Buyume Analitigi Direktoru, Beacon'),
      bio: localized(
        'Jonas partners with growth teams to transform raw data into profitable experimentation programs.',
        'Jonas, buyume ekipleriyle birlikte calisarak ham veriyi karli deney programlarina donusturur.',
      ),
    },
  },
  {
    id: 'course_03',
    slug: 'ux-systems-for-saas',
    title: localized('UX Systems for SaaS', 'SaaS Icin UX Sistemleri'),
    category: localized('Design', 'Tasarim'),
    level: localized('Intermediate', 'Orta'),
    duration: localized('5 weeks', '5 hafta'),
    lessons: 15,
    progress: 58,
    students: '1.8k',
    rating: 4.9,
    price: 219,
    accent: 'from-emerald-500/25 via-cyan-500/10 to-transparent',
    summary: localized(
      'Craft a polished SaaS experience with scalable patterns, strong hierarchy, and usable motion.',
      'Olceklenebilir kaliplar, guclu hiyerarsi ve kullanisli hareketlerle rafine bir SaaS deneyimi tasarla.',
    ),
    description: localized(
      'Learn how to design interfaces that feel calm, premium, and consistent across dashboard, workflow, and mobile states.',
      'Dashboard, is akisi ve mobil durumlarda sakin, premium ve tutarli hissettiren arayuzler tasarlamayi ogren.',
    ),
    outcomes: [
      localized('Audit visual hierarchy in dense dashboards', 'Yogun dashboard larda gorsel hiyerarsiyi denetle'),
      localized('Design reusable card and table systems', 'Yeniden kullanilabilir kart ve tablo sistemleri tasarla'),
      localized('Balance motion, feedback, and performance', 'Hareket, geri bildirim ve performansi dengele'),
      localized('Prepare handoff-ready UI specifications', 'Teslime hazir UI spesifikasyonlari hazirla'),
    ],
    tags: [
      localized('Design Systems', 'Tasarim Sistemleri'),
      localized('UX Writing', 'UX Yazimi'),
      localized('Motion', 'Hareket'),
    ],
    modules: [
      {
        id: 'm1',
        title: localized('Designing composable layout systems', 'Birlesebilir layout sistemleri tasarlama'),
        duration: localized('26 min', '26 dk'),
        type: localized('Workshop', 'Atolye'),
        completed: true,
      },
      {
        id: 'm2',
        title: localized('Interaction states and polished transitions', 'Etkilesim durumlari ve rafine gecisler'),
        duration: localized('35 min', '35 dk'),
        type: localized('Lesson', 'Ders'),
        completed: true,
      },
      {
        id: 'm3',
        title: localized('Responsive behavior for dense interfaces', 'Yogun arayuzler icin responsive davranis'),
        duration: localized('29 min', '29 dk'),
        type: localized('Lesson', 'Ders'),
        completed: false,
      },
      {
        id: 'm4',
        title: localized('Design QA and production readiness', 'Tasarim QA ve produksiyon hazirligi'),
        duration: localized('38 min', '38 dk'),
        type: localized('Case study', 'Vaka analizi'),
        completed: false,
      },
    ],
    instructor: {
      name: 'Lina Brooks',
      role: localized('Staff Product Designer, Meridian', 'Staff Product Designer, Meridian'),
      bio: localized(
        'Lina leads multi-platform design systems with a focus on polished enterprise experiences.',
        'Lina, rafine kurumsal deneyimlere odaklanan cok platformlu tasarim sistemlerine liderlik eder.',
      ),
    },
  },
  {
    id: 'course_04',
    slug: 'ai-ops-for-modern-teams',
    title: localized('AI Ops for Modern Teams', 'Modern Ekipler Icin AI Ops'),
    category: localized('Engineering', 'Muhendislik'),
    level: localized('Beginner', 'Baslangic'),
    duration: localized('4 weeks', '4 hafta'),
    lessons: 12,
    progress: 19,
    students: '760',
    rating: 4.7,
    price: 189,
    accent: 'from-amber-400/30 via-orange-400/10 to-transparent',
    summary: localized(
      'Adopt AI workflows responsibly inside product, support, and delivery organizations.',
      'Urun, destek ve teslimat organizasyonlarinda AI is akislarini sorumlu sekilde hayata gecir.',
    ),
    description: localized(
      'A practical primer on safe AI adoption, implementation workflows, quality review loops, and team enablement.',
      'Guvenli AI adaptasyonu, uygulama akisleri, kalite kontrol donguleri ve ekip enablement uzerine pratik bir baslangic programi.',
    ),
    outcomes: [
      localized('Identify high-leverage AI use cases', 'Yuksek etki potansiyeline sahip AI kullanim senaryolarini belirle'),
      localized('Create review loops for generated output', 'Uretilen cikti icin gozden gecirme donguleri olustur'),
      localized('Set guardrails for internal tooling', 'Ic araclar icin sinirlar ve guvenlik cerceveleri belirle'),
      localized('Measure operational ROI from AI workflows', 'AI is akislarinin operasyonel ROI sini olc'),
    ],
    tags: [
      localized('AI', 'AI'),
      localized('Automation', 'Otomasyon'),
      localized('Operations', 'Operasyon'),
    ],
    modules: [
      {
        id: 'm1',
        title: localized('Selecting high-confidence workflows', 'Yuksek guvenli akislari secme'),
        duration: localized('28 min', '28 dk'),
        type: localized('Lesson', 'Ders'),
        completed: true,
      },
      {
        id: 'm2',
        title: localized('Prompt design for repeatable outcomes', 'Tekrarlanabilir sonuclar icin prompt tasarimi'),
        duration: localized('32 min', '32 dk'),
        type: localized('Workshop', 'Atolye'),
        completed: false,
      },
      {
        id: 'm3',
        title: localized('Quality control and evaluation loops', 'Kalite kontrol ve degerlendirme donguleri'),
        duration: localized('41 min', '41 dk'),
        type: localized('Lesson', 'Ders'),
        completed: false,
      },
      {
        id: 'm4',
        title: localized('Scaling adoption across the org', 'Organizasyon genelinde olceklendirme'),
        duration: localized('30 min', '30 dk'),
        type: localized('Case study', 'Vaka analizi'),
        completed: false,
      },
    ],
    instructor: {
      name: 'Ethan Cruz',
      role: localized('AI Program Manager, Fluxware', 'AI Program Yoneticisi, Fluxware'),
      bio: localized(
        'Ethan helps operations teams roll out AI systems safely without sacrificing trust or governance.',
        'Ethan, operasyon ekiplerinin guven ve yonetisimden odun vermeden AI sistemlerini guvenle devreye almasina yardimci olur.',
      ),
    },
  },
]

const localizedMetrics: LocalizedMetric[] = [
  { label: localized('Courses in progress', 'Devam eden kurslar'), value: '12', change: '+18%', trend: 'up', tone: 'cyan' },
  { label: localized('Completion rate', 'Tamamlama orani'), value: '84%', change: '+6%', trend: 'up', tone: 'emerald' },
  { label: localized('Hours this month', 'Bu ayki saat'), value: '43h', change: '+9h', trend: 'up', tone: 'amber' },
  { label: localized('Team seats active', 'Aktif ekip koltugu'), value: '28', change: '-2%', trend: 'down', tone: 'indigo' },
]

const localizedActivities: LocalizedActivity[] = [
  {
    id: 'act_01',
    title: localized('Finished module: Prioritization frameworks', 'Tamamlanan modul: Onceliklendirme cerceveleri'),
    description: localized('Product Strategy Foundations', 'Urun Stratejisi Temelleri'),
    time: localized('12 minutes ago', '12 dakika once'),
    tag: localized('Completed', 'Tamamlandi'),
  },
  {
    id: 'act_02',
    title: localized('Course added to cart: UX Systems for SaaS', 'Sepete eklenen kurs: SaaS Icin UX Sistemleri'),
    description: localized('Design pod selected for team rollout', 'Tasarim ekibi icin secildi'),
    time: localized('2 hours ago', '2 saat once'),
    tag: localized('Cart', 'Sepet'),
  },
  {
    id: 'act_03',
    title: localized('Quarterly report shared with leadership', 'Ceyreklik rapor liderlikle paylasildi'),
    description: localized('Learning engagement metrics exported', 'Ogrenme etkilesim metrikleri disa aktarildi'),
    time: localized('Yesterday', 'Dun'),
    tag: localized('Report', 'Rapor'),
  },
]

const localizedMilestones: LocalizedMilestone[] = [
  {
    id: 'mil_01',
    label: localized('Live critique with design mentors', 'Tasarim mentorlariyla canli degerlendirme'),
    due: localized('Today, 3:00 PM', 'Bugun, 15:00'),
    status: localized('Ready', 'Hazir'),
  },
  {
    id: 'mil_02',
    label: localized('Analytics capstone review', 'Analitik bitirme projesi degerlendirmesi'),
    due: localized('Tomorrow, 11:00 AM', 'Yarin, 11:00'),
    status: localized('Upcoming', 'Yaklasiyor'),
  },
  {
    id: 'mil_03',
    label: localized('Complete payment for selected courses', 'Secilen kurslar icin odemeyi tamamla'),
    due: localized('Apr 02', '02 Nis'),
    status: localized('Needs review', 'Gozden gecirilmeli'),
  },
]

const mapCourse = (course: LocalizedCourse, language: AppLanguage): Course => ({
  ...course,
  title: pick(course.title, language),
  category: pick(course.category, language),
  level: pick(course.level, language),
  duration: pick(course.duration, language),
  summary: pick(course.summary, language),
  description: pick(course.description, language),
  outcomes: course.outcomes.map((item) => pick(item, language)),
  tags: course.tags.map((item) => pick(item, language)),
  modules: course.modules.map((module) => ({
    ...module,
    title: pick(module.title, language),
    duration: pick(module.duration, language),
    type: pick(module.type, language),
  })),
  instructor: {
    name: course.instructor.name,
    role: pick(course.instructor.role, language),
    bio: pick(course.instructor.bio, language),
  },
})

export const getCourses = (language: AppLanguage): Course[] =>
  localizedCourses.map((course) => mapCourse(course, language))

export const getCurrentUser = () => currentUser

export const getDashboardOverview = (language: AppLanguage): DashboardOverview => {
  const courses = getCourses(language)

  return {
    metrics: localizedMetrics.map((metric) => ({
      ...metric,
      label: pick(metric.label, language),
    })),
    recentActivity: localizedActivities.map((activity) => ({
      id: activity.id,
      title: pick(activity.title, language),
      description: pick(activity.description, language),
      time: pick(activity.time, language),
      tag: pick(activity.tag, language),
    })),
    focusCourse: courses[0],
    upcomingMilestones: localizedMilestones.map((milestone) => ({
      id: milestone.id,
      label: pick(milestone.label, language),
      due: pick(milestone.due, language),
      status: pick(milestone.status, language),
    })),
  }
}

export const getCourseBySlug = (slug: string, language: AppLanguage) =>
  getCourses(language).find((course) => course.slug === slug) ?? getCourses(language)[0]

export const searchCatalog = (filters: SearchFilters, language: AppLanguage): SearchResponse => {
  const courses = getCourses(language)
  const normalizedQuery = filters.query.trim().toLocaleLowerCase(language)

  const results = courses.filter((course) => {
    const matchesQuery =
      !normalizedQuery ||
      course.title.toLocaleLowerCase(language).includes(normalizedQuery) ||
      course.summary.toLocaleLowerCase(language).includes(normalizedQuery) ||
      course.tags.some((tag) => tag.toLocaleLowerCase(language).includes(normalizedQuery))

    const matchesCategory = !filters.category || course.category === filters.category
    const matchesLevel = !filters.level || course.level === filters.level

    return matchesQuery && matchesCategory && matchesLevel
  })

  return {
    filters: {
      categories: [...new Set(courses.map((course) => course.category))],
      levels: [...new Set(courses.map((course) => course.level))],
    },
    results,
  }
}
