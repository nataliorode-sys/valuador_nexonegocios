"use client";

import { useEffect } from "react";

// Recarga la página cada `seconds` (para esperar la confirmación de un pago pendiente).
export default function AutoRefresh({ seconds = 6 }: { seconds?: number }) {
  useEffect(() => {
    const t = setTimeout(() => window.location.reload(), seconds * 1000);
    return () => clearTimeout(t);
  }, [seconds]);
  return null;
}
