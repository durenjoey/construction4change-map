import { CardStage, getDemoProject } from "@/lib/cardPreview";
import { buildCardInset } from "@/lib/popupVariants";

export default function Page() {
  return (
    <CardStage
      title="Option D — Image embedded in the side"
      note="Photo contained within the card, beside the 3 items (softer than full-bleed)"
      html={buildCardInset(getDemoProject())}
    />
  );
}
