import FantasySubNav from "@/components/fantasy/FantasySubNav";
import GameModeSwitch from "@/components/fantasy/GameModeSwitch";

export default function FantasyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GameModeSwitch />
      <FantasySubNav />
      {children}
    </>
  );
}