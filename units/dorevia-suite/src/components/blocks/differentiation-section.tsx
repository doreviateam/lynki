export const DifferentiationSection = () => {
  return (
    <section
      className="bg-muted/15 py-24 lg:py-32"
      aria-labelledby="differentiation-titre"
    >
      <div className="container max-w-3xl">
        <h2
          id="differentiation-titre"
          className="text-center text-2xl font-bold tracking-tight text-[#1e3a5f] md:text-4xl lg:text-5xl"
        >
          Voir des chiffres ne suffit pas. Il faut pouvoir les lire.
        </h2>
        <p className="text-muted-foreground mt-8 text-center leading-relaxed md:text-lg">
          Linky ne se contente pas d&apos;afficher des indicateurs.
        </p>
        <p className="text-muted-foreground mt-4 text-center leading-relaxed md:text-lg">
          Il aide à comprendre :
        </p>
        <ul className="text-muted-foreground mx-auto mt-6 max-w-md list-inside list-disc space-y-2 text-left leading-relaxed">
          <li>ce qui se passe,</li>
          <li>pourquoi cela compte,</li>
          <li>où agir en priorité.</li>
        </ul>
        <p className="text-foreground mt-10 text-center text-lg font-semibold">
          Moins de lecture brute. Plus de pilotage.
        </p>
      </div>
    </section>
  );
};
