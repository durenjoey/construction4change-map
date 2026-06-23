import { CardStage, getDemoProject } from "@/lib/cardPreview";
import { buildCardImageRight } from "@/lib/popupVariants";

export default function Page() {
  return (
    <CardStage
      title="Option B — Image on the right"
      note="Name + description + 3 stacked items on the left, photo fills the right edge"
      html={buildCardImageRight(getDemoProject())}
    />
  );
}
