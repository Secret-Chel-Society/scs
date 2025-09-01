import nodemailer from "nodemailer"

export const createTransporter = () => {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const secure = process.env.SMTP_SECURE === "true"
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASSWORD

  if (!host || !user || !pass) {
    console.error("SMTP configuration is incomplete")
    throw new Error("SMTP configuration is incomplete")
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  })
}
