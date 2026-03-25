import type { PrimaryAction } from '../content/siteContent'

type AppHeaderProps = {
  primaryAction: PrimaryAction
  secondaryAction: PrimaryAction
}

function ActionLink({ action, tone }: { action: PrimaryAction; tone: 'primary' | 'secondary' }) {
  return (
    <a
      className={`action-link action-link--${tone}`}
      href={action.href}
      {...(action.external
        ? { target: '_blank', rel: 'noreferrer noopener' }
        : undefined)}
    >
      {action.label}
    </a>
  )
}

export function AppHeader({ primaryAction, secondaryAction }: AppHeaderProps) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Sentinel Nexus</p>
        <p className="topbar-title">Architecture-first frontend foundation</p>
      </div>
      <nav className="topbar-actions" aria-label="Primary navigation">
        <ActionLink action={primaryAction} tone="primary" />
        <ActionLink action={secondaryAction} tone="secondary" />
      </nav>
    </header>
  )
}
