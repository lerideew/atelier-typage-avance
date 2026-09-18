// Étape 4 — enregistrer deux fois le même nom doit être une erreur de compilation.

class E4Database {
  connect() {
    return "Connected!";
  }
}

const e4Container = new DependenciesContainer().add("database", () => new E4Database(), true);

// @ts-expect-error 'database' est déjà enregistré : le nom attendu se résout en `never`
e4Container.add("database", () => new E4Database());

// @ts-expect-error le doublon est refusé quel que soit le type produit par la factory
e4Container.add("database", () => 42);

// Un nom encore libre reste accepté.
const e4Extended = e4Container.add("other", () => new E4Database());

// Le garde-fou ne doit pas avoir cassé l'inférence de l'étape 2.
type E4Registry = typeof e4Extended extends DependenciesContainer<infer R> ? R : never;
type E4_Keys = Expect<Equal<keyof E4Registry, "database" | "other">>;
type E4_Other = Expect<Equal<E4Registry["other"], E4Database>>;

// Et l'étape 3 fonctionne toujours.
const e4Retrieved = e4Extended.retrieve("other");
type E4_Retrieved = Expect<Equal<typeof e4Retrieved, E4Database>>;
