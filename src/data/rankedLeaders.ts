import balenshahImg from "../assets/leaders/balenshah.jpg";
import bikramTimsinaImg from "../assets/leaders/bikramtimsina.jpg";
import rabiLamichhaneImg from "../assets/leaders/rabilamichhane.jpg";
import sasmitPokharelImg from "../assets/leaders/sasmitpokharel.jpg";
import sobitaGautamImg from "../assets/leaders/sobitagautam.jpg";
import sudhanGurungImg from "../assets/leaders/sudhangurung.jpg";
import swarnimWagleImg from "../assets/leaders/swarnimwagle.jpg";

export type RankedLeader = {
  id: string;
  name: string;
  position: "Prime Minister" | "Minister" | "MP";
  currentStatus: "Current" | "Former";
  party: string;
  district: string;
  province?: string;
  likes: number;
  dislikes: number;
  rating: number;
  comments: number;
  followers: number;
  verified: boolean;
  startYear: string;
  endYear: string;
  streak: number;
  badge: string;
  photo: string;
};

export const rankedLeaders: RankedLeader[] = [
  {
    id: "balendra-shah-pm",
    name: "Balendra Shah",
    position: "Prime Minister",
    currentStatus: "Current",
    party: "Rastriya Swatantra Party",
    district: "Kathmandu",
    province: "Bagmati",
    likes: 980,
    dislikes: 110,
    rating: 4.9,
    comments: 320,
    followers: 5200,
    verified: true,
    startYear: "2026",
    endYear: "Present",
    streak: 14,
    badge: "Head of Government",
    photo: balenshahImg,
  },
  {
    id: "rabi-lamichhane-mp",
    name: "Rabi Lamichhane",
    position: "MP",
    currentStatus: "Current",
    party: "Rastriya Swatantra Party",
    district: "Chitwan",
    province: "Bagmati",
    likes: 620,
    dislikes: 140,
    rating: 4.4,
    comments: 160,
    followers: 2600,
    verified: true,
    startYear: "2026",
    endYear: "Present",
    streak: 9,
    badge: "Senior RSP Leader",
    photo: rabiLamichhaneImg,
  },
  {
    id: "sobita-gautam-minister",
    name: "Sobita Gautam",
    position: "Minister",
    currentStatus: "Current",
    party: "Rastriya Swatantra Party",
    district: "Chitwan",
    province: "Bagmati",
    likes: 350,
    dislikes: 44,
    rating: 4.2,
    comments: 87,
    followers: 1450,
    verified: true,
    startYear: "2026",
    endYear: "Present",
    streak: 6,
    badge: "Law Minister",
    photo: sobitaGautamImg,
  },
  {
    id: "swarnim-wagle-minister",
    name: "Swarnim Wagle",
    position: "Minister",
    currentStatus: "Current",
    party: "Rastriya Swatantra Party",
    district: "Tanahun",
    province: "Gandaki",
    likes: 540,
    dislikes: 80,
    rating: 4.5,
    comments: 155,
    followers: 2300,
    verified: true,
    startYear: "2026",
    endYear: "Present",
    streak: 10,
    badge: "Finance Minister",
    photo: swarnimWagleImg,
  },
  {
    id: "sudhan-gurung-minister",
    name: "Sudhan Gurung",
    position: "Minister",
    currentStatus: "Current",
    party: "Rastriya Swatantra Party",
    district: "Gorkha",
    province: "Gandaki",
    likes: 410,
    dislikes: 76,
    rating: 4.2,
    comments: 110,
    followers: 1700,
    verified: true,
    startYear: "2026",
    endYear: "Present",
    streak: 8,
    badge: "Home Affairs",
    photo: sudhanGurungImg,
  },
  {
    id: "sasmit-pokharel-minister",
    name: "Sasmit Pokharel",
    position: "Minister",
    currentStatus: "Current",
    party: "Rastriya Swatantra Party",
    district: "Kathmandu",
    province: "Bagmati",
    likes: 360,
    dislikes: 52,
    rating: 4.1,
    comments: 95,
    followers: 1500,
    verified: true,
    startYear: "2026",
    endYear: "Present",
    streak: 6,
    badge: "Education & Sports",
    photo: sasmitPokharelImg,
  },
  {
    id: "bikram-timilsina-minister",
    name: "Bikram Timilsina",
    position: "Minister",
    currentStatus: "Current",
    party: "Rastriya Swatantra Party",
    district: "Kathmandu",
    province: "Bagmati",
    likes: 305,
    dislikes: 48,
    rating: 4.0,
    comments: 82,
    followers: 1350,
    verified: true,
    startYear: "2026",
    endYear: "Present",
    streak: 5,
    badge: "Communication & IT",
    photo: bikramTimsinaImg,
  },
];