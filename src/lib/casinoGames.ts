// Casino Games Library — 25 games for City of Fears

export type CasinoGame = {
  id: string;
  name: string;
  description: string;
  minBet: number;
  maxBet: number;
  houseEdge: number; // percentage
  category: "slots" | "table" | "card" | "dice" | "wheel" | "arcade";
  icon: string;
  play: (bet: number) => { win: boolean; payout: number; message: string };
};

function rng() { return Math.random(); }

export const casinoGames: CasinoGame[] = [
  {
    id: "slots_classic",
    name: "Classic Slots",
    description: "3-reel classic slot machine. Match symbols to win big.",
    minBet: 100, maxBet: 5000, houseEdge: 5, category: "slots", icon: "🎰",
    play: (bet) => {
      const symbols = ["🍒","🍋","🍊","⭐","💎","7️⃣"];
      const reels = [symbols[Math.floor(rng()*symbols.length)], symbols[Math.floor(rng()*symbols.length)], symbols[Math.floor(rng()*symbols.length)]];
      if (reels[0]===reels[1] && reels[1]===reels[2]) {
        const mult = reels[0]==="💎" ? 50 : reels[0]==="7️⃣" ? 25 : reels[0]==="⭐" ? 10 : 5;
        return { win: true, payout: bet*mult, message: `JACKPOT! ${reels.join("")} — ${mult}x!` };
      }
      if (reels[0]===reels[1] || reels[1]===reels[2]) return { win: true, payout: bet*2, message: `Two of a kind! ${reels.join("")} — 2x` };
      return { win: false, payout: 0, message: `No match: ${reels.join("")}` };
    }
  },
  {
    id: "blackjack",
    name: "Blackjack",
    description: "Beat the dealer to 21 without going bust.",
    minBet: 200, maxBet: 10000, houseEdge: 2, category: "card", icon: "🃏",
    play: (bet) => {
      const card = () => Math.min(Math.floor(rng()*13)+1, 10);
      const hand = () => card()+card();
      const player = hand(); const dealer = hand();
      if (player > 21) return { win: false, payout: 0, message: `Bust! You: ${player}, Dealer: ${dealer}` };
      if (dealer > 21 || player > dealer) return { win: true, payout: bet*2, message: `Win! You: ${player}, Dealer: ${dealer}` };
      if (player === dealer) return { win: true, payout: bet, message: `Push! You: ${player}, Dealer: ${dealer}` };
      return { win: false, payout: 0, message: `Dealer wins. You: ${player}, Dealer: ${dealer}` };
    }
  },
  {
    id: "roulette",
    name: "Roulette",
    description: "Bet on red, black, or a number. The wheel decides.",
    minBet: 100, maxBet: 8000, houseEdge: 5.26, category: "wheel", icon: "🎡",
    play: (bet) => {
      const num = Math.floor(rng()*37);
      const red = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
      const isRed = red.includes(num);
      const choice = rng() > 0.5 ? "red" : "black";
      if (num === 0) return { win: false, payout: 0, message: `Zero! House wins. Number: 0` };
      if ((choice==="red" && isRed)||(choice==="black" && !isRed)) return { win: true, payout: bet*2, message: `${choice.toUpperCase()} wins! Number: ${num}` };
      return { win: false, payout: 0, message: `${isRed?"Red":"Black"} ${num} — you bet ${choice}` };
    }
  },
  {
    id: "dice_roll",
    name: "High-Low Dice",
    description: "Guess if the dice roll is high (4-6) or low (1-3).",
    minBet: 100, maxBet: 5000, houseEdge: 3, category: "dice", icon: "🎲",
    play: (bet) => {
      const roll = Math.floor(rng()*6)+1;
      const choice = rng() > 0.5 ? "high" : "low";
      const isHigh = roll >= 4;
      const win = (choice==="high" && isHigh)||(choice==="low" && !isHigh);
      return { win, payout: win ? bet*1.9 : 0, message: `Rolled ${roll} — you bet ${choice}` };
    }
  },
  {
    id: "poker_video",
    name: "Video Poker",
    description: "5-card draw poker against the machine.",
    minBet: 200, maxBet: 5000, houseEdge: 4, category: "card", icon: "♠️",
    play: (bet) => {
      const r = rng();
      if (r < 0.002) return { win: true, payout: bet*800, message: "ROYAL FLUSH! 800x!" };
      if (r < 0.01) return { win: true, payout: bet*50, message: "Straight Flush! 50x!" };
      if (r < 0.03) return { win: true, payout: bet*25, message: "Four of a Kind! 25x!" };
      if (r < 0.07) return { win: true, payout: bet*9, message: "Full House! 9x!" };
      if (r < 0.13) return { win: true, payout: bet*6, message: "Flush! 6x!" };
      if (r < 0.20) return { win: true, payout: bet*4, message: "Straight! 4x!" };
      if (r < 0.30) return { win: true, payout: bet*3, message: "Three of a Kind! 3x!" };
      if (r < 0.40) return { win: true, payout: bet*2, message: "Two Pair! 2x!" };
      if (r < 0.50) return { win: true, payout: bet*1, message: "Jacks or Better! 1x!" };
      return { win: false, payout: 0, message: "No winning hand." };
    }
  },
  {
    id: "crash",
    name: "Crash",
    description: "Watch the multiplier climb — cash out before it crashes!",
    minBet: 100, maxBet: 20000, houseEdge: 4, category: "arcade", icon: "📈",
    play: (bet) => {
      const crash = Math.max(1, 1/(rng()*0.04+0.01));
      const cashout = 1 + rng()*(crash*1.2-1);
      if (cashout <= crash) return { win: true, payout: Math.floor(bet*cashout), message: `Cashed out at ${cashout.toFixed(2)}x before crash at ${crash.toFixed(2)}x!` };
      return { win: false, payout: 0, message: `Crashed at ${crash.toFixed(2)}x — too late!` };
    }
  },
  {
    id: "mines",
    name: "Mines",
    description: "Navigate a 5x5 grid avoiding hidden mines for multiplying rewards.",
    minBet: 100, maxBet: 10000, houseEdge: 3, category: "arcade", icon: "💣",
    play: (bet) => {
      const mines = 5; const cells = 25;
      const safe = cells - mines;
      let mult = 1;
      let hit = false;
      for (let i = 0; i < Math.floor(rng()*safe)+1; i++) {
        if (rng() < mines/(cells-i)) { hit = true; break; }
        mult *= 1.2;
      }
      if (hit) return { win: false, payout: 0, message: `Hit a mine! Lost ${bet} credits.` };
      return { win: true, payout: Math.floor(bet*mult), message: `Cleared ${Math.floor(mult/1.2)} tiles! ${mult.toFixed(2)}x payout!` };
    }
  },
  {
    id: "baccarat",
    name: "Baccarat",
    description: "Bet on Player, Banker, or Tie in this classic card game.",
    minBet: 300, maxBet: 15000, houseEdge: 1.06, category: "card", icon: "🎴",
    play: (bet) => {
      const card = () => Math.min(Math.floor(rng()*13)+1, 10) % 10;
      const player = (card()+card()) % 10;
      const banker = (card()+card()) % 10;
      if (player === banker) return { win: true, payout: bet*9, message: `TIE! Both ${player} — 9x payout!` };
      if (player > banker) return { win: true, payout: bet*2, message: `Player wins! ${player} vs ${banker}` };
      return { win: false, payout: 0, message: `Banker wins. ${banker} vs ${player}` };
    }
  },
  {
    id: "keno",
    name: "Keno",
    description: "Pick numbers and match the draw for massive payouts.",
    minBet: 100, maxBet: 3000, houseEdge: 25, category: "table", icon: "🔢",
    play: (bet) => {
      const picks = Array.from({length:5}, ()=>Math.floor(rng()*80)+1);
      const draw = Array.from({length:20}, ()=>Math.floor(rng()*80)+1);
      const matches = picks.filter(p=>draw.includes(p)).length;
      const payouts = [0,1,3,10,50,200];
      const mult = payouts[matches] ?? 0;
      return { win: mult>0, payout: bet*mult, message: `Matched ${matches}/5 numbers! ${mult>0?`${mult}x`:"No win"}` };
    }
  },
  {
    id: "wheel_of_fortune",
    name: "Wheel of Fortune",
    description: "Spin the big wheel for random multipliers and bonuses.",
    minBet: 200, maxBet: 5000, houseEdge: 10, category: "wheel", icon: "🎡",
    play: (bet) => {
      const segments = [
        {label:"BANKRUPT",mult:0},{label:"1x",mult:1},{label:"2x",mult:2},{label:"1x",mult:1},
        {label:"3x",mult:3},{label:"1x",mult:1},{label:"5x",mult:5},{label:"2x",mult:2},
        {label:"JACKPOT",mult:20},{label:"1x",mult:1},{label:"2x",mult:2},{label:"1x",mult:1},
      ];
      const seg = segments[Math.floor(rng()*segments.length)];
      return { win: seg.mult>0, payout: bet*seg.mult, message: `Wheel landed on ${seg.label}!` };
    }
  },
  {
    id: "plinko",
    name: "Plinko",
    description: "Drop a ball through pegs and watch it land on a multiplier.",
    minBet: 100, maxBet: 5000, houseEdge: 5, category: "arcade", icon: "⚪",
    play: (bet) => {
      const slots = [0.2,0.5,1,2,5,10,5,2,1,0.5,0.2];
      let pos = 5;
      for (let i=0;i<8;i++) pos += rng()>0.5?1:-1;
      pos = Math.max(0,Math.min(10,pos));
      const mult = slots[pos];
      return { win: mult>=1, payout: Math.floor(bet*mult), message: `Ball landed on ${mult}x slot!` };
    }
  },
  {
    id: "scratch_card",
    name: "Scratch Card",
    description: "Scratch 3 panels — match symbols to win instant prizes.",
    minBet: 50, maxBet: 1000, houseEdge: 30, category: "arcade", icon: "🎟️",
    play: (bet) => {
      const syms = ["💰","💎","⭐","🔔","🍀","❌"];
      const panels = [syms[Math.floor(rng()*syms.length)],syms[Math.floor(rng()*syms.length)],syms[Math.floor(rng()*syms.length)]];
      if (panels[0]===panels[1]&&panels[1]===panels[2]) {
        const mult = panels[0]==="💎"?100:panels[0]==="💰"?50:panels[0]==="⭐"?20:10;
        return { win: true, payout: bet*mult, message: `MATCH! ${panels.join("")} — ${mult}x!` };
      }
      return { win: false, payout: 0, message: `No match: ${panels.join("")}` };
    }
  },
  {
    id: "war",
    name: "Casino War",
    description: "Draw a card — higher card wins. Simple and brutal.",
    minBet: 100, maxBet: 5000, houseEdge: 2.88, category: "card", icon: "⚔️",
    play: (bet) => {
      const player = Math.floor(rng()*13)+1;
      const dealer = Math.floor(rng()*13)+1;
      if (player > dealer) return { win: true, payout: bet*2, message: `You win! Your ${player} beats dealer's ${dealer}` };
      if (player === dealer) return { win: true, payout: bet, message: `War tie! Both drew ${player} — push` };
      return { win: false, payout: 0, message: `Dealer wins. ${dealer} beats your ${player}` };
    }
  },
  {
    id: "sic_bo",
    name: "Sic Bo",
    description: "Bet on the outcome of three dice. Ancient Chinese dice game.",
    minBet: 100, maxBet: 5000, houseEdge: 7.87, category: "dice", icon: "🎲",
    play: (bet) => {
      const d1=Math.floor(rng()*6)+1, d2=Math.floor(rng()*6)+1, d3=Math.floor(rng()*6)+1;
      const total=d1+d2+d3;
      const big = total>=11&&total<=17;
      const choice = rng()>0.5?"big":"small";
      const win = (choice==="big"&&big)||(choice==="small"&&!big);
      return { win, payout: win?bet*2:0, message: `Dice: ${d1}+${d2}+${d3}=${total} — you bet ${choice}` };
    }
  },
  {
    id: "hi_lo_cards",
    name: "Hi-Lo Cards",
    description: "Predict if the next card is higher or lower than the current one.",
    minBet: 100, maxBet: 3000, houseEdge: 4, category: "card", icon: "🃏",
    play: (bet) => {
      const current = Math.floor(rng()*13)+1;
      const next = Math.floor(rng()*13)+1;
      const choice = rng()>0.5?"higher":"lower";
      const win = (choice==="higher"&&next>current)||(choice==="lower"&&next<current);
      return { win, payout: win?bet*1.9:0, message: `Current: ${current}, Next: ${next} — you bet ${choice}` };
    }
  },
  {
    id: "dragon_tiger",
    name: "Dragon Tiger",
    description: "Two cards — Dragon or Tiger? Highest card wins.",
    minBet: 200, maxBet: 8000, houseEdge: 3.73, category: "card", icon: "🐉",
    play: (bet) => {
      const dragon = Math.floor(rng()*13)+1;
      const tiger = Math.floor(rng()*13)+1;
      const choice = rng()>0.5?"dragon":"tiger";
      if (dragon===tiger) return { win: false, payout: Math.floor(bet*0.5), message: `Tie! Dragon ${dragon} = Tiger ${tiger} — half bet returned` };
      const win = (choice==="dragon"&&dragon>tiger)||(choice==="tiger"&&tiger>dragon);
      return { win, payout: win?bet*2:0, message: `Dragon: ${dragon}, Tiger: ${tiger} — you bet ${choice}` };
    }
  },
  {
    id: "coin_flip",
    name: "Coin Flip",
    description: "Heads or tails — 50/50 with a slight house edge.",
    minBet: 100, maxBet: 10000, houseEdge: 2, category: "arcade", icon: "🪙",
    play: (bet) => {
      const result = rng()>0.51?"heads":"tails";
      const choice = rng()>0.5?"heads":"tails";
      const win = result===choice;
      return { win, payout: win?bet*1.96:0, message: `Coin landed on ${result} — you bet ${choice}` };
    }
  },
  {
    id: "slots_mega",
    name: "Mega Slots",
    description: "5-reel video slot with wilds, scatters, and free spins.",
    minBet: 200, maxBet: 10000, houseEdge: 6, category: "slots", icon: "🎰",
    play: (bet) => {
      const r = rng();
      if (r < 0.001) return { win: true, payout: bet*1000, message: "MEGA JACKPOT! 1000x!" };
      if (r < 0.005) return { win: true, payout: bet*100, message: "Major Jackpot! 100x!" };
      if (r < 0.02) return { win: true, payout: bet*25, message: "Free Spins Bonus! 25x!" };
      if (r < 0.08) return { win: true, payout: bet*10, message: "Wild Line! 10x!" };
      if (r < 0.20) return { win: true, payout: bet*3, message: "Scatter Win! 3x!" };
      if (r < 0.40) return { win: true, payout: bet*1.5, message: "Small win! 1.5x!" };
      return { win: false, payout: 0, message: "No win this spin." };
    }
  },
  {
    id: "craps",
    name: "Craps",
    description: "Roll the dice and bet on the outcome. Classic casino craps.",
    minBet: 200, maxBet: 8000, houseEdge: 1.41, category: "dice", icon: "🎲",
    play: (bet) => {
      const d1=Math.floor(rng()*6)+1, d2=Math.floor(rng()*6)+1;
      const total=d1+d2;
      if ([7,11].includes(total)) return { win: true, payout: bet*2, message: `Natural! Rolled ${total} (${d1}+${d2}) — Win!` };
      if ([2,3,12].includes(total)) return { win: false, payout: 0, message: `Craps! Rolled ${total} (${d1}+${d2}) — Lose` };
      const point = total;
      const d3=Math.floor(rng()*6)+1, d4=Math.floor(rng()*6)+1;
      const roll2=d3+d4;
      if (roll2===point) return { win: true, payout: bet*2, message: `Hit the point ${point}! Rolled ${roll2} — Win!` };
      return { win: false, payout: 0, message: `Rolled 7 before point ${point} — Lose` };
    }
  },
  {
    id: "three_card_poker",
    name: "Three Card Poker",
    description: "Three cards, beat the dealer's hand.",
    minBet: 300, maxBet: 10000, houseEdge: 3.37, category: "card", icon: "♣️",
    play: (bet) => {
      const r = rng();
      if (r < 0.002) return { win: true, payout: bet*40, message: "Mini Royal! 40x!" };
      if (r < 0.01) return { win: true, payout: bet*30, message: "Straight Flush! 30x!" };
      if (r < 0.03) return { win: true, payout: bet*6, message: "Three of a Kind! 6x!" };
      if (r < 0.10) return { win: true, payout: bet*4, message: "Straight! 4x!" };
      if (r < 0.20) return { win: true, payout: bet*3, message: "Flush! 3x!" };
      if (r < 0.45) return { win: true, payout: bet*2, message: "Pair! 2x!" };
      return { win: false, payout: 0, message: "Dealer wins. No qualifying hand." };
    }
  },
  {
    id: "slots_horror",
    name: "Horror Slots",
    description: "City of Fears themed slot — skulls, ghosts, and blood.",
    minBet: 100, maxBet: 5000, houseEdge: 5, category: "slots", icon: "💀",
    play: (bet) => {
      const symbols = ["💀","👻","🩸","🕷️","🔪","🌙"];
      const reels = [symbols[Math.floor(rng()*symbols.length)],symbols[Math.floor(rng()*symbols.length)],symbols[Math.floor(rng()*symbols.length)]];
      if (reels[0]===reels[1]&&reels[1]===reels[2]) {
        const mult = reels[0]==="💀"?100:reels[0]==="👻"?50:reels[0]==="🩸"?30:15;
        return { win: true, payout: bet*mult, message: `HORROR JACKPOT! ${reels.join("")} — ${mult}x!` };
      }
      if (reels[0]===reels[1]||reels[1]===reels[2]) return { win: true, payout: bet*2, message: `Pair! ${reels.join("")} — 2x` };
      return { win: false, payout: 0, message: `No match: ${reels.join("")}` };
    }
  },
  {
    id: "number_guess",
    name: "Number Guess",
    description: "Guess a number 1-10. Hit it exactly for a 9x payout.",
    minBet: 100, maxBet: 5000, houseEdge: 10, category: "arcade", icon: "🔮",
    play: (bet) => {
      const secret = Math.floor(rng()*10)+1;
      const guess = Math.floor(rng()*10)+1;
      if (guess===secret) return { win: true, payout: bet*9, message: `EXACT MATCH! Number was ${secret} — 9x!` };
      if (Math.abs(guess-secret)===1) return { win: true, payout: bet*2, message: `Close! Guessed ${guess}, was ${secret} — 2x` };
      return { win: false, payout: 0, message: `Wrong! Guessed ${guess}, was ${secret}` };
    }
  },
  {
    id: "red_dog",
    name: "Red Dog",
    description: "Bet that the third card falls between the first two.",
    minBet: 200, maxBet: 5000, houseEdge: 3.15, category: "card", icon: "🐕",
    play: (bet) => {
      const c1=Math.floor(rng()*13)+1, c2=Math.floor(rng()*13)+1;
      const lo=Math.min(c1,c2), hi=Math.max(c1,c2);
      if (lo===hi) return { win: false, payout: bet, message: `Pair! ${c1} & ${c2} — push` };
      const spread = hi-lo-1;
      const c3=Math.floor(rng()*13)+1;
      const win = c3>lo&&c3<hi;
      const mult = spread<=1?5:spread<=4?2:1.5;
      return { win, payout: win?Math.floor(bet*mult):0, message: `Cards: ${lo}-${hi}, Third: ${c3} — ${win?`Win ${mult}x`:"Lose"}` };
    }
  },
  {
    id: "lucky_sevens",
    name: "Lucky Sevens",
    description: "Roll three dice — sevens are wild and multiply your bet.",
    minBet: 100, maxBet: 3000, houseEdge: 8, category: "dice", icon: "7️⃣",
    play: (bet) => {
      const dice = [Math.floor(rng()*6)+1,Math.floor(rng()*6)+1,Math.floor(rng()*6)+1];
      // Note: a d6 cannot roll 7, so 6 is the "lucky" number
      const sixes = dice.filter(d=>d===6).length;
      if (sixes===3) return { win: true, payout: bet*77, message: `TRIPLE LUCKY! 6-6-6 — 77x!` };
      if (sixes===2) return { win: true, payout: bet*7, message: `Double Lucky! Two 6s — 7x!` };
      if (sixes===1) return { win: true, payout: bet*2, message: `Lucky! One 6 — 2x!` };
      const total=dice.reduce((a,b)=>a+b,0);
      return { win: false, payout: 0, message: `No luck. Rolled ${dice.join("-")} = ${total}` };
    }
  },
  {
    id: "caribbean_stud",
    name: "Caribbean Stud",
    description: "5-card stud poker against the dealer with a progressive jackpot.",
    minBet: 500, maxBet: 15000, houseEdge: 5.22, category: "card", icon: "🌴",
    play: (bet) => {
      const r = rng();
      if (r < 0.001) return { win: true, payout: bet*200, message: "Royal Flush! Progressive Jackpot! 200x!" };
      if (r < 0.005) return { win: true, payout: bet*50, message: "Straight Flush! 50x!" };
      if (r < 0.02) return { win: true, payout: bet*20, message: "Four of a Kind! 20x!" };
      if (r < 0.05) return { win: true, payout: bet*7, message: "Full House! 7x!" };
      if (r < 0.10) return { win: true, payout: bet*5, message: "Flush! 5x!" };
      if (r < 0.18) return { win: true, payout: bet*4, message: "Straight! 4x!" };
      if (r < 0.28) return { win: true, payout: bet*3, message: "Three of a Kind! 3x!" };
      if (r < 0.40) return { win: true, payout: bet*2, message: "Two Pair! 2x!" };
      if (r < 0.52) return { win: true, payout: bet*1, message: "One Pair! 1x!" };
      return { win: false, payout: 0, message: "Dealer wins. No qualifying hand." };
    }
  },
];

export function getGameById(id: string): CasinoGame | undefined {
  return casinoGames.find(g => g.id === id);
}

export function getGamesByCategory(category: CasinoGame["category"]): CasinoGame[] {
  return casinoGames.filter(g => g.category === category);
}
