import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type {
  Campaign,
  EnrolledCampaign,
  CompletedCampaign,
  Submission,
} from "@/types";

// import {
//   mockCampaigns,
//   mockEnrolled,
//   mockCompleted,
// } from "./mockData";

import { getCampaigns } from "@/services/campaigns";
import { getMyEnrollments } from "@/services/enrollments";
import { getMySubmissions } from "@/services/submissions";

interface CampaignState {
  campaigns: Campaign[];
  enrolled: EnrolledCampaign[];
  completed: CompletedCampaign[];
  submissions: Submission[];

  loadCampaigns: () => Promise<void>;
  loadEnrollments: () => Promise<void>;

  enrollInCampaign: (campaignId: number) => void;

  submitReel: (
    campaignId: number,
    url: string,
    platform: "instagram" | "youtube"
  ) => void;

  getCampaignById: (id: number) => Campaign | undefined;

  getEnrolledByCampaignId: (
    id: number
  ) => EnrolledCampaign | undefined;

  loadSubmissions: () => Promise<void>;

  getSubmissionByCampaignId: (
    campaignId: number
  ) => Submission | undefined;
}

export const useCampaignStore = create<CampaignState>()(
  persist(
    (set, get) => ({
      campaigns: [],
      enrolled: [],
      completed: [],
      submissions: [],
      loadCampaigns: async () => {
        try {
          const campaigns = await getCampaigns();

          set({
            campaigns,
          });
        } catch (error) {
          console.error("Failed to load campaigns:", error);
        }
      },

      loadEnrollments: async () => {
        try {
          console.log("Loading enrollments...");

          const response = await getMyEnrollments();

          console.log("API RESPONSE:", response);

          const enrollments = response.map((item: any) => ({
            id: item.enrollment.id,
            campaignId: item.campaign.id,

            submittedUrl: "",

            platform: "instagram",

            submittedAt: item.enrollment.enrolledAt,

            verificationStatus:
              item.enrollment.status === "active"
                ? "pending"
                : "verified",

            currentViews: 0,

            milestonesHit: [],

            earned: 0,
          }));

          console.log("Mapped:", enrollments);

          set({
            enrolled: enrollments,
          });
          console.log(
            "STORE LENGTH:",
            useCampaignStore.getState().enrolled.length
          );

          console.log("Store Updated");
        } catch (err) {
          console.log("LOAD ENROLLMENTS ERROR");
          console.log(err);
        }
      },
      loadSubmissions: async () => {
        try {
          console.log("Loading submissions...");

          const response = await getMySubmissions();

          console.log("SUBMISSION API:", response);

          const submissions = response.map((item: any) => ({
            id: item.submission.id,
            enrollmentId: item.submission.enrollmentId,
            campaignId: item.campaign.id,
            reelUrl: item.submission.reelUrl,
            platform: item.submission.platform,
            submittedAt: item.submission.submittedAt,
            verificationStatus: item.submission.verificationStatus,
            currentViews: item.submission.currentViews,
          }));

          console.log("Mapped submissions:", submissions);

          set({
            submissions,
          });

          console.log(
            "Store submissions:",
            useCampaignStore.getState().submissions
          );
        } catch (err) {
          console.log("LOAD SUBMISSIONS ERROR");
          console.log(err);
        }
      },
      enrollInCampaign: (campaignId) =>
        set((state) => ({
          campaigns: state.campaigns.map((c) =>
            c.id === campaignId
              ? {
                ...c,
                spotsFilled: c.spotsFilled + 1,
              }
              : c
          ),

          enrolled: [
            ...state.enrolled,
            {
              id: -1, // Temporary ID until the backend provides a real one
              campaignId,

              submittedUrl: "",

              platform: "instagram",

              submittedAt: "",

              verificationStatus: "pending",

              currentViews: 0,

              milestonesHit: [],

              earned: 0,
            },
          ],
        })),

      submitReel: (campaignId, url, platform) =>
        set((state) => ({
          enrolled: state.enrolled.map((e) =>
            e.campaignId === campaignId
              ? {
                ...e,
                submittedUrl: url,
                platform,
                submittedAt: new Date().toISOString(),
                verificationStatus: "pending",
              }
              : e
          ),
        })),

      getCampaignById: (id) =>
        get().campaigns.find((c) => c.id === id),

      getEnrolledByCampaignId: (id) =>
        get().enrolled.find((e) => e.campaignId === id),

      getSubmissionByCampaignId: (campaignId) =>
        get().submissions.find(
          (s) => s.campaignId === campaignId
        ),
    }),
    {
      name: "doorbeen-campaigns-v2",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);