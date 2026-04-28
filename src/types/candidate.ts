export type CandidateStatus = "regjistuar" | "ne_proces" | "kaluar" | "deshtur";

export interface Payment {
  id: string;
  shuma: number;
  data: string;
}

export interface Candidate {
  id: string;
  numriRegjistrimit: string;
  numriPersonal: string;
  emri: string;
  mbiemri: string;
  emriBabait: string;
  vendlindja: string;
  telefon: string;
  dataLindjes: string;
  kategoria: string;
  certifikataShendetsore: string;
  vendi: string;
  statusi: CandidateStatus;
  dataRegjistrimit: string;
  shenimet: string;
  shumaMarreveshjes: number;
  payments: Payment[];
  vertetimiPrintuar?: boolean;
  dokumenteTerhequr?: boolean;
  instructorId?: string | null;
}
