// Midnight Studios INTl - All rights reserved
"use client"

/**
 * Dynamic mobile scaling utility
 * Calculates optimal scale based on viewport width to fit content perfectly
 */

export function calculateOptimalScale(): number {
  if (typeof window === 'undefined') return 1
  
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  
  // Base desktop width (where content looks perfect)
  const baseWidth = 1200
  
  // Calculate scale based on viewport width
  let scale = 1
  
  if (viewportWidth < 768) {
    // For mobile devices, calculate scale to fit content optimally
    // We want the content to be scaled so it fits well on the screen
    const targetWidth = Math.min(viewportWidth * 0.95, baseWidth) // 95% of viewport width
    scale = targetWidth / baseWidth
    
    // Ensure minimum scale for readability - much larger now
    scale = Math.max(scale, 0.8)
    
    // Ensure maximum scale to prevent content from being too large
    scale = Math.min(scale, 1.0)
  }
  
  return scale
}

export function applyMobileScaling(): void {
  if (typeof window === 'undefined') return
  
  const scale = calculateOptimalScale()
  const mobileContent = document.querySelector('.mobile-content') as HTMLElement
  
              if (window.innerWidth < 768 && mobileContent) {
                mobileContent.style.transform = 'none'
                mobileContent.style.transformOrigin = 'unset'
                mobileContent.style.width = '100vw'
                mobileContent.style.minHeight = '100vh'
                mobileContent.style.height = 'auto'
              } else if (mobileContent) {
    // Reset for desktop
    mobileContent.style.transform = ''
    mobileContent.style.transformOrigin = ''
    mobileContent.style.width = ''
    mobileContent.style.height = ''
  }
}

export function initializeMobileScaling(): void {
  if (typeof window === 'undefined') return
  
  // Apply scaling on load
  applyMobileScaling()
  
  // Apply scaling on resize
  let resizeTimeout: NodeJS.Timeout
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(applyMobileScaling, 100)
  })
  
  // Apply scaling on orientation change
  window.addEventListener('orientationchange', () => {
    setTimeout(applyMobileScaling, 100)
  })
}
