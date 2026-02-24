import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom colored marker for better visibility on grayscale map
const coloredMarkerIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `
    <div style="
      width: 24px;
      height: 24px;
      background: #DC2626;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(220, 38, 38, 0.5);
    "></div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

export default function WorkspacesMap({ workspaces, center }) {
  return (
    <MapContainer
      center={center}
      zoom={12}
      style={{ height: '500px', width: '100%' }}
      className="grayscale"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap'
      />
      {workspaces
        .filter(workspace => workspace.latitude && workspace.longitude)
        .map((workspace, index) => (
        <Marker key={index} position={[workspace.latitude, workspace.longitude]} icon={coloredMarkerIcon}>
          <Popup>
            <div className="p-2 font-sans">
              <h3 className="font-bold text-sm mb-1">{workspace.name}</h3>
              <p className="text-xs text-gray-600 mb-2">{workspace.address}</p>
              {workspace.website && (
                <a
                  href={workspace.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  Visit Website →
                </a>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
