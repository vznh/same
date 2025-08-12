"use client"
// components/Placeholder – render when no frames exist
import { MagicWandIcon, ImageIcon, CubeIcon, LayersIcon, ChatBubbleIcon } from '@radix-ui/react-icons'

type PlaceholderProps = {
  onCreateTool?: () => void
  onBuildWebsite?: () => void
  onStartTemplate?: () => void
  onViewCommunity?: () => void 
  onChatWithAI?: () => void
}

const Placeholder = ({
  onCreateTool,
  onBuildWebsite,
  onStartTemplate,
  onViewCommunity,
  onChatWithAI
}: PlaceholderProps) => {
  const Btn = ({
    icon,
    label,
    onClick,
  }: { icon: React.ReactNode; label: string; onClick?: () => void }) => (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white/80 px-4 py-2 text-sm text-gray-700 hover:bg-white shadow-sm"
    >
      {icon}
      <span className="tracking-tight">{label}</span>
    </button>
  )

  return (
    <div className="flex flex-col items-center gap-5 font-light tracking-tight text-center">
      <h1 className="text-[28px] leading-8">
        <span className="text-[#1E1919]">Hold down anywhere</span>
        <span className="text-[#9D9D9D]"> to create a new frame, or get started with</span>
      </h1>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Btn icon={<MagicWandIcon className="w-4 h-4" />} label="Create a tool" onClick={onCreateTool} />
        <Btn icon={<ImageIcon className="w-4 h-4" />} label="Build a website" onClick={onBuildWebsite} />
        <Btn icon={<ChatBubbleIcon className="w-4 h-4" />} label="Generate a plan" onClick={onChatWithAI} />
        <Btn icon={<CubeIcon className="w-4 h-4" />} label="Start from a template" onClick={onStartTemplate} />
        <div className="opacity-10">
          <Btn icon={<LayersIcon className="w-4 h-4" />} label="View community work" />
        </div>
      </div>
    </div>
  )
}

export default Placeholder
