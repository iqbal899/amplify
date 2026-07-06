import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Campaign, EnrolledCampaign, CompletedCampaign } from '@/types';
import { mockCampaigns, mockEnrolled, mockCompleted } from './mockData';

interface CampaignState {
  campaigns: Campaign[];
  enrolled: EnrolledCampaign[];
  completed: CompletedCampaign[];
  enrollInCampaign: (campaignId: string) => void;
  submitReel: (campaignId: string, url: string, platform: 'instagram' | 'youtube') => void;
  getCampaignById: (id: string) => Campaign | undefined;
  getEnrolledByCampaignId: (id: string) => EnrolledCampaign | undefined;
}

export const useCampaignStore = create<CampaignState>()(
  persist(
    (set, get) => ({
      campaigns: mockCampaigns,
      enrolled: mockEnrolled,
      completed: mockCompleted,
      enrollInCampaign: (campaignId) =>
        set((state) => ({
          campaigns: state.campaigns.map((c) =>
            c.id === campaignId ? { ...c, spotsFilled: c.spotsFilled + 1 } : c
          ),
          enrolled: [
            ...state.enrolled,
            {
              campaignId,
              submittedUrl: '',
              platform: 'instagram' as const,
              submittedAt: '',
              verificationStatus: 'pending' as const,
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
              ? { ...e, submittedUrl: url, platform, submittedAt: new Date().toISOString(), verificationStatus: 'pending' as const }
              : e
          ),
        })),
      getCampaignById: (id) => get().campaigns.find((c) => c.id === id),
      getEnrolledByCampaignId: (id) => get().enrolled.find((e) => e.campaignId === id),
    }),
    {
      name: 'doorbeen-campaigns',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
