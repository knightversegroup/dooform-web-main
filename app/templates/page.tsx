import { generatePageMetadata, pageMetadataConfigs } from "@/lib/seo/metadata";
import { JsonLd, generateTemplatesPageSchema } from "@/lib/seo/structured-data";
import TemplateGroupList from "@/app/components/Main/TemplateGroupList";

export const metadata = generatePageMetadata(pageMetadataConfigs.templates);

export default function TemplatesPage() {
    return (
        <>
            <JsonLd data={generateTemplatesPageSchema()} />
            <TemplateGroupList />
        </>
    );
}
