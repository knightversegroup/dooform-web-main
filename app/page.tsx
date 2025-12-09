import HeroBanner from "./components/Main/HeroBanner";
import TrustedBy from "./components/Main/TrustedBy";
import Banner from "./components/Main/Banner";
import Features from "./components/Main/Features";
import UseCase from "./components/Main/UseCase";
import BusinessSolutions from "./components/Main/BusinessSolutions";
import APIStats from "./components/Main/APIStats";
import LatestNews from "./components/Main/LatestNews";
import PricingPackage from "./components/Main/PricingPackage";
import FAQ from "./components/Main/FAQ";
import Community from "./components/Main/Community";
import Register from "./components/Auth/Register";

// Define section order and backgrounds: "default" = white, "alt" = gray
const sections = [
  { Component: HeroBanner, bg: "default" },
  { Component: Banner, bg: "alt" },
  // { Component: TrustedBy, bg: "default" },
  { Component: Features, bg: "default" },
  // { Component: UseCase, bg: "default" },
  { Component: BusinessSolutions, bg: "alt" },
  { Component: APIStats, bg: "default" },
  { Component: Community, bg: "alt" },
  { Component: LatestNews, bg: "default" },
  { Component: PricingPackage, bg: "alt" },
  { Component: FAQ, bg: "default" },
  { Component: Register, bg: "alt" },
] as const;

export default function Home() {
  return (
    <>
      {sections.map(({ Component, bg }, index) => (
        <Component key={index} background={bg} />
      ))}
    </>
  );
}
