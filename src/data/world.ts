import type { DayNightCycle, ParrotJoke } from '../types/game.js';

export const DAY_NIGHT_CYCLE = {
  duration: 480000,
  /* Længere nat-andel (tyve m.m.) så månen kan nå dybere/højere i løbet af den synlige nat — uden langsommere omløb. */
  phases: [
    { name: 'Morgen', time: 0,    lightColor: 0xffd27a, ambientColor: 0xffd8b0, intensity: 1.15, bgColor: 0xffe8c0, fogColor: 0xffd8a8, icon: '🌅' },
    { name: 'Dag',    time: 0.24, lightColor: 0xffffff, ambientColor: 0xffffff, intensity: 1.8,  bgColor: 0x87CEEB, fogColor: 0x87CEEB, icon: '☀️' },
    { name: 'Aften',  time: 0.46, lightColor: 0xff9040, ambientColor: 0xff8060, intensity: 1.1,  bgColor: 0xff7a50, fogColor: 0xff6040, icon: '🌇' },
    { name: 'Nat',    time: 0.70, lightColor: 0x4060c0, ambientColor: 0x203080, intensity: 0.3,  bgColor: 0x101840, fogColor: 0x080d20, icon: '🌙' },
  ]
} as const satisfies DayNightCycle;

export const RAT_FACTS: string[] = [
  '🐟 "Vidste du at torsk kan skifte køn? De starter som han og bliver hun!"',
  '🌊 "Havet dækker 71% af jordens overflade. Men vi fisker kun i 0,1% af det!"',
  '🎣 "Den ældste fiskekrog fundet er 23.000 år gammel. Fra Okinawa, Japan!"',
  '🐙 "En blæksprutte har tre hjerter og blåt blod. Og kan åbne skrueglas!"',
  '🦈 "Hajer har eksisteret i over 450 millioner år. Ældre end dinosaurerne!"',
  '🐡 "Kugfisken er giftigere end cyanid. Og en japansk delikatesse. Modig!"',
  '💀 "Pirater brugte faktisk sjældent jolly roger. Det var mest til at skræmme!"',
  '🌙 "Mange fisk er mere aktive om natten. Prøv at fiske ved midnat!"',
  '❄️ "Fisk i Arktis har specielt antifrysprotein i blodet. Naturens frostbeskyttelse!"',
  '🎵 "Fisk kommunikerer med lyde! Torsk brummer og sild... prutten!"',
  '🦀 "En hummer kan leve over 100 år. Og de vokser ved at skifte skal!"',
  '🔦 "Dybhavsfisk skaber deres eget lys. Bioluminescens — levende lysdioer!"',
  '🧂 "Den Døde Hav er så salt at ingen fisk overlever. Men du kan ikke synke!"',
  '🐬 "Delfiner sover med et halvt hjerne ad gangen. Altid lidt vågen!"',
  '⚡ "Stærelens kan generere 600 volt. Nok til at tænde en pære!"',
];

export const PARROT_JOKES: ParrotJoke[] = [
  { id: 'A', q: 'Hvad sagde den ene haj til den anden?', a: '"Haj haj!"' },
  { id: 'B', q: 'Hvorfor turde fisken ikke gå over vejen?', a: 'Fordi der var hajtænder!' },
  { id: 'C', q: 'Hvor rejser hajer hen på ferie?', a: 'Til Finland.' },
  { id: 'D', q: 'Hvorfor er fisk så grimme?', a: 'Fordi de er vandskabninger.' },
  { id: 'E', q: 'Hvordan får man en fisk til at dø af grin?', a: 'Man putter den i kildevand.' },
  { id: 'F', q: 'Hvad sagde den ene rødspætte til den anden?', a: '"Har du fem kroner, jeg kan låne?" – "Nej, jeg er helt flad!"' },
  { id: 'G', q: 'Hvorfor bor fisk i saltvand?', a: 'Fordi pebervand får dem til at nyse.' },
  { id: 'H', q: 'Hvad kalder man en haj, der kan lide at bygge?', a: 'En hammerhaj.' },
  { id: 'I', q: 'To fisk mødes. Den ene siger: "Hej!"', a: 'Den anden siger: "Hvor?!"' },
  { id: 'J', q: 'Hvilken sodavand drikker lystfiskere?', a: 'Lakse Kondi.' },
  { id: 'K', q: 'Hvilken kat har ingen pels?', a: 'En havkat.' },
  { id: 'L', q: 'Undskyld, men du må ikke fiske her!', a: '"Jeg fisker ikke – jeg bader bare mine regnorme."' },
  { id: 'M', q: 'Hvorfor fiskede Noah ikke ret meget fra arken?', a: 'Han havde kun to orm.' },
  { id: 'N', q: 'Hvem er den rigeste fisk?', a: 'En guldfisk.' },
  { id: 'O', q: 'Hvorfor vil fisk ikke spille basketball?', a: 'De er bange for nettet.' },
  { id: 'P', q: 'Hvorfor vokser fisk så hurtigt?', a: 'Fordi de bliver større hver gang fiskeren fortæller historien.' },
  { id: 'Q', q: 'En dreng ser en mand fiske og spørger:', a: '"Hvor lang tid tager det egentlig at lære en orm at svømme?"' },
];

export const PIRATE_QUOTES: string[] = [
  "Argh, en fin knogle! Den er mere værd end din stang!",
  "Dybets hemmeligheder... denne er særlig gammel.",
  "Mere, giv mig mere, landkrabbe! Jeg er aldrig mæt!",
  "Splitte mine bramsejl, smukt specimen!",
  "Rotteskæg er tilfreds. Det sker sjældent, nyd det.",
  "Arrr... mine gamle knogler kender disse. Fra havdybet!",
  "En skurk som mig behøver skatte fra fortiden. Godt arbejde.",
  "Ha! Piraternes guld ruster. Fossiler gør ikke. Klogt valg!",
];

export const BALLOON_HIDEOUTS = ['pier', 'cave', 'tropical_island', 'arctic_sea', 'desert_lake', 'fishing_cabin'] as const;
