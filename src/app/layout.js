// layout.js (Server Component)
import ClientLayout from "./ClientLayout";


export default function RootLayout({ children }) {
  return <ClientLayout>
    {children}
  </ClientLayout>;
}
