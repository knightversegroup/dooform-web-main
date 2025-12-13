import {
  generatePageMetadata,
  pageMetadataConfigs,
} from "@/lib/seo/metadata";

export const metadata = generatePageMetadata(pageMetadataConfigs.profile);

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
