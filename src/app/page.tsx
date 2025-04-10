import { Metadata } from "next";
import App from "./app";

const appUrl = process.env.NEXT_PUBLIC_URL;

const frame = {
  version: "next",
  imageUrl: `${appUrl}/flappy_image.png`,
  button: {
    title: "Play Now!",
    action: {
      type: "launch_frame",
      name: "Flappy Man",
      url: appUrl,
      splashImageUrl: `${appUrl}/flappy_icon.png`,
      splashBackgroundColor: "#f7f7f7",
    },
  },
};

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Icebreaker Frame",
    openGraph: {
      title: "Icebreaker Frame",
      description: "An icebreaker frame mini-app",
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default function Home() {
  return (<App />);
}
