// layout.js (Server Component)
import ClientLayout from "./ClientLayout";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>
          <div className="min-h-screen flex flex-col">
            <main className="flex-1">
              {children}
            </main>
            <footer className="text-sm text-gray-500 text-center pb-10 pt-8 bg-gray-50">
              © 2025 Mehor. All rights reserved.
            </footer>
          </div>
        </ClientLayout>
      </body>
    </html>
  );
}