export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  branch: string;
  year: number | null;
  skills: string[];
  bio: string;
  github: string;
  portfolio: string;
  rating: number;
  role: "poster" | "freelancer";
}

export interface Proposal {
  id: string;
  freelancer: User;
  approach: string;
  timeline: string;
  quote: number;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  skills: string[];
  budget: number;
  deadline: string;
  deliverables: string;
  status: "open" | "assigned" | "in-progress" | "submitted" | "completed";
  poster: User;
  applicants: Proposal[];
  applicantsCount: number;
  createdAt: string;
  referenceLinks?: string[];
}

export interface ChatMsg {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  type: "proposal" | "accepted" | "message" | "submitted" | "completed" | "rejected";
  title: string;
  description: string;
  time: string;
  read: boolean;
  createdAt: string;
}

export interface Workspace {
  id: string;
  job: Job;
  poster: User;
  freelancer: User;
  status: "Active" | "Completed";
  resources: Array<{
    id: string;
    url: string;
    addedBy: string;
    createdAt: string;
  }>;
  submission: {
    link: string;
    notes: string;
    submittedAt: string | null;
  };
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  workspaceId: string;
  fromUser: User;
  toUser: User;
  rating: number;
  comment: string;
  createdAt: string;
}
