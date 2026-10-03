export type NewsArticle = {
id: number;
slug: string;
category: string;
title: string;
excerpt: string;
date: string;
image: string;
};

export const NEWS: NewsArticle[] = [
{
id: 1,
slug: "ffws-2026-world-championship-coming-to-bangkok",
category: "Tournament",
title: "FFWS 2026 World Championship Set for Bangkok",
excerpt:
"The world's best Free Fire teams will meet in Bangkok for the FFWS 2026 World Championship.",
date: "2026-10-03",
image: "/home/venue.jpg",
},
{
id: 2,
slug: "meet-the-teams-competing-at-ffws-2026",
category: "Teams",
title: "Meet the Teams Competing at FFWS 2026",
excerpt:
"Get to know the teams preparing to battle for the world championship title this November.",
date: "2026-10-02",
image: "/home/venue.jpg",
},
{
id: 3,
slug: "everything-you-need-to-know-about-ffws-2026",
category: "Tournament",
title: "Everything You Need to Know About FFWS 2026",
excerpt:
"Dates, tournament structure, schedule and everything else you need to know before the action begins.",
date: "2026-10-01",
image: "/home/venue.jpg",
},
{
id: 4,
slug: "the-road-to-the-world-stage",
category: "Feature",
title: "The Road to the World Stage",
excerpt:
"From regional competition to the global stage, follow the journey of the teams heading to Bangkok.",
date: "2026-09-29",
image: "/home/venue.jpg",
},
{
id: 5,
slug: "ffws-2026-schedule-revealed",
category: "Schedule",
title: "FFWS 2026 Schedule Revealed",
excerpt:
"The complete championship schedule is now available, with the world's best teams ready for battle.",
date: "2026-09-27",
image: "/home/venue.jpg",
},
{
id: 6,
slug: "players-to-watch-at-ffws-2026",
category: "Players",
title: "Players to Watch at FFWS 2026",
excerpt:
"These players will be among the names to watch when the World Championship gets underway.",
date: "2026-09-25",
image: "/home/venue.jpg",
},
];

export const latestNews = NEWS.slice(0, 4);
