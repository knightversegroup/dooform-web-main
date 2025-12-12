import {
  generatePageMetadata,
  pageMetadataConfigs,
} from "@/lib/seo/metadata";

export const metadata = generatePageMetadata(pageMetadataConfigs.login);

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
