import { api } from "./api";

export async function getCampaigns() {
  const response = await api.get("/campaigns");

  return response.data.campaigns.map((campaign: any) => ({
    id: campaign.id.toString(),

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

    // Frontend-only fields
    isTrending: false,
    isNew: false,
  }));
}

export async function getCampaign(id: string) {
  const response = await api.get(`/campaigns/${id}`);

  const campaign = response.data.campaign;

  return {
    id: campaign.id.toString(),

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
// services/campaigns.ts

export async function getCampaignById(id: string) {
  const response = await api.get(`/campaigns/${id}`);

  const campaign = response.data.campaign;

  return {
    id: campaign.id.toString(),
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