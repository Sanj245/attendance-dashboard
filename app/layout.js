import "./globals.css";

export const metadata = {
  title: "Student Planner & Attendance Analytics Dashboard",
  description: "Optimize your study schedule, track class attendance in real-time, simulate bunking decisions, and visualize reports.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
