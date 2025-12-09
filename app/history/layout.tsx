import {
  generatePageMetadata,
  pageMetadataConfigs,
} from "@/lib/seo/metadata";

export const metadata = generatePageMetadata(pageMetadataConfigs.history);

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
