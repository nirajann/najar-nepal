import type { Leader } from "./ministers";

const HOR_MEMBERS_URL = "https://hr.parliament.gov.np/en/members";
const HOR_DETAILS_PUBLICATION_URL =
  "https://hr.parliament.gov.np/en/publication/1753960962";

export const horMembers: Leader[] = [
  {
    id: "devraj-ghimire-mp",
    name: "Devraj Ghimire",
    role: "MP",
    chamber: "House of Representatives",
    party: "Nepal Communist Party (UML)",
    district: "Jhapa",
    currentStatus: "Current",
    age: 69,
    officialSourceUrl: "https://hr.parliament.gov.np/en/members/3354",
    electionSourceUrl: HOR_MEMBERS_URL,
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

  // Add the rest in verified chunks from the official directory/publication.
];

export const horMeta = {
  directoryUrl: HOR_MEMBERS_URL,
  publicationUrl: HOR_DETAILS_PUBLICATION_URL,
};