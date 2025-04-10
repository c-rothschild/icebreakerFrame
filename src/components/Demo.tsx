"use client";

import { useEffect, useState } from "react";
import sdk, { type Context } from "@farcaster/frame-sdk";
import FlappyBird from "./FlappyBird";

export default function Demo(
  { title }: { title?: string } = { title: "Flappy Bird Frame" }
) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();

  useEffect(() => {
    const load = async () => {
      const context = await sdk.context;
      setContext(context);

      console.log("Calling ready");
      sdk.actions.ready({});
    };

    if (sdk && !isSDKLoaded) {
      console.log("Loading SDK");
      setIsSDKLoaded(true);
      load();
      return () => {
        sdk.removeAllListeners();
      };
    }
  }, [isSDKLoaded]);

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div
      style={{
        paddingTop: context?.client.safeAreaInsets?.top ?? 0,
        paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
        paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
        paddingRight: context?.client.safeAreaInsets?.right ?? 0,
      }}
    >
      <div className="w-[300px] mx-auto py-2 px-2">
        <h1 className="text-2xl font-bold text-center mb-2">{title}</h1>
        
        {/* Flappy Bird Game */}
        <FlappyBird />
        
        {/* Optional: Display Frame Context Info */}
        <div className="mt-4 text-xs text-gray-500">
          {context?.user && (
            <div className="text-center">
              Playing as FID: {context.user.fid}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}