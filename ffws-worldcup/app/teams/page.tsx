import { teams } from "@/data/teams"; import PageHero from "@/components/PageHero"; import TeamsBrowser from "@/components/TeamsBrowser";
export default function Teams() { return (<><PageHero title="TEAMS">Participating teams (demo data until official list).</PageHero><div className="mx-auto max-w-7xl px-4 pt-10"><TeamsBrowser teams={teams} /></div></>); }
