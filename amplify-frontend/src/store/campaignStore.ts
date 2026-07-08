import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type {
  Campaign,
  EnrolledCampaign,
  CompletedCampaign,
} from "@/types";

import {
  mockCampaigns,
  mockEnrolled,
  mockCompleted,
} from "./mockData";

import { getCampaigns } from "@/services/campaigns";

interface CampaignState {
  campaigns: Campaign[];
  enrolled: EnrolledCampaign[];
  completed: CompletedCampaign[];

  loadCampaigns: () => Promise<void>;

  enrollInCampaign: (campaignId: string) => void;

  submitReel: (
    campaignId: string,
    url: string,
    platform: "instagram" | "youtube"
  ) => void;

  getCampaignById: (id: string) => Campaign | undefined;

  getEnrolledByCampaignId: (
    id: string
  ) => EnrolledCampaign | undefined;
}

export const useCampaignStore = create<CampaignState>()(
  persist(
    (set, get) => ({
      campaigns: mockCampaigns,

      enrolled: mockEnrolled,

      completed: mockCompleted,

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
    }),
    {
      name: "doorbeen-campaigns-v2",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);