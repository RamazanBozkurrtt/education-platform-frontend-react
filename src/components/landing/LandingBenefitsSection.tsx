import { Check } from 'lucide-react'

interface LandingBenefitsSectionProps {
  sectionId: string
  title: string
  description: string
  institutionTitle: string
  institutionDescription: string
  instructorTitle: string
  instructorDescription: string
  highlights: string[]
  capabilities: string[]
}

const LandingBenefitsSection = ({
  sectionId,
  title,
  description,
  institutionTitle,
  institutionDescription,
  instructorTitle,
  instructorDescription,
  highlights,
  capabilities,
}: LandingBenefitsSectionProps) => (
  <section className="landing-section" id={sectionId}>
    <div className="landing-section-header">
      <h2 className="landing-section-title">{title}</h2>
      <p className="landing-section-description">{description}</p>
    </div>

    <div className="landing-institution-layout">
      <article className="landing-institution-block">
        <p className="landing-institution-eyebrow">Kurumlar Icin</p>
        <h3>{institutionTitle}</h3>
        <p>{institutionDescription}</p>
        <ul>
          {highlights.map((item) => (
            <li key={item}>
              <span><Check className="h-3.5 w-3.5" /></span>
              {item}
            </li>
          ))}
        </ul>
      </article>

      <article className="landing-institution-block landing-institution-block-soft">
        <p className="landing-institution-eyebrow">Egitmen Akisi</p>
        <h3>{instructorTitle}</h3>
        <p>{instructorDescription}</p>
        <ul>
          {capabilities.map((item) => (
            <li key={item}>
              <span><Check className="h-3.5 w-3.5" /></span>
              {item}
            </li>
          ))}
        </ul>
      </article>
    </div>
  </section>
)

export default LandingBenefitsSection
