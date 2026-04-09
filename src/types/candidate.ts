export type CandidateStatus = "regjistuar" | "ne_proces" | "kaluar" | "deshtur";

export interface Candidate {
  id: string;
  numriRegjistrimit: string;
  numriPersonal: string;
  emri: string;
  mbiemri: string;
  telefon: string;
  email: string;
  dataLindjes: string;
  kategoria: string;
  certifikataShendetsore: string;
  vendi: string;
  statusi: CandidateStatus;
  dataRegjistrimit: string;
  shenimet: string;
}
