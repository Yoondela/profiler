function getComponent(components, type) {
  console.log('parsing address with data:', components, 'type:', type);
  return components.find((c) => c.types.includes(type))?.long_name || '';
}

function parseGoogleAddress(place) {
  const components = place.address_components || [];

  return {
    formatted: place.formatted_address,
    placeId: place.place_id,

    addressComponents: {
      street: [
        getComponent(components, 'street_number'),
        getComponent(components, 'route'),
      ].filter(Boolean).join(' '),

      suburb:
        getComponent(components, 'sublocality') ||
        getComponent(components, 'neighborhood'),

      city: getComponent(components, 'locality'),

      province: getComponent(components, 'administrative_area_level_1'),

      postalCode: getComponent(components, 'postal_code'),

      country: getComponent(components, 'country'),
    },
  };
}


module.exports = { parseGoogleAddress };
