// app/momRoutes/page.tsx
"use client";
import { useEffect, useRef, useState } from "react";

export default function MomRoutes() {
    const mapRef = useRef<HTMLDivElement>(null);
    const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
    const [origin, setOrigin] = useState("");
    const [destination, setDestination] = useState("");
    const [routes, setRoutes] = useState<google.maps.DirectionsRoute[]>([]);

  useEffect(() => {
    const initMap = () => {
      if (!window.google || !mapRef.current) return;

      const map = new google.maps.Map(mapRef.current, {
        center: { lat: 40.758, lng: -73.9855 },
        zoom: 13,
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

  return (
    <div className="w-full h-screen relative">
      <div className="absolute z-10 top-4 left-4 bg-white p-4 shadow rounded w-80 space-y-2">
        <input
          type="text"
          placeholder="Start (e.g. 123 Main St)"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          className="w-full border p-2 text-sm rounded"
        />
        <input
          type="text"
          placeholder="Destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="w-full border p-2 text-sm rounded"
        />
        <button
          onClick={getMomRoute}
          className="w-full bg-pink-500 text-white p-2 rounded font-semibold text-sm"
        >
          Get MomRoute
        </button>
      </div>

      <div ref={mapRef} className="w-full h-full" />

      {routes.length > 0 && (
        <div className="absolute bottom-4 left-4 z-10 bg-white shadow rounded max-h-60 overflow-auto w-96 p-2 space-y-2 text-sm">
          {routes.map((route, i) => {
            const numTransfers = route.legs[0].steps.filter(
              (s) => s.travel_mode === "TRANSIT"
            ).length - 1;
            const walkTime = route.legs[0].steps
              .filter((s) => s.travel_mode === "WALKING")
              .reduce((sum, step) => sum + (step.duration?.value || 0), 0) / 60;

            const isMomRoute = numTransfers === 0 && walkTime <= 30;

            return (
              <div key={i} className={`p-2 border rounded ${isMomRoute ? "border-pink-500" : "border-gray-200"}`}>
                <div className="font-semibold">
                  {route.summary || "Unnamed route"}
                  {isMomRoute && <span className="ml-2 text-pink-600">💗 MomRoute</span>}
                </div>
                <div>
                  {route.legs[0].duration?.text} total, {numTransfers} transfers, {Math.round(walkTime)} min walk
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}