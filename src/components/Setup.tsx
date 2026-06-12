import { DotmHex1 } from "@/components/ui/dotm-hex-1";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import useStore from "@/store";
import executeAnyCommand from "@/tools/shell";
import type { ModelsListResponse } from "@/types/models";
import { fetch } from "@tauri-apps/plugin-http";
import { EditIcon, XIcon } from "lucide-react";
import { motion, useAnimate } from "motion/react";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { ButtonGroup } from "./ui/button-group";

// ----------------------------------------------------------------------
// Constants & helper functions
// ----------------------------------------------------------------------

const PROVIDER_INFOS = {
  ollama: {
    name: "Ollama",
    port: 11434,
    command: "ollama --version",
    baseUrl: "http://localhost:11434/v1",
  },
  lms: {
    name: "LM Studio",
    port: 1234,
    command: "lms --version",
    baseUrl: "http://localhost:1234/v1",
  },
  custom: {
    name: "Custom",
    command: "echo OK",
  },
} as const;

type LocalProvider = keyof typeof PROVIDER_INFOS;
type ProviderType = "local" | "api";

interface ConnectionParams {
  type: ProviderType;
  provider?: LocalProvider;
  customUrl?: string;
  baseUrl?: string;
  apiKey?: string;
}

async function fetchModelsFromLocal(
  provider: LocalProvider,
  customUrl?: string,
): Promise<ModelsListResponse> {
  const info = PROVIDER_INFOS[provider];
  let url: string | undefined;
  if (provider === "custom") {
    if (!customUrl)
      throw new Error("Custom URL is required for custom provider");
    url = customUrl;
  } else {
    // info is one of the known providers that include baseUrl
    url = `${(info as { baseUrl: string }).baseUrl}/models`;
  }

  // Verify that the server is reachable
  const output = await executeAnyCommand(info.command);
  console.log(output);

  const response = await fetch(url);
  return response.json();
}

async function fetchModelsFromApi(
  baseUrl: string | undefined,
  apiKey: string,
): Promise<ModelsListResponse> {
  console.log(baseUrl);

  const response = await fetch(
    `${baseUrl || "https://api.openai.com/v1"}/models`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    },
  );
  console.log(response);

  if (!response.ok) throw new Error("Network response was not ok");
  return response.json();
}

async function connectToProvider(
  params: ConnectionParams,
): Promise<ModelsListResponse> {
  if (params.type === "local") {
    if (!params.provider) throw new Error("No provider selected");
    if (params.provider === "custom" && !params.customUrl) {
      throw new Error("Please enter a valid URL.");
    }
    return fetchModelsFromLocal(params.provider, params.customUrl);
  }

  // API
  const { baseUrl, apiKey } = params;
  if (!apiKey) {
    throw new Error("Please enter API Key.");
  }
  return fetchModelsFromApi(baseUrl, apiKey);
}

// ----------------------------------------------------------------------
// Smaller components
// ----------------------------------------------------------------------

// Reusable motion primitives
const MotionButton = motion.create(Button);
const MotionInput = motion.create(Input);

function AnimatedTitle() {
  return (
    <>
      <div className="overflow-clip">
        <motion.h1
          className="text-shadow-lg text-shadow-zinc-900 font-tourner text-zinc-50 text-6xl"
          initial={{ translateY: 100, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.3, ease: "easeInOut" }}
        >
          Agent 9
        </motion.h1>
      </div>
      <motion.span
        className="inline-block w-full"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        style={{ originX: 0 }}
        transition={{ delay: 1.2, ease: "easeInOut", duration: 0.3 }}
      >
        <Separator className="opacity-30 rounded-full" />
      </motion.span>
    </>
  );
}

interface ConnectionPanelProps {
  provider: ProviderType;
  setProvider: (p: ProviderType) => void;
  selectedProvider: string | undefined;
  setSelectedProvider: (p: string | undefined) => void;
  isCustom: boolean;
  setIsCustom: (b: boolean) => void;
  customUrlRef: React.RefObject<HTMLInputElement | null>;
  baseUrlRef: React.RefObject<HTMLInputElement | null>;
  apiKeyRef: React.RefObject<HTMLInputElement | null>;
  isPending: boolean;
  onConnect: () => void;
}

function ConnectionPanel({
  provider,
  setProvider,
  selectedProvider,
  setSelectedProvider,
  isCustom,
  setIsCustom,
  customUrlRef,
  baseUrlRef,
  apiKeyRef,
  isPending,
  onConnect,
}: ConnectionPanelProps) {
  const [editBaseUrl, setEditBaseUrl] = useState(false);

  return (
    <motion.div
      className="absolute flex flex-col justify-around items-center gap-3 mt-15 p-6 w-full"
      animate={{
        translateX: 0, // will be overridden by parent if needed
        opacity: 1,
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Provider toggle */}
      <div className="flex justify-between gap-1 w-full">
        <MotionButton
          className={`bg-zinc-900/70 text-shadow-md ${provider === "local"
              ? "text-shadow-emerald-600 text-emerald-300"
              : "text-zinc-300/30"
            } border-0 w-[49%] cursor-pointer transition-colors duration-300`}
          onClick={() => {
            setProvider("local");
            setSelectedProvider("");
          }}
          initial={{ translateX: -300, opacity: 0 }}
          animate={{ translateX: 0, opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.3, ease: "easeInOut" }}
        >
          Local
        </MotionButton>
        <MotionButton
          className={`bg-zinc-900/70 text-shadow-md ${provider === "api"
              ? "text-shadow-emerald-600 text-emerald-300"
              : "text-zinc-300/30"
            } border-0 w-[49%] cursor-pointer transition-colors duration-300`}
          onClick={() => {
            setProvider("api");
            apiKeyRef.current?.focus();
          }}
          initial={{ translateX: -300, opacity: 0 }}
          animate={{ translateX: 0, opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.3, ease: "easeInOut" }}
        >
          API
        </MotionButton>
      </div>

      <div className="relative flex justify-center items-center gap-3 w-full h-20">
        {/* Local provider form */}
        <motion.div
          className="absolute flex flex-col justify-between w-full"
          animate={{
            translateX: provider === "local" ? 0 : "-100%",
            opacity: provider === "local" ? 1 : 0,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <motion.div
            initial={{ translateY: 300, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            transition={{ delay: 1.9, duration: 0.3, ease: "easeInOut" }}
            className="w-full"
          >
            <Select
              value={selectedProvider}
              onValueChange={(value) => {
                setSelectedProvider(value);
                setIsCustom(value === "custom");
                if (value === "custom") {
                  setTimeout(() => customUrlRef.current?.focus(), 0);
                }
              }}
            >
              <SelectTrigger className="bg-zinc-900/70 border-0 w-full text-zinc-100 cursor-pointer">
                <SelectValue placeholder="Select your provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="ollama">Ollama</SelectItem>
                  <SelectItem value="lms">LM Studio</SelectItem>
                  <SelectItem value="custom">Custom URL</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <MotionInput
              ref={customUrlRef}
              className="bg-zinc-900/70 mt-3 border-0 w-full text-zinc-100"
              placeholder="localhost:<port>/v1"
              value={
                selectedProvider === "ollama"
                  ? PROVIDER_INFOS.ollama.baseUrl
                  : selectedProvider === "lms"
                    ? PROVIDER_INFOS.lms.baseUrl
                    : ""
              }
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              disabled={!isCustom}
            />
          </motion.div>
        </motion.div>

        {/* API provider form */}
        <motion.div
          className="absolute flex flex-col justify-around items-center gap-1 w-full"
          animate={{
            translateX: provider === "api" ? 0 : "100%",
            opacity: provider === "api" ? 1 : 0,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <ButtonGroup className="w-full">
            <Input
              ref={baseUrlRef}
              placeholder="https://api.openai.com/v1"
              className="bg-zinc-900/70 border-0 w-full text-zinc-100"
              disabled={!editBaseUrl}
            />
            {editBaseUrl ? (
              <Button
                variant="outline"
                aria-label="Disable base URL"
                className="bg-zinc-900/70 ml-0 border-0 border-white rounded-none text-zinc-100 cursor-pointer"
                onClick={() => {
                  setEditBaseUrl(false);
                  if (baseUrlRef.current) {
                    baseUrlRef.current.value = "";
                  }
                }}
              >
                <XIcon className="opacity-75 hover:opacity-100 scale-125 transition-opacity" />
              </Button>
            ) : (
              <Button
                variant="outline"
                aria-label="Edit base URL"
                className="bg-zinc-900/70 ml-0.5 border-0 border-white rounded-none text-zinc-100 cursor-pointer"
                onClick={() => {
                  setEditBaseUrl(true);
                  setTimeout(() => baseUrlRef.current?.focus(), 0);
                }}
              >
                <EditIcon className="opacity-75 hover:opacity-100 scale-125 transition-opacity" />
              </Button>
            )}
          </ButtonGroup>
          <Input
            ref={apiKeyRef}
            type="password"
            placeholder="API Key"
            onChange={(e) => {
              if (e.currentTarget.value.trim().length > 0) {
                setSelectedProvider("api");
              } else {
                setSelectedProvider("");
              }
            }}
            className="bg-zinc-900/70 mt-1.5 border-0 w-full text-zinc-100"
          />
        </motion.div>
      </div>

      {/* Connection test button */}
      <motion.div
        className="w-full"
        initial={{ translateY: 300, opacity: 0 }}
        animate={{ translateY: 0, opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.3, ease: "easeInOut" }}
      >
        <Button
          className="flex bg-zinc-900/70 disabled:opacity-50 border-0 w-full text-zinc-100 cursor-pointer"
          onClick={onConnect}
          disabled={!selectedProvider || isPending}
        >
          {isPending ? (
            <DotmHex1 colorPreset="solid-mint" />
          ) : (
            "Connection Test"
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
}

interface ModelPanelProps {
  models: ModelsListResponse;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  onBack: () => void;
  onSave: () => void;
}

function ModelPanel({
  models,
  selectedModel,
  setSelectedModel,
  onBack,
  onSave,
}: ModelPanelProps) {
  return (
    <motion.div
      className="absolute flex flex-col justify-around items-center gap-3 mt-15 p-6 w-full"
      animate={{ translateX: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <span className="bg-zinc-900/70 px-3 py-1 border-0 rounded-3xl w-full text-zinc-300/70">
        Available Models: {models.data.length}
      </span>
      <Select value={selectedModel} onValueChange={setSelectedModel}>
        <SelectTrigger className="bg-zinc-900/70 border-0 w-full text-zinc-100 cursor-pointer">
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {models.data.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.id}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Button
        className="bg-zinc-900/70 border-0 w-full text-zinc-100 cursor-pointer"
        onClick={onBack}
      >
        Back to Providers
      </Button>
      <Button
        className="bg-zinc-900/70 border-0 w-full text-zinc-100 cursor-pointer"
        onClick={onSave}
        disabled={!selectedModel}
      >
        Save Configuration
      </Button>
    </motion.div>
  );
}

// ----------------------------------------------------------------------
// Main Setup component
// ----------------------------------------------------------------------

export default function Setup() {
  const { updateProvider } = useStore();
  //
  const [panel, animate] = useAnimate();
  //
  const [provider, setProvider] = useState<ProviderType>("local");
  const [isCustom, setIsCustom] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | undefined>(
    undefined,
  );
  const [isPending, startTransition] = useTransition();
  const [models, setModels] = useState<ModelsListResponse | null>(null);
  const [selectedModel, setSelectedModel] = useState("");

  // Refs for input values (kept as refs for simplicity, could be state)
  const customUrlRef = useRef<HTMLInputElement>(null);
  const baseUrlRef = useRef<HTMLInputElement>(null);
  const apiKeyRef = useRef<HTMLInputElement>(null);

  const handleConnect = () => {
    const params: ConnectionParams = {
      type: provider,
      provider: selectedProvider as LocalProvider | undefined,
      customUrl: customUrlRef.current?.value,
      baseUrl: baseUrlRef.current?.value,
      apiKey: apiKeyRef.current?.value,
    };

    startTransition(async () => {
      try {
        const data = await connectToProvider(params);
        setModels(data);
        const name =
          provider === "local" && selectedProvider
            ? PROVIDER_INFOS[selectedProvider as LocalProvider]?.name ||
            params.customUrl
            : "API";
        toast.success(`Connected to ${name} successfully.`);
      } catch (error: unknown) {
        console.error("Connection error:", error);
        const message =
          error instanceof Error
            ? error.message
            : typeof error === "string"
              ? error
              : "Failed to connect.";
        toast.error(message);
      }
    });
  };
  return (
    <motion.div
      ref={panel}
      className="relative flex flex-col justify-start items-center gap-3 bg-linear-to-br from-zinc-900/75 to-transparent shadow-2xl shadow-slate-900 rounded-3xl h-77.25 overflow-clip"
      initial={{ scaleY: 0, padding: 0, opacity: 0 }}
      animate={{ scaleY: 1, padding: "24px", opacity: 1 }}
      transition={{ delay: 1, duration: 0.3, ease: "easeInOut" }}
    >
      <AnimatedTitle />
      {/* Connection panel (shown when no models) */}
      <motion.div
        className="absolute w-full"
        animate={{
          translateX: models?.data.length ? "-100%" : 0,
          opacity: models?.data.length ? 0 : 1,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <ConnectionPanel
          provider={provider}
          setProvider={setProvider}
          selectedProvider={selectedProvider}
          setSelectedProvider={setSelectedProvider}
          isCustom={isCustom}
          setIsCustom={setIsCustom}
          customUrlRef={customUrlRef}
          baseUrlRef={baseUrlRef}
          apiKeyRef={apiKeyRef}
          isPending={isPending}
          onConnect={handleConnect}
        />
      </motion.div>

      {/* Model panel (shown when models loaded) */}
      <motion.div
        className="absolute w-full"
        animate={{
          translateX: models?.data.length ? 0 : "100%",
          opacity: models?.data.length ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {models && (
          <ModelPanel
            models={models}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            onBack={() => setModels(null)}
            onSave={() => {
              // Determine base_url based on provider type
              const base_url =
                provider === "local"
                  ? customUrlRef.current?.value || "" // local (ollama/lms/custom)
                  : baseUrlRef.current?.value || ""; // api

              // API key only relevant for API provider
              const api_key =
                provider === "api" ? apiKeyRef.current?.value || "" : "";

              const settings = {
                provider_name: selectedProvider || "",
                base_url,
                api_key,
                model: selectedModel,
              };

              updateProvider(settings);
              animate(
                panel.current,
                { opacity: 0 },
                { duration: 0.3 },
              ).finished.then(() => panel.current?.remove());
              toast.success("Configuration saved!");
            }}
          />
        )}
      </motion.div>
    </motion.div>
  );
}
