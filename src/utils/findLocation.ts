export function findDistrictData(data: any, districtName: string) {
  const normalize = (str: string) =>
    str.toLowerCase().replace(/\s+/g, "");

  for (const province of data.provinceList) {
    for (const district of province.districtList) {
      if (normalize(district.name) === normalize(districtName)) {
        return {
          province: province.name,
          district: district.name,
          municipalities: district.municipalityList,
        };
      }
    }
  }

  return null;
}