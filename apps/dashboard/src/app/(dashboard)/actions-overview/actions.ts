"use server";

// One action / task item.
export type ActionRow = {
  key: string;
  number: number | null;
  actionType: string | null;
  assignedTo: string | null;
  created: Date | null;
  createdBy: string | null;
  deadline: string | null;
  description: string | null;
  executed: boolean | null;
  executedBy: string | null;
  executedOn: string | null;
  explanation: string | null;
};

// The standalone "Action" entity (a to-do assigned with a deadline, distinct
// from the company-scoped Follow-ups) isn't modelled in this system yet, so
// there is no source to list.
export const getActions = async (): Promise<ActionRow[]> => [];
