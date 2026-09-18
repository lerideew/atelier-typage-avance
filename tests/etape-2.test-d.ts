// Étape 2 — chaque `.add()` doit renvoyer un container qui connaît un service de plus.

class E2Database {
  connect() {
    return "Connected!";
  }
}

const e2Container = new DependenciesContainer()
  .add("database", () => new E2Database(), true)
  .add("count", () => 42);

// On lit le registre porté par le type du container.
type E2Registry = typeof e2Container extends DependenciesContainer<infer R> ? R : never;

// Les deux services enregistrés sont connus, et eux seuls.
type E2_Keys = Expect<Equal<keyof E2Registry, "database" | "count">>;

// Chaque nom porte le type exact produit par sa factory.
type E2_Database = Expect<Equal<E2Registry["database"], E2Database>>;
type E2_Count = Expect<Equal<E2Registry["count"], number>>;

// Un container neuf ne connaît aucun service.
const e2Empty = new DependenciesContainer();
type E2EmptyRegistry = typeof e2Empty extends DependenciesContainer<infer R> ? R : never;
type E2_Empty = Expect<Equal<keyof E2EmptyRegistry, never>>;

// Le container de départ n'est pas modifié par l'ajout : chaque .add() en renvoie un nouveau.
const e2Base = new DependenciesContainer().add("database", () => new E2Database());
const e2Extended = e2Base.add("count", () => 42);
type E2BaseRegistry = typeof e2Base extends DependenciesContainer<infer R> ? R : never;
type E2_BaseUntouched = Expect<Equal<keyof E2BaseRegistry, "database">>;
void e2Extended;
