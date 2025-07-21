import { Main } from "../../Components/Main/Main";
import style from "./home.module.css";

export function Home() {
  return (
    <div className={style["container"]}>
      <Main>
        <h1 className={style.title}>Bem-vindo</h1>

        <p className={style.phrase}>
          Um aplicativo simples e eficiente para o controle de contas a receber.
        </p>
        <p className={style.phrase}>
          Pensado para qualquer pessoa que deseja organizar seus recebimentos
          com clareza e agilidade.
        </p>
      </Main>
    </div>
  );
}
