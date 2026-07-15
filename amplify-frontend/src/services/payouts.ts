import { api } from "./api";

export async function getPayouts() {
  const response = await api.get("/me/payouts");

  return response.data.payouts.map((item: any) => ({
    id: String(item.payout.id),

    campaignId: String(item.campaign.id),

    trackName: item.campaign.trackName,

    amount: Number(item.payout.amount),

    status: item.payout.status,

    date:
      item.payout.paidAt ??
      item.payout.createdAt,

    milestone: 0,
  }));
}