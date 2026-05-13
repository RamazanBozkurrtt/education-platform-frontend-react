import type { CSSProperties } from 'react'
import { ArrowRight, BookOpenText, ChartLine, ShieldCheck, Star, Users2 } from 'lucide-react'
import { Link } from 'react-router-dom'

interface LandingHeroCard {
  id: string
  title: string
  summary: string
  href: string
}

interface LandingHeroProps {
  eyebrow: string
  title: string
  description: string
  primaryCta: string
  secondaryCta: string
  primaryHref: string
  secondaryHref: string
  quickCardsTitle: string
  quickCards: LandingHeroCard[]
  learnersLabel: string
  learnersValue: string
  ratingLabel: string
  ratingValue: string
  coursesLabel: string
  coursesValue: string
  visualTitle: string
  visualDescription: string
  proofPoints: string[]
  trackActionLabel: string
  securityLabel: string
  structureLabel: string
  analyticsLabel: string
}

const LandingHero = ({
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta,
  primaryHref,
  secondaryHref,
  quickCardsTitle,
  quickCards,
  learnersLabel,
  learnersValue,
  ratingLabel,
  ratingValue,
  coursesLabel,
  coursesValue,
  visualTitle,
  visualDescription,
  proofPoints,
  trackActionLabel,
  securityLabel,
  structureLabel,
  analyticsLabel,
}: LandingHeroProps) => (
  <section className="landing-section landing-hero" id="hero">
    <div className="landing-hero-grid">
      <div className="landing-hero-copy">
        <p className="landing-eyebrow">{eyebrow}</p>
        <h1 className="landing-title">{title}</h1>
        <p className="landing-description">{description}</p>

        <div className="landing-hero-actions">
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

        <div className="landing-hero-proof">
          <span><ShieldCheck className="h-4 w-4" /> {securityLabel}</span>
          {proofPoints.slice(0, 2).map((point) => <span key={point}>{point}</span>)}
        </div>
      </div>

      <aside aria-label={quickCardsTitle} className="landing-hero-visual">
        <div className="landing-hero-visual-head">
          <p>{quickCardsTitle}</p>
          <h2>{visualTitle}</h2>
          <p>{visualDescription}</p>
        </div>

        <div className="landing-hero-visual-toolbar">
          <span><BookOpenText className="h-4 w-4" /> {structureLabel}</span>
          <span><ChartLine className="h-4 w-4" /> {analyticsLabel}</span>
        </div>

        <div className="landing-hero-track-list">
          {quickCards.slice(0, 3).map((card, index) => {
            const progressStyle = { '--track-progress': `${82 - (index * 14)}%` } as CSSProperties

            return (
              <Link className="landing-hero-track-row" key={card.id} to={card.href}>
                <div>
                  <p className="landing-hero-track-title">{card.title}</p>
                  <p className="landing-hero-track-summary">{card.summary}</p>
                </div>
                <div className="landing-hero-track-progress" style={progressStyle}>
                  <span />
                </div>
                <span className="landing-hero-track-link">
                  {trackActionLabel}
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            )
          })}
        </div>

        <div className="landing-hero-metrics">
          <div className="landing-metric-chip">
            <Users2 className="h-4 w-4" />
            <div>
              <p className="landing-metric-label">{learnersLabel}</p>
              <p className="landing-metric-value">{learnersValue}</p>
            </div>
          </div>
          <div className="landing-metric-chip">
            <Star className="h-4 w-4" />
            <div>
              <p className="landing-metric-label">{ratingLabel}</p>
              <p className="landing-metric-value">{ratingValue}</p>
            </div>
          </div>
          <div className="landing-metric-chip">
            <BookOpenText className="h-4 w-4" />
            <div>
              <p className="landing-metric-label">{coursesLabel}</p>
              <p className="landing-metric-value">{coursesValue}</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </section>
)

export default LandingHero
