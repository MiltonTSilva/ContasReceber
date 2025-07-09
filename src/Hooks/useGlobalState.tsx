import { useContext } from "react";
import { GlobalContext } from "./globalContext";
import type { GlobalContextType } from "../Types/GlobalTypes";

export const useGlobalState = (): GlobalContextType => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error(
      "useGlobalState deve ser usado dentro de um GlobalProvider"
    );
  }
  return context;
};
