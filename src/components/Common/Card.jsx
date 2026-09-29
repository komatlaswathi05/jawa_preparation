function Card({ as: Tag = 'div', padding = 'p-5', className = '', children, ...props }) {
  return (
    <Tag className={`rounded-xl border border-slate-200 bg-white shadow-sm ${padding} ${className}`} {...props}>
      {children}
    </Tag>
  )
}

export default Card
