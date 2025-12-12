import FormTemplateList from "@/app/components/Main/FormTemplateList";
import {
  generatePageMetadata,
  pageMetadataConfigs,
} from "@/lib/seo/metadata";
import { JsonLd, generateFormsPageSchema } from "@/lib/seo/structured-data";

export const metadata = generatePageMetadata(pageMetadataConfigs.forms);

export default function FormsPage() {
    return (
        <>
            <JsonLd data={generateFormsPageSchema()} />
            <main>
                <FormTemplateList />
            </main>
        </>
    );
}
