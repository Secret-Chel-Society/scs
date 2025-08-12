// Simplify the SMTP tester to avoid DNS lookup issues

// Replace the smtpConfigurations array with this simplified version
const smtpConfigurations = [
  // Hostinger standard SSL
  { port: 465, secure: true, name: "SSL/TLS (Standard)" },
  // Hostinger alternative STARTTLS
  { port: 587, secure: false, name: "STARTTLS" },
]

// Update the testSmtpConfigurations function to avoid DNS lookup
export async function testSmtpConfigurations(host: string, user: string, pass: string) {
  console.log("SMTP configuration testing is limited in preview environment due to DNS lookup restrictions")

  // Return a simulated result to avoid DNS lookup
  return [
    {
      name: "SSL/TLS (Standard)",
      port: 465,
      secure: true,
      success: false,
      error: "DNS lookup not available in preview environment",
      simulated: true,
    },
    {
      name: "STARTTLS",
      port: 587,
      secure: false,
      error: "DNS lookup not available in preview environment",
      simulated: true,
    },
  ]
}

// Update the sendTestEmail function to avoid DNS lookup
export async function sendTestEmail(
  host: string,
  port: number,
  secure: boolean,
  user: string,
  pass: string,
  from: string,
  to: string,
) {
  console.log("Email sending is limited in preview environment due to DNS lookup restrictions")

  // Return a simulated result to avoid DNS lookup
  return {
    success: false,
    error: "DNS lookup not available in preview environment",
    simulated: true,
  }
}
