import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Equinox OMS - Order Management with FSM",
  description: "A professional e-commerce platform powered by formal language theory and deterministic finite automata (DFA).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark h-full">
      <body className={`${inter.className} min-h-full flex flex-col bg-[#030712] text-gray-100 antialiased`}>
        <AuthProvider><CartProvider>
          <Navbar />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-4 md:p-8">
              {children}
            </main>
          </div>
        </CartProvider></AuthProvider>
      </body>
    </html>
  );
}
