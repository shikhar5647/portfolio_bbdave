import { useState, useEffect } from "react";
import ResearchCard from "../components/ResearchCard";
import {
  researchPapers as staticPapers,
  writtenPapers as staticWrittenPapers,
  type ResearchPaper,
} from "../data/researchPapers";
import { profile } from "../data/profile";
import styles from "./ResearchPage.module.css";

export default function ResearchPage() {
  const [uploadedPapers, setUploadedPapers] = useState<ResearchPaper[]>([]);
  const [uploadedWrittenPapers, setUploadedWrittenPapers] = useState<ResearchPaper[]>([]);

  useEffect(() => {
    fetch("/api/papers")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setUploadedPapers(data))
      .catch(() => {});
    fetch("/api/papers?kind=written")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setUploadedWrittenPapers(data))
      .catch(() => {});
  }, []);

  const allPapers = [...staticPapers, ...uploadedPapers];
  allPapers.sort((a, b) => b.year - a.year);
  const hasPapers = allPapers.length > 0;

  const allWrittenPapers = [...staticWrittenPapers, ...uploadedWrittenPapers];
  allWrittenPapers.sort((a, b) => b.year - a.year);

  return (
    <>
      <header className={styles.header}>
        <div className="container">
          <p className="section__label">Publications</p>
          <h1 className={styles.title}>Research Papers</h1>
          <p className={styles.subtitle}>
            {profile.name} has published {allPapers.length || "—"} research
            papers in national and international journals, with presentations at IIM Indore,
            management colleges in Guwahati, and Sardar Patel University, Anand.
            {allWrittenPapers.length > 0 &&
              ` A further ${allWrittenPapers.length} written ${
                allWrittenPapers.length === 1 ? "paper is" : "papers are"
              } currently submitted or under review.`}
          </p>
        </div>
      </header>

      <section className="section">
        <div className="container">
          <p className="section__label">Accepted</p>
          <h2 className="section__title">Accepted Papers</h2>
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
            </div>
          )}
        </div>
      </section>

      <section className="section section--alt">
        <div className="container">
          <p className="section__label">In Progress</p>
          <h2 className="section__title">Written Papers</h2>
          <p className={styles.sectionIntro}>
            Papers that have been written and submitted, and are awaiting acceptance.
          </p>
          {allWrittenPapers.length > 0 ? (
            <div className={styles.grid}>
              {allWrittenPapers.map((paper) => (
                <ResearchCard key={paper.id} paper={paper} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h2>No written papers listed yet</h2>
              <p>Papers currently under review will appear here.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
