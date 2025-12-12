"use client";

import { Check } from "lucide-react";
import { Button } from "../ui/Button";

interface PricingTier {
  name: string;
  description: string;
  price: string;
  priceNote?: string;
  features: string[];
  includesFrom?: string;
  isRecommended?: boolean;
  ctaText: string;
  ctaVariant?: "primary" | "secondary";
}

const pricingTiers: PricingTier[] = [
  {
    name: "Free",
    description: "For individuals getting started",
    price: "0",
    priceNote: "forever",
    features: [
      "Unlimited forms",
      "100 responses per month",
      "Basic templates",
      "Email support",
      "1 user",
    ],
    ctaText: "Get Started",
    ctaVariant: "secondary",
  },
  {
    name: "Pro",
    description: "Everything you need to get started",
    price: "590",
    priceNote: "per user / month",
    features: [
      "Unlimited responses",
      "Custom branding",
      "File uploads",
      "Priority email support",
      "Up to 5 users",
    ],
    includesFrom: "Free",
    ctaText: "Start Free Trial",
    ctaVariant: "secondary",
  },
  {
    name: "Premium",
    description: "Align multiple teams",
    price: "1990",
    priceNote: "per user / month",
    features: [
      "Advanced analytics",
      "Team collaboration",
      "API access",
      "Custom integrations",
      "Unlimited users",
      "24/7 support",
    ],
    includesFrom: "Standard",
    isRecommended: true,
    ctaText: "Start Free Trial",
    ctaVariant: "primary",
  },
  {
    name: "Enterprise",
    description: "Advanced security for enterprises",
    price: "ติดต่อเรา",
    features: [
      "SSO & SAML",
      "Dedicated account manager",
      "SLA guarantees",
      "Custom contracts",
      "On-premise deployment",
      "Audit logs",
    ],
    includesFrom: "Premium",
    ctaText: "Contact Sales",
    ctaVariant: "secondary",
  },
];

interface PricingPackageProps {
  background?: "default" | "alt";
}

export default function PricingPackage({
  background = "default",
}: PricingPackageProps) {
  const bgClass = background === "alt" ? "bg-surface-alt" : "bg-background";

  return (
    <section className={`${bgClass} font-sans`}>
      <div className="container-main section-padding">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-h2 text-text-default mb-4">เลือกแพ็คเกจใช้งาน</h2>
          <p className="text-body text-text-muted max-w-2xl mx-auto">
            เริ่มทดลองใช้งานได้ฟรี หากต้องการใช้งานมากขึ้น สามารถเลือกแพ็คเกจ
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-xl border ${
                tier.isRecommended
                  ? "border-primary border-2 shadow-lg"
                  : "border-border-default"
              } bg-background p-6 transition-all hover:shadow-md`}
            >
              {/* Recommended Badge */}
              {tier.isRecommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-white text-caption font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
                    Recommended
                  </span>
                </div>
              )}

              {/* Tier Header */}
              <div className="mb-6">
                <h3 className="text-h3 text-text-default mb-1">{tier.name}</h3>
                <p className="text-body-sm text-text-muted">
                  {tier.description}
                </p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-h1 text-text-default">
                    {tier.price}
                  </span>
                </div>
                {tier.priceNote && (
                  <p className="text-body-sm text-text-muted">
                    {tier.priceNote}
                  </p>
                )}
              </div>

              {/* CTA Button */}
              <div className="mb-6">
                <Button
                  variant={tier.ctaVariant}
                  className="w-full justify-center"
                  href="#"
                >
                  {tier.ctaText}
                </Button>
              </div>

              {/* Divider */}
              <div className="border-t border-border-default mb-6" />

              {/* Features */}
              <div className="flex-1">
                {tier.includesFrom && (
                  <p className="text-body-sm font-semibold text-text-default mb-4">
                    Everything from {tier.includesFrom} plus:
                  </p>
                )}
                {!tier.includesFrom && (
                  <p className="text-body-sm font-semibold text-text-default mb-4">
                    Includes:
                  </p>
                )}
                <ul className="space-y-3">
                  {tier.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-body-sm text-text-default"
                    >
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="text-center mt-10">
          <p className="text-body-sm text-text-muted">
            ราคาทั้งหมดเป็นราคา THB หากสนใจ{" "}
            <a href="#" className="text-primary hover:underline">
              สามสารถติดต่อได้ที่นี่
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
