import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import InstructorProfileForm from '../components/instructor/InstructorProfileForm'
import PageHeader from '../components/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Loader from '../components/ui/Loader'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import { instructorService } from '../services/instructorService'
import { ROUTES } from '../utils/constants'
import type { InstructorProfilePayload, InstructorProfileResponse } from '../utils/types'

const InstructorProfilePage = () => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const { user } = useAuth()
  const [profile, setProfile] = useState<InstructorProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const copy = language === 'tr'
    ? {
      eyebrow: 'Eğitmen profili',
      title: 'Profil bilgileri',
      description: 'Öğrencilerin göreceği eğitmen bilgilerini buradan güncelleyebilirsin.',
      submitLabel: 'Profili güncelle',
      submittingLabel: 'Güncelleniyor...',
      backLabel: 'Eğitmen paneline dön',
    }
    : {
      eyebrow: 'Instructor profile',
      title: 'Profile details',
      description: 'Update the instructor information visible to learners.',
      submitLabel: 'Update profile',
      submittingLabel: 'Updating...',
      backLabel: 'Back to instructor panel',
    }

  useEffect(() => {
    let isActive = true

    const loadProfile = async () => {
      try {
        const data = await instructorService.getMyInstructorProfile()

        if (!isActive) {
          return
        }

        setProfile(data)
      } catch {
        if (!isActive) {
          return
        }

        setProfile(null)
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    void loadProfile()

    return () => {
      isActive = false
    }
  }, [])

  const handleSubmit = async (payload: InstructorProfilePayload) => {
    const nextProfile = await instructorService.updateInstructorProfile(payload)
    setProfile(nextProfile)
    navigate(ROUTES.instructorDashboard, { replace: true })
  }

  if (loading) {
    return <Loader label={language === 'tr' ? 'Eğitmen profili yükleniyor...' : 'Loading instructor profile...'} />
  }

  return (
    <div className="space-y-7">
      <PageHeader
        actions={(
          <Button onClick={() => navigate(ROUTES.instructorDashboard)} variant="secondary">
            {copy.backLabel}
          </Button>
        )}
        description={copy.description}
        eyebrow={copy.eyebrow}
        title={copy.title}
      />
      <Card>
        <InstructorProfileForm
          forcedProfileImageUrl={user?.avatarUrl}
          initialValues={profile ?? undefined}
          onSubmit={handleSubmit}
          showProfileImageField={false}
          submitLabel={copy.submitLabel}
          submittingLabel={copy.submittingLabel}
        />
      </Card>
    </div>
  )
}

export default InstructorProfilePage
