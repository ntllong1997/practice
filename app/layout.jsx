import "./globals.css";

export const metadata = {
  title: process.env.NEXT_PUBLIC_SALON_NAME || "Nail Salon",
  description: "Walk-in check-in",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fdf2f8",
};

const RootLayout = ({ children }) => (
  <html lang="en">
    <body className="min-h-screen bg-pink-50 text-slate-900 antialiased">{children}</body>
  </html>
);

export default RootLayout;
