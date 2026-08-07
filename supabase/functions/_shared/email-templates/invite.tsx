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

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="sq" dir="ltr">
    <Head />
    <Preview>Ftesë për t'u bashkuar në {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Ke marrë një ftesë</Heading>
        <Text style={text}>
          Ke marrë ftesë për t'u bashkuar në{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          . Kliko butonin më poshtë për të pranuar ftesën dhe krijuar llogarinë.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Prano ftesën
        </Button>
        <Text style={footer}>
          Nëse nuk e prit këtë ftesë, mund t'i shpërfillësh këtë email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

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
