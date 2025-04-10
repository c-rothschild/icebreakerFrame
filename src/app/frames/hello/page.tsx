import { Metadata } from "next";
import App from "~/app/app";

const appUrl = process.env.NEXT_PUBLIC_URL;

const frame = {
  version: "next",
  imageUrl: `${appUrl}/flappy_image.png`,
  button: {
    title: "Play Now!",
    action: {
      type: "launch_frame",
      name: "Flappy Man",
      url: `${appUrl}/frames/hello/`,
      splashImageUrl: `${appUrl}/flappy_icon.png`,
      splashBackgroundColor: "#f7f7f7",
    },
  },
};

export const metadata: Metadata = {
  title: "Hello, world!",
  description: "A simple hello world frame",
  openGraph: {
    title: "Hello, world!",
    description: "A simple hello world frame",
  },
  other: {
    "fc:frame": JSON.stringify(frame),
  },
};

export default function HelloFrame() {
  return <App title={"Hello, world!"} />;
}
