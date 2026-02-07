import { Main } from "../../Components/Main/Main";
import stylesShared from "../sharedPage.module.css";
import type { Vendas } from "../../Types/VendasTypes";

import { LuReceipt } from "react-icons/lu";

export function Vendas() {
  return (
    <Main>
      <div className={`${stylesShared.container}`}>
        <div className={stylesShared.header}>
          <h1>
            <LuReceipt size={24} />
            &nbsp; Vendas em construção
          </h1>
        </div>
      </div>
    </Main>
  );
}
