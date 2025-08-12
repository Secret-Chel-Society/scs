import type React from "react"
export function DiscordLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="9" cy="12" r="1" />
      <circle cx="15" cy="12" r="1" />
      <path d="M7.5 7.2c3.5-1 5.5-1 9 0" />
      <path d="M7.5 16.8c3.5 1 5.5 1 9 0" />
      <path d="M15.5 17 17 20" />
      <path d="M8.5 17 7 20" />
      <path d="M16 3c-.8 0-1.3.4-1.6.8-1.1-.5-2.2-.8-3.4-.8-1.2 0-2.3.3-3.4.8-.3-.4-.8-.8-1.6-.8-3 0-3 3 0 3 .4 0 .8-.1 1.1-.3.3 1.1.9 2 1.7 2.8-1 1.5-1.4 3.2-1.4 5.5 0 .3.2 2 2 2h5.2c1.8 0 2-1.7 2-2 0-2.3-.4-4-1.4-5.5.8-.8 1.4-1.7 1.7-2.8.3.2.7.3 1.1.3 3 0 3-3 0-3Z" />
    </svg>
  )
}
