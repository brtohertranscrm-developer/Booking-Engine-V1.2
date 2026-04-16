import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const useLockerCatalog = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Tangkap data dari home/pencarian
  const passedData = location.state || {};
  const startDate = passedData.startDate || '';
  const endDate = passedData.endDate || '';

  const [lockerLocations, setLockerLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  useEffect(() => {
    const fetchLockers = async () => {
      try {
        const response = await fetch(`${API_URL}/api/lockers`);
        const result = await response.json();

        if (result.success) {
          // Mengelompokkan data dari DB berdasarkan "location"
          const grouped = {};
          result.data.forEach((row) => {
            if (!grouped[row.location]) {
              grouped[row.location] = {
                id: row.location,
                name: `Garasi ${row.location}`,
                city: row.location.toLowerCase().includes('solo') ? 'Solo' : 'Yogyakarta',
                address: `Lokasi di ${row.location}`,
                features: ['Akses 24 Jam', 'CCTV Indoor'],
                image: row.location.toLowerCase().includes('solo') 
                  ? 'https://awsimages.detik.net.id/community/media/visual/2023/11/26/stasiun-solo-balapan_169.jpeg?w=1200' 
                  : 'https://img.harianjogja.com/posts/2023/02/03/1125184/stasiun-lempuyangan-ok.jpg',
                availability: {
                  Medium: { stock: 0, price: 25000 },
                  Large: { stock: 0, price: 40000 }
                }
              };
            }
            
            // Masukkan data ukuran, harga, dan stok ke dalam grupnya
            const sizeKey = row.size.toLowerCase().includes('large') ? 'Large' : 'Medium';
            grouped[row.location].availability[sizeKey] = {
              id: row.id,
              stock: row.stock,
              price: row.base_price
            };
          });

          setLockerLocations(Object.values(grouped));
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError('Gagal mengambil data loker. Pastikan backend menyala.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLockers();
  }, [API_URL]);

  const handleSelectLocker = (selectedSize, locationName) => {
    navigate('/checkout-loker', {
      state: { size: selectedSize, location: locationName, startDate, endDate }
    });
  };

  return { lockerLocations, isLoading, error, startDate, endDate, handleSelectLocker };
};