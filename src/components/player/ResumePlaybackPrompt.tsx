import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { formatSecondsAsClock } from '../../utils/courseProgress'
import type { AppLanguage } from '../../utils/types'

interface ResumePlaybackPromptProps {
  open: boolean
  language: AppLanguage
  lastWatchedSecond: number
  onResume: () => void
  onRestart: () => void
}

const ResumePlaybackPrompt = ({
  language,
  lastWatchedSecond,
  onRestart,
  onResume,
  open,
}: ResumePlaybackPromptProps) => {
  const lastPositionText = formatSecondsAsClock(lastWatchedSecond)
  const title = language === 'tr' ? 'Derse devam et' : 'Resume lesson'
  const description = language === 'tr'
    ? `Bu derse daha once ${lastPositionText} konumunda kalmissin. Devam etmek ister misin?`
    : `You left this lesson at ${lastPositionText}. Do you want to continue from there?`

  return (
    <Modal
      description={description}
      onClose={onRestart}
      open={open}
      title={title}
    >
      <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-end">
        <Button className="justify-center" onClick={onResume}>
          {language === 'tr' ? 'Kaldigim yerden devam et' : 'Continue where I left off'}
        </Button>
        <Button className="justify-center" onClick={onRestart} variant="secondary">
          {language === 'tr' ? 'Bastan basla' : 'Start from beginning'}
        </Button>
      </div>
    </Modal>
  )
}

export default ResumePlaybackPrompt
