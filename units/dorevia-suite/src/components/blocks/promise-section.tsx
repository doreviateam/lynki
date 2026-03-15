export const PromiseSection = () => {
  return (
    <section
      className="py-24 lg:py-32"
      aria-labelledby="promesse-titre"
    >
      <div className="container max-w-3xl">
        <h2
          id="promesse-titre"
          className="text-center text-2xl font-bold tracking-tight text-[#1e3a5f] md:text-4xl lg:text-5xl"
        >
          Linky transforme des données dispersées en lecture financière claire.
        </h2>
        <div className="text-muted-foreground mt-8 space-y-6 text-center leading-relaxed md:text-lg">
          <p>Pas un dashboard de plus.</p>
          <p>Pas un simple reporting.</p>
          <p>
            Un assistant de contrôle de gestion qui aide les PME à :
          </p>
        </div>
        <ul className="text-muted-foreground mx-auto mt-8 max-w-md list-inside list-disc space-y-2 text-left leading-relaxed">
          <li>lire plus vite,</li>
          <li>hiérarchiser les signaux utiles,</li>
          <li>sécuriser les décisions,</li>
          <li>piloter avec plus de sérénité.</li>
        </ul>
      </div>
    </section>
  );
};
