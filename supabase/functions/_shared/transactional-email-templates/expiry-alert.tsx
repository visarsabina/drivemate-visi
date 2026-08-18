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

interface AlertItem {
  title?: string
  detail?: string
  days?: number
}

interface Props {
  schoolName?: string
  vehicles?: AlertItem[]
  employees?: AlertItem[]
}

const Email = ({ schoolName, vehicles = [], employees = [] }: Props) => (
  <Html lang="sq" dir="ltr">
    <Head />
    <Preview>Afate që skadojnë — {schoolName || 'Auto Shkolla'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Njoftim për afate</Heading>
        <Text style={text}>
          {schoolName || 'Auto Shkolla'} — këto afate skadojnë së shpejti ose kanë skaduar:
        </Text>

        {vehicles.length > 0 && (
          <Section style={card}>
            <Text style={cardTitle}>Mjetet</Text>
            {vehicles.map((v, i) => (
              <Text key={i} style={item}>
                <strong>{v.title}</strong> — {v.detail}
              </Text>
            ))}
          </Section>
        )}

        {employees.length > 0 && (
          <Section style={card}>
            <Text style={cardTitle}>Punëtorët</Text>
            {employees.map((e, i) => (
              <Text key={i} style={item}>
                <strong>{e.title}</strong> — {e.detail}
              </Text>
            ))}
          </Section>
        )}

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
    `Afate që skadojnë — ${data?.schoolName || 'Auto Shkolla'}`,
  displayName: 'Njoftim afatesh',
  previewData: {
    schoolName: 'Auto Shkolla Visi',
    vehicles: [{ title: 'Golf 7 (01-234-AB)', detail: 'kontrolla skadon nesër' }],
    employees: [{ title: 'Arben Krasniqi', detail: 'licenca skadon nesër' }],
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
const cardTitle = { fontSize: '14px', fontWeight: 700, color: '#2196c4', margin: '0 0 6px' }
const item = { fontSize: '14px', color: '#334155', margin: '4px 0' }
const footer = { fontSize: '12px', color: '#64748b', marginTop: '20px' }
