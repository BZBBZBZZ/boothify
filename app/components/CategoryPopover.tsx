"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { parseEventCategories } from "../lib/event-categories";
import Icon from "./Icon";

type CategoryPopoverProps = {
  categories?: string[] | null;
  category?: string | null;
  /** Text on the trigger button. */
  label?: string;
  size?: "sm" | "md";
  className?: string;
};

/**
 * An event's categories behind one button. One category shows as a plain chip;
 * several open a small scrollable pop-up with a close button at its top right.
 * The pop-up renders in a portal and stops clicks, so it also works inside a card link.
 */
export default function CategoryPopover({
  categories,
  category,
  label = "Lihat kategori event",
  size = "sm",
  className = "",
}: CategoryPopoverProps) {
  const list = parseEventCategories(categories, category);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Close when the page is hidden by a navigation, so it is never found open on return
  useLayoutEffect(() => () => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (list.length === 0) return null;

  if (list.length === 1) {
    return <span className={`category-chip ${className}`}>{list[0]}</span>;
  }

  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <>
      <button
        type="button"
        className={`btn btn-secondary ${size === "sm" ? "btn-sm" : ""} category-trigger ${className}`}
        onClick={(e) => {
          stop(e);
          setOpen(true);
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {label} ({list.length})
      </button>

      {open &&
        mounted &&
        createPortal(
          <div
            className="category-overlay"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
          >
            <div
              className="category-dialog"
              role="dialog"
              aria-modal="true"
              aria-label="Kategori event"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="category-dialog-head">
                <p className="category-dialog-title">Kategori event</p>
                <button
                  type="button"
                  className="category-dialog-close"
                  aria-label="Tutup"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                  }}
                  autoFocus
                >
                  <Icon name="x" size={20} />
                </button>
              </div>
              <ul className="category-dialog-list">
                {list.map((c) => (
                  <li key={c}>
                    <span className="category-chip">{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
