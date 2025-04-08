import NodeGeocoder from 'node-geocoder';

const options = {
  provider: 'openstreetmap',
  formatter: null
};

export const geocoder = NodeGeocoder(options);

export async function getCoordinatesFromZipCode(zipCode: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const results = await geocoder.geocode(zipCode);
    if (results.length > 0) {
      return {
        lat: results[0].latitude,
        lon: results[0].longitude
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}