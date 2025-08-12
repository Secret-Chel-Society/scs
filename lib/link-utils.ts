// Utility function to detect and convert URLs to clickable links
export function linkify(text: string): string {
  // Regular expression to match URLs
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.([a-zA-Z]{2,})(\/[^\s]*)?)/gi

  return text.replace(urlRegex, (url) => {
    // Ensure the URL has a protocol
    let href = url
    if (!url.match(/^https?:\/\//)) {
      href = `https://${url}`
    }

    // Create the link with security attributes
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-700 underline break-all">${url}</a>`
  })
}

// Function to check if text contains URLs
export function containsLinks(text: string): boolean {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.([a-zA-Z]{2,})(\/[^\s]*)?)/gi
  return urlRegex.test(text)
}

// Function to extract URLs from text
export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.([a-zA-Z]{2,})(\/[^\s]*)?)/gi
  return text.match(urlRegex) || []
}
