// Étape 3 — `retrieve()` ne doit accepter qu'un nom connu, et renvoyer le type exact du service.

class E3Database {
  connect() {
    return "Connected!";
  }
}

const e3Container = new DependenciesContainer()
  .add("database", () => new E3Database(), true)
  .add("parse", () => (input: string) => JSON.parse(input))
  .add("count", () => 42);

const e3Database = e3Container.retrieve("database");
type E3_Database = Expect<Equal<typeof e3Database, E3Database>>;

const e3Parse = e3Container.retrieve("parse");
type E3_Parse = Expect<Equal<typeof e3Parse, (input: string) => any>>;

const e3Count = e3Container.retrieve("count");
type E3_Count = Expect<Equal<typeof e3Count, number>>;

// Le service est directement utilisable, sans cast ni vérification.
const e3Connected: string = e3Container.retrieve("database").connect();

// @ts-expect-error 'mailer' n'est pas enregistré dans ce container
e3Container.retrieve("mailer");

// Un container vide ne peut rien fournir.
const e3Empty = new DependenciesContainer();
// @ts-expect-error un container vide n'a aucun nom valide à proposer
e3Empty.retrieve("database");
