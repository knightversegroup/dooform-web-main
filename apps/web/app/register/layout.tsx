import {
  generatePageMetadata,
  pageMetadataConfigs,
} from "@/lib/seo/metadata";

export const metadata = generatePageMetadata(pageMetadataConfigs.register);

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
