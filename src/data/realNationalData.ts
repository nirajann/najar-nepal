export const nationalLeaders = {
  primeMinister: {
    name: "Balendra Shah",
    position: "Prime Minister of Nepal",
    party: "Rastriya Swatantra Party",
    profileId: "balendra-shah-pm",
  },
};

type DistrictLeaderData = {
  mp?: string;
  mpProfileId?: string;
  minister?: string;
  ministerProfileId?: string;
  mayor?: string;
  mayorProfileId?: string;
  partyMp?: string;
  partyMinister?: string;
  partyMayor?: string;
  ratingMp?: number;
  ratingMinister?: number;
  ratingMayor?: number;
  promises?: number;
  projects?: number;
  budget?: number;
  satisfaction?: number;
  updates?: string[];
};

const districtLeaderData: Record<string, DistrictLeaderData> = {
  chitwan: {
    mp: "Rabi Lamichhane",
    mpProfileId: "rabi-lamichhane-mp",
    minister: "Sobita Gautam",
    ministerProfileId: "sobita-gautam-minister",
    partyMp: "Rastriya Swatantra Party",
    partyMinister: "Rastriya Swatantra Party",
    ratingMp: 4.4,
    ratingMinister: 4.2,
    promises: 69,
    projects: 60,
    budget: 66,
    satisfaction: 76,
    updates: [
      "Public engagement data added for Chitwan leaders",
      "Profile links connected to leader profile page",
      "District updates available here",
    ],
  },

  kathmandu: {
    mp: "Data not added yet",
    mpProfileId: "kathmandu-mp",
    minister: "Balendra Shah",
    ministerProfileId: "balendra-shah-pm",
    partyMp: "Unknown",
    partyMinister: "Rastriya Swatantra Party",
    ratingMp: 3.8,
    ratingMinister: 4.9,
    promises: 72,
    projects: 64,
    budget: 68,
    satisfaction: 81,
    updates: [
      "National leadership profile linked",
      "District leader card connected",
    ],
  },

  tanahun: {
    mp: "Swarnim Wagle",
    mpProfileId: "swarnim-wagle-minister",
    minister: "Swarnim Wagle",
    ministerProfileId: "swarnim-wagle-minister",
    partyMp: "Rastriya Swatantra Party",
    partyMinister: "Rastriya Swatantra Party",
    ratingMp: 4.5,
    ratingMinister: 4.5,
    promises: 67,
    projects: 58,
    budget: 63,
    satisfaction: 79,
    updates: ["Finance-related profile linked"],
  },

  gorkha: {
    mp: "Data not added yet",
    mpProfileId: "gorkha-mp",
    minister: "Sudhan Gurung",
    ministerProfileId: "sudhan-gurung-minister",
    partyMp: "Unknown",
    partyMinister: "Rastriya Swatantra Party",
    ratingMp: 3.8,
    ratingMinister: 4.2,
    promises: 55,
    projects: 49,
    budget: 57,
    satisfaction: 68,
    updates: ["Minister profile linked"],
  },
};

export default districtLeaderData;