import { ArrowRight, ChartColumnIncreasing, CheckCircle2, Clock3, PlayCircle, ShoppingCart, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useLibrary } from '../hooks/useLibrary'
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
  const inCart = isInCart(course.id)
  const purchased = isPurchased(course.id)

  return (
    <Card className="group relative flex h-full flex-col overflow-hidden p-0">
      <div className={`h-1.5 bg-gradient-to-r ${course.accent}`} />
      <div className="flex h-full flex-1 flex-col p-6">
        <div className="flex items-center justify-between gap-4">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
            {course.category}
          </span>
          <span className="text-xs text-slate-500">{course.level}</span>
        </div>

        <div className="mt-5 min-h-[7rem]">
          <h3 className="text-clamp-2 text-xl font-semibold text-white">{course.title}</h3>
          <p className="text-clamp-2 mt-3 min-h-[3rem] text-sm leading-6 text-slate-400">{course.summary}</p>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3 border-y border-white/8 py-4 text-sm text-slate-400">
          <span className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-cyan-300" />
            {course.duration}
          </span>
          <span className="flex items-center gap-2">
            <ChartColumnIncreasing className="h-4 w-4 text-cyan-300" />
            {t('courseCard.lessonsValue', { count: course.lessons })}
          </span>
          <span className="flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-300" />
            {course.rating}
          </span>
        </div>

        <div className="mt-auto pt-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{t('common.price')}</p>
            <p className="mt-2 text-xl font-semibold text-white">{formatCurrency(course.price)}</p>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {purchased ? (
              <Link className="w-full" to={ROUTES.coursePlayer(course.slug)}>
                <Button asChild className="group/cta w-full justify-center">
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
              <Button asChild className="group/cta w-full justify-center">
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
