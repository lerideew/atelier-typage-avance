// Point de départ : tout ici est du JavaScript valide, sans aucun type.
// Objectif : typer ce container au fil des 4 étapes de ENONCE.md.
// La logique runtime est correcte : ne la modifie pas, seuls les types changent.

type Factory<TService> = (container: any) => TService;

interface ProviderRecord {
  factory: Factory<any>;
  isSingleton: boolean;
}

type AvailableName<TName extends string, TServices> = TName extends keyof TServices
  ? never
  : TName;

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
    factory: Factory<TService>,
    isSingleton: boolean = false
  ): DependenciesContainer<WithService<TServices, TName, TService>> {
    const providers = new Map(this.providers);
    providers.set(name, { factory, isSingleton });

    return new DependenciesContainer<WithService<TServices, TName, TService>>(
      providers,
      this.singletons
    );
  }

  retrieve<TName extends keyof TServices>(name: TName): TServices[TName] {
    const key = name as string;
    const provider = this.providers.get(key);

    if (!provider) {
      throw new Error(`Service ${key} introuvable.`);
    }

    if (this.singletons.has(key)) {
      return this.singletons.get(key);
    }

    const service = provider.factory(this);

    if (provider.isSingleton) {
      this.singletons.set(key, service);
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

const database = container.retrieve("database");
const parse = container.retrieve("jsonParser");

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
//  Critères de réussite
// ============================================================

// À la fin, `database` doit être de type Database (et non any) au survol,
// `parse` doit être de type (input: string) => any,
// et décommenter ces deux lignes doit produire une erreur de compilation.

// container.add("database", () => new Database());
// container.retrieve("mailer");
