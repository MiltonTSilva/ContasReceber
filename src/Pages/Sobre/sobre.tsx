import { Main } from "../../Components/Main/Main";
import styles from "./sobre.module.css";

export function Sobre() {
  return (
    <Main>
      <div className={styles.container}>
        <h1 className={styles.title}>Sobre</h1>

        <p className={styles.phrase}>
          Mascotes Pet Shop é um sistema de gestão empresarial (ERP) desenvolvido
          para atender às necessidades específicas de pet shops. Ele oferece uma
          solução completa para gerenciar as operações diárias, desde o controle
          de estoque até a gestão financeira, proporcionando uma experiência
          eficiente e organizada para os proprietários de pet shops.
        </p>
        <address className={styles.address}>
          <span className={styles.author}>Criado por:</span>
          <span>Milton Tomé da Silva</span>

          <span className={styles.author}>E-mail:</span>
          <span>miltontsilva@gmail.com</span>

          <span className={styles.author}>Github:</span>
          <span>
            <a
              href="https://github.com/MiltonTSilva"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://github.com/MiltonTSilva
            </a>
          </span>

          <span className={styles.author}>LinkedIn:</span>
          <span>
            <a
              href="https://www.linkedin.com/in/miltontsilva/"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://www.linkedin.com/in/miltontsilva/
            </a>
          </span>

          <span className={styles.author}>Whatsapp:</span>
          <span>
            <a
              href="https://api.whatsapp.com/send?phone=5511967079318"
              target="_blank"
              rel="noopener noreferrer"
            >
              (11) 9.6707-9318
            </a>
          </span>
        </address>
      </div>
    </Main>
  );
}
