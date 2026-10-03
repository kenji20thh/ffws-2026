import ProfileView from "@/components/profile/ProfileView";

export const metadata = { title: "Profile · FFWS 2026" };

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <ProfileView />
    </div>
  );
}
