import { ministers, type Leader } from "./ministers";
import { horMembers } from "./horMembers";
import { naMembers } from "./naMembers";
import { localRepresentatives } from "./localRepresentatives";

import balenshahImg from "../../assets/leaders/balenshah.jpg";
import bikramTimsinaImg from "../../assets/leaders/bikramtimsina.jpg";
import rabiLamichhaneImg from "../../assets/leaders/rabilamichhane.jpg";
import sasmitPokharelImg from "../../assets/leaders/sasmitpokharel.jpg";
import sobitaGautamImg from "../../assets/leaders/sobitagautam.jpg";
import sudhanGurungImg from "../../assets/leaders/sudhangurung.jpg";
import swarnimWagleImg from "../../assets/leaders/swarnimwagle.jpg";

export type AppLeader = Leader & {
  badge?: string;
  verified?: boolean;
  startYear?: string;
  endYear?: string;
  streak?: number;
};

const photoMap: Record<string, string> = {
  "balendra-shah-prime-minister": balenshahImg,
  "rabi-lamichhane-mp": rabiLamichhaneImg,
  "sobita-gautam-minister": sobitaGautamImg,
  "swarnim-wagle-minister": swarnimWagleImg,
  "sudhan-gurung-minister": sudhanGurungImg,
  "sasmit-pokharel-minister": sasmitPokharelImg,
  "bikram-timilsina-minister": bikramTimsinaImg,
};

const extraMeta: Record<
  string,
  {
    badge?: string;
    verified?: boolean;
    startYear?: string;
    endYear?: string;
    streak?: number;
    district?: string;
    province?: string;
  }
> = {
  "balendra-shah-prime-minister": {
    badge: "Head of Government",
    verified: true,
    startYear: "2026",
    endYear: "Present",
    streak: 14,
    district: "Kathmandu",
    province: "Bagmati",
  },
  "rabi-lamichhane-mp": {
    badge: "Senior RSP Leader",
    verified: true,
    startYear: "2026",
    endYear: "Present",
    streak: 9,
    district: "Chitwan",
    province: "Bagmati",
  },
  "sobita-gautam-minister": {
    badge: "Law Minister",
    verified: true,
    startYear: "2026",
    endYear: "Present",
    streak: 6,
    district: "Chitwan",
    province: "Bagmati",
  },
  "swarnim-wagle-minister": {
    badge: "Finance Minister",
    verified: true,
    startYear: "2026",
    endYear: "Present",
    streak: 10,
    district: "Tanahun",
    province: "Gandaki",
  },
  "sudhan-gurung-minister": {
    badge: "Home Affairs",
    verified: true,
    startYear: "2026",
    endYear: "Present",
    streak: 8,
    district: "Gorkha",
    province: "Gandaki",
  },
  "sasmit-pokharel-minister": {
    badge: "Education & Sports",
    verified: true,
    startYear: "2026",
    endYear: "Present",
    streak: 6,
    district: "Kathmandu",
    province: "Bagmati",
  },
  "bikram-timilsina-minister": {
    badge: "Communication & IT",
    verified: true,
    startYear: "2026",
    endYear: "Present",
    streak: 5,
    district: "Kathmandu",
    province: "Bagmati",
  },
};

function enrichLeader(leader: Leader): AppLeader {
  const meta = extraMeta[leader.id] || {};

  return {
    ...leader,
    district: leader.district || meta.district,
    province: leader.province || meta.province,
    photo: leader.photo || photoMap[leader.id] || "",
    badge: meta.badge,
    verified: meta.verified ?? false,
    startYear: meta.startYear,
    endYear: meta.endYear,
    streak: meta.streak,
  };
}

export const allLeaders: AppLeader[] = [
  ...ministers,
  ...horMembers,
  ...naMembers,
  ...localRepresentatives,
].map(enrichLeader);