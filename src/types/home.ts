export type LocalLevel = {
  name: string;
  type?: string;
  wardCount?: number;
};

export type LeaderRef = {
  _id?: string;
  leaderId: string;
  name: string;
  role: string;
  party?: string;
  portfolio?: string;
  photo?: string;
};

export type DistrictInfo = {
  _id?: string;
  districtId: string;
  name: string;
  province: string;
  localLevels: LocalLevel[];
  mpLeader?: LeaderRef | null;
  ministerLeader?: LeaderRef | null;
  naLeaders?: LeaderRef[];
  satisfactionScore?: number;
};