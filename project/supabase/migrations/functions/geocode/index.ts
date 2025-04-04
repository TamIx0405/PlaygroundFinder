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
    countrycodes: options.countrycodes || 'de', // Set default country to Germany
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
    throw new Error('Bitte geben Sie Straße und Stadt an (z.B. "Hauptstraße 1, Berlin")');
  }

  const streetAddress = addressParts[0];
  const city = addressParts[1];

  // Validate street address format (street name + number, as common in Germany)
  // Allow both "Hauptstraße 1" and "1 Hauptstraße" formats
  const streetMatch = streetAddress.match(/^(\d+\s+\w+|\w+\s+\d+)/);
  if (!streetMatch) {
    throw new Error('Ungültiges Straßenformat. Bitte geben Sie Straßennamen und Hausnummer an (z.B. "Hauptstraße 1" oder "1 Hauptstraße")');
  }

  if (city.length < 2) {
    throw new Error('Bitte geben Sie einen gültigen Stadtnamen an');
  }

  return { streetAddress, city };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const { zipCode, address } = await req.json();
    
    if (!zipCode || typeof zipCode !== 'string') {
      throw new Error('Postleitzahl ist erforderlich');
    }

    if (!address || typeof address !== 'string') {
      throw new Error('Adresse ist erforderlich');
    }

    // Validate German postal code format (5 digits)
    if (!/^\d{5}$/.test(zipCode)) {
      throw new Error('Ungültige Postleitzahl. Bitte geben Sie eine 5-stellige Postleitzahl ein.');
    }

    const cleanAddress = address.trim();
    if (cleanAddress.length < 5) {
      throw new Error('Adresse ist zu kurz. Bitte geben Sie eine gültige Straßenadresse ein.');
    }

    const { streetAddress, city } = validateAddress(cleanAddress);

    let results: any[] = [];
    let searchAttempts = 0;
    const maxAttempts = 4;

    // Strategy 1: Full address with ZIP code
    console.log('Strategy 1: Trying full address with ZIP code');
    results = await searchLocation(`${cleanAddress} ${zipCode}`, { 
      limit: 5,
      countrycodes: 'de'
    });
    searchAttempts++;

    // Strategy 2: Street address with city and ZIP code
    if (!results.length && searchAttempts < maxAttempts) {
      console.log('Strategy 2: Trying street address with city and ZIP code');
      results = await searchLocation(`${streetAddress}, ${city} ${zipCode}`, {
        limit: 5,
        countrycodes: 'de'
      });
      searchAttempts++;
    }

    // Strategy 3: Street address with ZIP code
    if (!results.length && searchAttempts < maxAttempts) {
      console.log('Strategy 3: Trying street address with ZIP code');
      results = await searchLocation(`${streetAddress} ${zipCode}`, {
        limit: 5,
        countrycodes: 'de'
      });
      searchAttempts++;
    }

    // Strategy 4: ZIP code lookup to get state (Bundesland)
    if (!results.length && searchAttempts < maxAttempts) {
      console.log('Strategy 4: Looking up ZIP code to get state');
      const zipResults = await searchLocation(zipCode, {
        limit: 1,
        countrycodes: 'de'
      });
      if (zipResults.length && zipResults[0].address?.state) {
        const state = zipResults[0].address.state;
        results = await searchLocation(`${streetAddress}, ${city}, ${state}`, {
          limit: 5,
          countrycodes: 'de'
        });
      }
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
        throw new Error('Ungültige Koordinaten vom Geocoding-Service erhalten');
      }

      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        throw new Error('Ungültige Koordinaten: außerhalb des gültigen Bereichs');
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
      'Adresse nicht gefunden. Bitte überprüfen Sie:\n' +
      '1. Die Hausnummer und der Straßenname sind korrekt\n' +
      '2. Der Stadtname ist richtig geschrieben\n' +
      '3. Die Postleitzahl stimmt mit der Adresse überein'
    );

  } catch (error) {
    console.error('Geocoding error:', error);

    let status = 400;
    let message = error.message;

    if (message.includes('nicht gefunden')) {
      status = 404;
    } else if (message.includes('service error')) {
      status = 503;
      message = 'Der Geocoding-Service ist vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut.';
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