import { GraduationCap, PlusCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../hooks/useLanguage'
import { ROUTES } from '../../utils/constants'
import Button from '../ui/Button'

interface InstructorCtaCardProps {
  isInstructor: boolean
}

const InstructorCtaCard = ({ isInstructor }: InstructorCtaCardProps) => {
  const { language } = useLanguage()
  const copy = language === 'tr'
    ? {
      studentTitle: 'Egitmen olmak ister misin?',
      studentDescription: 'Profilini tamamlayip egitmen basvurunu gonderebilirsin.',
      studentButton: 'Egitmen ol',
      instructorTitle: 'Eğitmen paneli',
      instructorDescription: 'Kurslarini, derslerini ve videolarini bu panelden yonetebilirsin.',
      instructorButton: 'Egitmen paneline git',
    }
    : {
      studentTitle: 'Want to teach on EduBase?',
      studentDescription: 'Complete your profile to start creating courses and uploading lesson videos.',
      studentButton: 'Apply as instructor',
      instructorTitle: 'Instructor panel',
      instructorDescription: 'Go to the panel to manage your courses and add new lessons.',
      instructorButton: 'Open panel',
    }

  const title = isInstructor ? copy.instructorTitle : copy.studentTitle
  const description = isInstructor ? copy.instructorDescription : copy.studentDescription
  const buttonText = isInstructor ? copy.instructorButton : copy.studentButton
  const to = isInstructor ? ROUTES.instructorDashboard : ROUTES.becomeInstructor

  return (
    <section className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-4 md:px-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-sm border border-[color:var(--border)] bg-[color:var(--surface-strong)] text-[color:var(--primary)]">
            {isInstructor ? <PlusCircle className="h-4 w-4" /> : <GraduationCap className="h-4 w-4" />}
          </div>
          <div>
            <h3 className="theme-heading text-base font-semibold">{title}</h3>
            <p className="theme-muted mt-1 text-sm leading-6">{description}</p>
          </div>
        </div>

        <Link to={to}>
          <Button variant={isInstructor ? 'primary' : 'secondary'}>{buttonText}</Button>
        </Link>
      </div>
    </section>
  )
}

export default InstructorCtaCard

