"use client";

import { Suspense } from "react";
import TenantBookingsAndOrdersPage from "../page";

export default function DynamicBoothBookingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground text-center">Memuat data pesanan...</div>}>
      <TenantBookingsAndOrdersPage />
    </Suspense>
  );
}
