import { createGlobalStyle } from "styled-components";
import type { ThemeType } from "./theme";

export const GlobalStyle = createGlobalStyle<{ theme: ThemeType }>`
  body {
    background-color: ${({ theme }) => theme.background};
    color: ${({ theme }) => theme.color};
    margin: 0;
    font-family: sans-serif;
    transition: background-color 0.3s ease;
  }
`;
