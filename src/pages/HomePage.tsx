import { Link } from "react-router-dom";
import Hero from "../components/Hero";
import BlogCard from "../components/BlogCard";
import { profile } from "../data/profile";
import { blogs } from "../data/blogs";
import styles from "./HomePage.module.css";

export default function HomePage() {
  const recentBlogs = blogs.slice(0, 3);

  return (
    <>
      <Hero />

      <section id="about" className="section">
        <div className="container">
          <p className="section__label">About</p>
          <h2 className="section__title">Scholar, Administrator & Writer</h2>
          <div className={styles.aboutGrid}>
            <p className={styles.aboutText}>{profile.bio}</p>
            <div className={styles.hobbies}>
              <h3>Hobbies</h3>
              <ul>
                {profile.hobbies.map((hobby) => (
                  <li key={hobby}>{hobby}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{profile.researchStats.papersPublished}</span>
              <span className={styles.statLabel}>Research papers published</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>39+</span>
              <span className={styles.statLabel}>Years in administration</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>PhD</span>
              <span className={styles.statLabel}>Sardar Patel University, 2018</span>
            </div>
          </div>
        </div>
      </section>

      <section id="education" className="section section--alt">
        <div className="container">
          <p className="section__label">Education</p>
          <h2 className="section__title">Academic Background</h2>
          <ol className={styles.timeline}>
            {profile.education.map((edu) => (
              <li key={edu.qualification} className={styles.timelineItem}>
                <span className={styles.timelinePeriod}>{edu.period}</span>
                <h3>{edu.qualification}</h3>
                <p className={styles.timelineInst}>{edu.institution}</p>
                {edu.note && <p className={styles.timelineNote}>{edu.note}</p>}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="experience" className="section">
        <div className="container">
          <p className="section__label">Experience</p>
          <h2 className="section__title">Career Highlights</h2>
          {profile.experience.map((exp) => (
            <article key={exp.role} className={styles.experienceCard}>
              <header>
                <h3>{exp.role}</h3>
                <p className={styles.expOrg}>{exp.organization}</p>
                {exp.period && <span className={styles.expPeriod}>{exp.period}</span>}
              </header>
              <ul>
                {exp.highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
          <div className={styles.skills}>
            <h3>Skills & Recognition</h3>
            <ul>
              {profile.skills.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section section--alt">
        <div className="container">
          <p className="section__label">Latest Writing</p>
          <h2 className="section__title">From the Blog</h2>
          <div className={`card-grid card-grid--3 ${styles.blogPreview}`}>
            {recentBlogs.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
          <p className={styles.viewAll}>
            <Link to="/blog" className="btn btn--primary">
              View all articles
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
