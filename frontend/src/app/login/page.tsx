import LoginForm from "@/components/admin/LoginForm";

export const metadata = { title: "Admin login · FFWS 2026" };

export default function AdminLoginPage() {
  return (
    <div className="map-grid flex min-h-[calc(100vh-4rem)] items-center justify-center px-5">
      <LoginForm />
    </div>
  );
}