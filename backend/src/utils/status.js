export const dbJobToClientStatus = {
  Open: "open",
  Assigned: "assigned",
  InProgress: "in-progress",
  Submitted: "submitted",
  Completed: "completed",
};

export const clientJobToDbStatus = Object.fromEntries(
  Object.entries(dbJobToClientStatus).map(([db, client]) => [client, db])
);

export const dbProposalToClientStatus = {
  Pending: "pending",
  Accepted: "accepted",
  Rejected: "rejected",
};

export const statusTransitions = {
  Open: ["Assigned"],
  Assigned: ["InProgress"],
  InProgress: ["Submitted"],
  Submitted: ["InProgress", "Completed"],
  Completed: [],
};

export const canTransitionStatus = (from, to) => statusTransitions[from]?.includes(to) || false;
