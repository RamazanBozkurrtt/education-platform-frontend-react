import { ArrowRight, CheckCircle2, Clock3, PlayCircle, ShoppingCart, Star, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useLibrary } from '../hooks/useLibrary'
import { useTheme } from '../hooks/useTheme'
import { ROUTES } from '../utils/constants'
import { formatCurrency } from '../utils/helpers'
import type { Course } from '../utils/types'
import Button from './ui/Button'
import Card from './ui/Card'
import MetaRow from './ui/MetaRow'
import TagList from './ui/TagList'

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
    <Card className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-4">
        <span className="rounded-full border border-white/10 bg-[color:var(--surface-muted)] px-3 py-1 text-xs font-medium text-slate-300">
          {course.category}
        </span>
        <span className="rounded-full border border-white/10 bg-[color:var(--surface-muted)] px-3 py-1 text-xs text-slate-300">
          {course.level}
        </span>
      </div>

      <div className="mt-4 min-h-[7rem]">
        <h3 className="text-clamp-2 text-xl font-semibold leading-7 text-white">{course.title}</h3>
        <p className="mt-2 flex items-center gap-2 text-sm text-slate-400">
          <UserRound className="h-4 w-4" />
          {course.instructor.name}
        </p>
        <p className="text-clamp-2 mt-2 text-sm leading-6 text-slate-400">{course.summary}</p>
      </div>

      <MetaRow
        className="mt-4"
        items={[
          { key: 'duration', icon: Clock3, label: t('courseDetail.duration'), value: course.duration },
          { key: 'lessons', label: t('courseDetail.lessons'), value: t('courseCard.lessonsValue', { count: course.lessons }) },
          { key: 'rating', icon: Star, label: 'Puan', value: String(course.rating) },
        ]}
      />

      <div className="mt-4 border-t border-white/8 pt-4">
        <TagList hideWhenEmpty label="Etiketler" tags={course.tags.slice(0, 3)} />
      </div>

      <div className="mt-auto pt-5">
        <div className="flex items-end justify-between gap-4 border-t border-white/8 pt-4">
          <div>
            <p className="text-xs text-slate-500">{t('common.price')}</p>
            <p className="mt-1 text-2xl font-semibold text-white">{formatCurrency(course.price)}</p>
          </div>
          <p className="text-sm text-slate-400">{course.instructor.role}</p>
        </div>

        <div className="mt-4 flex flex-col gap-2.5">
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
    </Card>
  )
}

export default CourseCard
