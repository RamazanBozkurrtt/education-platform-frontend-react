import { ArrowRight, Trash2 } from 'lucide-react'
import type { SyntheticEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { resolveServiceUrl } from '../config/api'
import DashboardPageHeader from '../components/dashboard/DashboardPageHeader'
import DashboardSection from '../components/dashboard/DashboardSection'
import EmptyState from '../components/dashboard/EmptyState'
import TableShell from '../components/dashboard/TableShell'
import Button from '../components/ui/Button'
import { useCart } from '../hooks/useCart'
import { useLanguage } from '../hooks/useLanguage'
import { API_ENDPOINTS } from '../services/endpoints'
import { ROUTES } from '../utils/constants'
import { getCourseCategoryLabel } from '../utils/courseCategory'
import { formatCoursePrice, formatCurrency } from '../utils/helpers'

const CartPage = () => {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const { clearCart, itemCount, items, removeCourse, subtotal, tax, total } = useCart()
  const actionLabel = language === 'tr' ? 'Islem' : 'Action'
  const locale = language === 'tr' ? 'tr-TR' : 'en-US'
  const freeLabel = language === 'tr' ? 'Ücretsiz' : 'Free'
  const summaryCurrency = items[0]?.course.currency ?? 'TRY'

  const handleImageError = (event: SyntheticEvent<HTMLImageElement>, fallbackImageUrl: string) => {
    const target = event.currentTarget

    if (target.dataset.fallbackApplied === 'true') {
      return
    }

    target.dataset.fallbackApplied = 'true'
    target.src = fallbackImageUrl
  }

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        actions={
          itemCount > 0 ? (
            <>
              <Button onClick={clearCart} variant="secondary">
                <Trash2 className="h-4 w-4" />
                {t('cart.clearCart')}
              </Button>
              <Link to={ROUTES.payment}>
                <Button asChild>
                  {t('cart.proceedToPayment')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </>
          ) : undefined
        }
        description={t('cart.description')}
        eyebrow={t('cart.eyebrow')}
        title={t('cart.title')}
      />

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <DashboardSection
          description={t('cart.courseCount', { count: itemCount })}
          title={t('cart.selectedCourses')}
        >
          {items.length === 0 ? (
            <EmptyState
              action={(
                <Link className="inline-flex" to={ROUTES.courses}>
                  <Button asChild>{t('cart.browseCourses')}</Button>
                </Link>
              )}
              description={t('cart.emptyDescription')}
              title={t('cart.emptyTitle')}
            />
          ) : (
            <TableShell>
              <table className="min-w-[760px] w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[color:var(--border)] bg-[color:var(--surface-soft)] text-left">
                    <th className="theme-subtle px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em]">{t('routes.courseDetails')}</th>
                    <th className="theme-subtle px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em]">{t('payment.subtotal')}</th>
                    <th className="theme-subtle px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em]">{actionLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const fallbackImageUrl = resolveServiceUrl(API_ENDPOINTS.courses.image.public(item.course.id))
                    const courseImageUrl = item.course.imageUrl || fallbackImageUrl

                    return (
                      <tr className="border-b border-[color:var(--border)] last:border-b-0" key={item.courseId}>
                        <td className="px-4 py-3.5">
                          <Link className="block" to={ROUTES.courseDetail(item.course.slug)}>
                            <div className="flex items-start gap-3">
                              <img
                                alt={item.course.title}
                                className="h-14 w-[88px] shrink-0 rounded-sm border border-[color:var(--border)] object-cover"
                                loading="lazy"
                                onError={(event) => handleImageError(event, fallbackImageUrl)}
                                src={courseImageUrl}
                              />
                              <div className="min-w-0">
                                <p className="theme-heading font-medium transition-colors hover:text-[color:var(--primary)]">{item.course.title}</p>
                                <p className="theme-muted mt-1 text-xs">{getCourseCategoryLabel(item.course)} · {item.course.level.levelName}</p>
                                <p className="theme-muted mt-1 line-clamp-1 text-xs">{item.course.summary}</p>
                              </div>
                            </div>
                          </Link>
                        </td>
                        <td className="theme-heading px-4 py-3.5 font-semibold">
                          {formatCoursePrice(item.course.price, item.course.currency, { locale, freeLabel })}
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            className="theme-muted inline-flex items-center gap-2 rounded-sm border border-[color:var(--border)] px-3 py-2 text-sm font-medium transition hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-hover)]"
                            onClick={() => removeCourse(item.courseId)}
                            type="button"
                          >
                            <Trash2 className="h-4 w-4" />
                            {t('common.remove')}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </TableShell>
          )}
        </DashboardSection>

        <aside className="h-fit rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-5 py-5 xl:sticky xl:top-24">
          <p className="theme-subtle text-xs uppercase tracking-[0.22em]">{t('cart.orderSummary')}</p>
          <div className="theme-muted mt-5 space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span>{t('cart.itemsLabel')}</span>
              <span>{itemCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>{t('payment.subtotal')}</span>
              <span>{formatCurrency(subtotal, { currency: summaryCurrency, locale })}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>{t('payment.estimatedTax')}</span>
              <span>{formatCurrency(tax, { currency: summaryCurrency, locale })}</span>
            </div>
            <div className="theme-heading flex items-center justify-between border-t border-[color:var(--border)] pt-4 text-base font-semibold">
              <span>{t('payment.total')}</span>
              <span>{formatCurrency(total, { currency: summaryCurrency, locale })}</span>
            </div>
          </div>

          <div className="theme-muted mt-5 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4 text-sm leading-7">
            {t('cart.summaryNote')}
          </div>

          {itemCount > 0 ? (
            <Link className="mt-5 inline-flex w-full" to={ROUTES.payment}>
              <Button asChild className="w-full justify-center">
                {t('cart.proceedToPayment')}
              </Button>
            </Link>
          ) : (
            <Button className="mt-5 w-full justify-center" disabled>
              {t('cart.proceedToPayment')}
            </Button>
          )}
        </aside>
      </section>
    </div>
  )
}

export default CartPage

