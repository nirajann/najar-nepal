export type LeaderRole =
  | "Prime Minister"
  | "Minister"
  | "MP"
  | "National Assembly Member"
  | "Mayor"
  | "Chairperson";

export type Leader = {
  id: string;
  name: string;
  role: LeaderRole;
  chamber?: "House of Representatives" | "National Assembly";
  portfolio?: string;
  party: string;
  district?: string;
  province?: string;
  localLevel?: string;
  ward?: string;
  currentStatus: "Current" | "Former";
  age?: number;
  birthPlace?: string;
  permanentAddress?: string;
  gender?: string;
  photo?: string;
  officialSourceUrl: string;
  electionSourceUrl?: string;
  siteMetrics: {
    ratingAverage: number;
    ratingCount: number;
    likes: number;
    dislikes: number;
    comments: number;
    followers: number;
  };
};

const OPMCM_MINISTERS_URL = "https://opmcm.gov.np/pages/ministers-pages/";

export const ministers: Leader[] = [
  {
    id: "balendra-shah-prime-minister",
    name: "Balendra Shah",
    role: "Prime Minister",
    portfolio: "Defence; Industry, Commerce and Supplies",
    party: "Rastriya Swatantra Party",
    currentStatus: "Current",
    officialSourceUrl: OPMCM_MINISTERS_URL,
    photo: "",
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
    id: "swarnim-wagle-minister",
    name: "Swarnim Wagle",
    role: "Minister",
    portfolio: "Finance",
    party: "Rastriya Swatantra Party",
    currentStatus: "Current",
    officialSourceUrl: OPMCM_MINISTERS_URL,
    photo: "",
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
    id: "sudhan-gurung-minister",
    name: "Sudhan Gurung",
    role: "Minister",
    portfolio: "Home Affairs",
    party: "Rastriya Swatantra Party",
    currentStatus: "Current",
    officialSourceUrl: OPMCM_MINISTERS_URL,
    photo: "",
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
    id: "shishir-khanal-minister",
    name: "Shishir Khanal",
    role: "Minister",
    portfolio: "Foreign Affairs",
    party: "Rastriya Swatantra Party",
    currentStatus: "Current",
    officialSourceUrl: OPMCM_MINISTERS_URL,
    photo: "",
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
    id: "sunil-lamsal-minister",
    name: "Sunil Lamsal",
    role: "Minister",
    portfolio: "Physical Infrastructure and Transport; Urban Development",
    party: "Rastriya Swatantra Party",
    currentStatus: "Current",
    officialSourceUrl: OPMCM_MINISTERS_URL,
    photo: "",
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
    id: "biraj-bhakta-shrestha-minister",
    name: "Biraj Bhakta Shrestha",
    role: "Minister",
    portfolio: "Energy, Water Resources and Irrigation",
    party: "Rastriya Swatantra Party",
    currentStatus: "Current",
    officialSourceUrl: OPMCM_MINISTERS_URL,
    photo: "",
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
    id: "khadka-raj-paudel-minister",
    name: "Khadka Raj Paudel",
    role: "Minister",
    portfolio: "Culture, Tourism and Civil Aviation",
    party: "Rastriya Swatantra Party",
    currentStatus: "Current",
    officialSourceUrl: OPMCM_MINISTERS_URL,
    photo: "",
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
    id: "sasmit-pokharel-minister",
    name: "Sasmit Pokharel",
    role: "Minister",
    portfolio: "Education, Science and Technology; Youth and Sports",
    party: "Rastriya Swatantra Party",
    currentStatus: "Current",
    officialSourceUrl: OPMCM_MINISTERS_URL,
    photo: "",
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