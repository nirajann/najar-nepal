import type { Leader } from "./ministers";

const NA_MEMBERS_URL = "https://na.parliament.gov.np/en/members";
const NA_DETAILS_PUBLICATION_URL =
  "https://na.parliament.gov.np/en/publication/1753960962";

export const naMembers: Leader[] = [
  {
    id: "narayan-prasad-dahal-na",
    name: "Narayan Prasad Dahal",
    role: "National Assembly Member",
    chamber: "National Assembly",
    party: "Communist Party Of Nepal (Maoist Center)",
    district: "Kaski",
    currentStatus: "Current",
    age: 70,
    birthPlace: "Dhikurpokhari, Lewadi, Kaski",
    permanentAddress: "Bharatpur Metropolitancity-14, Chitwan",
    officialSourceUrl: "https://na.parliament.gov.np/en/members/3348",
    electionSourceUrl: NA_MEMBERS_URL,
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
  id: "bimala-ghimire-na",
  name: "Bimala Ghimire",
  role: "National Assembly Member",
  chamber: "National Assembly",
  portfolio: "Vice Chairperson, National Assembly",
  party: "",
  currentStatus: "Current",
  officialSourceUrl: "https://na.parliament.gov.np/en/office-bearers",
  electionSourceUrl: "https://na.parliament.gov.np/en/members",
  photo: "",
  siteMetrics: {
    ratingAverage: 0,
    ratingCount: 0,
    likes: 0,
    dislikes: 0,
    comments: 0,
    followers: 0,
  },
}
];

export const naMeta = {
  directoryUrl: NA_MEMBERS_URL,
  publicationUrl: NA_DETAILS_PUBLICATION_URL,
};