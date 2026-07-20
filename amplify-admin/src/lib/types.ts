export type CampaignStatus = "draft" | "open" | "full" | "closed";

export type Milestone = {
  views: number;
  minDaysLive: number;
  incrementalPayout: number;
  cumulativePayout: number;
};

/** Row shape from GET /admin/campaigns — a summary, not the whole campaign. */
export type CampaignSummary = {
  id: number;
  trackName: string;
  artistName: string;
  rewardPool: string | null;
  spotsTotal: number;
  spotsFilled: number | null;
  endsAt: string | null;
  status: CampaignStatus;
  createdAt: string;
  enrolledCount: number;
};

export type Campaign = {
  id: number;
  trackName: string;
  artistName: string;
  spotifyTrackId: string | null;
  genre: string | null;
  language: string | null;
  albumArt: string | null;
  previewUrl: string | null;
  description: string | null;
  rewardPool: string | null;
  spotsTotal: number;
  spotsFilled: number | null;
  endsAt: string | null;
  milestones: Milestone[] | null;
  status: CampaignStatus;
  createdAt: string;
};

export type PayoutStatus = "pending" | "paid" | "failed";

export type Payout = {
  id: number;
  amount: string;
  status: PayoutStatus;
  upiReference: string | null;
  createdAt: string;
  paidAt: string | null;

  creatorId: number;
  creatorName: string;
  creatorEmail: string;
  creatorPhone: string | null;
  creatorUpiId: string | null;

  submissionId: number;
  reelUrl: string;
  currentViews: number;

  campaignId: number;
  trackName: string;
  artistName: string;
};

export type SettlementResult = {
  campaignId: number;
  submissions: number;
  paid: number;
};
