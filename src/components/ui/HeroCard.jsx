import HeroRings from './HeroRings.jsx'
import './HeroCard.css'

export default function HeroCard({ children, className = '', ...props }) {
  return (
    <section className={`fa-hero ${className}`} {...props}>
      <HeroRings />
      <div className="fa-hero__content">{children}</div>
    </section>
  )
}
