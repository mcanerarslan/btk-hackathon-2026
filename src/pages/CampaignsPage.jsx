import { useTrip } from "../TripContext";

export function CampaignsPage() {
  const { campaigns } = useTrip();
  const activeCampaigns = campaigns.filter((campaign) => campaign.status === "active");

  return (
    <section id="campaigns" className="section campaigns reveal">
      <div className="section-heading">
        <span className="eyebrow">Kampanyalar</span>
        <h2>Sezonluk fırsatlar ve AI önerileri.</h2>
      </div>
      <div className="promo-grid">
        {activeCampaigns.map((campaign) => (
          <article key={campaign.id} className="promo-card glass">
            <span>{campaign.title}</span>
            <strong>{campaign.headline}</strong>
            <p>{campaign.description}</p>
            <small>
              {campaign.code ? `${campaign.code} kodu` : campaign.audience}
              {campaign.discount ? ` · %${campaign.discount}` : ""}
            </small>
          </article>
        ))}
      </div>
    </section>
  );
}
