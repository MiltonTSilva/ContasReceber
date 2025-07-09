import style from './Main.module.css';
export function Main({children}: {children?: React.ReactNode}) {
  return (
    <main className={style["main"]}>
     {children}
    </main>
  );
}