"use client"

import { useState, useEffect } from "react"

export function useMobile() {
  // Always return false, which will cause components to render the desktop version.
  return false;
}

export const useIsMobile = useMobile
