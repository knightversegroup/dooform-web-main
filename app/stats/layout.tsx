import {
  generatePageMetadata,
  pageMetadataConfigs,
} from "@/lib/seo/metadata";

export const metadata = generatePageMetadata(pageMetadataConfigs.stats);

export default function StatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
