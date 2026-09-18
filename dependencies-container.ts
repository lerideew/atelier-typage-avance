// ============================================================
//  Types utilitaires
// ============================================================

// Le container est passé à la factory pour qu'elle résolve ses propres dépendances.
type Factory<TService> = (container: any) => TService;

// Un nom déjà pris devient `never` : plus aucune valeur ne peut être passée en argument.
type AvailableName<TName extends string, TServices> = TName extends keyof TServices
  ? never
  : TName;

// Ajoute une entrée au registre de types, sans toucher aux précédentes.
type WithService<TServices, TName extends string, TService> = TServices & {
  readonly [K in TName]: TService;
};

// ============================================================
//  Le container
// ============================================================

interface ProviderRecord {
  factory: Factory<any>;
  isSingleton: boolean;
}

// TServices est le registre { nom -> type du service } ; il s'enrichit à chaque .add().
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

    // On ne mute rien : on renvoie un nouveau container au registre élargi.
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
//  Démo
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

// Ce que le typage interdit. Fonction jamais appelée : seul le compilateur la lit.
function erreursAttendues() {
  // @ts-expect-error 'database' est déjà enregistré, donc le nom attendu est `never`
  container.add("database", () => new Database());

  // @ts-expect-error 'mailer' n'existe pas dans le registre
  container.retrieve("mailer");
}
