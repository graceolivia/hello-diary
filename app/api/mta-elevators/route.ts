// app/api/mta-outages/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const res = await fetch("https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fnyct_ene.json");
  const outages = await res.json();

  const brokenStations = new Set<string>();

  outages.forEach((entry: any) => {
    if (entry.equipmenttype === "EL") {
      brokenStations.add(entry.station.trim().toLowerCase());
    }
  });

  return NextResponse.json([...brokenStations]);
}