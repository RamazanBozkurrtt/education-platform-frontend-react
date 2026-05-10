import { ArrowRight, Star, Users2 } from 'lucide-react'
import { Link } from 'react-router-dom'

interface LandingHeroCard {
  id: string
  title: string
  summary: string
  href: string
  tone: 'violet' | 'sky' | 'peach' | 'slate'
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
        </div>
      </div>

      <aside className="landing-hero-panel" aria-label={quickCardsTitle}>
        <div className="landing-hero-panel-head">
          <h2>{quickCardsTitle}</h2>
        </div>
        <div className="landing-hero-topics">
          {quickCards.map((card) => (
            <Link className={`landing-topic-card landing-topic-card-${card.tone}`} key={card.id} to={card.href}>
              <p className="landing-topic-title">{card.title}</p>
              <p className="landing-topic-summary">{card.summary}</p>
              <span className="landing-topic-link">
                {secondaryCta}
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </aside>
    </div>
  </section>
)

export default LandingHero
