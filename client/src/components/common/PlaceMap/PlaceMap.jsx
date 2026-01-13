import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import styles from './PlaceMap.module.css';

// Fix marker icon issue with Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

/**
 * PlaceMap Component - Hiển thị vị trí địa điểm trên bản đồ
 * 
 * @param {Object} location - Tọa độ {lat, lng} của địa điểm
 * @param {string} placeName - Tên địa điểm (hiển thị trong popup)
 * @param {string} address - Địa chỉ (hiển thị trong popup)
 */
const PlaceMap = ({ location, placeName, address }) => {
  const mapRef = useRef(null);

  // Default Hanoi center nếu không có tọa độ
  const defaultCenter = [21.028511, 105.804817]; // Hồ Hoàn Kiếm, Hà Nội
  const center = location?.lat && location?.lng 
    ? [location.lat, location.lng] 
    : defaultCenter;

  useEffect(() => {
    // Invalidate size khi component mount để fix display issue
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current.invalidateSize();
      }, 100);
    }
  }, []);

  if (!location?.lat || !location?.lng) {
    return (
      <div className={styles.noMapContainer}>
        <div className={styles.noMapIcon}>🗺️</div>
        <p className={styles.noMapText}>Không có thông tin vị trí</p>
      </div>
    );
  }

  return (
    <div className={styles.mapContainer}>
      <MapContainer
        center={center}
        zoom={16}
        scrollWheelZoom={false}
        className={styles.map}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={center}>
          <Popup>
            <div className={styles.popupContent}>
              <strong>{placeName}</strong>
              <p>{address}</p>
              <a 
                href={`https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.directionsLink}
              >
                📍 Chỉ đường
              </a>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default PlaceMap;
