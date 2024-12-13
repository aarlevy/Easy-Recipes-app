import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "./navigation";
import { UserProvider } from "./store/UserContext";
import { RecipeProvider } from './store/RecipeContext'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Smart Recipe Assistant",
  description: "AI-powered recipe suggestions from your fridge contents",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <UserProvider>
          <RecipeProvider>
            <Navigation>{children}</Navigation>
          </RecipeProvider>
        </UserProvider>
      </body>
    </html>
  );
}
