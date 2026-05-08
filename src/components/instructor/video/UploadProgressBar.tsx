interface UploadProgressBarProps {
  progress: number
}

const UploadProgressBar = ({ progress }: UploadProgressBarProps) => {
  const normalizedProgress = Math.max(0, Math.min(100, Math.round(progress)))

  return (
    <div className="space-y-1">
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800/70">
        <div
          className="h-full rounded-full bg-cyan-400 transition-all duration-150"
          style={{ width: `${normalizedProgress}%` }}
        />
      </div>
      <p className="text-xs text-slate-300">Yukleniyor... %{normalizedProgress}</p>
    </div>
  )
}

export default UploadProgressBar
