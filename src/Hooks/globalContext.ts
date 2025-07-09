import { createContext } from "react";
import type { GlobalContextType } from "../Types/GlobalTypes";

export const GlobalContext = createContext<GlobalContextType | null>(
  null
);
