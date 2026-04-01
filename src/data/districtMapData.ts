import type { ProvinceMapItem } from "./mapSchema";

export const districtMapData: ProvinceMapItem[] = [
  {
    id: 3,
    name: "Bagmati Province",
    districts: [
      {
        id: 301,
        name: "Kathmandu",
        province: "Bagmati Province",
        mp: null,
        minister: {
          leaderId: "balendra-shah-prime-minister",
          name: "Balendra Shah",
          role: "Prime Minister",
        },
        nationalAssemblyMembers: [],
        localLevels: [
          {
            id: 30101,
            name: "Kathmandu Metropolitan City",
            type: "Metropolitan City",
            wardCount: 32,
            mayorOrChairperson: null,
          },
          {
            id: 30102,
            name: "Kageshwori Manohara Municipality",
            type: "Municipality",
            wardCount: 9,
            mayorOrChairperson: null,
          },
          {
            id: 30103,
            name: "Tokha Municipality",
            type: "Municipality",
            wardCount: 11,
            mayorOrChairperson: null,
          },
        ],
        quickStats: {
          satisfactionScore: 0,
        },
      },
      {
        id: 302,
        name: "Chitwan",
        province: "Bagmati Province",
        mp: {
          leaderId: "rabi-lamichhane-mp",
          name: "Rabi Lamichhane",
          role: "MP",
        },
        minister: {
          leaderId: "sobita-gautam-minister",
          name: "Sobita Gautam",
          role: "Minister",
        },
        nationalAssemblyMembers: [],
        localLevels: [
          {
            id: 30201,
            name: "Bharatpur Metropolitan City",
            type: "Metropolitan City",
            wardCount: 29,
            mayorOrChairperson: null,
          },
          {
            id: 30202,
            name: "Kalika Municipality",
            type: "Municipality",
            wardCount: 11,
            mayorOrChairperson: null,
          },
          {
            id: 30203,
            name: "Khairahani Municipality",
            type: "Municipality",
            wardCount: 13,
            mayorOrChairperson: null,
          },
          {
            id: 30204,
            name: "Madi Municipality",
            type: "Municipality",
            wardCount: 9,
            mayorOrChairperson: null,
          },
          {
            id: 30205,
            name: "Ratnanagar Municipality",
            type: "Municipality",
            wardCount: 16,
            mayorOrChairperson: null,
          },
          {
            id: 30206,
            name: "Ichchha Kamana Rural Municipality",
            type: "Rural Municipality",
            wardCount: 7,
            mayorOrChairperson: null,
          },
        ],
        quickStats: {
          satisfactionScore: 0,
        },
      },
    ],
  },
  {
    id: 4,
    name: "Gandaki Province",
    districts: [
      {
        id: 401,
        name: "Kaski",
        province: "Gandaki Province",
        mp: null,
        minister: null,
        nationalAssemblyMembers: [
          {
            leaderId: "narayan-prasad-dahal-na",
            name: "Narayan Prasad Dahal",
            role: "National Assembly Member",
          },
        ],
        localLevels: [
          {
            id: 40101,
            name: "Pokhara Metropolitan City",
            type: "Metropolitan City",
            wardCount: 33,
            mayorOrChairperson: null,
          },
          {
            id: 40102,
            name: "Annapurna Rural Municipality",
            type: "Rural Municipality",
            wardCount: 11,
            mayorOrChairperson: null,
          },
          {
            id: 40103,
            name: "Machhapuchchhre Rural Municipality",
            type: "Rural Municipality",
            wardCount: 9,
            mayorOrChairperson: null,
          },
          {
            id: 40104,
            name: "Madi Rural Municipality",
            type: "Rural Municipality",
            wardCount: 12,
            mayorOrChairperson: null,
          },
          {
            id: 40105,
            name: "Rupa Rural Municipality",
            type: "Rural Municipality",
            wardCount: 7,
            mayorOrChairperson: null,
          },
        ],
        quickStats: {
          satisfactionScore: 0,
        },
      },
      {
        id: 402,
        name: "Gorkha",
        province: "Gandaki Province",
        mp: null,
        minister: {
          leaderId: "sudhan-gurung-minister",
          name: "Sudhan Gurung",
          role: "Minister",
        },
        nationalAssemblyMembers: [],
        localLevels: [],
        quickStats: {
          satisfactionScore: 0,
        },
      },
      {
        id: 403,
        name: "Tanahun",
        province: "Gandaki Province",
        mp: {
          leaderId: "swarnim-wagle-minister",
          name: "Swarnim Wagle",
          role: "MP",
        },
        minister: {
          leaderId: "swarnim-wagle-minister",
          name: "Swarnim Wagle",
          role: "Minister",
        },
        nationalAssemblyMembers: [],
        localLevels: [],
        quickStats: {
          satisfactionScore: 0,
        },
      },
    ],
  },
];