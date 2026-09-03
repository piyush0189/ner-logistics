import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polyline,
  Tooltip,
  Marker,
} from "react-leaflet";

import L from "leaflet";


const STATUS_COLOR = {
  open: "#5b8c5a",
  caution: "#d6a24c",
  "high-risk": "#c1502e",
  blocked: "#7a2a17",
};


const CONNECTIVITY_COLOR = {
  connected: "#5b8c5a",
  "at-risk": "#d6a24c",
  "cut-off": "#c1502e",
  isolated: "#c1502e",
};


function vehicleIcon(cargo = "") {

  const glyph =
    cargo.includes("Medic")
      ? "+"
      : cargo.includes("Food")
      ? "F"
      : cargo.includes("Constr")
      ? "C"
      : "A";


  return L.divIcon({

    className: "",

    html: `
      <div style="
        width:20px;
        height:20px;
        border-radius:50%;
        background:#4f97a8;
        border:2px solid #0f1712;
        display:flex;
        align-items:center;
        justify-content:center;
        color:#0f1712;
        font-family:'IBM Plex Mono',monospace;
        font-size:10px;
        font-weight:600;
      ">
        ${glyph}
      </div>
    `,

    iconSize: [20, 20],

    iconAnchor: [10, 10],

  });

}


export default function MapView({

  districts = [],

  roads = [],

  vehicles = [],

  highlightRoadIds = [],

}) {

  return (

    <MapContainer

      center={[25.7, 92.8]}

      zoom={6}

      scrollWheelZoom={true}

    >

      {/* DARK BASEMAP — NO CARTO API KEY */}

      <TileLayer

        attribution="Tiles &copy; Esri"

        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"

      />


      {/* ROADS */}

      {roads.map((r) => {

        /*
         * OSRM returns GeoJSON coordinates as:
         *
         * [longitude, latitude]
         *
         * Leaflet expects:
         *
         * [latitude, longitude]
         *
         * Therefore we convert them here.
         */

        const realPositions =
          r.geometry?.coordinates?.map(
            ([lng, lat]) => [lat, lng]
          );


        /*
         * Use the real OpenStreetMap route
         * whenever it is available.
         *
         * Otherwise fall back to the
         * existing district-to-district line.
         */

        const positions =
          realPositions &&
          realPositions.length > 1
            ? realPositions
            : [
                r.fromCoords,
                r.toCoords
              ];


        const isHighlighted =
          highlightRoadIds.includes(r.id);


        return (

          <Polyline

            key={r.id}

            positions={positions}

            pathOptions={{

              color:
                STATUS_COLOR[r.status]
                || "#5b8c5a",

              weight:
                isHighlighted
                  ? 6
                  : 3,

              opacity:
                highlightRoadIds.length &&
                !isHighlighted
                  ? 0.25
                  : 0.9,

              dashArray:
                r.status === "blocked"
                  ? "2 6"
                  : null,

            }}

          >

            <Tooltip sticky>

              <div
                style={{
                  fontFamily:
                    "IBM Plex Sans, sans-serif",
                }}
              >

                <strong>
                  {r.name}
                </strong>

                {" "}
                ({r.fromName} – {r.toName})

                <br />

                Status:
                {" "}
                {r.status}
                {" · "}
                Risk {r.risk}/100

                <br />

                {/* REAL ROUTING DISTANCE */}

                {r.realDistanceKm != null
                  ? `${r.realDistanceKm} km`
                  : `${r.lengthKm} km`
                }


                {/* REAL ROUTING TIME */}

                {r.realDurationMin != null && (
                  <>
                    <br />
                    Driving time:
                    {" "}
                    {r.realDurationMin} min
                  </>
                )}


                {/* ROUTING SOURCE */}

                {r.routingSource && (
                  <>
                    <br />
                    Source:
                    {" "}
                    {r.routingSource}
                  </>
                )}

              </div>

            </Tooltip>

          </Polyline>

        );

      })}


      {/* DISTRICTS */}

      {districts.map((d) => (

        <CircleMarker

          key={d.id}

          center={[
            d.lat,
            d.lng
          ]}

          radius={
            d.tier === "hub"
              ? 9
              : 6
          }

          pathOptions={{

            color: "#0f1712",

            weight: 1.5,

            fillColor:
              CONNECTIVITY_COLOR[
                d.connectivity
              ]
              || "#8fa093",

            fillOpacity: 0.95,

          }}

        >

          <Tooltip>

            <div
              style={{
                fontFamily:
                  "IBM Plex Sans, sans-serif",
              }}
            >

              <strong>
                {d.name}
              </strong>

              , {d.state}

              <br />

              Connectivity:
              {" "}
              {d.connectivity}


              {d.weatherSeverity != null && (

                <>

                  <br />

                  Weather severity:
                  {" "}
                  {d.weatherSeverity}/100

                </>

              )}

            </div>

          </Tooltip>

        </CircleMarker>

      ))}


      {/* LIVE VEHICLES */}

      {vehicles.map((v) => (

        <Marker

          key={v.id}

          position={[
            v.lat,
            v.lng
          ]}

          icon={
            vehicleIcon(v.cargo)
          }

        >

          <Tooltip>

            <div
              style={{
                fontFamily:
                  "IBM Plex Sans, sans-serif",
              }}
            >

              <strong>
                {v.id}
              </strong>

              {" — "}

              {v.cargo}

              <br />

              {v.originName}
              {" → "}
              {v.destName}

              <br />

              ETA:
              {" "}

              {v.etaMin != null
                ? `${v.etaMin} min`
                : "unavailable"
              }

            </div>

          </Tooltip>

        </Marker>

      ))}

    </MapContainer>

  );

}