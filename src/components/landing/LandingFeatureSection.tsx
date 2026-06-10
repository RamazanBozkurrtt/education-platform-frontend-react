import { GraduationCap, ShieldCheck, Sparkles, Workflow } from 'lucide-react'

interface LandingFeatureItem {
  id: string
  title: string
  description: string
  icon: 'workflow' | 'insight' | 'quality' | 'security'
}

interface LandingFeatureSectionProps {
  sectionId: string
  title: string
  description: string
  items: LandingFeatureItem[]
}

const iconMap = {
  workflow: Workflow,
  insight: Sparkles,
  quality: GraduationCap,
  security: ShieldCheck,
}

const LandingFeatureSection = ({ sectionId, title, description, items }: LandingFeatureSectionProps) => (
  <section className="landing-section" id={sectionId}>
    <div className="landing-feature-surface">
      <div className="landing-section-header">
        <h2 className="landing-section-title">{title}</h2>
        <p className="landing-section-description">{description}</p>
      </div>

      <div className="landing-feature-list" role="list">
        {items.map((item) => {
          const Icon = iconMap[item.icon]

          return (
            <article className="landing-feature-item" key={item.id} role="listitem">
              <span className="landing-feature-icon">
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
    </div>
  </section>
)

export default LandingFeatureSection
