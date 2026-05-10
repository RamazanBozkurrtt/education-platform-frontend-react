import { BookOpenCheck, ChartNoAxesColumnIncreasing, UsersRound } from 'lucide-react'

interface LandingValueItem {
  id: string
  title: string
  description: string
  icon: 'discover' | 'track' | 'instructor'
}

interface LandingValueSectionProps {
  sectionId: string
  title: string
  description: string
  items: LandingValueItem[]
}

const iconMap = {
  discover: BookOpenCheck,
  track: ChartNoAxesColumnIncreasing,
  instructor: UsersRound,
}

const LandingValueSection = ({ sectionId, title, description, items }: LandingValueSectionProps) => (
  <section className="landing-section" id={sectionId}>
    <div className="landing-surface">
      <div className="landing-section-header">
        <h2 className="landing-section-title">{title}</h2>
        <p className="landing-section-description">{description}</p>
      </div>

      <div className="landing-value-grid">
        {items.map((item) => {
          const Icon = iconMap[item.icon]

          return (
            <article className="landing-value-card" key={item.id}>
              <span className="landing-value-icon">
                <Icon className="h-4 w-4" />
              </span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          )
        })}
      </div>
    </div>
  </section>
)

export default LandingValueSection
