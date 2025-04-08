"use client";

import { useEffect, useCallback, useState, useMemo } from "react";
import { Input } from "../components/ui/input";
import { signIn, signOut, getCsrfToken } from "next-auth/react";
import sdk, {
  AddFrame,
  FrameNotificationDetails,
  SignIn as SignInCore,
  type Context,
} from "@farcaster/frame-sdk";
import {
  useAccount,
  useSendTransaction,
  useSignMessage,
  useSignTypedData,
  useWaitForTransactionReceipt,
  useDisconnect,
  useConnect,
  useSwitchChain,
  useChainId,
} from "wagmi";
import Provider from "~/components/providers/WagmiProvider";

import { config } from "~/components/providers/WagmiProvider";
import { Button } from "~/components/ui/Button";
import { truncateAddress } from "~/lib/truncateAddress";
import { base, degen, mainnet, optimism, unichain } from "wagmi/chains";
import { BaseError, UserRejectedRequestError } from "viem";
import { useSession } from "next-auth/react";
import { createStore } from "mipd";
import { Label } from "~/components/ui/label";
import { IcebreakerGraph } from '~/components/IcebreakerGraph';


export default function Demo(
  { title }: { title?: string } = { title: "Icebreaker Profile Viewer" }
) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const [added, setAdded] = useState(false);
  const [notificationDetails, setNotificationDetails] =
    useState<FrameNotificationDetails | null>(null);

  const [lastEvent, setLastEvent] = useState("");

  const [addFrameResult, setAddFrameResult] = useState("");
  const [sendNotificationResult, setSendNotificationResult] = useState("");

  useEffect(() => {
    setNotificationDetails(context?.client.notificationDetails ?? null);
  }, [context]);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const {
    sendTransaction,
    error: sendTxError,
    isError: isSendTxError,
    isPending: isSendTxPending,
  } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: txHash as `0x${string}`,
    });

  const {
    signTypedData,
    error: signTypedError,
    isError: isSignTypedError,
    isPending: isSignTypedPending,
  } = useSignTypedData();

  const { disconnect } = useDisconnect();
  const { connect } = useConnect();

  const {
    switchChain,
    error: switchChainError,
    isError: isSwitchChainError,
    isPending: isSwitchChainPending,
  } = useSwitchChain();

  const nextChain = useMemo(() => {
    if (chainId === base.id) {
      return optimism;
    } else if (chainId === optimism.id) {
      return degen;
    } else if (chainId === degen.id) {
      return mainnet;
    } else if (chainId === mainnet.id) {
      return unichain;
    } else {
      return base;
    }
  }, [chainId]);

  const handleSwitchChain = useCallback(() => {
    switchChain({ chainId: nextChain.id });
  }, [switchChain, nextChain.id]);

  useEffect(() => {
    const load = async () => {
      try{
        const context = await sdk.context;
        setContext(context);
        setAdded(context.client.added);
      } catch (error) {
        console.error("Error loading context:", error);
      }
      
      

      sdk.on("frameAdded", ({ notificationDetails }) => {
        setLastEvent(
          `frameAdded${!!notificationDetails ? ", notifications enabled" : ""}`
        );

        setAdded(true);
        if (notificationDetails) {
          setNotificationDetails(notificationDetails);
        }
      });

      sdk.on("frameAddRejected", ({ reason }) => {
        setLastEvent(`frameAddRejected, reason ${reason}`);
      });

      sdk.on("frameRemoved", () => {
        setLastEvent("frameRemoved");
        setAdded(false);
        setNotificationDetails(null);
      });

      sdk.on("notificationsEnabled", ({ notificationDetails }) => {
        setLastEvent("notificationsEnabled");
        setNotificationDetails(notificationDetails);
      });
      sdk.on("notificationsDisabled", () => {
        setLastEvent("notificationsDisabled");
        setNotificationDetails(null);
      });

      sdk.on("primaryButtonClicked", () => {
        console.log("primaryButtonClicked");
      });

      console.log("Calling ready");
      sdk.actions.ready({});

      // Set up a MIPD Store, and request Providers.
      const store = createStore();

      // Subscribe to the MIPD Store.
      store.subscribe((providerDetails) => {
        console.log("PROVIDER DETAILS", providerDetails);
        // => [EIP6963ProviderDetail, EIP6963ProviderDetail, ...]
      });
    };
    if (sdk && !isSDKLoaded) {
      console.log("Calling load");
      setIsSDKLoaded(true);
      load();
      return () => {
        sdk.removeAllListeners();
      };
    }
  }, [isSDKLoaded]);
  

  const close = useCallback(() => {
    sdk.actions.close();
  }, []);

  
  

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
        <h1 className="text-2xl font-bold text-center mb-4">{title}</h1>

        <div>
          <h2 className="font-2xl font-bold">Enter Farcaster Name:</h2>

          <div className="mb-4">
            <ViewIcebreaker />
          </div>
        </div>
      </div>

      <div className="w-[300px] mx-auto py-2 px-2">
        <div>
          <div className="mb-4">
            <Button onClick={close}>Close Frame</Button>
          </div>
        </div>
      </div>
    </div>

    
  );
}

interface Channel {
  type: string;
  isVerified: boolean;
  isLocked: boolean;
  value: string;
  url: string;
  metadata?: Array<{name: string, value: string}>;
}

interface Credential {
  name: string;
  chain?: string;
  source?: string;
  reference?: string;
}

interface Event {
  id: string;
  source: string;
  name: string;
  description: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  city?: string;
  country?: string;
  year: string;
}

interface IcebreakerProfile {
  profileID: string;
  walletAddress: string;
  avatarUrl: string;
  displayName: string;
  bio: string;
  jobTitle?: string;
  primarySkill?: string;
  networkingStatus?: string;
  location?: string;
  channels: Channel[];
  credentials: Credential[];
  events: Event[];
  highlights?: any[];
  workExperience?: any[];
  guilds?: any[];
}

interface IcebreakerData {
  profiles: IcebreakerProfile[];
}

// Helper function to extract the direct image URL from a Cloudinary URL
const extractDirectImageUrl = (cloudinaryUrl: string) => {
  try {
    // Check if it's a cloudinary URL with the format we expect
    if (cloudinaryUrl.includes('cloudinary.com/merkle-manufactory/image/fetch')) {
      // Extract the original image URL after the last slash
      const matches = cloudinaryUrl.match(/\/https?:\/\/(.+)$/);
      if (matches && matches[0]) {
        // Return the actual image URL (remove the leading slash)
        return matches[0].substring(1);
      }
    }
    return cloudinaryUrl;
  } catch (error) { 
    // If not a cloudinary URL or no match, return the original
    console.error('Error extracting image URL:', error);
    return cloudinaryUrl;
  }
};

async function fetchIcebreakerData(api: string) {
  try {
    const response = await fetch(`/api/icebreaker/${api}`);
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching icebreaker data:", error);
    throw error;
  }
}

function ViewIcebreaker() {
  const [fname, setFname] = useState("web3pm");
  const [iceData, setIceData] = useState<IcebreakerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Add state for connections
  const [connections, setConnections] = useState<IcebreakerProfile[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  
  // Add state to track the selected credential name
  const [selectedCredentialName, setSelectedCredentialName] = useState<string>("");

  const icebreaker = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchIcebreakerData('fname/' + fname);
      console.log("Raw Icebreaker data:", data);
      setIceData(data);
      
      // Initialize with empty connections
      setConnections([]);
      // Reset credential name when loading a new profile
      setSelectedCredentialName("");
      
    } catch (error) {
      console.error("Error fetching icebreaker data:", error);
      setError("Failed to fetch data");
      setConnections([]);
      setSelectedCredentialName("");
    } finally {
      setLoading(false);
    }
  }, [fname]);

  useEffect(() => {
    // Trigger the icebreaker function when the component mounts
    icebreaker();
    // Only run this effect once on mount
  }, [icebreaker]);

  // Handler for when a credential network is fetched
  const handleCredentialNetworkFetched = useCallback((
    newConnections: IcebreakerProfile[], 
    credentialName: string
  ) => {
    setConnections(newConnections);
    setSelectedCredentialName(credentialName);
  }, []);
  
  const profile = iceData?.profiles?.[0];

  // Transform profile for the graph component
  const graphProfile = useMemo(() => {
    if (!profile) return null;
    
    return {
      profileID: profile.profileID,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl ? extractDirectImageUrl(profile.avatarUrl) : undefined,
      bio: profile.bio,
      type: 'main' as const,
    };
  }, [profile]);

  // Transform connections for the graph component
  const graphConnections = useMemo(() => {
    if (!connections.length) return [];
    
    return connections.map(conn => ({
      profileID: conn.profileID,
      displayName: conn.displayName,
      avatarUrl: conn.avatarUrl ? extractDirectImageUrl(conn.avatarUrl) : undefined,
      bio: conn.bio,
      type: 'connection' as const,
    }));
  }, [connections]);

  return (
    <>
      <div>
        <Input 
          id="view-icebreaker-profile"
          type="string"
          value={fname}
          className="mb-2"
          onChange={(e) => {
            setFname(e.target.value);
          }}
        />
      </div>
      <Button
        onClick={icebreaker}
        disabled={loading}
      >
        {loading ? "Loading..." : "View Icebreaker Profile"}
      </Button>
      
      {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
      
      {iceData && profile && (
        <>
          <div className="my-2 p-2 text-xs overflow-x-scroll bg-gray-100 rounded-lg font-mono">
            <div className="font-semibold text-gray-500 mb-1">Icebreaker Data</div>
            <div className="whitespace-pre-wrap text-gray-700">
              {/* Profile information sections remain unchanged */}
              {profile.displayName && (
                <div className="mb-1">
                  <span className="font-bold">Name:</span> {profile.displayName}
                </div>
              )}
              
              {/* Find Farcaster username from channels */}
              {profile.channels && profile.channels.find(c => c.type === "farcaster") && (
                <div className="mb-1">
                  <span className="font-bold">Farcaster:</span> @{profile.channels.find(c => c.type === "farcaster")?.value}
                </div>
              )}
              
              {/* Find FID from Farcaster channel metadata */}
              {profile.channels && profile.channels.find(c => c.type === "farcaster")?.metadata?.find(m => m.name === "fid") && (
                <div className="mb-1">
                  <span className="font-bold">FID:</span> {profile.channels.find(c => c.type === "farcaster")?.metadata?.find(m => m.name === "fid")?.value}
                </div>
              )}
              
              {profile.avatarUrl && (
                <div className="mb-1">
                  <span className="font-bold">Profile Image:</span> 
                  <img 
                    src={extractDirectImageUrl(profile.avatarUrl)}
                    alt={`${profile.displayName || 'User'}'s profile`}
                    className="mt-1 rounded-full w-12 h-12 object-cover" 
                    onError={(e) => {
                      // Fallback to a generic avatar if the image fails to load
                      const target = e.target as HTMLImageElement;
                      target.onerror = null; // Prevent infinite loop
                      target.src = "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png";
                    }}
                  />
                </div>
              )}
              
              {profile.bio && (
                <div className="mb-1">
                  <span className="font-bold">Bio:</span> {profile.bio}
                </div>
              )}
              
              {profile.jobTitle && (
                <div className="mb-1">
                  <span className="font-bold">Job:</span> {profile.jobTitle}
                </div>
              )}
              
              {profile.primarySkill && (
                <div className="mb-1">
                  <span className="font-bold">Skill:</span> {profile.primarySkill}
                </div>
              )}
              
              {/* Add credential section with count */}
              {profile.credentials && profile.credentials.length > 0 && (
                <div className="mb-1">
                  <span className="font-bold">Credentials:</span> {profile.credentials.length}
                </div>
              )}
              

              {/* Raw data section */}
              <div className="mt-2 pt-2 border-t border-gray-300">
                <details>
                  <summary className="cursor-pointer text-gray-500 hover:text-gray-700">View raw data</summary>
                  <div className="mt-2 whitespace-pre text-gray-500">
                    {JSON.stringify(iceData.profiles[0], null, 2)}
                  </div>
                </details>
              </div>

              {/* Credential Network Selector Section */}
              <CredentialNetworkSelector 
                profile={profile} 
                onNetworkFetched={handleCredentialNetworkFetched} 
              />
              
            </div>
          </div>
          
          {/* Add the social graph component with properly transformed data */}
          {!connectionsLoading && connections.length > 0 && graphProfile && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold mb-2">
                {selectedCredentialName ? 
                  `Network of Profiles Sharing the Credential "${selectedCredentialName}"` : 
                  "Credential Network"
                }
              </h3>
              <IcebreakerGraph profile={graphProfile} connections={graphConnections} />
            </div>
          )}

          {/* Add a message when credentials are fetched but no connections found */}
          {!connectionsLoading && connections.length === 0 && selectedCredentialName && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold mb-2">
                Network of Profiles Sharing the Credential "{selectedCredentialName}"
              </h3>
              <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-500 border border-gray-200">
                No connections found for this credential
              </div>
            </div>
          )}
          
          {connectionsLoading && (
            <div className="mt-4 text-xs text-gray-500">Loading network connections...</div>
          )}
        </>
      )}
    </>
  );
}

function CredentialNetworkSelector({ 
  profile, 
  onNetworkFetched 
}: { 
  profile: IcebreakerProfile, 
  onNetworkFetched: (connections: IcebreakerProfile[], credentialName: string) => void
}) {
  const [selectedCredential, setSelectedCredential] = useState<string>('');
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');

  // Get unique credentials by name to avoid duplicates
  const uniqueCredentials = useMemo(() => {
    if (!profile || !profile.credentials) return [];
    
    // Create a map to store unique credentials
    const credentialMap = new Map();
    
    // Add each credential to the map with the name as the key
    profile.credentials.forEach(credential => {
      if (!credentialMap.has(credential.name)) {
        credentialMap.set(credential.name, credential);
      }
    });
    
    // Convert the map values back to an array
    return Array.from(credentialMap.values());
  }, [profile]);

  // Auto-select (but don't fetch) the first credential when the component mounts
  useEffect(() => {
    if (uniqueCredentials.length > 0 && !selectedCredential) {
      // Get the first credential in the list
      const firstCredential = uniqueCredentials[0];
      
      // Set it as the selected credential (but don't fetch automatically)
      setSelectedCredential(firstCredential.name);
    }
  }, [uniqueCredentials, selectedCredential]);

  const handleCredentialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCredential(e.target.value);
    setFetchError('');
  };

  const fetchCredentialNetwork = async () => {
    if (!selectedCredential) {
      setFetchError('Please select a credential first');
      return;
    }

    setIsFetching(true);
    setFetchError('');

    try {
      const connectionsData = await fetchIcebreakerData('credentials/' + selectedCredential);
      if (connectionsData && connectionsData.profiles) {
        // Pass both the connections and the credential name
        onNetworkFetched(connectionsData.profiles, selectedCredential);
      } else {
        setFetchError('No connections found for this credential');
      }
    } catch (error) {
      setFetchError('Error fetching credential network');
      console.error('Error fetching credential network:', error);
    } finally {
      setIsFetching(false);
    }
  };

  if (!profile || uniqueCredentials.length === 0) {
    return (
      <div className="mt-3 bg-gray-100 p-3 rounded-md text-sm">
        No credentials available for this profile.
      </div>
    );
  }

  return (
    <div className="mt-3 p-3 rounded-md border border-gray-200">
      <h3 className="text-sm font-semibold mb-2">Credential Networks</h3>
      <div className="mb-2">
        <select
          className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white"
          value={selectedCredential}
          onChange={handleCredentialChange}
          disabled={isFetching}
        >
          <option value="">-- Select a credential --</option>
          {uniqueCredentials.map((credential, index) => (
            <option key={index} value={credential.name}>
              {credential.name} {credential.chain ? `(${credential.chain})` : ''}
            </option>
          ))}
        </select>
      </div>
      
      <Button
        onClick={fetchCredentialNetwork}
        disabled={!selectedCredential || isFetching}
        className="w-full"
      >
        {isFetching ? 'Loading...' : 'Get Credential Network'}
      </Button>
      
      {fetchError && (
        <div className="mt-2 text-red-500 text-xs">{fetchError}</div>
      )}
    </div>
  );
}

const renderError = (error: Error | null) => {
  if (!error) return null;
  if (error instanceof BaseError) {
    const isUserRejection = error.walk(
      (e) => e instanceof UserRejectedRequestError
    );

    if (isUserRejection) {
      return <div className="text-red-500 text-xs mt-1">Rejected by user.</div>;
    }
  }

  return <div className="text-red-500 text-xs mt-1">{error.message}</div>;
};
