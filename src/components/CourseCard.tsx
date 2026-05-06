import { ArrowRight, ChartColumnIncreasing, CheckCircle2, Clock3, PlayCircle, ShoppingCart, Star, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useLibrary } from '../hooks/useLibrary'
import { useTheme } from '../hooks/useTheme'
import { formatCurrency } from '../utils/helpers'
import Card from './ui/Card'
import Button from './ui/Button'
import { ROUTES } from '../utils/constants'
import type { Course } from '../utils/types'

interface CourseCardProps {
  course: Course
}

const CourseCard = ({ course }: CourseCardProps) => {
  const { t } = useTranslation()
  const { addCourse, isInCart } = useCart()
  const { isPurchased } = useLibrary()
  const { theme } = useTheme()
  const inCart = isInCart(course.id)
  const purchased = isPurchased(course.id)
  const isLight = theme === 'light'
  const purchasedButtonClassName = isLight
    ? '!border-slate-200 !bg-white !text-slate-950 hover:!border-slate-300 hover:!bg-slate-50'
    : undefined

  return (
    <Card className="group relative flex h-full flex-col overflow-hidden p-0">
      <div className={`h-1.5 bg-gradient-to-r ${course.accent} opacity-90`} />
      <div className="flex h-full flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-4">
          <span className="rounded-full border border-white/10 bg-[color:var(--surface-muted)] px-3 py-1 text-xs font-semibold text-slate-300">
            {course.category}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">{course.level}</span>
        </div>

        <div className="mt-5 min-h-[8rem]">
          <h3 className="text-clamp-2 text-[1.35rem] font-semibold leading-8 text-white">{course.title}</h3>
          <p className="mt-3 flex items-center gap-2 text-sm text-slate-400">
            <UserRound className="h-4 w-4" />
            {course.instructor.name}
          </p>
          <p className="text-clamp-2 mt-3 min-h-[3rem] text-sm leading-6 text-slate-400">{course.summary}</p>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3 rounded-[18px] border border-white/8 bg-[color:var(--surface-muted)] p-4 text-sm text-slate-400">
          <span className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-slate-500" />
            {course.duration}
          </span>
          <span className="flex items-center gap-2">
            <ChartColumnIncreasing className="h-4 w-4 text-slate-500" />
            {t('courseCard.lessonsValue', { count: course.lessons })}
          </span>
          <span className="flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-300" />
            {course.rating}
          </span>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {course.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/10 bg-[color:var(--surface-muted)] px-3 py-1 text-xs text-slate-400"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-6">
          <div className="flex items-end justify-between gap-4 border-t border-white/8 pt-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{t('common.price')}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{formatCurrency(course.price)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{t('courseDetail.instructor')}</p>
              <p className="mt-2 text-sm font-medium text-slate-300">{course.instructor.role}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2.5">
            {purchased ? (
              <Link className="w-full" to={ROUTES.coursePlayer(course.slug)}>
                <Button asChild className={`group/cta w-full justify-center ${purchasedButtonClassName ?? ''}`}>
                  <PlayCircle className="h-4 w-4" />
                  {t('common.watchCourse')}
                </Button>
              </Link>
            ) : inCart ? (
              <Link className="w-full" to={ROUTES.cart}>
                <Button asChild className="group/cta w-full justify-center" variant="secondary">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  {t('common.goToCart')}
                </Button>
              </Link>
            ) : (
              <Button className="w-full justify-center" onClick={() => addCourse(course.id)} variant="secondary">
                <ShoppingCart className="h-4 w-4" />
                {t('common.addToCart')}
              </Button>
            )}
            <Link className="w-full" to={ROUTES.courseDetail(course.slug)}>
              <Button asChild className="group/cta w-full justify-center" variant="ghost">
                {t('common.viewDetails')}
                <ArrowRight className="h-4 w-4 transition-transform group-hover/cta:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default CourseCard
