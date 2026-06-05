"use client";

import { useQuery } from "@tanstack/react-query";
import { HotelCard } from "@/components/HotelCard";
import { graphQL } from "@/lib/graphql";
import type { Hotel } from "@/lib/types";

const HOTELS_QUERY = `
  query Hotels($search: String) {
    hotels(search: $search, limit: 20, offset: 0) {
      id name city country description imageUrl rating
    }
  }
`;

export default function HotelsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["hotels"],
    queryFn: () => graphQL<{ hotels: Hotel[] }>(HOTELS_QUERY)
  });

  return (
    <main className="page">
      <div className="section-title">
        <div>
          <h1>Hotel Catalog</h1>
          <p className="muted">Catalog data comes from Server 2 through GraphQL.</p>
        </div>
      </div>
      {isLoading ? <p>Loading hotels...</p> : null}
      {error ? <p>{error.message}</p> : null}
      <div className="grid">
        {data?.hotels.map((hotel) => <HotelCard hotel={hotel} key={hotel.id} />)}
      </div>
    </main>
  );
}
