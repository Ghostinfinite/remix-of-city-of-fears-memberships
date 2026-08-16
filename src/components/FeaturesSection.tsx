import { useState } from "react";
import {
  Car, Home, Briefcase, Users, Shield, Zap, Star, Globe, Music, Camera,
  Map, Package, Wrench, Heart, MessageCircle, Bell, Lock, Eye, Cpu,
  Gamepad2, Trophy, Gift, Flame, Rocket, Crown, Gem, Swords, Ghost,
  Building2, Coins, Newspaper, Radio, Truck, Plane, Bike, Ship,
  Skull, AlertTriangle, CheckCircle2, Sparkles, Dices, Target,
} from "lucide-react";

type Feature = {
  icon: React.ElementType;
  title: string;
  description: string;
  category: string;
  new?: boolean;
};

const features: Feature[] = [
  // ROLEPLAY CORE
  { icon: Users, title: "Deep Character Creation", description: "Full backstory, appearance, and personality system with 200+ customization options.", category: "Roleplay" },
  { icon: Briefcase, title: "50+ Civilian Jobs", description: "Taxi, trucker, mechanic, chef, lawyer, doctor, fisherman, farmer, and more.", category: "Roleplay" },
  { icon: Building2, title: "Business Ownership", description: "Buy, run, and upgrade businesses. Hire staff, set prices, manage inventory.", category: "Roleplay" },
  { icon: Home, title: "Property System", description: "Purchase houses, apartments, and warehouses. Fully furnished interiors.", category: "Roleplay" },
  { icon: Heart, title: "Relationship System", description: "Marry, divorce, adopt. Family trees tracked server-wide.", category: "Roleplay" },
  { icon: MessageCircle, title: "Proximity Voice Chat", description: "Realistic voice range with whisper, normal, and shout modes.", category: "Roleplay" },
  { icon: Camera, title: "In-Game Phone", description: "Full smartphone with contacts, photos, social media, and apps.", category: "Roleplay" },
  { icon: Newspaper, title: "Player-Run Newspaper", description: "Write and publish articles. Other players can read them in-game.", category: "Roleplay" },
  { icon: Music, title: "Radio Stations", description: "Custom in-game radio with DJ slots, playlists, and live broadcasts.", category: "Roleplay" },
  { icon: Globe, title: "Dynamic World Events", description: "Random server events: storms, blackouts, gang wars, police chases.", category: "Roleplay" },
  { icon: Map, title: "Custom Map Zones", description: "Unique MLO interiors, custom buildings, and exclusive areas.", category: "Roleplay" },
  { icon: Ghost, title: "Horror Events", description: "Seasonal horror events with unique quests, enemies, and rewards.", category: "Roleplay" },
  { icon: Skull, title: "Death & Respawn System", description: "Realistic injury, hospitalization, and respawn with memory loss mechanics.", category: "Roleplay" },
  { icon: Eye, title: "Witness System", description: "NPCs and players can report crimes they witness to police.", category: "Roleplay" },
  { icon: Lock, title: "Safe Houses", description: "Rent temporary safe houses to hide from police or enemies.", category: "Roleplay" },

  // VEHICLES
  { icon: Car, title: "500+ Custom Vehicles", description: "Exclusive cars, trucks, bikes, and emergency vehicles not found elsewhere.", category: "Vehicles" },
  { icon: Truck, title: "Trucking & Logistics", description: "Long-haul trucking jobs with cargo, fuel, and delivery mechanics.", category: "Vehicles" },
  { icon: Bike, title: "Motorcycle Clubs", description: "Form or join MCs with territory, runs, and club hierarchy.", category: "Vehicles" },
  { icon: Plane, title: "Aviation System", description: "Pilot license, private jets, helicopters, and air taxi service.", category: "Vehicles" },
  { icon: Ship, title: "Maritime System", description: "Boats, yachts, fishing vessels, and underwater exploration.", category: "Vehicles" },
  { icon: Wrench, title: "Vehicle Customization", description: "Full tuning: engine, suspension, paint, wraps, neon, and more.", category: "Vehicles" },
  { icon: Car, title: "Car Dealerships", description: "Multiple dealerships with test drives, financing, and trade-ins.", category: "Vehicles" },
  { icon: Car, title: "Impound System", description: "Vehicles get impounded. Pay fines or break them out.", category: "Vehicles" },
  { icon: Car, title: "Street Racing", description: "Organized and illegal street races with betting and leaderboards.", category: "Vehicles" },
  { icon: Car, title: "Chop Shop", description: "Steal and strip vehicles for parts. Sell to underground buyers.", category: "Vehicles" },

  // CRIME & GANGS
  { icon: Swords, title: "Gang Territory System", description: "Control turf, collect taxes, defend against rivals. Dynamic map control.", category: "Crime" },
  { icon: Flame, title: "Drug Empire", description: "Grow, cook, distribute, and sell drugs. Full supply chain simulation.", category: "Crime" },
  { icon: Package, title: "Heist System", description: "Bank heists, jewelry stores, armored trucks — plan and execute.", category: "Crime" },
  { icon: AlertTriangle, title: "Wanted System", description: "Star-based wanted levels with police pursuit and bounties.", category: "Crime" },
  { icon: Skull, title: "Hitman Contracts", description: "Take or place contracts on players. Anonymous dark web board.", category: "Crime" },
  { icon: Lock, title: "Jail System", description: "Full prison with jobs, contraband, escape attempts, and parole.", category: "Crime" },
  { icon: Briefcase, title: "Money Laundering", description: "Clean dirty money through businesses, casinos, and shell companies.", category: "Crime" },
  { icon: Ghost, title: "Underground Market", description: "Black market for illegal weapons, drugs, and stolen goods.", category: "Crime" },
  { icon: Swords, title: "Weapon Crafting", description: "Craft illegal weapons from components found across the map.", category: "Crime" },
  { icon: Car, title: "Vehicle Theft Ring", description: "Organized car theft with export missions and international buyers.", category: "Crime" },

  // LAW ENFORCEMENT
  { icon: Shield, title: "LSPD Department", description: "Full police department with ranks, training, and internal affairs.", category: "Law" },
  { icon: Shield, title: "DEA Operations", description: "Undercover drug enforcement with informants and sting operations.", category: "Law" },
  { icon: Shield, title: "SWAT Team", description: "Elite tactical unit for high-risk situations and hostage rescue.", category: "Law" },
  { icon: Shield, title: "Traffic Division", description: "Speed cameras, DUI checkpoints, and vehicle inspections.", category: "Law" },
  { icon: Shield, title: "Detective Bureau", description: "Investigate crimes, collect evidence, and build cases.", category: "Law" },
  { icon: Shield, title: "Corrections Officers", description: "Manage the prison population, prevent escapes, run programs.", category: "Law" },
  { icon: Shield, title: "Federal Agencies", description: "FBI, ICE, and USSS with jurisdiction over major crimes.", category: "Law" },
  { icon: Shield, title: "Dispatch System", description: "CAD/MDT system for officers with real-time crime map.", category: "Law" },
  { icon: Shield, title: "Evidence Locker", description: "Collected evidence stored and used in court proceedings.", category: "Law" },
  { icon: Shield, title: "Court System", description: "Lawyers, judges, trials, and sentencing for serious crimes.", category: "Law" },

  // ECONOMY
  { icon: Coins, title: "Dual Currency", description: "Clean cash and dirty money with separate economies.", category: "Economy" },
  { icon: Coins, title: "Stock Market", description: "Player-driven stock market affected by in-game events.", category: "Economy" },
  { icon: Coins, title: "Banking System", description: "Personal and business accounts, loans, interest, and wire transfers.", category: "Economy" },
  { icon: Coins, title: "Tax System", description: "Income tax, property tax, and business tax with evasion mechanics.", category: "Economy" },
  { icon: Coins, title: "Auction House", description: "Bid on rare vehicles, properties, and items from other players.", category: "Economy" },
  { icon: Coins, title: "Crypto Exchange", description: "In-game cryptocurrency for anonymous transactions.", category: "Economy" },
  { icon: Coins, title: "Pawn Shop", description: "Sell items for quick cash. Buy cheap goods from desperate players.", category: "Economy" },
  { icon: Coins, title: "Insurance System", description: "Insure vehicles, properties, and businesses against loss.", category: "Economy" },
  { icon: Coins, title: "Lottery", description: "Daily and weekly lottery draws with massive jackpots.", category: "Economy" },
  { icon: Coins, title: "Credit Score", description: "Financial reputation affects loan rates and business deals.", category: "Economy" },

  // SOCIAL
  { icon: Trophy, title: "Leaderboards", description: "Top earners, criminals, cops, racers, and casino winners.", category: "Social" },
  { icon: Gift, title: "Achievement System", description: "500+ achievements with rewards, titles, and badges.", category: "Social" },
  { icon: Star, title: "Reputation System", description: "Street cred, police record, and community standing tracked.", category: "Social" },
  { icon: Users, title: "Crew System", description: "Form crews with shared bank, territory, and missions.", category: "Social" },
  { icon: Bell, title: "Notification System", description: "In-game alerts for events, messages, and transactions.", category: "Social" },
  { icon: MessageCircle, title: "Global Chat Channels", description: "OOC, IC, gang, police, and emergency channels.", category: "Social" },
  { icon: Camera, title: "Screenshot Gallery", description: "Share in-game screenshots to the server gallery.", category: "Social" },
  { icon: Trophy, title: "Player of the Month", description: "Community voted awards with exclusive in-game prizes.", category: "Social" },
  { icon: Star, title: "VIP Lounge", description: "Exclusive area for premium members with special NPCs.", category: "Social" },
  { icon: Users, title: "Mentorship Program", description: "Veteran players guide new members through the city.", category: "Social" },

  // ENTERTAINMENT
  { icon: Gamepad2, title: "25 Casino Games", description: "Slots, poker, blackjack, roulette, crash, mines, and more.", category: "Entertainment", new: true },
  { icon: Dices, title: "Poker Rooms", description: "Private and public poker tables with buy-ins and tournaments.", category: "Entertainment" },
  { icon: Music, title: "Nightclubs", description: "Player-run clubs with DJs, VIP sections, and bottle service.", category: "Entertainment" },
  { icon: Trophy, title: "Sports Betting", description: "Bet on in-game races, fights, and sports events.", category: "Entertainment" },
  { icon: Target, title: "Shooting Range", description: "Practice shooting, compete in tournaments, earn weapon licenses.", category: "Entertainment" },
  { icon: Car, title: "Go-Kart Track", description: "Fun racing mini-game with custom karts and tracks.", category: "Entertainment" },
  { icon: Gamepad2, title: "Arcade Games", description: "In-game arcade with retro games playable for credits.", category: "Entertainment" },
  { icon: Trophy, title: "Fight Club", description: "Underground fighting ring with betting and championship belts.", category: "Entertainment" },
  { icon: Music, title: "Concert Events", description: "Live in-game concerts with custom stages and performances.", category: "Entertainment" },
  { icon: Camera, title: "Movie Theater", description: "Watch community-made videos on the big screen.", category: "Entertainment" },

  // HORROR THEME
  { icon: Skull, title: "Haunted Locations", description: "Explore cursed buildings with jump scares and hidden lore.", category: "Horror", new: true },
  { icon: Ghost, title: "Ghost Encounters", description: "Random ghost events with investigation mechanics.", category: "Horror", new: true },
  { icon: Skull, title: "Cult Storyline", description: "Deep lore-driven cult questline with multiple endings.", category: "Horror", new: true },
  { icon: Ghost, title: "Paranormal Investigations", description: "EMF readers, spirit boxes, and ghost hunting equipment.", category: "Horror", new: true },
  { icon: Skull, title: "Zombie Outbreak Events", description: "Seasonal zombie events with survival mechanics.", category: "Horror", new: true },
  { icon: Ghost, title: "Ritual System", description: "Perform dark rituals for powerful but dangerous buffs.", category: "Horror", new: true },
  { icon: Skull, title: "Cursed Items", description: "Find and trade cursed items with unpredictable effects.", category: "Horror", new: true },
  { icon: Ghost, title: "Horror Radio Broadcasts", description: "Cryptic messages and warnings broadcast on certain frequencies.", category: "Horror", new: true },
  { icon: Skull, title: "Serial Killer Events", description: "Anonymous player-driven murder mystery events.", category: "Horror", new: true },
  { icon: Ghost, title: "Demon Possession", description: "Rare event where a player becomes temporarily possessed.", category: "Horror", new: true },

  // TECHNICAL
  { icon: Cpu, title: "Anti-Cheat System", description: "Advanced detection for cheats, exploits, and modding.", category: "Technical" },
  { icon: Cpu, title: "Performance Optimized", description: "60+ FPS on mid-range hardware with optimized scripts.", category: "Technical" },
  { icon: Cpu, title: "Auto-Save System", description: "Character data saved every 5 minutes automatically.", category: "Technical" },
  { icon: Cpu, title: "Crash Recovery", description: "Reconnect within 5 minutes and resume exactly where you left off.", category: "Technical" },
  { icon: Cpu, title: "Low Latency Servers", description: "Dedicated servers with sub-50ms ping for NA players.", category: "Technical" },
  { icon: Cpu, title: "Modded Weapons Pack", description: "200+ custom weapons with unique animations and sounds.", category: "Technical" },
  { icon: Cpu, title: "Custom HUD", description: "Sleek horror-themed HUD with health, armor, hunger, and thirst.", category: "Technical" },
  { icon: Cpu, title: "Inventory System", description: "Weight-based inventory with item stacking and containers.", category: "Technical" },
  { icon: Cpu, title: "Crafting System", description: "Craft items, weapons, and consumables from raw materials.", category: "Technical" },
  { icon: Cpu, title: "Weather & Time Sync", description: "Real-time weather and synchronized day/night cycle.", category: "Technical" },

  // NEW FEATURES
  { icon: Rocket, title: "Season Pass", description: "Quarterly season passes with exclusive cosmetics and missions.", category: "New", new: true },
  { icon: Crown, title: "Prestige System", description: "Reset your character for exclusive prestige rewards and titles.", category: "New", new: true },
  { icon: Gem, title: "Gem Store", description: "Cosmetic-only store with character skins, emotes, and effects.", category: "New", new: true },
  { icon: Sparkles, title: "Daily Missions", description: "Fresh missions every day with escalating rewards.", category: "New", new: true },
  { icon: Rocket, title: "Weekly Challenges", description: "Server-wide challenges with community rewards on completion.", category: "New", new: true },
  { icon: Crown, title: "Faction Wars", description: "Monthly faction vs faction events with territory and cash prizes.", category: "New", new: true },
  { icon: Gem, title: "Loot Boxes", description: "Earn loot boxes from gameplay. No pay-to-win — cosmetics only.", category: "New", new: true },
  { icon: Sparkles, title: "Battle Pass", description: "Free and premium tracks with 100 tiers of rewards.", category: "New", new: true },
  { icon: Rocket, title: "Referral System", description: "Invite friends and earn bonus credits and exclusive items.", category: "New", new: true },
  { icon: Crown, title: "Legacy Titles", description: "Earn permanent titles based on your server history and achievements.", category: "New", new: true },
  { icon: Gem, title: "Custom Emotes", description: "100+ emotes including horror-themed animations.", category: "New", new: true },
  { icon: Sparkles, title: "Photo Mode", description: "Cinematic photo mode with filters, poses, and depth of field.", category: "New", new: true },
  { icon: Rocket, title: "Companion App", description: "Mobile app to check stats, manage inventory, and chat.", category: "New", new: true },
  { icon: Crown, title: "Server Lore Book", description: "In-game lore book updated by staff with city history.", category: "New", new: true },
  { icon: Gem, title: "Custom License Plates", description: "Design unique plates with custom text and borders.", category: "New", new: true },
];

const allCategories = ["All", ...Array.from(new Set(features.map(f => f.category)))];

export function FeaturesSection() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [showAll, setShowAll] = useState(false);

  const filtered = activeCategory === "All" ? features : features.filter(f => f.category === activeCategory);
  const displayed = showAll ? filtered : filtered.slice(0, 24);

  return (
    <section id="features" className="relative py-24 px-6 border-t border-border" style={{ background: "var(--gradient-dark)" }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-bold tracking-widest uppercase text-primary">Everything Included</span>
          <h2 className="mt-3 text-5xl md:text-6xl font-black uppercase">Server Features</h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            {features.length}+ features across roleplay, crime, law enforcement, economy, and horror.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {allCategories.map(cat => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setShowAll(false); }}
              className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition ${activeCategory === cat ? "text-primary-foreground" : "border border-border bg-secondary hover:bg-accent"}`}
              style={activeCategory === cat ? { background: "var(--gradient-blood)" } : {}}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayed.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div key={i} className="relative rounded-lg border border-border bg-card p-5 hover:border-primary/50 transition hover:-translate-y-0.5">
                {feature.new && (
                  <span className="absolute top-3 right-3 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full text-primary-foreground" style={{ background: "var(--gradient-blood)" }}>
                    NEW
                  </span>
                )}
                <Icon size={22} className="text-primary mb-3" />
                <h3 className="font-black text-sm uppercase tracking-wide">{feature.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                <div className="mt-3 text-[10px] font-bold uppercase tracking-widest text-primary/60">{feature.category}</div>
              </div>
            );
          })}
        </div>

        {filtered.length > 24 && (
          <div className="text-center mt-8">
            <button
              onClick={() => setShowAll(s => !s)}
              className="px-8 py-3 rounded text-sm font-bold uppercase tracking-widest border border-border bg-secondary hover:bg-accent transition"
            >
              {showAll ? "Show Less" : `Show All ${filtered.length} Features`}
            </button>
          </div>
        )}

        {/* Feature Count Banner */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Features", value: `${features.length}+` },
            { label: "Casino Games", value: "25" },
            { label: "Custom Vehicles", value: "500+" },
            { label: "Unique Jobs", value: "50+" },
          ].map(stat => (
            <div key={stat.label} className="rounded-lg border border-primary/30 bg-card p-6 text-center" style={{ boxShadow: "var(--shadow-glow)" }}>
              <div className="text-4xl font-black text-primary">{stat.value}</div>
              <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
