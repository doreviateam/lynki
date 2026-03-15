const points = [
  "où la marge se forme,",
  "où le cash se tend,",
  "quels clients concentrent le risque,",
  "quelles priorités exigent une action.",
];

export const ProblemSection = () => {
  return (
    <section className="bg-muted/15 py-24 lg:py-32">
      <div className="container max-w-4xl">
        <h2 className="text-center text-2xl font-bold tracking-tight text-[#1e3a5f] md:text-4xl lg:text-5xl">
          Les chiffres existent déjà.
          <br />
          La lecture de pilotage, beaucoup moins.
        </h2>
        <p className="text-muted-foreground mt-6 text-center leading-relaxed">
          Entre l&apos;ERP, la banque, les paiements, les documents et les
          opérations, la réalité financière se fragmente.
        </p>
        <p className="text-muted-foreground mt-4 text-center leading-relaxed">
          On voit des données.
          <br />
          On voit moins vite :
        </p>
        <ul className="text-muted-foreground mt-8 list-inside list-disc space-y-2 text-center md:grid md:grid-cols-2 md:gap-4 md:gap-x-8 md:text-left">
          {points.map((text) => (
            <li key={text} className="leading-relaxed">
              {text}
            </li>
          ))}
        </ul>
        <div className="mt-12 border-t border-border/50 pt-10">
          <div className="rounded-2xl bg-amber-100/80 p-6 text-center dark:bg-amber-900/20">
            <p className="text-foreground text-sm font-medium leading-relaxed md:text-base">
              Un cockpit financier rafraîchi et lisible en moins de{" "}
              <span className="font-bold text-[#e67e22]">5 secondes</span>. Linky
              s&apos;appuie sur des données fiables pour restituer une lecture
              unique et exploitable.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
