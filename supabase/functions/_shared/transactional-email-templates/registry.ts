import type * as React from 'npm:react@18.3.1'
import { template as expiryAlert } from './expiry-alert.tsx'
import { template as newRegistration } from './new-registration.tsx'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'expiry-alert': expiryAlert,
  'new-registration': newRegistration,
}
