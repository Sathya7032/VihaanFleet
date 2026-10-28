import React, { useState } from 'react';
import { 
  Fuel, 
  Gauge, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Zap,
  Bike,
  X,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import colors from '../utils/colors';

const bikes = [
  {
    id: 'activa-6g',
    name: 'Honda Activa 6G',
    cc: '109.5 cc',
    tagline: "India's #1 Most Trusted Commercial & Daily Scooter",
    image: 'https://imgd.aeplcdn.com/1056x594/n/cw/ec/44686/activa-6g-right-front-three-quarter-3.jpeg?isig=0&q=80&wm=3',
    badge: 'Most Popular',
    badgeType: 'popular',
    dailyRate: 400,
    specs: [
      { label: 'Mileage', value: '55 km/L', icon: Fuel },
      { label: 'Engine', value: '109.5 cc PGM-FI', icon: Gauge },
      { label: 'Transmission', value: 'Automatic (CVT)', icon: Zap },
      { label: 'Protection', value: 'Fully Insured', icon: ShieldCheck },
    ],
    features: ['Heavy Delivery Carrier Rack', 'Mobile Phone Mount Fitted', 'Dual ISI Helmets Included'],
    readyCount: 14,
  },
  {
    id: 'tvs-jupiter',
    name: 'TVS Jupiter 110',
    cc: '109.7 cc',
    tagline: 'Superior Ride Comfort with Extra Footboard Space',
    image: 'https://imgd.aeplcdn.com/664x374/n/cw/ec/1/versions/tvs-jupiter-drum-obd-2b1781094785153.jpg?q=80',
    badge: 'Extra Comfort',
    badgeType: 'premium',
    dailyRate: 400,
    specs: [
      { label: 'Mileage', value: '58 km/L', icon: Fuel },
      { label: 'Engine', value: '109.7 cc EcoThrust', icon: Gauge },
      { label: 'Transmission', value: 'Automatic', icon: Zap },
      { label: 'Protection', value: 'Fully Insured', icon: ShieldCheck },
    ],
    features: ['External Fuel Filling', 'Smooth Telescopic Suspension', 'Dual ISI Helmets Included'],
    readyCount: 11,
  },
  {
    id: 'hero-xoom',
    name: 'Hero Xoom 110',
    cc: '110.9 cc',
    tagline: 'Sporty Aerodynamics & Quick City Acceleration',
    image: 'https://imgd.aeplcdn.com/664x374/n/cw/ec/1/versions/--vx-drum-obd-2b1744895987824.jpg?q=80',
    badge: 'Sporty & Agile',
    badgeType: 'sport',
    dailyRate: 400,
    specs: [
      { label: 'Mileage', value: '52 km/L', icon: Fuel },
      { label: 'Engine', value: '110.9 cc i3S Power', icon: Gauge },
      { label: 'Transmission', value: 'Automatic', icon: Zap },
      { label: 'Protection', value: 'Fully Insured', icon: ShieldCheck },
    ],
    features: ['Built-in USB Mobile Charger', 'Cornering LED Headlamp', 'Dual ISI Helmets Included'],
    readyCount: 9,
  },
];

export default function AvailableBikesSection({ onBookBike }) {
  const [selectedBikeId, setSelectedBikeId] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);

  const selectedBike = bikes.find((b) => b.id === selectedBikeId) || null;
  const otherBikes = selectedBikeId ? bikes.filter((b) => b.id !== selectedBikeId) : bikes;

  const handleCardClick = (bike) => {
    if (selectedBikeId === bike.id) {
      setSelectedBikeId(null);
    } else {
      setSelectedBikeId(bike.id);
    }
  };

  return (
    <section
      id="rent"
      className="relative w-full py-16 sm:py-20 lg:py-24 transition-colors"
      style={{
        backgroundColor: colors.background.default,
        borderBottom: `1px solid ${colors.border.default}`,
      }}
      aria-label="Available Scooters and Bikes"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12 sm:mb-14">
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider select-none shadow-sm"
            style={{
              backgroundColor: colors.badge.popularBackground,
              color: colors.badge.popularText,
              border: `1px solid ${colors.border.focus}`,
            }}
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: colors.brand.navy }} />
            <span>Featured Rental Fleet</span>
          </div>

          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight"
            style={{ color: colors.text.primary }}
          >
            Explore Our <span style={{ color: colors.brand.limeDark }}>Available Scooters</span>
          </h2>

          <p
            className="text-base sm:text-lg leading-relaxed max-w-2xl mx-auto font-normal"
            style={{ color: colors.text.secondary }}
          >
            {selectedBikeId 
              ? 'Showing detailed specifications below. Click any other scooter to switch or close to view all.'
              : 'Click any scooter to expand complete technical specifications, inclusions, and rental options in-place.'}
          </p>
        </div>

        {/* Dynamic In-Line Layout Container */}
        <div className="w-full space-y-8 transition-all duration-700 ease-in-out">
          
          {/* SCENARIO 1: A SCOOTY IS SELECTED -> EXPANDED IN-ROW DETAIL VIEW */}
          {selectedBike && (
            <div className="w-full animate-expand">
              
              {/* Detailed View Card - Full Width Matching Below Row */}
              <div
                className="relative w-full rounded-3xl overflow-hidden border shadow-xl transition-all duration-700 ease-in-out"
                style={{
                  backgroundColor: colors.card.background,
                  borderColor: colors.brand.limeDark,
                }}
              >
                {/* Close / Collapse Button */}
                <button
                  type="button"
                  onClick={() => setSelectedBikeId(null)}
                  className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 shadow-sm focus:outline-none hover:scale-105"
                  style={{
                    backgroundColor: colors.background.subtle,
                    color: colors.text.primary,
                    border: `1px solid ${colors.border.strong}`,
                  }}
                  aria-label="Close detailed view and return to grid"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Close Details</span>
                </button>

                {/* Split Layout: Image on Left, Details on Right */}
                <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
                  
                  {/* Left Column: Scooty Image & Visual Highlights */}
                  <div
                    className="lg:col-span-5 xl:col-span-6 p-6 sm:p-8 lg:p-10 flex flex-col justify-between items-center text-center relative transition-all duration-700"
                    style={{ backgroundColor: colors.card.imageBackground }}
                  >
                    {/* Top Badges */}
                    <div className="w-full flex items-center justify-between z-10 mb-2">
                      <span
                        className="px-3.5 py-1 rounded-full text-xs font-bold select-none shadow-xs"
                        style={{
                          backgroundColor:
                            selectedBike.badgeType === 'popular'
                              ? colors.badge.popularBackground
                              : colors.badge.premiumBackground,
                          color:
                            selectedBike.badgeType === 'popular'
                              ? colors.badge.popularText
                              : colors.badge.premiumText,
                        }}
                      >
                        {selectedBike.badge}
                      </span>

                      <span
                        className="inline-flex items-center gap-1.5 text-xs font-semibold"
                        style={{ color: colors.status.success }}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        {selectedBike.readyCount} Ready in Hubs
                      </span>
                    </div>

                    {/* Large Scooty Image */}
                    <div className="w-full h-56 sm:h-72 lg:h-80 my-3 flex items-center justify-center">
                      <img
                        src={selectedBike.image}
                        alt={selectedBike.name}
                        className="max-h-full max-w-full object-contain mix-blend-multiply drop-shadow-xl select-none transition-transform duration-500 hover:scale-105"
                      />
                    </div>

                    {/* Quality Assurance Tag */}
                    <div
                      className="w-full py-2.5 px-3.5 rounded-xl text-xs font-medium flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: colors.background.default,
                        color: colors.text.secondary,
                        border: `1px solid ${colors.border.default}`,
                      }}
                    >
                      <ShieldCheck className="w-4 h-4" style={{ color: colors.brand.limeDark }} />
                      <span>Sanitized, Serviced &amp; Insured Before Handover</span>
                    </div>
                  </div>

                  {/* Right Column: Full Scooty Details */}
                  <div className="lg:col-span-7 xl:col-span-6 p-6 sm:p-8 lg:p-10 flex flex-col justify-between text-left space-y-6 transition-all duration-700">
                    <div>
                      {/* Name, CC, and Tagline */}
                      <div className="space-y-1.5 mb-5">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3
                            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight"
                            style={{ color: colors.text.primary }}
                          >
                            {selectedBike.name}
                          </h3>
                          <span
                            className="px-3 py-1 rounded-lg text-xs font-bold"
                            style={{
                              backgroundColor: colors.brand.navy,
                              color: colors.brand.lime,
                            }}
                          >
                            {selectedBike.cc}
                          </span>
                        </div>

                        <p
                          className="text-xs sm:text-sm font-normal"
                          style={{ color: colors.text.secondary }}
                        >
                          {selectedBike.tagline}
                        </p>
                      </div>

                      {/* 4 Specs Badges Grid */}
                      <div className="space-y-1.5 mb-5">
                        <span
                          className="text-[11px] font-bold uppercase tracking-wider block"
                          style={{ color: colors.text.muted }}
                        >
                          Key Specifications
                        </span>
                        <div
                          className="grid grid-cols-2 gap-2.5 p-3 sm:p-3.5 rounded-2xl"
                          style={{
                            backgroundColor: colors.background.subtle,
                            border: `1px solid ${colors.border.default}`,
                          }}
                        >
                          {selectedBike.specs.map((spec, idx) => {
                            const SpecIcon = spec.icon;
                            return (
                              <div key={idx} className="flex items-center gap-2.5">
                                <SpecIcon
                                  className="w-4 h-4 shrink-0"
                                  style={{ color: colors.brand.limeDark }}
                                />
                                <div className="min-w-0">
                                  <span
                                    className="text-[10px] uppercase font-semibold block leading-none"
                                    style={{ color: colors.text.muted }}
                                  >
                                    {spec.label}
                                  </span>
                                  <span
                                    className="text-xs sm:text-sm font-bold truncate block mt-0.5"
                                    style={{ color: colors.text.primary }}
                                  >
                                    {spec.value}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Inclusions Checklist */}
                      <div className="space-y-2 mb-4">
                        <span
                          className="text-[11px] font-bold uppercase tracking-wider block"
                          style={{ color: colors.text.muted }}
                        >
                          Free Inclusions
                        </span>
                        <div className="space-y-1.5">
                          {selectedBike.features.map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs">
                              <CheckCircle2
                                className="w-4 h-4 shrink-0"
                                style={{ color: colors.status.success }}
                              />
                              <span style={{ color: colors.text.secondary }}>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Bar: Rent Amount & Rent CTA */}
                    <div
                      className="pt-5 border-t flex flex-wrap items-center justify-between gap-4"
                      style={{ borderColor: colors.border.default }}
                    >
                      <div>
                        <span
                          className="text-[10px] uppercase font-semibold block"
                          style={{ color: colors.text.muted }}
                        >
                          Flat Daily Rental
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span
                            className="text-3xl font-black"
                            style={{ color: colors.brand.navy }}
                          >
                            ₹{selectedBike.dailyRate}
                          </span>
                          <span
                            className="text-xs font-medium"
                            style={{ color: colors.text.secondary }}
                          >
                            /day
                          </span>
                        </div>
                        <span
                          className="text-[10px] font-medium block"
                          style={{ color: colors.text.muted }}
                        >
                          100% Refundable Security Deposit
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (onBookBike) onBookBike(selectedBike);
                        }}
                        className="px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-md active:scale-95 transition-all duration-300 focus:outline-none focus-visible:ring-2"
                        style={{
                          backgroundColor: colors.button.primary,
                          color: colors.text.onLime,
                          outlineColor: colors.border.focus,
                        }}
                      >
                        <span>Rent {selectedBike.name.split(' ')[0]} Now</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>

                  </div>

                </div>
              </div>

            </div>
          )}

          {/* ROW OF REMAINING CARDS (OR ALL 3 WHEN NONE SELECTED) */}
          <div className="w-full transition-all duration-700 ease-in-out">
            
            {/* Header when row is moved down below the active detail view */}
            {selectedBike && (
              <div className="flex items-center justify-between mb-4 px-1 animate-slide-down">
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: colors.text.muted }}
                >
                  Other Available Scooters (Click to switch view)
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedBikeId(null)}
                  className="text-xs font-semibold flex items-center gap-1.5 hover:underline transition-colors"
                  style={{ color: colors.text.link }}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>View All 3 in Single Row</span>
                </button>
              </div>
            )}

            {/* Grid of Cards: Exactly matching the full container width (w-full) */}
            <div
              className={`w-full grid gap-7 lg:gap-8 items-stretch transition-all duration-700 ease-in-out ${
                selectedBike 
                  ? 'grid-cols-1 sm:grid-cols-2 animate-slide-down' 
                  : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              }`}
            >
              {otherBikes.map((bike) => {
                const isHovered = hoveredCard === bike.id;

                return (
                  <div
                    key={bike.id}
                    onClick={() => handleCardClick(bike)}
                    onMouseEnter={() => setHoveredCard(bike.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    className="group cursor-pointer rounded-3xl p-5 sm:p-6 transition-all duration-700 ease-in-out flex flex-col justify-between border select-none w-full"
                    style={{
                      backgroundColor: colors.card.background,
                      borderColor: isHovered ? colors.brand.limeDark : colors.border.default,
                      boxShadow: isHovered
                        ? '0 20px 35px -10px rgba(7, 27, 45, 0.12), 0 8px 16px -4px rgba(185, 243, 74, 0.2)'
                        : '0 4px 15px rgba(7, 27, 45, 0.05)',
                      transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                    }}
                  >
                    <div>
                      {/* Top Badge & Live Status */}
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-bold tracking-tight select-none shadow-xs"
                          style={{
                            backgroundColor:
                              bike.badgeType === 'popular'
                                ? colors.badge.popularBackground
                                : colors.badge.premiumBackground,
                            color:
                              bike.badgeType === 'popular'
                                ? colors.badge.popularText
                                : colors.badge.premiumText,
                          }}
                        >
                          {bike.badge}
                        </span>

                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-semibold"
                          style={{ color: colors.status.success }}
                        >
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          {bike.readyCount} in Hubs
                        </span>
                      </div>

                      {/* Vehicle Image Container */}
                      <div
                        className="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden flex items-center justify-center p-3 mb-4 transition-colors duration-500"
                        style={{
                          backgroundColor: colors.card.imageBackground,
                        }}
                      >
                        <img
                          src={bike.image}
                          alt={bike.name}
                          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500 pointer-events-none select-none"
                          loading="lazy"
                        />
                      </div>

                      {/* Scooty Name & CC */}
                      <div className="flex items-baseline justify-between mb-2 text-left">
                        <h3
                          className="text-xl sm:text-2xl font-extrabold tracking-tight group-hover:text-emerald-700 transition-colors duration-300"
                          style={{ color: colors.text.primary }}
                        >
                          {bike.name}
                        </h3>
                        <span
                          className="px-2.5 py-0.5 rounded-lg text-xs font-bold"
                          style={{
                            backgroundColor: colors.background.subtle,
                            color: colors.brand.navy,
                            border: `1px solid ${colors.border.strong}`,
                          }}
                        >
                          {bike.cc}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Bar: Rent Amount & Click Prompt */}
                    <div
                      className="pt-4 flex items-center justify-between border-t mt-3"
                      style={{ borderColor: colors.border.default }}
                    >
                      <div className="text-left">
                        <span
                          className="text-[10px] uppercase font-semibold block"
                          style={{ color: colors.text.muted }}
                        >
                          Daily Rent
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span
                            className="text-2xl font-black"
                            style={{ color: colors.brand.navy }}
                          >
                            ₹{bike.dailyRate}
                          </span>
                          <span
                            className="text-xs font-medium"
                            style={{ color: colors.text.secondary }}
                          >
                            /day
                          </span>
                        </div>
                      </div>

                      <span
                        className="inline-flex items-center gap-1.5 text-xs font-bold group-hover:translate-x-1 transition-transform duration-300"
                        style={{ color: colors.text.link }}
                      >
                        <span>View Details</span>
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

        </div>

        {/* Free Maintenance Callout Banner */}
        <div
          className="mt-14 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left transition-all duration-700"
          style={{
            backgroundColor: colors.background.subtle,
            border: `1px solid ${colors.border.default}`,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: colors.brand.navy,
              }}
            >
              <Bike className="w-5 h-5" style={{ color: colors.brand.lime }} />
            </div>
            <div>
              <span
                className="font-bold text-sm block"
                style={{ color: colors.text.primary }}
              >
                100% Free Regular Servicing &amp; Maintenance Included
              </span>
              <span
                className="text-xs font-normal"
                style={{ color: colors.text.secondary }}
              >
                Breakdowns and engine wear are taken care of by Vihaan Fleet mechanics at all 6 Hyderabad hubs.
              </span>
            </div>
          </div>

          <a
            href="#how-it-works"
            className="text-xs font-bold flex items-center gap-1 hover:underline shrink-0"
            style={{ color: colors.text.link }}
          >
            <span>Learn How It Works</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>
    </section>
  );
}
