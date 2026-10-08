// Solution complète de l'atelier : étapes 1 à 4, plus le typage du paramètre `container` des factories.
// Les annotations sont les seules modifications par rapport à exercice.ts : la logique runtime est identique.

// Rend le fichier isolé (module) : sinon l'éditeur le confond avec exercice.ts et les autres corrigés.
export {};

// ---------- Étape 1 : les briques de base ----------

// Le second paramètre (le registre) permet de typer le `container` reçu par la factory.
// Valeur par défaut `any` : `Factory<Service>` reste utilisable seul.
type Factory<TService, TServices extends Record<string, any> = any> = (
  container: DependenciesContainer<TServices>
) => TService;

interface ProviderRecord {
  factory: Factory<any>; // stocke des factories de services différents
  isSingleton: boolean;
}

// ---------- Étape 4 : refuser un doublon ----------

// Si le nom est déjà dans le registre, l'argument devient de type `never` : impossible à fournir.
// Sinon on renvoie `TName` tel quel, ce qui préserve l'inférence du littéral (piège classique).
type AvailableName<TName extends string, TServices> = TName extends keyof TServices ? never : TName;

// ---------- Étape 2 : le registre qui grossit ----------

// « registre + une entrée de plus »
type WithService<TServices, TName extends string, TService> = TServices & {
  readonly [K in TName]: TService;
};

class DependenciesContainer<TServices extends Record<string, any> = {}> {
  providers: Map<string, ProviderRecord>;
  singletons: Map<string, any>;

  constructor(
    providers: Map<string, ProviderRecord> = new Map(),
    singletons: Map<string, any> = new Map()
  ) {
    this.providers = providers;
    this.singletons = singletons;
  }

  add<TName extends string, TService>(
    name: AvailableName<TName, TServices>,
    factory: Factory<TService, TServices>, // la factory voit le registre courant
    isSingleton: boolean = false
  ): DependenciesContainer<WithService<TServices, TName, TService>> {
    const providers = new Map(this.providers);
    providers.set(name, { factory, isSingleton });

    return new DependenciesContainer<WithService<TServices, TName, TService>>(
      providers,
      this.singletons
    );
  }

  // ---------- Étape 3 : lire dans le registre ----------

  // `& string` : `keyof` inclut number et symbol, or la Map est indexée par des string.
  retrieve<TName extends keyof TServices & string>(name: TName): TServices[TName] {
    const provider = this.providers.get(name);

    if (!provider) {
      throw new Error(`Service ${name} introuvable.`);
    }

    if (this.singletons.has(name)) {
      return this.singletons.get(name);
    }

    const service = provider.factory(this);

    if (provider.isSingleton) {
      this.singletons.set(name, service);
    }

    return service;
  }
}

// ============================================================
//  Terrain de jeu : ce code doit continuer à fonctionner à l'identique
// ============================================================

class Database {
  connect() {
    return "Connected!";
  }
}

const jsonParser = (input: string) => JSON.parse(input);

const container = new DependenciesContainer()
  .add("database", () => new Database(), true) // singleton : une seule instance
  .add("transientDatabase", () => new Database()) // une nouvelle instance par retrieve()
  .add("jsonParser", () => jsonParser);

const database = container.retrieve("database"); // Database
const parse = container.retrieve("jsonParser"); // (input: string) => any

console.log("singleton :", container.retrieve("database") === container.retrieve("database"));
console.log(
  "transient :",
  container.retrieve("transientDatabase") === container.retrieve("transientDatabase")
);
console.log(database.connect(), parse('{ "ok": true }'));

// Sortie attendue, avant comme après le typage :
//   singleton : true
//   transient : false
//   Connected! { ok: true }

// ============================================================
//  Bonus : une factory qui dépend d'un autre service (container typé)
// ============================================================

const withDeps = new DependenciesContainer()
  .add("config", () => ({ url: "postgres://localhost" }))
  .add("connection", (c) => `${new Database().connect()} ${c.retrieve("config").url}`);

const connection: string = withDeps.retrieve("connection");

// ============================================================
//  Critères de réussite : chacune des lignes ci-dessous est refusée à la compilation
// ============================================================

// Jamais appelée : ces lignes ne doivent exister que pour le compilateur.
function _refused() {
  // @ts-expect-error doublon (étape 4)
  container.add("database", () => new Database());
  // @ts-expect-error nom inconnu (étape 3)
  container.retrieve("mailer");
  // @ts-expect-error nom inconnu dans une factory (container typé)
  new DependenciesContainer().add("a", (c) => c.retrieve("nope"));
}
