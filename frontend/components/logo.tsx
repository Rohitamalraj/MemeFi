import { Rocket } from "lucide-react";

export const Logo = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <div className="flex items-center gap-2">
      <Rocket className="w-6 h-6 text-primary" />
      <span className="text-xl font-bold font-mono tracking-tight">
        <span className="text-white">MEME</span>
        <span className="text-primary">FI</span>
      </span>
    </div>
  );
};
