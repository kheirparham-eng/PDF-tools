import React from 'react';

export const IrisBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Powder Blue Sky Ambient Canvas */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#CDE4F8] via-[#BCE0F7] to-[#D5ECFB] dark:from-[#071325] dark:via-[#0c1f3d] dark:to-[#08172c] transition-colors duration-500" />

      {/* Ambient Luminous Radiance Blobs */}
      <div className="absolute -top-[10%] left-[10%] w-[600px] h-[600px] rounded-full bg-white/40 dark:bg-sky-400/[0.08] blur-[120px]" />
      <div className="absolute top-[40%] -right-[10%] w-[680px] h-[680px] rounded-full bg-sky-200/50 dark:bg-blue-600/[0.08] blur-[140px]" />
      <div className="absolute -bottom-[10%] left-[25%] w-[650px] h-[650px] rounded-full bg-blue-200/40 dark:bg-indigo-900/[0.12] blur-[150px]" />

      {/* Iris / Sweet Pea Blue Flower Illustration (Soft Ambient Focus for Maximum Text Legibility) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-30 dark:opacity-20 transition-opacity duration-500">
        <svg
          viewBox="0 0 1000 1000"
          className="w-[950px] h-[950px] max-w-[130vw] max-h-[130vh] translate-y-6 animate-iris-breathe"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Top Center Main Petal Gradient */}
            <radialGradient id="irisCenterPetal" cx="50%" cy="40%" r="55%">
              <stop offset="0%" stopColor="#A8D5F9" />
              <stop offset="35%" stopColor="#68B1ED" />
              <stop offset="75%" stopColor="#3B8FD9" />
              <stop offset="100%" stopColor="#2875C0" />
            </radialGradient>

            {/* Left Fan Petal Gradient */}
            <linearGradient id="irisLeftPetal" x1="20%" y1="20%" x2="80%" y2="80%">
              <stop offset="0%" stopColor="#93CCF7" />
              <stop offset="40%" stopColor="#55A4E8" />
              <stop offset="85%" stopColor="#2C7EC8" />
              <stop offset="100%" stopColor="#1E65AB" />
            </linearGradient>

            {/* Right Fan Petal Gradient */}
            <linearGradient id="irisRightPetal" x1="80%" y1="20%" x2="20%" y2="80%">
              <stop offset="0%" stopColor="#A0D3F9" />
              <stop offset="45%" stopColor="#5EA9EB" />
              <stop offset="80%" stopColor="#3283CE" />
              <stop offset="100%" stopColor="#236BB2" />
            </linearGradient>

            {/* Lower Billowing Fall Petal Gradient */}
            <radialGradient id="irisBottomPetal" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#68B4F0" />
              <stop offset="50%" stopColor="#3589D3" />
              <stop offset="85%" stopColor="#226EBA" />
              <stop offset="100%" stopColor="#185698" />
            </radialGradient>

            {/* Inner Golden Nectar Glow */}
            <radialGradient id="irisNectarGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFF4D0" stopOpacity="0.95" />
              <stop offset="40%" stopColor="#E8CA72" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#68B1ED" stopOpacity="0" />
            </radialGradient>

            {/* Stem Gradient */}
            <linearGradient id="irisStem" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4D7F57" />
              <stop offset="50%" stopColor="#6DA47A" />
              <stop offset="100%" stopColor="#43704B" />
            </linearGradient>

            {/* Soft Focus Filter to mimic the photographic lens blur of the reference */}
            <filter id="softPetalFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Stem */}
          <path
            d="M492 680 C490 760 488 880 495 990 L518 990 C513 880 514 760 516 680 Z"
            fill="url(#irisStem)"
            opacity="0.9"
          />

          {/* Upper Crown Petal (Soft, curving top ruffle) */}
          <path
            d="M 500 120
               C 420 120 380 200 400 290
               C 415 360 460 380 500 390
               C 540 380 585 360 600 290
               C 620 200 580 120 500 120 Z"
            fill="url(#irisCenterPetal)"
            filter="url(#softPetalFilter)"
          />

          {/* Left Wing Petal */}
          <path
            d="M 430 260
               C 320 230 240 330 260 440
               C 280 540 370 580 460 540
               C 490 520 480 440 460 360
               C 450 310 440 280 430 260 Z"
            fill="url(#irisLeftPetal)"
            filter="url(#softPetalFilter)"
          />

          {/* Right Wing Petal */}
          <path
            d="M 570 260
               C 680 230 760 330 740 440
               C 720 540 630 580 540 540
               C 510 520 520 440 540 360
               C 550 310 560 280 570 260 Z"
            fill="url(#irisRightPetal)"
            filter="url(#softPetalFilter)"
          />

          {/* Bottom Left Billow Petal */}
          <path
            d="M 470 500
               C 380 520 260 550 250 670
               C 240 760 340 820 440 810
               C 490 800 500 730 490 640 Z"
            fill="url(#irisBottomPetal)"
            filter="url(#softPetalFilter)"
          />

          {/* Bottom Right Billow Petal */}
          <path
            d="M 530 500
               C 620 520 740 550 750 670
               C 760 760 660 820 560 810
               C 510 800 500 730 510 640 Z"
            fill="url(#irisBottomPetal)"
            filter="url(#softPetalFilter)"
          />

          {/* Central Flounce & Nectar Heart */}
          <ellipse
            cx="500"
            cy="460"
            rx="85"
            ry="75"
            fill="url(#irisNectarGlow)"
            filter="url(#softPetalFilter)"
          />

          {/* Center Petal Crest (Fold overlapping the center) */}
          <path
            d="M 450 350
               C 460 410 470 480 500 495
               C 530 480 540 410 550 350
               C 525 365 475 365 450 350 Z"
            fill="#EAF4FC"
            opacity="0.85"
            filter="url(#softPetalFilter)"
          />

          {/* Golden Yellow Inner Pistil Fleck */}
          <path
            d="M 488 440
               C 492 425 508 425 512 440
               C 516 455 504 465 500 472
               C 496 465 484 455 488 440 Z"
            fill="#FBE08A"
            opacity="0.9"
          />
        </svg>
      </div>

      {/* Atmospheric Diffuse Glass Reflection Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/15 dark:from-sky-950/20 dark:to-black/30 pointer-events-none" />
    </div>
  );
};
