import { Link } from "react-router-dom";
import { profile } from "../data/profile";
import styles from "./Footer.module.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <p className={styles.name}>{profile.name}</p>
          <p className={styles.tagline}>{profile.tagline}</p>
        </div>
        <nav className={styles.links}>
          <Link to="/">Home</Link>
          <Link to="/blog">Blog</Link>
          <Link to="/research">Research</Link>
          <a href={profile.website} target="_blank" rel="noopener noreferrer">
            WordPress
          </a>
        </nav>
        <p className={styles.copy}>
          © {year} {profile.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
