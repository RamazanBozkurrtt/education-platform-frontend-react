import { ArrowRight, Search, SlidersHorizontal } from 'lucide-react'
import { Link } from 'react-router-dom'

interface LandingCategoryItem {
  id: string
  label: string
  countLabel: string
  highlight: string
  href: string
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
  steps: string[]
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
  steps,
}: LandingDiscoverySectionProps) => (
  <section className="landing-section" id="discovery">
    <div className="landing-discovery-layout">
      <div>
        <div className="landing-section-header">
          <h2 className="landing-section-title">{title}</h2>
          <p className="landing-section-description">{description}</p>
        </div>

        <ol className="landing-discovery-steps">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>

        <Link to={catalogHref}>
          <span className="public-primary-button h-11 px-5 text-sm font-semibold">
            {catalogCta}
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </div>

      <div className="landing-discovery-surface">
        <div className="landing-discovery-pane">
          <h3>{categoriesTitle}</h3>
          <div className="landing-discovery-tags">
            {categories.slice(0, 6).map((category) => (
              <Link key={category.id} to={category.href}>
                <span>{category.label}</span>
                <small>{category.countLabel}</small>
              </Link>
            ))}
          </div>
        </div>

        <div className="landing-discovery-pane">
          <h3>{coursesTitle}</h3>
          <div className="landing-discovery-course-list">
            {courses.slice(0, 4).map((course, index) => (
              <Link className="landing-discovery-course" key={course.id} to={course.href}>
                <span className="landing-discovery-course-index">0{index + 1}</span>
                <div>
                  <p>{course.meta}</p>
                  <h4>{course.title}</h4>
                  <p>{course.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="landing-discovery-hints" role="list">
          <span role="listitem"><Search className="h-4 w-4" /> Anahtar kelime aramasi</span>
          <span role="listitem"><SlidersHorizontal className="h-4 w-4" /> Kategori ve seviye filtreleri</span>
        </div>
      </div>
    </div>
  </section>
)

export default LandingDiscoverySection
