import RegisterForm from "@/components/auth/RegisterForm";

export const metadata = { title: "Register · FFWS 2026" };

export default function RegisterPage() {
  return (
    <div className="map-grid flex min-h-[calc(100vh-4rem)] items-center justify-center px-5">
      <RegisterForm />
    </div>
  );
}