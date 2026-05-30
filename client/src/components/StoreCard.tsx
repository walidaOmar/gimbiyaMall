import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Store {
  _id: string;
  name: string;
  category: 'store' | 'office';
  description?: string;
  bannerImageUrl?: string;
  buildingLevel: number;
  products: any[];
}

interface StoreCardProps {
  store: Store;
  onClick: () => void;
}

export default function StoreCard({ store, onClick }: StoreCardProps) {
  // Helper for window background: use bannerImageUrl if available, else warm gradient
  const windowBgStyle = store.bannerImageUrl
    ? {
        backgroundImage: `url(${store.bannerImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {};

  return (
    <Card
      className="cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden group border-0 shadow-md"
      onClick={onClick}
    >
      {/* Storefront Facade Area (realistic, brick-textured, with windows and entrance) */}
      <div className="relative aspect-video bg-[#2c2e31] overflow-hidden">
        {/* Brick / modern cladding texture (subtle) */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, rgba(80,80,90,0.5) 0px, rgba(80,80,90,0.5) 2px, transparent 2px, transparent 8px),
                              repeating-linear-gradient(135deg, rgba(50,50,60,0.4) 0px, rgba(50,50,60,0.4) 1px, transparent 1px, transparent 6px)`,
          }}
        />

        {/* Main Facade Layout: left window, center entrance, right window */}
        <div className="relative z-10 flex h-full p-2 gap-1 md:gap-2">
          {/* LEFT WINDOW (well-lit display) */}
          <div className="flex-1 relative rounded-lg overflow-hidden shadow-inner">
            <div
              className="absolute inset-0 bg-gradient-to-br from-amber-100/80 to-amber-800/60"
              style={store.bannerImageUrl ? { backgroundImage: 'none', backgroundColor: 'rgba(0,0,0,0.3)' } : {}}
            />
            {/* If custom image exists, show it with a slight overlay */}
            {store.bannerImageUrl && (
              <div
                className="absolute inset-0 bg-cover bg-center opacity-80 mix-blend-overlay"
                style={{ backgroundImage: `url(${store.bannerImageUrl})` }}
              />
            )}
            {/* Window interior details (shelves, mannequin hints) */}
            <div className="absolute bottom-2 left-1 right-1 flex justify-around gap-1">
              <div className="w-6 h-10 bg-black/20 rounded-sm backdrop-blur-[1px]" />
              <div className="w-6 h-12 bg-black/20 rounded-sm backdrop-blur-[1px]" />
              <div className="w-6 h-8 bg-black/20 rounded-sm backdrop-blur-[1px]" />
            </div>
            {/* Glass reflection & mullions */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-px bg-black/30 pointer-events-none" />
          </div>

          {/* CENTRAL ENTRANCE (double doors + store banner above) */}
          <div className="flex-[1.4] flex flex-col relative">
            {/* STORE BANNER – prominently above the door */}
            <div className="relative -mt-1 mb-1 z-20 bg-gradient-to-r from-gray-900 to-gray-800 rounded-t-lg py-1.5 px-2 text-center shadow-lg border-b-2 border-amber-500/60">
              <div className="flex justify-center items-center gap-2">
                <span className="text-amber-400 text-sm">✦</span>
                <span className="font-extrabold text-sm md:text-base uppercase tracking-wider bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent drop-shadow-md">
                  {store.name}
                </span>
                <span className="text-amber-400 text-sm">✦</span>
              </div>
              <div className="absolute -bottom-2 left-0 w-full h-2 bg-gradient-to-t from-amber-600/40 to-transparent blur-sm" />
            </div>

            {/* Double Doors */}
            <div className="flex flex-1 gap-1">
              {/* Left door */}
              <div className="w-1/2 bg-gray-800 rounded-b-md overflow-hidden relative shadow-md">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-200/30 to-amber-800/40" />
                <div className="absolute inset-0 border border-amber-800/40 rounded-sm" />
                {/* Door glass panes */}
                <div className="absolute inset-0 grid grid-cols-1 grid-rows-2 gap-0.5 bg-black/20" />
                {/* Handle */}
                <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-gradient-to-r from-gray-300 to-gray-500 rounded-full shadow-md" />
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[6px] text-white/50 font-bold">PUSH</div>
              </div>
              {/* Right door */}
              <div className="w-1/2 bg-gray-800 rounded-b-md overflow-hidden relative shadow-md">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-200/30 to-amber-800/40" />
                <div className="absolute inset-0 border border-amber-800/40 rounded-sm" />
                <div className="absolute inset-0 grid grid-cols-1 grid-rows-2 gap-0.5 bg-black/20" />
                <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-gradient-to-r from-gray-300 to-gray-500 rounded-full shadow-md" />
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[6px] text-white/50 font-bold">PULL</div>
              </div>
            </div>

            {/* Threshold & welcome mat */}
            <div className="h-1.5 w-full bg-gray-600 rounded-full mt-0.5" />
            <div className="w-4/5 mx-auto mt-0.5 h-2 bg-amber-900/60 rounded-full flex items-center justify-center">
              <span className="text-[6px] font-bold text-amber-200/80">WELCOME</span>
            </div>
          </div>

          {/* RIGHT WINDOW (symmetrical display) */}
          <div className="flex-1 relative rounded-lg overflow-hidden shadow-inner">
            <div
              className="absolute inset-0 bg-gradient-to-br from-amber-100/70 to-amber-800/70"
              style={store.bannerImageUrl ? { backgroundImage: 'none', backgroundColor: 'rgba(0,0,0,0.3)' } : {}}
            />
            {store.bannerImageUrl && (
              <div
                className="absolute inset-0 bg-cover bg-center opacity-80 mix-blend-overlay"
                style={{ backgroundImage: `url(${store.bannerImageUrl})` }}
              />
            )}
            <div className="absolute bottom-2 left-1 right-1 flex justify-around gap-1">
              <div className="w-6 h-8 bg-black/20 rounded-sm backdrop-blur-[1px]" />
              <div className="w-6 h-12 bg-black/20 rounded-sm backdrop-blur-[1px]" />
              <div className="w-6 h-10 bg-black/20 rounded-sm backdrop-blur-[1px]" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-bl from-white/10 to-transparent pointer-events-none" />
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-px bg-black/30 pointer-events-none" />
          </div>
        </div>

        {/* Level Badge (placed on top-right of the facade) */}
        <div className="absolute top-2 right-2 z-20">
          <Badge variant="secondary" className="shadow-md bg-black/70 text-amber-100 border-amber-500/40">
            Level {store.buildingLevel}
          </Badge>
        </div>

        {/* Decorative wall lamps (left and right) */}
        <div className="absolute bottom-2 left-2 w-6 h-6 rounded-full bg-gray-700/80 flex items-center justify-center shadow-md backdrop-blur-sm">
          <div className="w-2 h-2 bg-amber-300 rounded-full animate-pulse shadow-glow" />
        </div>
        <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-gray-700/80 flex items-center justify-center shadow-md backdrop-blur-sm">
          <div className="w-2 h-2 bg-amber-300 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Card Content: description, product count, category */}
      <CardContent className="pt-4 pb-3">
        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
          {store.description || 'Explore this unique space in our virtual mall.'}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-amber-500 rounded-full" />
            {store.products.length} products
          </span>
          <Badge variant="outline" className="text-xs capitalize">
            {store.category}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}