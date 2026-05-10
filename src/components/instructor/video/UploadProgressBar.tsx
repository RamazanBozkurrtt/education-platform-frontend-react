interface UploadProgressBarProps {
  progress: number
}

const UploadProgressBar = ({ progress }: UploadProgressBarProps) => {
  const normalizedProgress = Math.max(0, Math.min(100, Math.round(progress)))

  return (
    <div className="space-y-1">
      <div className="h-2 w-full overflow-hidden rounded-full bg-[color:var(--surface-muted)]">
        <div
          className="h-full rounded-full bg-[color:var(--primary)] transition-all duration-150"
          style={{ width: `${normalizedProgress}%` }}
        />
      </div>
      <p className="theme-muted text-xs">Yukleniyor... %{normalizedProgress}</p>
    </div>
  )
}

export default UploadProgressBar
