export interface ResearchPaper {
  id: string;
  title: string;
  authors: string[];
  journal?: string;
  year: number;
  abstract?: string;
  pdfUrl?: string;
  doi?: string;
  tags?: string[];
}

/**
 * Add research papers here. Each entry appears on the Research page.
 * PDFs can be placed in /public/papers/ and linked via pdfUrl.
 */
export const researchPapers: ResearchPaper[] = [
  // Example — replace or remove when adding real papers:
  // {
  //   id: "paper-1",
  //   title: "Your Paper Title",
  //   authors: ["Dr. Brij Behari Dave"],
  //   journal: "Journal Name",
  //   year: 2020,
  //   abstract: "Brief abstract...",
  //   pdfUrl: "/papers/your-paper.pdf",
  //   tags: ["Public Policy", "Finance"],
  // },
];

/**
 * Written papers — submitted or under review, not yet accepted.
 * These appear in the "Written Papers" section of the Research page.
 */
export const writtenPapers: ResearchPaper[] = [];
