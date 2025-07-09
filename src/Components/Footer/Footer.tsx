import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles["footer"]}>
      <p>
        © 2025 Supabase. <span>Todos direitos reservado.</span>
      </p>
    </footer>
  );
}
