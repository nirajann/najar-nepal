type Municipality = {
  id: number;
  name: string;
};

type RawDistrict = {
  id: number;
  name: string;
  municipalityList: Municipality[];
};

type RawProvince = {
  id: number;
  name: string;
  districtList: RawDistrict[];
};

type RawData = {
  provinceList: RawProvince[];
};

export type FlatDistrict = {
  id: number;
  name: string;
  province: string;
  municipalities: Municipality[];
};

export function flattenDistricts(data: RawData): FlatDistrict[] {
  const districts: FlatDistrict[] = [];

  for (const province of data.provinceList) {
    for (const district of province.districtList) {
      districts.push({
        id: district.id,
        name: district.name,
        province: province.name,
        municipalities: district.municipalityList || [],
      });
    }
  }

  return districts;
}