"use client";

import Image from "next/image";

type Props = {
  side?: "left" | "right";
  className?: string;
};

/** Glowing Taraka mark with golden orbit — mirrors guest report loader motion. */
export function GlowingBrandOrb({ side = "left", className = "" }: Props) {
  return (
    <div
      className={`home-side-orb guest-star-loader relative ${className}`}
      aria-hidden
      data-side={side}
    >
      <div className="guest-star-aura" />
      <div className="guest-star-ring" />
      <div className="guest-star-orbit">
        <span className="guest-star-trail" />
        <span className="guest-star-spark" />
      </div>
      <div className="guest-star-core-wrap home-side-orb__mark">
        <Image
          src="/brand/taraka-nav-clear.png"
          alt=""
          width={120}
          height={120}
          className="h-full w-full object-contain bg-transparent"
          priority
        />
      </div>
    </div>
  );
}
