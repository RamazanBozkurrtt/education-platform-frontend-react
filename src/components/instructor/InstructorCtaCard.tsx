import { GraduationCap, PlusCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../hooks/useLanguage'
import { ROUTES } from '../../utils/constants'
import Button from '../ui/Button'
import Card from '../ui/Card'

interface InstructorCtaCardProps {
  isInstructor: boolean
}

const InstructorCtaCard = ({ isInstructor }: InstructorCtaCardProps) => {
  const { language } = useLanguage()
  const copy = language === 'tr'
    ? {
      studentTitle: 'Eğitmen olmak ister misin?',
      studentDescription: 'Profilini tamamladıktan sonra kurs oluşturabilir ve ders videolarını yükleyebilirsin.',
      studentButton: 'Eğitmen başvurusu',
      instructorTitle: 'Eğitmen paneli',
      instructorDescription: 'Kurslarını yönetmek ve yeni ders eklemek için panele geç.',
      instructorButton: 'Panele git',
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
    <Card>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-[color:var(--surface-muted)] text-[color:var(--primary)]">
            {isInstructor ? <PlusCircle className="h-5 w-5" /> : <GraduationCap className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
          </div>
        </div>

        <Link to={to}>
          <Button variant={isInstructor ? 'primary' : 'secondary'}>{buttonText}</Button>
        </Link>
      </div>
    </Card>
  )
}

export default InstructorCtaCard
