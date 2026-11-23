"use client";

/**
 * Shared building blocks for every dashboard and public page, so headings, tabs,
 * notices and form fields look and behave the same everywhere.
 */

import { useId, type ReactNode } from "react";
import Icon from "./Icon";

/* ---------------------------------------------------------------- PageHeader */

export function PageHeader({
  title,
  description,
  actions,
  id,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  id?: string;
}) {
  return (
    <header className="page-header" id={id}>
      <div className="min-w-0">
        <h1 className="page-header-title">{title}</h1>
        {description && <p className="page-header-desc">{description}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </header>
  );
}

/** Heading for a card or section inside a page. */
export function SectionTitle({ title, description, as = "h2" }: { title: ReactNode; description?: ReactNode; as?: "h2" | "h3" }) {
  const Tag = as;
  return (
    <div className="mb-5">
      <Tag className="section-title">{title}</Tag>
      {description && <p className="section-desc">{description}</p>}
    </div>
  );
}

/* ---------------------------------------------------------------------- Tabs */

export type TabItem<K extends string> = { key: K; label: ReactNode; count?: number };

/**
 * A row of tabs. The panels are rendered by the caller; give each panel
 * `role="tabpanel"` and `id={tabPanelId(key)}` if you want the ARIA link.
 */
export function Tabs<K extends string>({
  items,
  active,
  onChange,
  label,
  idPrefix = "tab",
}: {
  items: Array<TabItem<K>>;
  active: K;
  onChange: (key: K) => void;
  label: string;
  idPrefix?: string;
}) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          role="tab"
          id={`${idPrefix}-${item.key}`}
          aria-selected={active === item.key}
          aria-controls={`${idPrefix}-panel-${item.key}`}
          className="tab"
          onClick={() => onChange(item.key)}
        >
          {item.label}
          {typeof item.count === "number" && <span className="tab-count">{item.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function TabPanel({ idPrefix = "tab", tabKey, children, className = "" }: { idPrefix?: string; tabKey: string; children: ReactNode; className?: string }) {
  return (
    <div role="tabpanel" id={`${idPrefix}-panel-${tabKey}`} aria-labelledby={`${idPrefix}-${tabKey}`} className={`animate-fade-in ${className}`}>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------- Notice */

export function Notice({
  tone = "info",
  title,
  children,
  className = "",
  id,
}: {
  tone?: "info" | "ok" | "error" | "warn";
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
  id?: string;
}) {
  const icon = tone === "ok" ? "check-circle" : tone === "error" ? "x" : tone === "warn" ? "bell" : "clipboard";
  return (
    <div className={`notice notice--${tone} ${className}`} role={tone === "error" ? "alert" : "status"} id={id}>
      <Icon name={icon} size={16} />
      <div className="min-w-0">
        {title && <p className="notice-title">{title}</p>}
        {children && <div>{children}</div>}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- Field */

/**
 * A labelled form control. Pass a render function to get the generated id:
 *   <Field label="Nama menu" hint="Tampil di menu pengunjung">{(id) => <input id={id} … />}</Field>
 */
export function Field({
  label,
  hint,
  required,
  optional,
  id,
  className = "",
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  required?: boolean;
  optional?: boolean;
  id?: string;
  className?: string;
  children: (id: string) => ReactNode;
}) {
  const autoId = useId();
  const fieldId = id || autoId;
  return (
    <div className={className}>
      <div className="field-label-row">
        <label htmlFor={fieldId} className="field-label">
          {label}
          {required && <span aria-hidden="true" className="text-error"> *</span>}
        </label>
        {optional && <span className="field-tag">Opsional</span>}
      </div>
      {children(fieldId)}
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

/* ---------------------------------------------------------------- EmptyState */

export function EmptyState({ title, text, action, icon }: { title: ReactNode; text?: ReactNode; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="empty-state">
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <p className="empty-state-title">{title}</p>
      {text && <p className="empty-state-text">{text}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------- Stepper */

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="stepper" aria-label={`Langkah ${current + 1} dari ${steps.length}`}>
      {steps.map((label, i) => (
        <li
          key={label}
          className={`stepper-item ${i < current ? "is-done" : ""} ${i === current ? "is-current" : ""}`}
          aria-current={i === current ? "step" : undefined}
        >
          <span className="stepper-bar" />
          <span className="stepper-label">
            {i + 1}. {label}
          </span>
        </li>
      ))}
    </ol>
  );
}
