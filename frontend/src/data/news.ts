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
id: 1,
slug: "tsg-pros-roster-reportedly-leaves-organization",
category: "Teams",
title: "TSG Pros Roster Reportedly Leaves Organization After FFWS Qualification",
excerpt:
"The TSG Pros roster has reportedly parted ways with the organization shortly after securing qualification for the FFWS 2026 Global Finals.",
date: "2026-10-02",
image: "/news/news1.jpg",
url: "",
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
url: "",
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
url: "",
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
url: "",
},
{
id: 5,
slug: "ffws-sea-fall-breaks-viewership-record",
category: "Esports",
title: "FFWS SEA Fall Breaks Regional Viewership Record",
excerpt:
"The FFWS SEA 2026 Fall season reached a new regional peak in viewership, highlighting the continued growth of competitive Free Fire.",
date: "2026-09-21",
image: "/news/news5.jpg",
url: "",
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
url: "",
},
];

export const latestNews = NEWS.slice(0, 4);
