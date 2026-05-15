import type { ResearchPaper } from "../data/researchPapers";
import styles from "./ResearchCard.module.css";

interface ResearchCardProps {
  paper: ResearchPaper;
}

export default function ResearchCard({ paper }: ResearchCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.meta}>
        <span className={styles.year}>{paper.year}</span>
        {paper.journal && <span className={styles.journal}>{paper.journal}</span>}
      </div>
      <h3 className={styles.title}>{paper.title}</h3>
      <p className={styles.authors}>{paper.authors.join(", ")}</p>
      {paper.abstract && <p className={styles.abstract}>{paper.abstract}</p>}
      {paper.tags && paper.tags.length > 0 && (
        <ul className={styles.tags}>
          {paper.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      )}
      <div className={styles.links}>
        {paper.pdfUrl && (
          <a href={paper.pdfUrl} className={styles.link} target="_blank" rel="noopener noreferrer">
            Download PDF
          </a>
        )}
        {paper.doi && (
          <a
            href={`https://doi.org/${paper.doi}`}
            className={styles.link}
            target="_blank"
            rel="noopener noreferrer"
          >
            DOI
          </a>
        )}
      </div>
    </article>
  );
}
