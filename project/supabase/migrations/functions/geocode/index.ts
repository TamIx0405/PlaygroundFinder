import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json'
};

async function searchLocation(query: string, options: { limit?: number; countrycodes?: string; addressdetails?: number } = {}): Promise<any[]> {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    countrycodes: options.countrycodes || 'de',
    addressdetails: (options.addressdetails || 1).toString(),
    limit: (options.limit || 10).toString()
  });

  console.log(`Searching for location with query: ${query}`);

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        headers: {
          'User-Agent': 'PlaygroundFinder/1.0',
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Geocoding service error: ${response.status} ${response.statusText}`);
    }

    const results = await response.json();

    if (!Array.isArray(results)) {
      throw new Error('Invalid response format from geocoding service');
    }

    return results;
  } catch (error) {
    console.error('Search location error:', error);
    throw new Error(`Geocoding service error: ${error.message}`);
  }
}

function validateAddress(address: string): { streetAddress: string; city: string } {
  const addressParts = address.split(',').map(part => part.trim());

  if (addressParts.length < 2) {
    throw new Error('Please enter at least street and city');
  }

  const streetAddress = addressParts[0];
  const city = addressParts[1];

  if (streetAddress.length < 2) {
    throw new Error('Invalid street format. Please provide at least the street name');
  }

  if (city.length < 2) {
    throw new Error('Please provide a valid city name');
  }

  return { streetAddress, city };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const { zipCode, address } = await req.json();

    if (!zipCode || typeof zipCode !== 'string') {
      throw new Error('ZIP code is required');
    }

    if (!address || typeof address !== 'string') {
      throw new Error('Address is required');
    }

    if (!/^\d{5}$/.test(zipCode)) {
      throw new Error('Invalid ZIP code. Please enter a 5-digit ZIP code.');
    }

    const cleanAddress = address.trim();
    if (cleanAddress.length < 3) {
      throw new Error('Address is too short. Please enter a valid street address.');
    }

    const { streetAddress, city } = validateAddress(cleanAddress);

    let results: any[] = [];
    let searchAttempts = 0;
    const maxAttempts = 4;

    console.log('Strategy 1: Trying full address with ZIP code');
    results = await searchLocation(`${cleanAddress} ${zipCode}`, {
      limit: 5,
      countrycodes: 'de'
    });
    searchAttempts++;

    if (!results.length && searchAttempts < maxAttempts) {
      console.log('Strategy 2: Trying street address with city and ZIP code');
      results = await searchLocation(`${streetAddress}, ${city} ${zipCode}`, {
        limit: 5,
        countrycodes: 'de'
      });
      searchAttempts++;
    }

    if (!results.length && searchAttempts < maxAttempts) {
      console.log('Strategy 3: Trying street address with ZIP code');
      results = await searchLocation(`${streetAddress} ${zipCode}`, {
        limit: 5,
        countrycodes: 'de'
      });
      searchAttempts++;
    }

    if (!results.length && searchAttempts < maxAttempts) {
      console.log('Strategy 4: Trying city and ZIP code');
      results = await searchLocation(`${city} ${zipCode}`, {
        limit: 5,
        countrycodes: 'de'
      });
      searchAttempts++;
    }

    if (results.length > 0) {
      const matchingResults = results.filter(result => {
        const postalCode = result.address?.postcode;
        return postalCode === zipCode;
      });

      const location = matchingResults.length > 0 ? matchingResults[0] : results[0];

      const latitude = Number(location.lat);
      const longitude = Number(location.lon);

      if (isNaN(latitude) || isNaN(longitude)) {
        throw new Error('Received invalid coordinates from the geocoding service');
      }

      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        throw new Error('Invalid coordinates: out of valid range');
      }

      return new Response(
        JSON.stringify({
          latitude,
          longitude,
          display_name: location.display_name,
          confidence: location.importance || null,
          type: location.type || null,
          address_details: location.address || null,
          exact_match: matchingResults.length > 0
        }),
        { headers: corsHeaders }
      );
    }

    throw new Error(
      'Address not found. Please check:\n' +
      '1. The street name is correct\n' +
      '2. The city name is spelled correctly\n' +
      '3. The ZIP code matches the address'
    );

  } catch (error) {
    console.error('Geocoding error:', error);

    let status = 400;
    let message = error.message;

    if (message.includes('not found')) {
      status = 404;
    } else if (message.includes('service error')) {
      status = 503;
      message = 'The geocoding service is temporarily unavailable. Please try again later.';
    }

    return new Response(
      JSON.stringify({
        error: message,
        status
      }),
      {
        status,
        headers: corsHeaders
      }
    );
  }
});
