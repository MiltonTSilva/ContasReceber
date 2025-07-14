import { Main } from "../../Components/Main/Main";
import style from "./sobre.module.css";

export function Sobre() {
  return (
    <Main>
      <h1 className={style.title}>Sobre</h1>
      <p className={style.phrase}>
        Este aplicativo foi criado com o objetivo de centralizar as contas a
        receber de alunos.
      </p>

      <p className={style.phrase}>
        O aplicativo é uma ferramenta simples e eficiente para o controle de
        contas a receber, pensado especialmente para professores que desejam
        organizar seus recebimentos com clareza e agilidade.
      </p>

      <address className={style.address}>
        <span className={style.author}>Criado por: </span> Milton Tomé da Silva
        <br />
        <span className={style.author}> E-mail: </span> miltontsilva@gmail.com
        <br />
        <span className={style.author}>Github: </span>
        <a href="https://github.com/MiltonTSilva">
          https://github.com/MiltonTSilva
        </a>
        <br />
        <span className={style.author}>LinkedIn: </span>
        <a href="https://www.linkedin.com/in/miltontsilva/">
          https://www.linkedin.com/in/miltontsilva/
        </a>
        <br />
        <span className={style.author}> Whatsapp: </span>
        <a href="https://api.whatsapp.com/send?phone=5511967079318">
          (11) 9.6707-9318
        </a>
      </address>
    </Main>
  );
}
