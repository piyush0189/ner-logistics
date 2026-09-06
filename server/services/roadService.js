const OSRM_BASE_URL =
  "https://router.project-osrm.org/route/v1/driving";

const routeCache = new Map();

const CACHE_DURATION_MS =
  30 * 60 * 1000;


/*
 * Fetch a real driving route from OSRM.
 *
 * OSRM uses OpenStreetMap road data.
 */
async function fetchRoute(
  from,
  to
) {
  const url =
    `${OSRM_BASE_URL}/` +
    `${from.lng},${from.lat};` +
    `${to.lng},${to.lat}` +
    `?overview=full` +
    `&geometries=geojson` +
    `&steps=false`;


  const response =
    await fetch(url);


  if (!response.ok) {

    throw new Error(
      `OSRM request failed with status ${response.status}`
    );

  }


  const data =
    await response.json();


  if (
    data.code !== "Ok" ||
    !data.routes ||
    data.routes.length === 0
  ) {

    throw new Error(
      "OSRM returned no driving route."
    );

  }


  const route =
    data.routes[0];


  return {

    distanceKm:
      Number(
        (route.distance / 1000)
          .toFixed(2)
      ),

    durationMin:
      Math.round(
        route.duration / 60
      ),

    geometry:
      route.geometry,

    source:
      "OpenStreetMap / OSRM"

  };

}


/*
 * Get a real route between two districts.
 *
 * Results are cached temporarily so that
 * we don't repeatedly request the same
 * route from OSRM.
 */
export async function getRoadRoute(
  road,
  from,
  to
) {

  const cacheKey =
    `${road.id}:${from.id}:${to.id}`;


  const cached =
    routeCache.get(cacheKey);


  if (
    cached &&
    Date.now() - cached.timestamp <
      CACHE_DURATION_MS
  ) {

    return cached.data;

  }


  const route =
    await fetchRoute(
      from,
      to
    );


  const result = {

    roadId:
      road.id,

    roadName:
      road.name,

    from:
      from.id,

    to:
      to.id,

    fromName:
      from.name,

    toName:
      to.name,

    distanceKm:
      route.distanceKm,

    durationMin:
      route.durationMin,

    geometry:
      route.geometry,

    source:
      route.source,

    fetchedAt:
      new Date().toISOString()

  };


  routeCache.set(
    cacheKey,
    {
      timestamp:
        Date.now(),

      data:
        result
    }
  );


  return result;

}


/*
 * Get real routing information for
 * the complete monitored network.
 */
export async function getRealRoadRoutes(
  roads,
  districts
) {
  return Promise.all(
    roads.map(async (road) => {
      const from =
        districts.find(
          (district) =>
            district.id === road.from
        );

      const to =
        districts.find(
          (district) =>
            district.id === road.to
        );

      if (!from || !to) {
        return {
          roadId: road.id,
          error: true,
          message: "District coordinates unavailable.",
          source: "OpenStreetMap / OSRM"
        };
      }

      try {
        return await getRoadRoute(
          road,
          from,
          to
        );
      } catch (error) {
        console.error(
          `Road routing failed for ${road.id}:`,
          error.message
        );

        return {
          roadId: road.id,
          roadName: road.name,
          from: from.id,
          to: to.id,
          fromName: from.name,
          toName: to.name,
          error: true,
          message: "Real road routing data temporarily unavailable.",
          source: "OpenStreetMap / OSRM"
        };
      }
    })
  );
}