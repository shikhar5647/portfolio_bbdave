import { useState, useEffect } from "react";
import ResearchCard from "../components/ResearchCard";
import { profile } from "../data/profile";
import { researchPapers as staticPapers, type ResearchPaper } from "../data/researchPapers";
import styles from "./ResearchPage.module.css";

export default function ResearchPage() {
  const [uploadedPapers, setUploadedPapers] = useState<ResearchPaper[]>([]);

  useEffect(() => {
    fetch("/api/papers")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setUploadedPapers(data))
      .catch(() => {});
  }, []);

  const allPapers = [...staticPapers, ...uploadedPapers];
  allPapers.sort((a, b) => b.year - a.year);
  const hasPapers = allPapers.length > 0;

  return (
    <>
      <header className={styles.header}>
        <div className="container">
          <p className="section__label">Publications</p>
          <h1 className={styles.title}>Research Papers</h1>
          <p className={styles.subtitle}>
            {profile.name} has published {allPapers.length || profile.researchStats.papersPublished} research
            papers in national and international journals, with presentations at IIM Indore,
            management colleges in Guwahati, and Sardar Patel University, Anand.
          </p>
        </div>
      </header>

      <section className="section">
        <div className="container">
          {hasPapers ? (
            <div className={styles.grid}>
              {allPapers.map((paper) => (
                <ResearchCard key={paper.id} paper={paper} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h2>Papers coming soon</h2>
              <p>
                Research papers will be added soon. Check back later for published
                research and downloadable PDFs.
              </p>
              <p className={styles.hint}>
                {profile.researchStats.papersPublished} papers are listed on the CV.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
