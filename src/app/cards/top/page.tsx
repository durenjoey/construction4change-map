import { CardStage, getDemoProject } from "@/lib/cardPreview";
import { buildCardImageTop } from "@/lib/popupVariants";

export default function Page() {
  return (
    <CardStage
      title="Option A — Image on top"
      note="Photo banner across the top, then name, description, and 3 stat tiles"
      html={buildCardImageTop(getDemoProject())}
    />
  );
}
