interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  children?: React.ReactNode
}

export default function PageHeader({ title, description, actions, children }: PageHeaderProps) {
  return (
    <div className="mb-6 pb-5 border-b border-slate-200">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          {description && <p className="text-muted-foreground mt-1">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
      {children}
    </div>
  )
}
