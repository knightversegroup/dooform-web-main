import Banner from "./components/Main/Banner";
import Features from "./components/Main/Features";
import FAQ from "./components/Main/FAQ";
import Community from "./components/Main/Community";
import Register from "./components/Auth/Register";

// Define section order and backgrounds: "default" = white, "alt" = gray
const sections = [
  { Component: Banner, bg: "alt" },
  { Component: Features, bg: "default" },
  { Component: Community, bg: "alt" },
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
