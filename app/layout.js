import "./globals.css";

export const metadata = {
  title: "Raza Theory & Driving Academy",
  description: "UK driving theory test mock tests and private sessions.",
};
export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;600&family=Barlow+Condensed:wght@700;800&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
