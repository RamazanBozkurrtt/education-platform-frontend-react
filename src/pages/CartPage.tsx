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
          <div className="flex items-center justify-between gap-4 border-b border-white/8 pb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{t('cart.selectedCourses')}</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                {t('cart.courseCount', { count: itemCount })}
              </h2>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-300">
                <ShoppingCart className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-white">{t('cart.emptyTitle')}</h3>
              <p className="mt-3 max-w-md text-sm leading-7 text-slate-400">{t('cart.emptyDescription')}</p>
              <Link className="mt-6 inline-flex" to={ROUTES.courses}>
                <Button asChild>{t('cart.browseCourses')}</Button>
              </Link>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {items.map((item) => (
                <div key={item.courseId} className="rounded-2xl border border-white/8 bg-white/4 p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className={`mb-4 h-1.5 w-20 rounded-full bg-gradient-to-r ${item.course.accent}`} />
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
                          {item.course.category}
                        </span>
                        <span className="text-xs text-slate-500">{item.course.level}</span>
                      </div>
                      <h3 className="mt-4 text-xl font-semibold text-white">{item.course.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-400">{item.course.summary}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
                      <p className="text-2xl font-semibold text-white">{formatCurrency(item.course.price)}</p>
                      <button
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/6 hover:text-white"
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
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-100">{t('cart.orderSummary')}</p>
          <div className="mt-6 space-y-4 text-sm text-slate-300">
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
            <div className="flex items-center justify-between border-t border-white/10 pt-4 text-base font-semibold text-white">
              <span>{t('payment.total')}</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="mt-8 rounded-[22px] border border-white/8 bg-white/4 p-4 text-sm leading-7 text-slate-400">
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
