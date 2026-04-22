// Pure HTML template builders for print views — testable & framework-free.
import { formatDateDMY } from "@/lib/date";

const formatDate = (d: string | null | undefined) => formatDateDMY(d);

const daysUntil = (date: string | null | undefined): number | null => {
  if (!date) return null;
  const diff = new Date(date).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const baseStyles = `
  body{font-family:Arial,sans-serif;padding:24px;color:#111;}
  h1{margin:0 0 4px 0;font-size:20px;}
  .sub{color:#555;margin-bottom:16px;font-size:12px;}
  table{width:100%;border-collapse:collapse;font-size:12px;}
  th,td{border:1px solid #999;padding:6px 8px;text-align:left;vertical-align:top;}
  th{background:#f0f0f0;}
  .urgent{background:#ffe5e5;}
  @media print{button{display:none;}}
`;

export interface EmployeeForPrint {
  full_name: string;
  personal_number: string | null;
  license_number: string | null;
  license_date: string | null;
  license_expiry_date: string | null;
  health_certificate_date: string | null;
  health_certificate_expiry_date: string | null;
}

export const buildEmployeesPrintHTML = (employees: EmployeeForPrint[]): string => {
  const rows = employees
    .map((e, i) => {
      const lic = daysUntil(e.license_expiry_date);
      const health = daysUntil(e.health_certificate_expiry_date);
      const urgent = (lic !== null && lic <= 30) || (health !== null && health <= 30);
      return `<tr class="${urgent ? "urgent" : ""}">
        <td>${i + 1}</td>
        <td>${e.full_name}</td>
        <td>${e.personal_number || "—"}</td>
        <td>${e.license_number || "—"}</td>
        <td>${formatDate(e.license_date)}</td>
        <td>${formatDate(e.license_expiry_date)}</td>
        <td>${formatDate(e.health_certificate_date)}</td>
        <td>${formatDate(e.health_certificate_expiry_date)}</td>
      </tr>`;
    })
    .join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Lista e Punëtorëve</title>
    <style>${baseStyles.replace(/font-size:12px/, "font-size:11px")}</style></head><body>
    <h1>Auto Shkolla Visi — Lista e Punëtorëve</h1>
    <div class="sub">Gjithsej: ${employees.length} punëtorë</div>
    <table>
      <thead><tr>
        <th>#</th><th>Emri Mbiemri</th><th>Nr. Personal</th><th>Nr. Licencës</th>
        <th>Data e Licencës</th><th>Skadon Licenca</th>
        <th>Data Cert. Shëndet.</th><th>Skadon Cert.</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <script>window.onload=()=>{window.print();}</script>
    </body></html>`;
};

export interface VehicleForPrint {
  name: string;
  plate_number: string;
  registration_date: string | null;
  registration_expiry_date: string | null;
  inspection_date: string | null;
  inspection_expiry_date: string | null;
  attestation_number: string | null;
}

export const buildVehiclesPrintHTML = (vehicles: VehicleForPrint[]): string => {
  const rows = vehicles
    .map((v, i) => {
      const insp = daysUntil(v.inspection_expiry_date);
      const urgent = insp !== null && insp <= 7;
      return `<tr class="${urgent ? "urgent" : ""}">
        <td>${i + 1}</td>
        <td>${v.name}</td>
        <td>${v.plate_number}</td>
        <td>${formatDate(v.registration_date)}</td>
        <td>${formatDate(v.inspection_expiry_date)}</td>
        <td>${v.attestation_number || "—"}</td>
      </tr>`;
    })
    .join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Lista e Mjeteve</title>
    <style>${baseStyles}</style></head><body>
    <h1>Auto Shkolla Visi — Lista e Mjeteve</h1>
    <div class="sub">Gjithsej: ${vehicles.length} mjete</div>
    <table>
      <thead><tr>
        <th>#</th><th>Emri i Veturës</th><th>Tabelat</th><th>Regjistrimi</th>
        <th>Kontrolla Periodike</th><th>Nr. Atestit</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <script>window.onload=()=>{window.print();}</script>
    </body></html>`;
};

export interface LicenseForPrint {
  category: string;
  license_number: string;
  issue_date: string | null;
  expiry_date: string | null;
}

export const buildLicensesPrintHTML = (licenses: LicenseForPrint[]): string => {
  const rows = licenses
    .map((l, i) => {
      const d = daysUntil(l.expiry_date);
      const urgent = d !== null && d <= 30;
      return `<tr class="${urgent ? "urgent" : ""}">
        <td>${i + 1}</td>
        <td>${l.category}</td>
        <td>${l.license_number}</td>
        <td>${formatDate(l.issue_date)}</td>
        <td>${formatDate(l.expiry_date)}</td>
      </tr>`;
    })
    .join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Lista e Licencave</title>
    <style>${baseStyles}</style></head><body>
    <h1>Auto Shkolla Visi — Lista e Licencave</h1>
    <div class="sub">Gjithsej: ${licenses.length} licenca</div>
    <table>
      <thead><tr>
        <th>#</th><th>Kategoria</th><th>Numri i Licencës</th><th>Data e Licencës</th><th>Skadenca</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <script>window.onload=()=>{window.print();}</script>
    </body></html>`;
};

export interface FinancesReportRow {
  label: string;
  value: number;
}

export const buildFinancesReportHTML = (
  title: string,
  subtitle: string,
  rows: FinancesReportRow[],
  total: number,
  columnLabel: string = "Muaji"
): string => {
  const body = rows
    .map(
      (r) => `<tr>
        <td>${r.label}</td>
        <td style="text-align:right">${r.value.toFixed(2)} €</td>
      </tr>`
    )
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
      <style>
        @page { size: A4; margin: 20mm; }
        body { font-family: Arial, sans-serif; color: #111; }
        h1 { font-size: 20px; margin: 0 0 4px; }
        .sub { color: #555; font-size: 12px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th, td { border: 1px solid #ccc; padding: 8px 10px; text-align: left; }
        th { background: #f3f4f6; }
        .total { margin-top: 16px; text-align: right; font-size: 14px; font-weight: 600; }
        .footer { margin-top: 40px; font-size: 11px; color: #666; text-align: center; }
      </style></head><body>
      <h1>${title}</h1>
      <div class="sub">Auto Shkolla Visi — ${subtitle}</div>
      <table>
        <thead><tr><th>${columnLabel}</th><th style="text-align:right">Totali</th></tr></thead>
        <tbody>${body}</tbody>
      </table>
      <div class="total">Total: ${total.toFixed(2)} €</div>
      <div class="footer">Gjeneruar nga sistemi Auto Shkolla Visi</div>
      <script>window.onload = () => { window.print(); }</script>
      </body></html>`;
};

export interface DailyPaymentRow {
  numriRegjistrimit: string | number;
  emri: string;
  mbiemri: string;
  shuma: number;
}

export const buildDailyPaymentsPrintHTML = (
  payments: DailyPaymentRow[],
  totalSot: number,
  today: string
): string => {
  const rows = payments
    .map(
      (p) => `<tr>
        <td>${p.numriRegjistrimit}</td>
        <td>${p.emri}</td>
        <td>${p.mbiemri}</td>
        <td style="text-align:right">${p.shuma.toFixed(2)} €</td>
      </tr>`
    )
    .join("");

  const body = payments.length
    ? rows
    : `<tr><td colspan="4" style="text-align:center;padding:24px;color:#666">Nuk ka pagesa sot</td></tr>`;

  return `<!doctype html><html><head><meta charset="utf-8"><title>Raporti ditor — ${today}</title>
      <style>
        @page { size: A4; margin: 20mm; }
        body { font-family: Arial, sans-serif; color: #111; }
        h1 { font-size: 20px; margin: 0 0 4px; }
        .sub { color: #555; font-size: 12px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th, td { border: 1px solid #ccc; padding: 8px 10px; text-align: left; }
        th { background: #f3f4f6; }
        .total { margin-top: 16px; text-align: right; font-size: 14px; font-weight: 600; }
        .footer { margin-top: 40px; font-size: 11px; color: #666; text-align: center; }
      </style></head><body>
      <h1>Raporti ditor i pagesave</h1>
      <div class="sub">Auto Shkolla Visi</div>
      <table>
        <thead><tr><th>Nr. Regj.</th><th>Emri</th><th>Mbiemri</th><th style="text-align:right">Shuma</th></tr></thead>
        <tbody>${body}</tbody>
      </table>
      <div class="total">Total: ${totalSot.toFixed(2)} €</div>
      <div class="footer">Gjeneruar nga sistemi Auto Shkolla Visi</div>
      <script>window.onload = () => { window.print(); }</script>
      </body></html>`;
};
