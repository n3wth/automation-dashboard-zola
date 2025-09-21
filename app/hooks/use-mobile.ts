"use client"

import { useSsrBreakpoint } from "./use-ssr-breakpoint"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  return useSsrBreakpoint(MOBILE_BREAKPOINT)
}
