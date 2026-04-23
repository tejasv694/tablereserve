// Admin layout — no SessionProvider (admin uses separate auth)
export default function AdminLayout({ children }) {
  return <>{children}</>;
}
