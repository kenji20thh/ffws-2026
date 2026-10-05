import GoogleUsernameForm from "@/components/auth/GoogleUsernameForm";

export const metadata = { title: "Choose username · FFWS 2026" };

export default function GoogleUsernamePage() {
  return (
    <div className="map-grid flex min-h-[calc(100vh-4rem)] items-center justify-center px-5">
      <GoogleUsernameForm />
    </div>
  );
}
