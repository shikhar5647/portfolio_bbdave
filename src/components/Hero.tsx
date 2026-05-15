import { Link } from "react-router-dom";
import { profile } from "../data/profile";
import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.content}>
          <p className={styles.eyebrow}>{profile.title}</p>
          <h1 className={styles.title}>{profile.name}</h1>
          <p className={styles.tagline}>{profile.tagline}</p>
          <p className={styles.bio}>{profile.bio}</p>
          <div className={styles.actions}>
            <Link to="/blog" className="btn btn--primary">
              Read the Blog
            </Link>
            <Link to="/research" className="btn btn--outline">
              Research Papers
            </Link>
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--outline"
            >
              WordPress Site
            </a>
          </div>
          <dl className={styles.contact}>
            <div>
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${profile.email}`}>{profile.email}</a>
              </dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>
                <a href={`tel:${profile.phone}`}>{profile.phone}</a>
              </dd>
            </div>
          </dl>
        </div>
        <div className={styles.portraitWrap}>
          <img
            src="/profile.png"
            alt={`Portrait of ${profile.name}`}
            className={styles.portrait}
            width={639}
            height={639}
          />
          <div className={styles.portraitFrame} aria-hidden />
        </div>
      </div>
    </section>
  );
}
