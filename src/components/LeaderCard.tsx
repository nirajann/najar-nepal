import { Link } from "react-router-dom";
import { getDistrictByName } from "../utils/mapHelpers";
import { allLeaders } from "../data/leaders/allLeaders";

type Municipality = {
  id: number;
  name: string;
};

type DistrictInfo = {
  id: number;
  name: string;
  province: string;
  municipalities: Municipality[];
};

type Props = {
  district: DistrictInfo | null;
};

function LeaderCard({ district }: Props) {
  const districtData = district ? getDistrictByName(district.name) : null;

  const mpLeader = districtData?.mp
    ? allLeaders.find((leader) => leader.id === districtData.mp?.leaderId)
    : null;

  const ministerLeader = districtData?.minister
    ? allLeaders.find((leader) => leader.id === districtData.minister?.leaderId)
    : null;

  const naLeaders =
    districtData?.nationalAssemblyMembers
      ?.map((member) =>
        allLeaders.find((leader) => leader.id === member.leaderId)
      )
      .filter(Boolean) || [];

  return (
    <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">District Leaders</h3>
          <p className="text-slate-500 mt-1">
            Real linked representatives for the selected district
          </p>
        </div>

        {district && (
          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
            {district.name}
          </span>
        )}
      </div>

      {!district || !districtData ? (
        <p className="text-slate-500">Select a district to view leaders.</p>
      ) : (
        <div className="space-y-4">
          <LeaderRow
            label="Member of Parliament"
            leader={mpLeader || null}
            fallbackName={districtData.mp?.name || "Not added yet"}
          />

          <LeaderRow
            label="Minister / National Executive Link"
            leader={ministerLeader || null}
            fallbackName={districtData.minister?.name || "Not added yet"}
          />

          {naLeaders.length > 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500 mb-3">
                National Assembly Members
              </p>

              <div className="space-y-3">
                {naLeaders.map((leader) =>
                  leader ? <LeaderMiniRow key={leader.id} leader={leader} /> : null
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500 mb-2">
                National Assembly Members
              </p>
              <p className="text-slate-500">Not added yet</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function LeaderRow({
  label,
  leader,
  fallbackName,
}: {
  label: string;
  leader: any | null;
  fallbackName: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm text-slate-500 mb-3">{label}</p>

      <div className="flex items-center gap-3">
        {leader?.photo ? (
          <img
            src={leader.photo}
            alt={leader.name}
            className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
          />
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-slate-200" />
        )}

        <div className="min-w-0">
          {leader ? (
            <Link
              to={`/leader/${leader.id}`}
              className="text-lg font-semibold text-blue-700 hover:underline"
            >
              {leader.name}
            </Link>
          ) : (
            <p className="text-lg font-semibold text-slate-900">{fallbackName}</p>
          )}

          <p className="text-sm text-slate-500 mt-1">
            {leader?.party || ""}
            {leader?.portfolio ? ` • ${leader.portfolio}` : ""}
          </p>

          <p className="text-sm text-slate-400 mt-1">
            {leader?.role || ""}
            {leader?.district ? ` • ${leader.district}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}

function LeaderMiniRow({ leader }: { leader: any }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white border border-slate-200 p-3">
      {leader?.photo ? (
        <img
          src={leader.photo}
          alt={leader.name}
          className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
        />
      ) : (
        <div className="w-12 h-12 rounded-2xl bg-slate-200" />
      )}

      <div className="min-w-0">
        <Link
          to={`/leader/${leader.id}`}
          className="text-base font-semibold text-blue-700 hover:underline"
        >
          {leader.name}
        </Link>

        <p className="text-sm text-slate-500 mt-1">
          {leader.party || ""}
          {leader.portfolio ? ` • ${leader.portfolio}` : ""}
        </p>
      </div>
    </div>
  );
}

export default LeaderCard;