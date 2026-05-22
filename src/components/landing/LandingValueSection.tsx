import { BookOpenCheck, ChartNoAxesColumnIncreasing, ShieldCheck, UsersRound } from 'lucide-react'

interface LandingValueItem {
  id: string
  title: string
  description: string
  icon: 'discover' | 'track' | 'instructor' | 'secure'
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
  secure: ShieldCheck,
}

const LandingValueSection = ({ sectionId, title, description, items }: LandingValueSectionProps) => (
  <section className="landing-section" id={sectionId}>
    <div className="landing-section-header">
      <h2 className="landing-section-title">{title}</h2>
      <p className="landing-section-description">{description}</p>
    </div>

    <div className="landing-trust-strip" role="list">
      {items.map((item) => {
        const Icon = iconMap[item.icon]

        return (
          <article className="landing-trust-item" key={item.id} role="listitem">
            <span className="landing-trust-icon">
              <Icon className="h-4 w-4" />
            </span>
            <div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          </article>
        )
      })}
    </div>
  </section>
)

export default LandingValueSection
