// app/momRoutes/page.tsx
"use client";
import { useEffect, useRef, useState } from "react";

export default function MomRoutes() {
    const mapRef = useRef<HTMLDivElement>(null);
    const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
    const [origin, setOrigin] = useState("337 Riverside Dr, New York, NY");
    const [destination, setDestination] = useState("41 E 7th St, New York, NY 10003");
    const [routes, setRoutes] = useState<google.maps.DirectionsRoute[]>([]);
    const [maxWalkTime, setMaxWalkTime] = useState(30); // default 30 min
    const [prioritizeElevators, setPrioritizeElevators] = useState(true);


  useEffect(() => {

    const softerMapStyle = [
        { elementType: "geometry", stylers: [{ color: "#eaeaea" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#333333" }] },
        {
          featureType: "administrative.locality",
          elementType: "labels.text.fill",
          stylers: [{ color: "#444444" }],
        },
        {
          featureType: "poi",
          elementType: "geometry",
          stylers: [{ color: "#f0f0f0" }],
        },
        {
          featureType: "poi.park",
          elementType: "geometry",
          stylers: [{ color: "#cceccd" }],
        },
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [{ color: "#ffffff" }],
        },
        {
          featureType: "road",
          elementType: "geometry.stroke",
          stylers: [{ color: "#d6d6d6" }],
        },
        {
          featureType: "road.highway",
          elementType: "geometry",
          stylers: [{ color: "#f8c967" }],
        },
        {
          featureType: "transit.line",
          elementType: "geometry",
          stylers: [{ color: "#bbbbbb" }],
        },
        {
          featureType: "transit.station",
          elementType: "labels.icon",
          stylers: [{ visibility: "on" }],
        },
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#d4e4f7" }],
        },
      ];
      
      

    const initMap = () => {
      if (!window.google || !mapRef.current) return;

      const map = new google.maps.Map(mapRef.current, {
        center: { lat: 40.758, lng: -73.9855 },
        zoom: 13,
        styles: softerMapStyle,
      });


      const renderer = new google.maps.DirectionsRenderer();
      renderer.setMap(map);
      setDirectionsRenderer(renderer);
    };

    if (!window.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
      script.async = true;
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }
  }, []);

  const getMomRoute = () => {
    if (!window.google || !directionsRenderer || !origin || !destination) return;

    const service = new google.maps.DirectionsService();
    service.route(
      {
        origin,
        destination,
        travelMode: google.maps.TravelMode.TRANSIT,
        transitOptions: {
          modes: [google.maps.TransitMode.SUBWAY, google.maps.TransitMode.BUS],
          routingPreference: google.maps.TransitRoutePreference.FEWER_TRANSFERS,
        },
      },
      (result, status) => {
        if (status === "OK" && result) {
          setRoutes(result.routes);
          directionsRenderer.setDirections(result);
        } else {
          console.error("Directions request failed", status);
        }
      }
    );
  };

  function scoreRoute(route, inaccessibleStations: Set<string>) {
    const steps = route.legs[0].steps;
  
    const walkTime =
      steps
        .filter((s) => s.travel_mode === "WALKING")
        .reduce((sum, step) => sum + (step.duration?.value || 0), 0) / 60;
  
    const transfers = steps.filter((s) => s.travel_mode === "TRANSIT").length - 1;
  
    const transitStops = steps
      .filter((s) => s.travel_mode === "TRANSIT")
      .flatMap((s) => {
        const { transit } = s as any;
        return [transit?.departure_stop?.name, transit?.arrival_stop?.name].filter(Boolean);
      });
  
    const hasInaccessibleStop = transitStops.some((stop) =>
      inaccessibleStations.has(stop.toLowerCase())
    );
  
    // Score logic: higher score = better
    let score = walkTime - transfers * 3;
    if (hasInaccessibleStop) score -= 5;
  
    return { score, walkTime, transfers, hasInaccessibleStop };
  }
  

  return (
    <div className="w-full h-screen relative">
<div className="absolute z-10 top-4 left-4 bg-white/90 backdrop-blur p-4 shadow-xl rounded-xl w-80 space-y-4 text-[15px] font-medium text-gray-800">
  <h2 className="text-lg font-bold text-gray-900">Plan Your MomRoute</h2>

  <input
    type="text"
    placeholder="Start"
    value={origin}
    onChange={(e) => setOrigin(e.target.value)}
    className="w-full border border-gray-300 p-2 rounded-md bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-400"
  />

  <input
    type="text"
    placeholder="Destination"
    value={destination}
    onChange={(e) => setDestination(e.target.value)}
    className="w-full border border-gray-300 p-2 rounded-md bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-400"
  />

  <div className="space-y-1">
    <label className="block text-sm font-semibold">Max walking time:</label>
    <select
      value={maxWalkTime}
      onChange={(e) => setMaxWalkTime(parseInt(e.target.value))}
      className="w-full border border-gray-300 p-2 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-pink-400"
    >
      {[15, 30, 45, 60].map((min) => (
        <option key={min} value={min}>
          {min} minutes
        </option>
      ))}
    </select>
  </div>

  <label className="flex items-center gap-2 text-sm">
    <input
      type="checkbox"
      checked={prioritizeElevators}
      onChange={(e) => setPrioritizeElevators(e.target.checked)}
    />
    Prioritize elevators (avoid broken stations)
  </label>

  <button
    onClick={getMomRoute}
    className="w-full bg-pink-500 hover:bg-pink-600 transition text-white p-2 rounded-lg font-semibold shadow-md"
  >
    Get MomRoute
  </button>
</div>


      <div ref={mapRef} className="w-full h-full" />

      {routes.length > 0 && (
  <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur shadow-xl rounded-xl max-h-64 overflow-auto w-96 p-3 space-y-3 text-sm text-gray-800">
    {routes.map((route, i) => {
      const numTransfers =
        route.legs[0].steps.filter((s) => s.travel_mode === "TRANSIT").length - 1;
      const walkTime =
        route.legs[0].steps
          .filter((s) => s.travel_mode === "WALKING")
          .reduce((sum, step) => sum + (step.duration?.value || 0), 0) / 60;

      const isMomRoute = numTransfers === 0 && walkTime <= maxWalkTime;

      return (
        <div
          key={i}
          className={`p-3 rounded-lg border ${
            isMomRoute ? "border-pink-400" : "border-gray-200"
          } bg-white shadow-sm`}
        >
          <div className="font-semibold flex items-center justify-between">
            {route.summary || "Unnamed route"}
            {isMomRoute && (
              <span className="ml-2 text-pink-600 text-xs font-bold">💗 MomRoute</span>
            )}
          </div>
          <div className="mt-1 text-gray-700">
            ⏱ {route.legs[0].duration?.text}  
            &nbsp; • 🚶 {Math.round(walkTime)} min walk  
            &nbsp; • 🔁 {numTransfers} transfers
          </div>
        </div>
      );
    })}
  </div>
)}

    </div>
  );
}