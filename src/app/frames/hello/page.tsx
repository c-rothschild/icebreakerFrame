import { Metadata } from "next";
import App from "~/app/app";

// Ensure this URL is correct and accessible
const appUrl = process.env.NEXT_PUBLIC_URL || "https://your-actual-deployed-url.com";

export const metadata: Metadata = {
  title: "Flappy Bird Game",
  description: "Play Flappy Bird on Farcaster",
  openGraph: {
    title: "Flappy Bird Game",
    description: "Play Flappy Bird on Farcaster",
    images: [{
      url: `${appUrl}/flappy_image.png`,
    }],
  },
  other: {
    // Properly format according to Farcaster Frame format
    "fc:frame": "vNext",
    "fc:frame:image": `${appUrl}/flappy_image.png`,
    "fc:frame:button:1": "Play Now!",
    "fc:frame:post_url": `${appUrl}/api/frame-action`
  },
};

export default function HelloFrame() {
  return <App title={"Flappy Bird"} />;
}
