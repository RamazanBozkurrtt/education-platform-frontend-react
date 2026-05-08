import { ArrowRight, ShoppingCart, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { useCart } from '../hooks/useCart'
import { ROUTES } from '../utils/constants'
import { formatCurrency } from '../utils/helpers'

const CartPage = () => {
  const { t } = useTranslation()
  const { clearCart, itemCount, items, removeCourse, subtotal, tax, total } = useCart()

  return (
    <div className="space-y-6">
      <PageHeader
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
        <Card>
          <div className="flex items-center justify-between gap-4 border-b border-[color:var(--border)] pb-4">
            <div>
              <p className="theme-subtle text-xs uppercase tracking-[0.22em]">{t('cart.selectedCourses')}</p>
              <h2 className="theme-heading mt-2 text-2xl font-semibold">
                {t('cart.courseCount', { count: itemCount })}
              </h2>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[color:var(--surface-sky-haze)] text-[color:var(--primary)]">
                <ShoppingCart className="h-7 w-7" />
              </div>
              <h3 className="theme-heading text-xl font-semibold">{t('cart.emptyTitle')}</h3>
              <p className="theme-muted mt-3 max-w-md text-sm leading-7">{t('cart.emptyDescription')}</p>
              <Link className="mt-6 inline-flex" to={ROUTES.courses}>
                <Button asChild>{t('cart.browseCourses')}</Button>
              </Link>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {items.map((item) => (
                <div key={item.courseId} className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="theme-muted rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-1 text-xs font-semibold">
                          {item.course.category}
                        </span>
                        <span className="theme-subtle text-xs">{item.course.level}</span>
                      </div>
                      <h3 className="theme-heading mt-4 text-xl font-semibold">{item.course.title}</h3>
                      <p className="theme-muted mt-2 text-sm leading-7">{item.course.summary}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
                      <p className="theme-heading text-2xl font-semibold">{formatCurrency(item.course.price)}</p>
                      <button
                        className="theme-muted inline-flex items-center gap-2 rounded-xl border border-[color:var(--border)] px-3 py-2 text-sm font-medium transition hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-hover)]"
                        onClick={() => removeCourse(item.courseId)}
                        type="button"
                      >
                        <Trash2 className="h-4 w-4" />
                        {t('common.remove')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="h-fit">
          <p className="theme-subtle text-xs uppercase tracking-[0.22em]">{t('cart.orderSummary')}</p>
          <div className="theme-muted mt-6 space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span>{t('cart.itemsLabel')}</span>
              <span>{itemCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>{t('payment.subtotal')}</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>{t('payment.estimatedTax')}</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="theme-heading flex items-center justify-between border-t border-[color:var(--border)] pt-4 text-base font-semibold">
              <span>{t('payment.total')}</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="theme-muted mt-8 rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4 text-sm leading-7">
            {t('cart.summaryNote')}
          </div>

          {itemCount > 0 ? (
            <Link className="mt-6 inline-flex w-full" to={ROUTES.payment}>
              <Button asChild className="w-full justify-center">
                {t('cart.proceedToPayment')}
              </Button>
            </Link>
          ) : (
            <Button className="mt-6 w-full justify-center" disabled>
              {t('cart.proceedToPayment')}
            </Button>
          )}
        </Card>
      </section>
    </div>
  )
}

export default CartPage
