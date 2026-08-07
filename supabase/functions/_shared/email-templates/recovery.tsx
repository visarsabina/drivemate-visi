/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="sq" dir="ltr">
    <Head />
    <Preview>Rivendos fjalëkalimin për {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Rivendos fjalëkalimin</Heading>
        <Text style={text}>
          Kemi marrë një kërkesë për rivendosjen e fjalëkalimit tënd në {siteName}.
          Kliko butonin më poshtë për të zgjedhur një fjalëkalim të re.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Rivendos fjalëkalimin
        </Button>
        <Text style={footer}>
          Nëse nuk e ke kërkuar këtë, mund t'i shpërfillësh këtë email —
          fjalëkalimi nuk do të ndryshohet.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

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
