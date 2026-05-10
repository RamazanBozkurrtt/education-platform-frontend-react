import { Check } from 'lucide-react'

interface LandingBenefitsSectionProps {
  sectionId: string
  title: string
  description: string
  studentTitle: string
  instructorTitle: string
  studentBenefits: string[]
  instructorBenefits: string[]
}

const LandingBenefitsSection = ({
  sectionId,
  title,
  description,
  studentTitle,
  instructorTitle,
  studentBenefits,
  instructorBenefits,
}: LandingBenefitsSectionProps) => (
  <section className="landing-section" id={sectionId}>
    <div className="landing-section-header">
      <h2 className="landing-section-title">{title}</h2>
      <p className="landing-section-description">{description}</p>
    </div>

    <div className="landing-benefit-grid">
      <article className="landing-surface landing-benefit-card">
        <h3>{studentTitle}</h3>
        <ul>
          {studentBenefits.map((benefit) => (
            <li key={benefit}>
              <span>
                <Check className="h-3.5 w-3.5" />
              </span>
              {benefit}
            </li>
          ))}
        </ul>
      </article>

      <article className="landing-surface landing-benefit-card">
        <h3>{instructorTitle}</h3>
        <ul>
          {instructorBenefits.map((benefit) => (
            <li key={benefit}>
              <span>
                <Check className="h-3.5 w-3.5" />
              </span>
              {benefit}
            </li>
          ))}
        </ul>
      </article>
    </div>
  </section>
)

export default LandingBenefitsSection
