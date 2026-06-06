import { Separator } from "@/components/ui/separator";
import { motion } from "motion/react";
import { useState } from "react";
import { Button } from "./ui/button";

function Setup() {
  const [provider, setProvider] = useState<"api" | "local">("api");
  return (
    <div className="flex flex-col justify-start items-center gap-1 bg-linear-to-r from-zinc-900/75 to-transparent shadow-2xl shadow-slate-900 p-3 rounded-md">
      <div className="overflow-clip">
        <motion.h1
          className="text-shadow-lg text-shadow-zinc-900 font-tourner text-zinc-50 text-6xl"
          initial={{ translateY: 100 }}
          animate={{
            translateY: 0,
          }}
          transition={{ delay: 1.5, duration: 0.3 }}
        >
          Agent 9
        </motion.h1>
      </div>
      <motion.span
        className="inline-block w-full"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        style={{ originX: 0 }} // Forces the scale to start from the left
        transition={{ delay: 1.2, ease: "easeInOut", duration: 0.3 }}
      >
        <Separator className="opacity-30 rounded-full" />
      </motion.span>
      <div className="relative flex justify-center items-center w-full">
        <Button
          className={`bg-zinc-900/70 text-shadow-md ${provider === "api" ? "text-shadow-emerald-600 text-emerald-300" : " text-zinc-300/30"} rounded-md w-1/2 cursor-pointer transition-colors duration-300`}
          onClick={() => setProvider("api")}
        >
          API
        </Button>
        <Button
          className={`bg-zinc-900/70 text-shadow-md ${provider === "local" ? "text-shadow-emerald-600 text-emerald-300" : " text-zinc-300/30"} rounded-md w-1/2 cursor-pointer transition-colors duration-300`}
          onClick={() => setProvider("local")}
        >
          Local
        </Button>
      </div>
    </div>
  );
}

export default Setup;
