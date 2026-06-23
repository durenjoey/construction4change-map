import { CardStage, getDemoProject } from "@/lib/cardPreview";
import { buildCardHero } from "@/lib/popupVariants";

export default function Page() {
  return (
    <CardStage
      title="Option C — Hero overlay"
      note="Full-bleed photo with a gradient, name + location + year over the image"
      html={buildCardHero(getDemoProject())}
    />
  );
}
