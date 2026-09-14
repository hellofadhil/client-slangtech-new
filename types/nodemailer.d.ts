declare module "nodemailer" {
  type TransportOptions = {
    host: string
    port: number
    secure: boolean
    auth: {
      user: string
      pass: string
    }
  }

  type MailOptions = {
    from: string
    to: string
    subject: string
    text: string
    html: string
  }

  export function createTransport(options: TransportOptions): {
    sendMail(options: MailOptions): Promise<unknown>
  }
}
