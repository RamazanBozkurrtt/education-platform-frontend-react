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
const toStableKey = (value: string) =>
  value
    .toLocaleLowerCase('en-US')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

type LocalizedCourseModule = Omit<CourseModule, 'title' | 'duration' | 'type'> & {
  title: LocalizedField<string>
  duration: LocalizedField<string>
  type: LocalizedField<string>
}

type LocalizedCourse = Omit<
  Course,
  | 'title'
  | 'category'
  | 'categoryKey'
  | 'level'
  | 'levelKey'
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
  progress: number
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
  firstName: 'Avery',
  lastName: 'Coleman',
  headline: 'Learning Program Lead',
  biography:
    'Plans internal learning programs and supports product and design teams with practical course paths.',
  avatarUrl: '',
  socialLinks: {
    LinkedIn: 'https://linkedin.com/in/avery-coleman',
    GitHub: 'https://github.com/averycoleman',
  },
  roleLabelKey: 'user.roles.learningLead',
  avatarColor: 'from-cyan-400 to-blue-500',
  initials: getInitials('Avery Coleman'),
}

const localizedCourses: LocalizedCourse[] = [
  {
    id: 'course_01',
    slug: 'product-strategy-foundations',
    title: localized('Product Strategy Foundations', 'Ürün Stratejisi Temelleri'),
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=80',
    category: localized('Product', 'Ürün'),
    level: localized('Intermediate', 'Orta'),
    duration: localized('6 weeks', '6 hafta'),
    lessons: 18,
    progress: 72,
    students: '1.2k',
    rating: 4.9,
    price: 249,
    accent: 'from-cyan-500/30 via-sky-500/10 to-transparent',
    summary: localized(
      'Connect product ideas with customer needs, goals, and roadmap decisions.',
      'Ürün fikirlerini müşteri ihtiyaçları, hedefler ve yol haritası kararlarıyla ilişkilendir.',
    ),
    description: localized(
      'A practical course for product teams that want clearer prioritization, better customer research, and simpler roadmap planning.',
      'Önceliklendirme, müşteri araştırması ve yol haritası planlamasını daha anlaşılır hale getirmek isteyen ürün ekipleri için pratik bir kurs.',
    ),
    outcomes: [
      localized('Build a repeatable prioritization process', 'Tekrarlanabilir bir önceliklendirme süreci kur'),
      localized('Connect product work with company goals', 'Ürün çalışmalarını şirket hedefleriyle ilişkilendir'),
      localized('Run customer interviews with a clear plan', 'Müşteri görüşmelerini planlı şekilde yürüt'),
      localized('Prepare roadmap reviews stakeholders can follow', 'Paydaşların kolayca takip edebileceği yol haritası değerlendirmeleri hazırla'),
    ],
    tags: [
      localized('Roadmapping', 'Yol Haritası'),
      localized('OKRs', 'OKR'),
      localized('Customer Research', 'Müşteri Araştırması'),
    ],
    modules: [
      {
        id: 'm1',
        title: localized('Market research and opportunity sizing', 'Pazar araştırması ve fırsat değerlendirme'),
        duration: localized('42 min', '42 dk'),
        type: localized('Workshop', 'Atölye'),
        completed: true,
      },
      {
        id: 'm2',
        title: localized('Building a lean product thesis', 'Yalın ürün hipotezi oluşturma'),
        duration: localized('36 min', '36 dk'),
        type: localized('Lesson', 'Ders'),
        completed: true,
      },
      {
        id: 'm3',
        title: localized('Prioritization methods in practice', 'Önceliklendirme yöntemlerini uygulama'),
        duration: localized('55 min', '55 dk'),
        type: localized('Case study', 'Vaka analizi'),
        completed: true,
      },
      {
        id: 'm4',
        title: localized('Roadmap communication with stakeholders', 'Paydaşlarla yol haritası iletişimi'),
        duration: localized('48 min', '48 dk'),
        type: localized('Workshop', 'Atölye'),
        completed: false,
      },
    ],
    instructor: {
      name: 'Maya Patel',
      role: localized('VP Product, Northstar Labs', 'Ürün Başkan Yardımcısı, Northstar Labs'),
      bio: localized(
        'Maya helps product teams turn customer research and strategy into clear roadmap decisions.',
        'Maya, ürün ekiplerinin müşteri araştırmasını ve stratejiyi net yol haritası kararlarına dönüştürmesine yardımcı olur.',
      ),
    },
  },
  {
    id: 'course_02',
    slug: 'data-analytics-for-growth',
    title: localized('Data Analytics for Growth', 'Büyüme İçin Veri Analitiği'),
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80',
    category: localized('Analytics', 'Analitik'),
    level: localized('Advanced', 'İleri'),
    duration: localized('8 weeks', '8 hafta'),
    lessons: 24,
    progress: 41,
    students: '980',
    rating: 4.8,
    price: 329,
    accent: 'from-indigo-500/30 via-cyan-500/10 to-transparent',
    summary: localized(
      'Use data, experiments, and reporting habits to make better growth decisions.',
      'Veri, deney ve raporlama alışkanlıklarıyla daha iyi büyüme kararları al.',
    ),
    description: localized(
      'Learn the basics of measurement planning, experiment design, reporting, and clear data storytelling.',
      'Ölçüm planlama, deney tasarımı, raporlama ve anlaşılır veri anlatımı üzerine pratik bir kurs.',
    ),
    outcomes: [
      localized('Define north-star metrics and supporting KPIs', 'Ana başarı metriğini ve destekleyici KPIları tanımla'),
      localized('Review product event tracking', 'Ürün içi olay takibini gözden geçir'),
      localized('Plan experiments with clear success criteria', 'Net başarı kriterleriyle deneyler planla'),
      localized('Prepare reports that explain what changed', 'Değişimi anlaşılır şekilde anlatan raporlar hazırla'),
    ],
    tags: [
      localized('Reporting', 'Raporlama'),
      localized('Experimentation', 'Deney Tasarımı'),
      localized('SQL', 'SQL'),
    ],
    modules: [
      {
        id: 'm1',
        title: localized('Measurement setup review', 'Ölçüm altyapısını gözden geçirme'),
        duration: localized('31 min', '31 dk'),
        type: localized('Lesson', 'Ders'),
        completed: true,
      },
      {
        id: 'm2',
        title: localized('Experiment design and guardrail metrics', 'Deney tasarımı ve kontrol metrikleri'),
        duration: localized('44 min', '44 dk'),
        type: localized('Workshop', 'Atölye'),
        completed: false,
      },
      {
        id: 'm3',
        title: localized('Analytics storytelling for stakeholders', 'Paydaşlar için veri anlatımı'),
        duration: localized('39 min', '39 dk'),
        type: localized('Case study', 'Vaka analizi'),
        completed: false,
      },
      {
        id: 'm4',
        title: localized('Building repeatable reporting habits', 'Tekrarlanabilir raporlama alışkanlıkları kurma'),
        duration: localized('33 min', '33 dk'),
        type: localized('Lesson', 'Ders'),
        completed: false,
      },
    ],
    instructor: {
      name: 'Jonas Reed',
      role: localized('Growth Analytics Director, Beacon', 'Büyüme Analitiği Direktörü, Beacon'),
      bio: localized(
        'Jonas works with growth teams to turn raw data into useful experiments and clear reports.',
        'Jonas, büyüme ekiplerinin ham veriyi işe yarayan deneylere ve anlaşılır raporlara dönüştürmesine destek olur.',
      ),
    },
  },
  {
    id: 'course_03',
    slug: 'ux-systems-for-saas',
    title: localized('UX Systems for SaaS', 'SaaS İçin UX Sistemleri'),
    imageUrl: 'https://images.unsplash.com/photo-1518773553398-650c184e0bb3?auto=format&fit=crop&w=1400&q=80',
    category: localized('Design', 'Tasarım'),
    level: localized('Intermediate', 'Orta'),
    duration: localized('5 weeks', '5 hafta'),
    lessons: 15,
    progress: 58,
    students: '1.8k',
    rating: 4.9,
    price: 219,
    accent: 'from-emerald-500/25 via-cyan-500/10 to-transparent',
    summary: localized(
      'Design SaaS screens with reusable patterns, clear hierarchy, and useful interaction states.',
      'Tekrar kullanılabilir kalıplar, net hiyerarşi ve anlaşılır etkileşim durumlarıyla SaaS ekranları tasarla.',
    ),
    description: localized(
      'Learn how to design clear interfaces for dashboards, workflows, forms, and mobile screens.',
      'Panel, iş akışı, form ve mobil ekranlar için anlaşılır arayüzler tasarlamayı öğren.',
    ),
    outcomes: [
      localized('Review visual hierarchy in dense screens', 'Yoğun ekranlarda görsel hiyerarşiyi değerlendir'),
      localized('Design reusable card and table patterns', 'Yeniden kullanılabilir kart ve tablo kalıpları tasarla'),
      localized('Balance motion, feedback, and performance', 'Hareket, geri bildirim ve performansı dengele'),
      localized('Prepare UI notes developers can follow', 'Geliştiricilerin takip edebileceği arayüz notları hazırla'),
    ],
    tags: [
      localized('Design Systems', 'Tasarım Sistemleri'),
      localized('UX Writing', 'UX Yazımı'),
      localized('Motion', 'Hareket'),
    ],
    modules: [
      {
        id: 'm1',
        title: localized('Designing flexible layout systems', 'Esnek yerleşim sistemleri tasarlama'),
        duration: localized('26 min', '26 dk'),
        type: localized('Workshop', 'Atölye'),
        completed: true,
      },
      {
        id: 'm2',
        title: localized('Interaction states and transitions', 'Etkileşim durumları ve geçişler'),
        duration: localized('35 min', '35 dk'),
        type: localized('Lesson', 'Ders'),
        completed: true,
      },
      {
        id: 'm3',
        title: localized('Responsive behavior for dense interfaces', 'Yoğun arayüzlerde duyarlı davranış'),
        duration: localized('29 min', '29 dk'),
        type: localized('Lesson', 'Ders'),
        completed: false,
      },
      {
        id: 'm4',
        title: localized('Design review before release', 'Yayın öncesi tasarım kontrolü'),
        duration: localized('38 min', '38 dk'),
        type: localized('Case study', 'Vaka analizi'),
        completed: false,
      },
    ],
    instructor: {
      name: 'Lina Brooks',
      role: localized('Staff Product Designer, Meridian', 'Kıdemli Ürün Tasarımcısı, Meridian'),
      bio: localized(
        'Lina designs product interfaces and design systems used by growing SaaS teams.',
        'Lina, büyüyen SaaS ekiplerinin kullandığı ürün arayüzleri ve tasarım sistemleri üzerinde çalışır.',
      ),
    },
  },
  {
    id: 'course_04',
    slug: 'ai-ops-for-modern-teams',
    title: localized('AI Operations for Modern Teams', 'Modern Ekipler İçin Yapay Zeka Operasyonları'),
    imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80',
    category: localized('Engineering', 'Mühendislik'),
    level: localized('Beginner', 'Başlangıç'),
    duration: localized('4 weeks', '4 hafta'),
    lessons: 12,
    progress: 19,
    students: '760',
    rating: 4.7,
    price: 189,
    accent: 'from-amber-400/30 via-orange-400/10 to-transparent',
    summary: localized(
      'Use AI tools in product, support, and delivery teams with clear rules and review habits.',
      'Yapay zeka araçlarını ürün, destek ve teslimat ekiplerinde net kurallar ve kontrol alışkanlıklarıyla kullan.',
    ),
    description: localized(
      'A beginner course on choosing AI use cases, reviewing generated output, and measuring team impact.',
      'Yapay zeka kullanım alanlarını seçme, üretilen çıktıyı kontrol etme ve ekip etkisini ölçme üzerine başlangıç seviyesi bir kurs.',
    ),
    outcomes: [
      localized('Identify useful AI use cases', 'Yararlı yapay zeka kullanım alanlarını belirle'),
      localized('Review generated output before it is used', 'Üretilen çıktıyı kullanmadan önce kontrol et'),
      localized('Set clear rules for internal tools', 'İç araçlar için net kullanım kuralları belirle'),
      localized('Measure the impact of AI-assisted work', 'Yapay zeka destekli çalışmaların etkisini ölç'),
    ],
    tags: [
      localized('AI', 'Yapay Zeka'),
      localized('Automation', 'Otomasyon'),
      localized('Operations', 'Operasyon'),
    ],
    modules: [
      {
        id: 'm1',
        title: localized('Choosing suitable AI use cases', 'Uygun yapay zeka kullanım alanlarını seçme'),
        duration: localized('28 min', '28 dk'),
        type: localized('Lesson', 'Ders'),
        completed: true,
      },
      {
        id: 'm2',
        title: localized('Prompt design for repeatable results', 'Tekrarlanabilir sonuçlar için prompt yazımı'),
        duration: localized('32 min', '32 dk'),
        type: localized('Workshop', 'Atölye'),
        completed: false,
      },
      {
        id: 'm3',
        title: localized('Quality review and evaluation', 'Kalite kontrol ve değerlendirme'),
        duration: localized('41 min', '41 dk'),
        type: localized('Lesson', 'Ders'),
        completed: false,
      },
      {
        id: 'm4',
        title: localized('Expanding AI use across teams', 'Yapay zeka kullanımını ekipler arasında yaygınlaştırma'),
        duration: localized('30 min', '30 dk'),
        type: localized('Case study', 'Vaka analizi'),
        completed: false,
      },
    ],
    instructor: {
      name: 'Ethan Cruz',
      role: localized('AI Program Manager, Fluxware', 'Yapay Zeka Program Yöneticisi, Fluxware'),
      bio: localized(
        'Ethan helps teams introduce AI tools with clear review steps and practical operating rules.',
        'Ethan, ekiplerin yapay zeka araçlarını net kontrol adımları ve pratik kullanım kurallarıyla hayata geçirmesine yardımcı olur.',
      ),
    },
  },
]

const localizedMetrics: LocalizedMetric[] = [
  { label: localized('Courses in progress', 'Devam eden kurslar'), value: '12 / 20', progress: 60, tone: 'cyan' },
  { label: localized('Completion rate', 'Tamamlama oranı'), value: '84%', progress: 84, tone: 'emerald' },
]

const localizedActivities: LocalizedActivity[] = [
  {
    id: 'act_01',
    title: localized('Finished lesson: Prioritization methods', 'Tamamlanan ders: Önceliklendirme yöntemleri'),
    description: localized('Product Strategy Foundations', 'Ürün Stratejisi Temelleri'),
    time: localized('12 minutes ago', '12 dakika önce'),
    tag: localized('Completed', 'Tamamlandı'),
  },
  {
    id: 'act_02',
    title: localized('Course added to cart: UX Systems for SaaS', 'Sepete eklenen kurs: SaaS İçin UX Sistemleri'),
    description: localized('Selected for the design team', 'Tasarım ekibi için seçildi'),
    time: localized('2 hours ago', '2 saat önce'),
    tag: localized('Cart', 'Sepet'),
  },
  {
    id: 'act_03',
    title: localized('Course progress report shared', 'Kurs ilerleme raporu paylaşıldı'),
    description: localized('Learning activity summary exported', 'Öğrenme hareketleri özeti dışa aktarıldı'),
    time: localized('Yesterday', 'Dün'),
    tag: localized('Report', 'Rapor'),
  },
]

const localizedMilestones: LocalizedMilestone[] = [
  {
    id: 'mil_01',
    label: localized('Live review with design mentors', 'Tasarım eğitmenleriyle canlı değerlendirme'),
    due: localized('Today, 3:00 PM', 'Bugün, 15:00'),
    status: localized('Ready', 'Hazır'),
  },
  {
    id: 'mil_02',
    label: localized('Analytics final project review', 'Analitik final projesi değerlendirmesi'),
    due: localized('Tomorrow, 11:00 AM', 'Yarın, 11:00'),
    status: localized('Upcoming', 'Yaklaşıyor'),
  },
  {
    id: 'mil_03',
    label: localized('Complete payment for selected courses', 'Seçilen kurslar için ödemeyi tamamla'),
    due: localized('Apr 02', '02 Nis'),
    status: localized('Needs review', 'Gözden geçirilmeli'),
  },
]

const mapCourse = (course: LocalizedCourse, language: AppLanguage): Course => ({
  ...course,
  title: pick(course.title, language),
  category: pick(course.category, language),
  categoryKey: toStableKey(pick(course.category, 'en')),
  level: pick(course.level, language),
  levelKey: toStableKey(pick(course.level, 'en')),
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
