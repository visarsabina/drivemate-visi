export type CandidateStatus = "regjistuar" | "ne_proces" | "kaluar" | "deshtur";

export interface Candidate {
  id: string;
  numriPersonal: string;
  emri: string;
  mbiemri: string;
  telefon: string;
  email: string;
  dataLindjes: string;
  kategoria: string;
  statusi: CandidateStatus;
  dataRegjistrimit: string;
  shenimet: string;
}
