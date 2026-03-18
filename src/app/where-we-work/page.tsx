import { HUBS } from "@/lib/hubs";
import { WhereWeWorkMapCards } from "@/components/WhereWeWorkMapCards";

export default function WhereWeWorkPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#ffffff" }}>
      <WhereWeWorkMapCards hubs={HUBS} />
    </div>
  );
}
