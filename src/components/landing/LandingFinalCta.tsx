import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

interface LandingFinalCtaProps {
  title: string
  description: string
  primaryCta: string
  secondaryCta: string
  primaryHref: string
  secondaryHref: string
}

const LandingFinalCta = ({
  title,
  description,
  primaryCta,
  secondaryCta,
  primaryHref,
  secondaryHref,
}: LandingFinalCtaProps) => (
  <section className="landing-section landing-section-last">
    <div className="landing-final-cta">
      <div>
        <h2 className="landing-section-title">{title}</h2>
        <p className="landing-section-description">{description}</p>
      </div>

      <div className="landing-final-actions">
        <Link to={primaryHref}>
          <span className="public-primary-button h-12 px-5 text-sm font-semibold">
            {primaryCta}
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>

        <Link to={secondaryHref}>
          <span className="public-outline-button h-12 px-5 text-sm font-semibold">
            {secondaryCta}
          </span>
        </Link>
      </div>
    </div>
  </section>
)

export default LandingFinalCta
