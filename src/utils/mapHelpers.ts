import { districtMapData } from "../data/districtMapData";
import type { DistrictMapItem, ProvinceMapItem } from "../data/mapSchema";

export function getDistrictByName(name: string): DistrictMapItem | null {
  const lower = name.trim().toLowerCase();

  for (const province of districtMapData) {
    for (const district of province.districts) {
      if (district.name.toLowerCase() === lower) {
        return district;
      }
    }
  }

  return null;
}

export function getProvinceNames(): string[] {
  return districtMapData.map((province: ProvinceMapItem) => province.name);
}

export function getAllDistrictsFlat(): DistrictMapItem[] {
  return districtMapData.flatMap((province: ProvinceMapItem) => province.districts);
} 