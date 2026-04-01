import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import { useState } from "react";

type Props = {
  setSelectedDistrict: (district: string) => void;
};

// Handle map click
function MapClickHandler({ onClick }: any) {
  useMapEvents({
    click(e) {
      onClick(e.latlng);
    },
  });
  return null;
}

function MapSection({ setSelectedDistrict }: Props) {
  const [position, setPosition] = useState<[number, number] | null>(null);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <h2 className="text-blue-600 font-semibold mb-3">
        Nepal Map (Click Anywhere)
      </h2>

      <MapContainer
        center={[28.3949, 84.1240]}
        zoom={7}
        className="h-64 rounded-lg"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Click logic */}
        <MapClickHandler
          onClick={(latlng: any) => {
            const newPos: [number, number] = [latlng.lat, latlng.lng];
            setPosition(newPos);

            // TEMP: Fake district (we will make real next step)
            if (latlng.lat > 27.7) {
              setSelectedDistrict("Kathmandu");
            } else {
              setSelectedDistrict("Lalitpur");
            }
          }}
        />

        {/* Marker */}
        {position && (
          <Marker position={position}>
            <Popup>Selected Location</Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Filters */}
      <div className="flex gap-4 mt-4">
        <select className="border px-3 py-2 rounded text-sm">
          <option>Bagmati Province</option>
        </select>

        <select className="border px-3 py-2 rounded text-sm">
          <option>Select District</option>
        </select>
      </div>
    </div>
  );
}

export default MapSection;