// Point de départ : tout ici est du JavaScript valide, sans aucun type.
// Objectif : typer ce container au fil des 4 étapes de ENONCE.md.
// La logique runtime est correcte : ne la modifie pas, seuls les types changent.

// TODO étape 1 : créer `Factory<TService>` et `ProviderRecord`.
// Ces deux noms sont imposés : les tests s'y réfèrent.

class DependenciesContainer {
  providers;
  singletons;

  constructor(providers = new Map(), singletons = new Map()) {
    this.providers = providers;
    this.singletons = singletons;
  }

  // TODO étape 2 : à chaque add(), le container renvoyé doit connaître un service de plus.
  // Le registre sera porté par un premier paramètre de type à ajouter sur la classe, `TServices`.
  // TODO étape 4 (bonus) : refuser un nom déjà enregistré.
  add(name, factory, isSingleton = false) {
    const providers = new Map(this.providers);
    providers.set(name, { factory, isSingleton });

    return new DependenciesContainer(providers, this.singletons);
  }

  // TODO étape 3 : n'accepter qu'un nom connu, et renvoyer le type exact du service.
  retrieve(name) {
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

const jsonParser = (input) => JSON.parse(input);

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
