// Étape 1 — `Factory` doit être générique, et `ProviderRecord` décrire une entrée du registre.

class E1Service {
  ping() {
    return "pong";
  }
}

const e1Factory: Factory<E1Service> = () => new E1Service();

// Le type du service produit est porté par le paramètre de type de la factory.
type E1_Return = Expect<Equal<ReturnType<Factory<E1Service>>, E1Service>>;

// Le container est bien passé à la factory.
const e1UsesContainer: Factory<E1Service> = (container) => {
  void container;
  return new E1Service();
};

// @ts-expect-error une Factory<E1Service> ne peut pas renvoyer autre chose
const e1WrongReturn: Factory<E1Service> = () => 42;

// Un provider garde sa factory et son drapeau singleton.
const e1Record: ProviderRecord = { factory: e1Factory, isSingleton: true };

// @ts-expect-error isSingleton fait partie de la forme d'un provider
const e1Incomplete: ProviderRecord = { factory: e1Factory };
