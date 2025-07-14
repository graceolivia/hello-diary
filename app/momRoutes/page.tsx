// app/momRoutes/page.tsx
"use client";
import { useEffect, useRef, useState } from "react";

export default function MomRoutes() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);

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
    if (!window.google || !directionsRenderer) return;

    const service = new google.maps.DirectionsService();
    service.route(
      {
        origin: "Morningside Heights, NYC",
        destination: "Central Park Zoo, NYC",
        travelMode: google.maps.TravelMode.TRANSIT,
        transitOptions: {
          modes: [google.maps.TransitMode.SUBWAY, google.maps.TransitMode.BUS],
        },
      },
      (result, status) => {
        if (status === "OK" && result) {
          directionsRenderer.setDirections(result);
        } else {
          console.error("Directions request failed", status);
        }
      }
    );
  };

  return (
    <div className="w-full h-screen">
      <button
        className="absolute z-10 top-4 left-4 bg-white px-4 py-2 shadow border rounded text-sm font-semibold"
        onClick={getMomRoute}
      >
        Get MomRoute
      </button>
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
