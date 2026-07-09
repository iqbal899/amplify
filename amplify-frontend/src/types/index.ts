export interface Milestone {
  views: number;
  minDaysLive: number;
  incrementalPayout: number;
  cumulativePayout: number;
}

export interface Campaign {
  id: number;
  trackName: string;
  artistName: string;
  albumArt: string;
  previewUrl: string;
  spotifyTrackId: string;
  genre: string;
  language: string;
  pool: number;
  spotsTotal: number;
  spotsFilled: number;
  endsAt: string;
  milestones: Milestone[];
  status: 'open' | 'full' | 'ended';
  isTrending: boolean;
  isNew: boolean;
  description: string;
}

export interface MilestoneHit {
  views: number;
  earnedAmount: number;
}

export interface EnrolledCampaign {
  id: number;              // enrollment id
  campaignId: number;

  submittedUrl: string;
  platform: "instagram" | "youtube";
  submittedAt: string;
  verificationStatus: "pending" | "verified" | "rejected";
  rejectionReason?: string;
  currentViews: number;
  milestonesHit: MilestoneHit[];
  earned: number;
}

export interface CompletedCampaign {
  campaignId: number;
  trackName: string;
  artistName: string;
  albumArt: string;
  genre: string;
  platform: 'instagram' | 'youtube';
  submittedUrl: string;
  verificationStatus: 'verified' | 'rejected';
  finalViews: number;
  totalEarned: number;
  completedAt: string;
  allMilestonesHit: boolean;
}

export interface Submission {
  id: number;

  enrollmentId: number;

  campaignId: number;

  reelUrl: string;

  platform: "instagram" | "youtube";

  submittedAt: string;

  verificationStatus:
  | "pending"
  | "verified"
  | "rejected";

  currentViews: number;
}

export interface Transaction {
  id: string;
  campaignId: number;
  trackName: string;
  milestone: number;
  amount: number;
  status: 'paid' | 'pending' | 'rejected';
  date: string;
  upiRef?: string;
}

export interface MonthlyEarning {
  month: string;
  year: number;
  amount: number;
  campaigns: number;
}

export interface Track {
  id: number;
  trackName: string;
  artistName: string;
  albumArt: string;
  previewUrl: string;
  spotifyTrackId: string;
}

export interface AchievementBadge {
  id: number;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  progressHint?: string;
}

export interface UserProfile {
  name: string;
  phone: string;
  upiId: string;
  avatarUrl: string;
  instagramHandle?: string;
  isKYCComplete: boolean;
  isVerified: boolean;
}
