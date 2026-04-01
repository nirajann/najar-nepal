export type LeaderRef = {
  leaderId: string;
  name: string;
  role:
    | "Prime Minister"
    | "Minister"
    | "MP"
    | "National Assembly Member"
    | "Mayor"
    | "Chairperson";
};

export type LocalLevel = {
  id: number;
  name: string;
  type:
    | "Metropolitan City"
    | "Sub-Metropolitan City"
    | "Municipality"
    | "Rural Municipality";
  wardCount?: number;
  mayorOrChairperson?: LeaderRef | null;
};

export type DistrictMapItem = {
  id: number;
  name: string;
  province: string;
  mp?: LeaderRef | null;
  nationalAssemblyMembers?: LeaderRef[];
  minister?: LeaderRef | null;
  localLevels: LocalLevel[];
  quickStats?: {
    populationLabel?: string;
    areaLabel?: string;
    satisfactionScore?: number;
  };
};

export type ProvinceMapItem = {
  id: number;
  name: string;
  districts: DistrictMapItem[];
};