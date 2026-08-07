/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="sq" dir="ltr">
    <Head />
    <Preview>Kodi i verifikimit</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Konfirmo identitetin</Heading>
        <Text style={text}>Përdor kodin më poshtë për të konfirmuar identitetin:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          Kodi skadon pas një kohe të shkurtër. Nëse nuk e ke kërkuar, mund t'i
          shpërfillësh këtë email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

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
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '26px',
  fontWeight: 'bold' as const,
  letterSpacing: '4px',
  color: 'hsl(199, 70%, 44%)',
  margin: '0 0 30px',
}
const footer = { fontSize: '12px', color: 'hsl(215, 10%, 55%)', margin: '30px 0 0' }
