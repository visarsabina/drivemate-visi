import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  schoolName?: string
  fullName?: string
  email?: string
  phone?: string
  category?: string
  createdAt?: string
}

const Email = ({ schoolName, fullName, email, phone, category, createdAt }: Props) => (
  <Html lang="sq" dir="ltr">
    <Head />
    <Preview>Regjistrim i re online — {fullName || 'Kandidat i re'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Regjistrim i re online</Heading>
        <Text style={text}>
          {schoolName || 'Auto Shkolla'} ka pranuar një regjistrim të re nga faqja e internetit:
        </Text>

        <Section style={card}>
          <Text style={item}>
            <strong>Emri dhe mbiemri:</strong> {fullName || '-'}
          </Text>
          <Text style={item}>
            <strong>Kategoria:</strong> {category || '-'}
          </Text>
          <Text style={item}>
            <strong>Telefoni:</strong> {phone || '-'}
          </Text>
          <Text style={item}>
            <strong>Email:</strong> {email || '-'}
          </Text>
          {createdAt && (
            <Text style={item}>
              <strong>Data:</strong> {createdAt}
            </Text>
          )}
        </Section>

        <Text style={text}>
          Kandidati e pret kontaktin tuaj. Regjistrimin mund t'i shikoni në panelin
          e administrimit, tek seksioni “Regjistrimet”.
        </Text>

        <Text style={footer}>
          Ky njoftim dërgohet automatikisht nga sistemi i menaxhimit të auto-shkollës.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `Regjistrim i re online — ${data?.fullName || 'Kandidat i re'}${
      data?.category ? ` (Kat. ${data.category})` : ''
    }`,
  displayName: 'Regjistrim i re online',
  previewData: {
    schoolName: 'Auto Shkolla Visi',
    fullName: 'Arben Krasniqi',
    email: 'arben@example.com',
    phone: '044 123 456',
    category: 'B',
    createdAt: '18.08.2026 21:10',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '20px', color: '#0f172a', margin: '0 0 12px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '22px' }
const card = {
  border: '1px solid #d7e9f2',
  borderRadius: '12px',
  padding: '12px 16px',
  margin: '12px 0',
  backgroundColor: '#f6fbfd',
}
const item = { fontSize: '14px', color: '#334155', margin: '4px 0' }
const footer = { fontSize: '12px', color: '#64748b', marginTop: '20px' }
