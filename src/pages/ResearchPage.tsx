import ResearchCard from "../components/ResearchCard";
import { profile } from "../data/profile";
import { researchPapers } from "../data/researchPapers";
import styles from "./ResearchPage.module.css";

export default function ResearchPage() {
  const hasPapers = researchPapers.length > 0;

  return (
    <>
      <header className={styles.header}>
        <div className="container">
          <p className="section__label">Publications</p>
          <h1 className={styles.title}>Research Papers</h1>
          <p className={styles.subtitle}>
            {profile.name} has published {profile.researchStats.papersPublished} research
            papers in national and international journals, with presentations at IIM Indore,
            management colleges in Guwahati, and Sardar Patel University, Anand.
          </p>
        </div>
      </header>

      <section className="section">
        <div className="container">
          {hasPapers ? (
            <div className={styles.grid}>
              {researchPapers.map((paper) => (
                <ResearchCard key={paper.id} paper={paper} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h2>Papers coming soon</h2>
              <p>
                Research papers can be added in{" "}
                <code>src/data/researchPapers.ts</code>. Place PDF files in{" "}
                <code>public/papers/</code> and link them with <code>pdfUrl</code>.
              </p>
              <p className={styles.hint}>
                {profile.researchStats.papersPublished} papers are listed on the CV — add
                each title, journal, year, and PDF to display them here.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
