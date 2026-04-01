import type { Leader } from "./ministers";

import rabiLamichhaneImg from "../../assets/leaders/rabilamichhane.jpg";
import sobitaGautamImg from "../../assets/leaders/sobitagautam.jpg";

export const localRepresentatives: Leader[] = [
  {
    id: "rabi-lamichhane-mp",
    name: "Rabi Lamichhane",
    role: "MP",
    chamber: "House of Representatives",
    party: "Rastriya Swatantra Party",
    district: "Chitwan",
    province: "Bagmati",
    currentStatus: "Current",
    photo: rabiLamichhaneImg,
    officialSourceUrl: "",
    electionSourceUrl: "",
    siteMetrics: {
      ratingAverage: 0,
      ratingCount: 0,
      likes: 0,
      dislikes: 0,
      comments: 0,
      followers: 0,
    },
  },
  {
    id: "sobita-gautam-minister",
    name: "Sobita Gautam",
    role: "Minister",
    party: "Rastriya Swatantra Party",
    district: "Chitwan",
    province: "Bagmati",
    currentStatus: "Current",
    photo: sobitaGautamImg,
    officialSourceUrl: "",
    electionSourceUrl: "",
    siteMetrics: {
      ratingAverage: 0,
      ratingCount: 0,
      likes: 0,
      dislikes: 0,
      comments: 0,
      followers: 0,
    },
  },
];