import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { profile } from "../data/profile";
import styles from "./Header.module.css";

const navLinks = [
  { to: "/#about", label: "About", hash: true },
  { to: "/#education", label: "Education", hash: true },
  { to: "/#experience", label: "Experience", hash: true },
  { to: "/blog", label: "Blog", hash: false },
  { to: "/research", label: "Research", hash: false },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNavClick = () => setMenuOpen(false);

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link to="/" className={styles.brand} onClick={handleNavClick}>
          <span className={styles.brandInitials}>BD</span>
          <span className={styles.brandText}>
            <span className={styles.brandName}>Dr. Brij Behari Dave</span>
            <span className={styles.brandTag}>Analysis without Noise</span>
          </span>
        </Link>

        <button
          type="button"
          className={styles.menuBtn}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ""}`}>
          {navLinks.map(({ to, label, hash }) =>
            hash ? (
              <a
                key={to}
                href={to}
                className={styles.navLink}
                onClick={handleNavClick}
              >
                {label}
              </a>
            ) : (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`
                }
                onClick={handleNavClick}
              >
                {label}
              </NavLink>
            )
          )}
          <a
            href={`mailto:${profile.email}`}
            className={`btn btn--primary ${styles.cta}`}
            onClick={handleNavClick}
          >
            Contact
          </a>
        </nav>
      </div>
    </header>
  );
}
