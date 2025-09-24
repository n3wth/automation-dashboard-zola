import { addUTM } from "@/app/components/chat/utils"
import { ModelConfig } from "@/lib/models/types"
import { PROVIDERS } from "@/lib/providers"
import {
  ArrowSquareOutIcon,
  BrainIcon,
  GlobeIcon,
  ImageIcon,
  WrenchIcon,
} from "@phosphor-icons/react"

type SubMenuProps = {
  hoveredModelData: ModelConfig
}

export function SubMenu({ hoveredModelData }: SubMenuProps) {
  const provider = PROVIDERS.find(
    (provider) => provider.id === hoveredModelData.icon
  )

  return (
    <div className="model-submenu-panel w-[280px] p-3">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          {provider?.icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-400/30">
              <provider.icon className="size-5 text-violet-300" />
            </div>
          )}
          <h3 className="font-semibold text-white text-sm">{hoveredModelData.name}</h3>
        </div>

        <p className="text-white/70 text-xs leading-relaxed">
          {hoveredModelData.description}
        </p>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-1.5">
            {hoveredModelData.vision && (
              <div className="model-capability-tag flex items-center gap-1 rounded-full bg-green-500/10 border-green-400/30 px-2.5 py-1 text-xs text-green-300 font-medium">
                <ImageIcon className="size-3" />
                <span>Vision</span>
              </div>
            )}

            {hoveredModelData.tools && (
              <div className="model-capability-tag flex items-center gap-1 rounded-full bg-purple-500/10 border-purple-400/30 px-2.5 py-1 text-xs text-purple-300 font-medium">
                <WrenchIcon className="size-3" />
                <span>Tools</span>
              </div>
            )}

            {hoveredModelData.reasoning && (
              <div className="model-capability-tag flex items-center gap-1 rounded-full bg-amber-500/10 border-amber-400/30 px-2.5 py-1 text-xs text-amber-300 font-medium">
                <BrainIcon className="size-3" />
                <span>Reasoning</span>
              </div>
            )}

            {hoveredModelData.webSearch && (
              <div className="model-capability-tag flex items-center gap-1 rounded-full bg-cyan-500/10 border-cyan-400/30 px-2.5 py-1 text-xs text-cyan-300 font-medium">
                <GlobeIcon className="size-3" />
                <span>Web Search</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3 border-t border-white/10 pt-3">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-medium text-white/80">Context</span>
            <span className="font-mono text-white/90">
              {Intl.NumberFormat("en-US", {
                style: "decimal",
              }).format(hoveredModelData.contextWindow ?? 0)}{" "}
              tokens
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-medium text-white/80">Input Pricing</span>
              <span className="font-mono text-emerald-300">
                {Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(hoveredModelData.inputCost ?? 0)}{" "}
                / 1M tokens
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-medium text-white/80">Output Pricing</span>
              <span className="font-mono text-blue-300">
                {Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(hoveredModelData.outputCost ?? 0)}{" "}
                / 1M tokens
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-medium text-white/80">Provider</span>
            <span className="text-violet-300 font-medium">{hoveredModelData.provider}</span>
          </div>

          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-medium text-white/80">Id</span>
            <span className="text-white/60 truncate font-mono text-[10px] max-w-[140px]">
              {String(hoveredModelData.id)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 pt-2 border-t border-white/5">
            <a
              href={addUTM(hoveredModelData.apiDocs ?? "")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-white/70 hover:text-violet-300 transition-colors"
            >
              <span>API Docs</span>
              <ArrowSquareOutIcon className="size-3" />
            </a>
            <a
              href={addUTM(hoveredModelData.modelPage ?? "")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-white/70 hover:text-violet-300 transition-colors"
            >
              <span>Model Page</span>
              <ArrowSquareOutIcon className="size-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
