"use client";

import { Fragment, type ReactNode } from "react";
import { useRouter } from "next/navigation";

/**
 * With Cache Components, Next.js keeps visited pages alive, so a half-filled form
 * would still be there when the user comes back through a link. Keying the page on
 * `bfcacheId` starts it fresh on every link or router navigation, while the browser's
 * back and forward buttons still restore what was typed.
 */
export default function FreshOnNavigate({ children }: { children: ReactNode }) {
  const { bfcacheId } = useRouter();
  return <Fragment key={bfcacheId}>{children}</Fragment>;
}
