import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  generatePageMetadata,
  pageMetadataConfigs,
} from "@/lib/seo/metadata";
import { JsonLd, generateDocumentsPageSchema } from "@/lib/seo/structured-data";

export const metadata = generatePageMetadata(pageMetadataConfigs.documents);

export default function DocumentsPage() {
    return (
        <>
            <JsonLd data={generateDocumentsPageSchema()} />
            {/* Page Title */}
            <h1 className="text-h1 text-foreground mb-6">
                Getting Started
            </h1>

            {/* Introduction */}
            <p className="text-body-lg text-text-default mb-8">
                Dooform is an online form building platform that helps you create, manage,
                and analyze forms easily. Whether it is a survey, questionnaire, or registration form.
            </p>

            {/* Section: Best Practices */}
            <h2 id="best-practices" className="text-h2 text-foreground mt-12 mb-4">
                <a href="#best-practices" className="hover:text-primary">
                    Best Practices
                </a>
            </h2>

            <h3 id="keep-it-simple" className="text-h3 text-foreground mt-8 mb-3">
                <a href="#keep-it-simple" className="hover:text-primary">
                    Keep it Simple
                </a>
            </h3>
            <p className="text-body text-text-default mb-4">
                <strong>Dooform is designed to make form creation easy and fast.</strong>{" "}
                Avoid unnecessary complexity to give respondents the best experience.
            </p>

            <h3 id="be-inclusive" className="text-h3 text-foreground mt-8 mb-3">
                <a href="#be-inclusive" className="hover:text-primary">
                    Be Inclusive
                </a>
            </h3>
            <p className="text-body text-text-default mb-4">
                <strong>Dooform aims to be accessible to everyone.</strong>{" "}
                No matter what device or situation, our forms are designed to be easily accessible and{" "}
                <strong>WCAG compliant.</strong>
            </p>

            <h3 id="stay-professional" className="text-h3 text-foreground mt-8 mb-3">
                <a href="#stay-professional" className="hover:text-primary">
                    Stay Professional
                </a>
            </h3>
            <p className="text-body text-text-default mb-4">
                Professional-looking forms help build trust.{" "}
                <strong>
                    Dooform has well-designed templates and themes
                </strong>{" "}
                to make your forms look beautiful and appropriate for any organization.
            </p>

            <h3 id="in-practice" className="text-h3 text-foreground mt-8 mb-3">
                <a href="#in-practice" className="hover:text-primary">
                    In Practice
                </a>
            </h3>
            <ol className="list-decimal list-inside text-body text-text-default space-y-3 mb-8">
                <li>
                    Start by clearly defining the purpose of your form.
                </li>
                <li>
                    Choose question types appropriate for the data you need. See details at{" "}
                    <Link href="/documents/question-types" className="text-primary hover:underline">
                        Question Types
                    </Link>
                </li>
                <li>
                    Group related questions together.
                </li>
                <li>
                    Use validation to ensure accurate data.
                </li>
                <li>
                    Test your form before publishing.
                </li>
                <li>
                    If you need to integrate with other systems, you can use{" "}
                    <Link href="/documents/api-integration" className="text-primary hover:underline">
                        API
                    </Link>{" "}
                    or{" "}
                    <Link href="/documents/webhooks" className="text-primary hover:underline">
                        Webhooks
                    </Link>
                </li>
            </ol>

            {/* Section: Fundamentals */}
            <h2 id="fundamentals" className="text-h2 text-foreground mt-12 mb-4">
                <a href="#fundamentals" className="hover:text-primary">
                    Fundamentals
                </a>
            </h2>
            <p className="text-body text-text-default mb-6">
                Dooform is not limited to just creating forms.
                It also has tools and principles to help you manage data efficiently.
            </p>

            <h3 id="form-types" className="text-h3 text-foreground mt-8 mb-3">
                <a href="#form-types" className="hover:text-primary">
                    Form Types
                </a>
            </h3>
            <p className="text-body text-text-default mb-4">
                Dooform supports various types of forms including:
            </p>
            <ul className="list-disc list-inside text-body text-text-default space-y-2 mb-6">
                <li>Survey</li>
                <li>Questionnaire</li>
                <li>Registration Form</li>
                <li>Contact Form</li>
                <li>Quiz</li>
                <li>Order Form</li>
            </ul>

            <h3 id="question-types-overview" className="text-h3 text-foreground mt-8 mb-3">
                <a href="#question-types-overview" className="hover:text-primary">
                    Question Types
                </a>
            </h3>
            <p className="text-body text-text-default mb-4">
                Choose appropriate question types to get the data you need.
                All details are in the{" "}
                <Link href="/documents/question-types" className="text-primary hover:underline">
                    Question Types page
                </Link>
            </p>

            <h3 id="data-validation" className="text-h3 text-foreground mt-8 mb-3">
                <a href="#data-validation" className="hover:text-primary">
                    Data Validation
                </a>
            </h3>
            <p className="text-body text-text-default mb-4">
                <strong>Data validation helps you receive accurate and complete data.</strong>{" "}
                Dooform supports various validation formats such as email, phone number,
                date format, and more.
            </p>

            <h3 id="analytics-overview" className="text-h3 text-foreground mt-8 mb-3">
                <a href="#analytics-overview" className="hover:text-primary">
                    Analytics
                </a>
            </h3>
            <p className="text-body text-text-default mb-4">
                Dooform has built-in analytics tools
                to help you understand results quickly.
                More details are in the{" "}
                <Link href="/documents/analytics" className="text-primary hover:underline">
                    Analytics page
                </Link>
            </p>

            {/* Feedback Box */}
            <div className="mt-12 p-6 bg-surface-alt rounded-xl">
                <h4 className="text-h4 text-foreground mb-2">
                    Suggest Improvement
                </h4>
                <p className="text-body-sm text-text-muted mb-4">
                    Help us improve this documentation by sending feedback, questions,
                    or suggestions on GitHub.
                </p>
                <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-body-sm text-primary hover:underline"
                >
                    Go to GitHub
                    <ExternalLink className="w-4 h-4" />
                </a>
            </div>
        </>
    );
}
