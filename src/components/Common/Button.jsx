import { Link } from 'react-router'

const VARIANTS = {
  primary: 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700',
  secondary: 'border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  success: 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
}

const SIZES = {
  sm: 'h-8 gap-1.5 px-3 text-sm',
  md: 'h-10 gap-2 px-4 text-sm',
  lg: 'h-11 gap-2 px-5 text-base',
}

// Renders a <Link> when `to` is given, otherwise a <button>.
function Button({ to, variant = 'primary', size = 'md', icon: Icon, className = '', children, ...props }) {
  const classes = `inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`

  const content = (
    <>
      {Icon && <Icon className="size-4" aria-hidden="true" />}
      {children}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" className={classes} {...props}>
      {content}
    </button>
  )
}

export default Button
