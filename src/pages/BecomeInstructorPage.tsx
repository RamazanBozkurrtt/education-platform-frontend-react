import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import InstructorProfileForm from '../components/instructor/InstructorProfileForm'
import PageHeader from '../components/PageHeader'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import { instructorService } from '../services/instructorService'
import { ROUTES } from '../utils/constants'
import { extractAuthRoles, isInstructor } from '../utils/roles'
import type { InstructorProfilePayload } from '../utils/types'

const BecomeInstructorPage = () => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const { user, claims, syncAuthSession } = useAuth()
  const isCurrentUserInstructor = isInstructor(user, claims)

  const copy = language === 'tr'
    ? {
      eyebrow: 'Egitmen basvurusu',
      title: 'Egitmen profili olustur',
      description: 'Kurs olusturmak ve ders yonetmek icin temel bilgilerini tamamla.',
      alreadyInstructorTitle: 'Egitmen hesabin aktif',
      alreadyInstructorDescription: 'Kurslarini ve derslerini yonetmek icin paneli acabilirsin.',
      alreadyInstructorButton: 'Egitmen paneline git',
      submitLabel: 'Başvuruyu tamamla',
      submittingLabel: 'Gönderiliyor...',
    }
    : {
      eyebrow: 'Instructor application',
      title: 'Create instructor profile',
      description: 'Complete your details and start publishing your courses.',
      alreadyInstructorTitle: 'Your instructor account is active',
      alreadyInstructorDescription: 'You can open the panel to create courses and manage lessons.',
      alreadyInstructorButton: 'Go to instructor panel',
      submitLabel: 'Complete application',
      submittingLabel: 'Submitting...',
    }

  useEffect(() => {
    console.log('[INSTRUCTOR_FLOW] current user:', user)
    console.log('[INSTRUCTOR_FLOW] current roles:', extractAuthRoles(user, claims))
    console.log('[INSTRUCTOR_FLOW] isInstructor:', isCurrentUserInstructor)
  }, [claims, isCurrentUserInstructor, user])

  const handleSubmit = async (payload: InstructorProfilePayload) => {
    const payloadWithUserAvatar: InstructorProfilePayload = {
      ...payload,
      profileImageUrl: user?.avatarUrl ?? payload.profileImageUrl,
    }

    const response = await instructorService.applyAsInstructor(payloadWithUserAvatar)

    if (response.accessToken && response.refreshToken) {
      await syncAuthSession({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        fallbackUserId: response.userId ?? undefined,
      })
    } else {
      await syncAuthSession()
    }

    navigate(ROUTES.instructorDashboard, { replace: true })
  }

  if (isCurrentUserInstructor) {
    return (
      <div className="space-y-6">
        <PageHeader description={copy.description} eyebrow={copy.eyebrow} title={copy.title} />
        <Card>
          <h2 className="theme-heading text-lg font-semibold">{copy.alreadyInstructorTitle}</h2>
          <p className="theme-muted mt-2 text-sm leading-6">{copy.alreadyInstructorDescription}</p>
          <Button className="mt-4" onClick={() => navigate(ROUTES.instructorDashboard)}>
            {copy.alreadyInstructorButton}
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader description={copy.description} eyebrow={copy.eyebrow} title={copy.title} />
      <Card>
        <InstructorProfileForm
          forcedProfileImageUrl={user?.avatarUrl}
          onSubmit={handleSubmit}
          showProfileImageField={false}
          submitLabel={copy.submitLabel}
          submittingLabel={copy.submittingLabel}
        />
      </Card>
    </div>
  )
}

export default BecomeInstructorPage
