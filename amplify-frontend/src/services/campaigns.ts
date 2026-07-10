import { api } from "./api";


function mapCampaign(campaign: any) {
  return {
    id: campaign.id,

    trackName: campaign.trackName,
    artistName: campaign.artistName,

    albumArt: campaign.albumArt ?? "",
    previewUrl: campaign.previewUrl ?? "",

    spotifyTrackId: campaign.spotifyTrackId,

    genre: campaign.genre,
    language: campaign.language,

    pool: Number(campaign.rewardPool),

    spotsTotal: campaign.spotsTotal,
    spotsFilled: campaign.spotsFilled,

    endsAt: campaign.endsAt,

    milestones: campaign.milestones,

    status:
      campaign.status === "closed"
        ? "ended"
        : campaign.status,

    description: campaign.description,

    isTrending: false,
    isNew: false,
  };
}

export async function getCampaigns() {
  const response = await api.get("/campaigns");

  return response.data.campaigns.map(mapCampaign);
}

export async function getCampaign(id: number) {
  const response = await api.get(`/campaigns/${id}`);

  return mapCampaign(response.data.campaign);
}

// services/campaigns.ts

export async function getCampaignById(id: number) {
  const response = await api.get(`/campaigns/${id}`);

  return mapCampaign(response.data.campaign);
}


export async function searchCampaigns(query: string) {
  const response = await api.get(
    `/campaigns?search=${encodeURIComponent(query)}&limit=20`
  );

  return response.data.campaigns.map(mapCampaign);
}