import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

interface LandingCategoryItem {
  id: string
  label: string
  countLabel: string
  highlight: string
  href: string
  tone: 'violet' | 'sky' | 'peach' | 'slate'
}

interface LandingCourseItem {
  id: string
  title: string
  summary: string
  meta: string
  href: string
}

interface LandingDiscoverySectionProps {
  title: string
  description: string
  categoriesTitle: string
  coursesTitle: string
  categories: LandingCategoryItem[]
  courses: LandingCourseItem[]
  catalogCta: string
  catalogHref: string
}

const LandingDiscoverySection = ({
  title,
  description,
  categoriesTitle,
  coursesTitle,
  categories,
  courses,
  catalogCta,
  catalogHref,
}: LandingDiscoverySectionProps) => (
  <section className="landing-section" id="categories">
    <div className="landing-section-header landing-section-header-row">
      <div>
        <h2 className="landing-section-title">{title}</h2>
        <p className="landing-section-description">{description}</p>
      </div>
      <Link to={catalogHref}>
        <span className="public-outline-button h-11 px-4 text-sm font-semibold">
          {catalogCta}
          <ArrowRight className="h-4 w-4" />
        </span>
      </Link>
    </div>

    <div className="landing-discovery-grid">
      <div className="landing-surface">
        <h3 className="landing-subtitle">{categoriesTitle}</h3>
        <div className="landing-category-grid">
          {categories.map((category) => (
            <Link className={`landing-category-card landing-topic-card-${category.tone}`} key={category.id} to={category.href}>
              <p className="landing-category-count">{category.countLabel}</p>
              <p className="landing-category-title">{category.label}</p>
              <p className="landing-category-highlight">{category.highlight}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="landing-surface">
        <h3 className="landing-subtitle">{coursesTitle}</h3>
        <div className="landing-course-list">
          {courses.map((course) => (
            <Link className="landing-course-item" key={course.id} to={course.href}>
              <p className="landing-course-meta">{course.meta}</p>
              <h4>{course.title}</h4>
              <p>{course.summary}</p>
              <span>
                {catalogCta}
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  </section>
)

export default LandingDiscoverySection
