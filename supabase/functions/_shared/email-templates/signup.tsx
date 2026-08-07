/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="sq" dir="ltr">
    <Head />
    <Preview>Konfirmo email-in tënd për {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Konfirmo email-in tënd</Heading>
        <Text style={text}>
          Faleminderit që u regjistrove në{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          .
        </Text>
        <Text style={text}>
          Të lutem konfirmo adresën e email-it (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) duke klikuar butonin më poshtë:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Konfirmo email-in
        </Button>
        <Text style={footer}>
          Nëse nuk e ke krijuar këtë llogari, mund t'i shpërfillësh këtë email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '24px 25px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: 'hsl(215, 25%, 15%)',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: 'hsl(215, 10%, 45%)',
  lineHeight: '1.6',
  margin: '0 0 25px',
}
const link = { color: 'hsl(199, 70%, 44%)', textDecoration: 'underline' }
const button = {
  backgroundColor: 'hsl(199, 70%, 44%)',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  borderRadius: '12px',
  padding: '12px 22px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: 'hsl(215, 10%, 55%)', margin: '30px 0 0' }
