import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "HotelHub",
  description: "Microservices hotel booking platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="shell">
            <Nav />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
