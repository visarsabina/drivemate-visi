import { describe, it, expect } from "vitest";
import {
  buildEmployeesPrintHTML,
  buildVehiclesPrintHTML,
  buildLicensesPrintHTML,
  buildFinancesReportHTML,
  buildDailyPaymentsPrintHTML,
} from "./printTemplates";

// Helpers — produce dates relative to "today" so urgent-row logic is stable.
const offsetDate = (days: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

describe("buildEmployeesPrintHTML", () => {
  it("renders well-formed HTML with header, count, and column headers", () => {
    const html = buildEmployeesPrintHTML([]);
    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(html).toContain("<title>Lista e Punëtorëve</title>");
    expect(html).toContain("Auto Shkolla Visi — Lista e Punëtorëve");
    expect(html).toContain("Gjithsej: 0 punëtorë");
    // Required columns
    ["Emri Mbiemri", "Nr. Personal", "Nr. Licencës", "Skadon Licenca", "Skadon Cert."]
      .forEach((c) => expect(html).toContain(c));
    // Print trigger
    expect(html).toContain("window.print()");
    // No print-date footer (regression: user removed it)
    expect(html).not.toContain("Data e printimit");
  });

  it("renders rows with formatted dates and urgent class for soon-expiring docs", () => {
    const html = buildEmployeesPrintHTML([
      {
        full_name: "Arben Krasniqi",
        personal_number: "1234567890",
        license_number: "LIC-1",
        license_date: "2020-01-15",
        license_expiry_date: offsetDate(10), // urgent (≤30)
        health_certificate_date: "2024-06-01",
        health_certificate_expiry_date: offsetDate(200),
      },
      {
        full_name: "Blerta Hoxha",
        personal_number: null,
        license_number: null,
        license_date: null,
        license_expiry_date: offsetDate(365),
        health_certificate_date: null,
        health_certificate_expiry_date: null,
      },
    ]);
    expect(html).toContain("Gjithsej: 2 punëtorë");
    expect(html).toContain("Arben Krasniqi");
    expect(html).toContain("Blerta Hoxha");
    expect(html).toContain("15.01.2020"); // dd.mm.yyyy
    // Empty fields rendered as em dash
    expect(html).toContain("<td>—</td>");
    // First row should be marked urgent, second should not
    const firstRow = html.split("<tbody>")[1].split("</tr>")[0];
    expect(firstRow).toContain('class="urgent"');
    const secondRow = html.split("<tbody>")[1].split("</tr>")[1];
    expect(secondRow).toContain('class=""');
  });

  it("escapes nothing dangerous but preserves user input verbatim", () => {
    const html = buildEmployeesPrintHTML([
      {
        full_name: "Test User",
        personal_number: "X",
        license_number: "Y",
        license_date: null,
        license_expiry_date: null,
        health_certificate_date: null,
        health_certificate_expiry_date: null,
      },
    ]);
    expect(html).toContain("<td>1</td>");
    expect(html).toContain("Test User");
  });
});

describe("buildVehiclesPrintHTML", () => {
  it("renders header and vehicle-specific columns", () => {
    const html = buildVehiclesPrintHTML([]);
    expect(html).toContain("<title>Lista e Mjeteve</title>");
    expect(html).toContain("Auto Shkolla Visi — Lista e Mjeteve");
    expect(html).toContain("Gjithsej: 0 mjete");
    ["Emri i Veturës", "Tabelat", "Regjistrimi", "Kontrolla Periodike", "Nr. Atestit"]
      .forEach((c) => expect(html).toContain(c));
    expect(html).not.toContain("Data e printimit");
  });

  it("marks rows urgent when inspection expires within 7 days", () => {
    const html = buildVehiclesPrintHTML([
      {
        name: "Golf 7",
        plate_number: "01-AAA-001",
        registration_date: "2024-03-01",
        registration_expiry_date: offsetDate(200),
        inspection_date: "2024-09-01",
        inspection_expiry_date: offsetDate(3), // urgent
        attestation_number: "AT-1",
      },
      {
        name: "Polo",
        plate_number: "02-BBB-002",
        registration_date: null,
        registration_expiry_date: null,
        inspection_date: null,
        inspection_expiry_date: offsetDate(60),
        attestation_number: null,
      },
    ]);
    expect(html).toContain("Golf 7");
    expect(html).toContain("01-AAA-001");
    expect(html).toContain("01.03.2024");
    expect(html).toContain("<td>—</td>"); // attestation_number null
    const tbody = html.split("<tbody>")[1];
    expect(tbody.split("</tr>")[0]).toContain('class="urgent"');
    expect(tbody.split("</tr>")[1]).toContain('class=""');
  });
});

describe("buildLicensesPrintHTML", () => {
  it("renders header, count, and license columns", () => {
    const html = buildLicensesPrintHTML([]);
    expect(html).toContain("<title>Lista e Licencave</title>");
    expect(html).toContain("Auto Shkolla Visi — Lista e Licencave");
    expect(html).toContain("Gjithsej: 0 licenca");
    ["Kategoria", "Numri i Licencës", "Data e Licencës", "Skadenca"]
      .forEach((c) => expect(html).toContain(c));
    expect(html).not.toContain("Data e printimit");
  });

  it("marks expiring rows urgent and formats dates dd.mm.yyyy", () => {
    const html = buildLicensesPrintHTML([
      { category: "B", license_number: "B-001", issue_date: "2022-05-10", expiry_date: offsetDate(20) },
      { category: "C", license_number: "C-002", issue_date: "2023-07-22", expiry_date: offsetDate(120) },
    ]);
    expect(html).toContain("10.05.2022");
    expect(html).toContain("22.07.2023");
    const tbody = html.split("<tbody>")[1];
    expect(tbody.split("</tr>")[0]).toContain('class="urgent"');
    expect(tbody.split("</tr>")[1]).toContain('class=""');
  });
});

describe("buildFinancesReportHTML", () => {
  it("renders title, subtitle, rows and total", () => {
    const html = buildFinancesReportHTML(
      "Raporti vjetor — 2026",
      "Viti: 2026",
      [
        { label: "Janar", value: 100 },
        { label: "Shkurt", value: 250.5 },
      ],
      350.5
    );
    expect(html).toContain("<title>Raporti vjetor — 2026</title>");
    expect(html).toContain("<h1>Raporti vjetor — 2026</h1>");
    expect(html).toContain("Auto Shkolla Visi — Viti: 2026");
    expect(html).toContain("Janar");
    expect(html).toContain("100.00 €");
    expect(html).toContain("250.50 €");
    expect(html).toContain("Total: 350.50 €");
    expect(html).toContain("@page { size: A4");
  });
});

describe("buildDailyPaymentsPrintHTML", () => {
  it("renders empty-state row when there are no payments", () => {
    const html = buildDailyPaymentsPrintHTML([], 0, "2026-04-22");
    expect(html).toContain("Raporti ditor i pagesave");
    expect(html).toContain("Auto Shkolla Visi");
    expect(html).toContain("Nuk ka pagesa sot");
    expect(html).toContain("Total: 0.00 €");
    expect(html).not.toContain("Auto Shkolla Visi — Data:"); // regression: removed
  });

  it("renders a row per payment with formatted amount", () => {
    const html = buildDailyPaymentsPrintHTML(
      [
        { numriRegjistrimit: "001", emri: "Arben", mbiemri: "Krasniqi", shuma: 50 },
        { numriRegjistrimit: "002", emri: "Blerta", mbiemri: "Hoxha", shuma: 75.25 },
      ],
      125.25,
      "2026-04-22"
    );
    expect(html).toContain("Arben");
    expect(html).toContain("Krasniqi");
    expect(html).toContain("50.00 €");
    expect(html).toContain("75.25 €");
    expect(html).toContain("Total: 125.25 €");
    expect(html).not.toContain("Nuk ka pagesa sot");
  });
});
