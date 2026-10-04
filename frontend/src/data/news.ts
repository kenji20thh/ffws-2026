export type NewsArticle = {
id: number;
slug: string;
category: string;
title: string;
excerpt: string;
date: string;
image: string;
url: string;
};

export const NEWS: NewsArticle[] = [
{
id: 7,
slug: "los-loud-snickers-qualify-ffws-bangkok",
category: "Qualification",
title: "LOS and LOUD Snickers Qualify for FFWS 2026 Global Finals",
excerpt:
"LOS and LOUD Snickers secured their places at the FFWS 2026 Global Finals in Bangkok, joining Brazil's representatives for the global championship.",
date: "2026-10-04",
image: "/news/news7.jpeg",
url: "https://www.pichauarena.com.br/free-fire/ffws-br-passo-mundial/",
},
{
id: 1,
slug: "tsg-pros-roster-reportedly-leaves-organization",
category: "Teams",
title: "TSG Pros Roster Reportedly Leaves Organization After FFWS Qualification",
excerpt:
"The TSG Pros roster has reportedly parted ways with the organization shortly after securing qualification for the FFWS 2026 Global Finals.",
date: "2026-10-02",
image: "/news/news1.jpg",
url: "https://www.talkesport.com/mobile-gaming/tsg-pros-roster-reportedly-leaves-organisation-after-qualifying-for-ffws-2026/",
},
{
id: 2,
slug: "apex-resurrection-tsg-qualify-for-ffws-global-finals",
category: "Qualification",
title: "Apex Gaming, Resurrection and TSG Pros Qualify for FFWS Global Finals",
excerpt:
"Team Apex Gaming, Resurrection Esports and TSG Pros have secured India's three spots at the FFWS 2026 Global Finals.",
date: "2026-09-27",
image: "/news/news2.jpg",
url: "https://esportz.in/news/mobile/team-apex-gaming-resurrection-and-tsg-pros-qualify-for-ffws-2026-global-finals",
},
{
id: 3,
slug: "xprojekt-esports-crowned-ffws-mena-fall-champions",
category: "MENA",
title: "xProjekt Esports Crowned FFWS MENA Fall Champions",
excerpt:
"Moroccan squad xProjekt Esports won the FFWS MENA 2026 Fall season and secured a place at the Global Finals in Bangkok.",
date: "2026-09-19",
image: "/news/news3.png",
url: "https://www.moroccogamingindustry.ma/moroccos-xprojekt-esports-crowned-ffws-champion-in-the-middle-east-and-north-africa/",
},
{
id: 4,
slug: "bigetron-by-vitality-wins-ffws-sea-fall",
category: "SEA",
title: "Bigetron by Vitality Wins FFWS SEA Fall",
excerpt:
"Bigetron by Vitality claimed the FFWS SEA 2026 Fall championship as Southeast Asia finalized its Global Finals representatives.",
date: "2026-09-20",
image: "/news/news4.webp",
url: "https://rri.co.id/en/sport/2751389/bigetron-wins-ffws-sea-2026-fall-sends-three-indonesian-teams-to-global-finals",
},
{
id: 5,
slug: "ffws-sea-fall-breaks-viewership-record",
category: "Esports",
title: "FFWS SEA Fall Breaks Regional Viewership Record",
excerpt:
"The FFWS SEA 2026 Fall season reached a new regional peak in viewership, highlighting the continued growth of competitive Free Fire.",
date: "2026-09-21",
image: "/news/news5.jpeg",
url: "https://escharts.com/news/ffws-southeast-asia-2026-fall-viewership",
},
{
id: 6,
slug: "24-teams-set-for-ffws-global-finals-bangkok",
category: "Tournament",
title: "24 Teams Set for FFWS 2026 Global Finals in Bangkok",
excerpt:
"The expanded FFWS 2026 Global Finals will bring 24 teams together in Bangkok this November to compete for the world championship.",
date: "2026-09-15",
image: "/news/news6.jpg",
url: "https://liquipedia.net/freefire/Free_Fire_World_Series/2026",
},
];

export const latestNews = NEWS.slice(0, 4);
