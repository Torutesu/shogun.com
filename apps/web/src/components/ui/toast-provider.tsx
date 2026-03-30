"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ToastContainer } from "./toast";

export function ToastProvider() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(<ToastContainer />, document.body);
}
