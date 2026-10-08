# Atelier — typage avancé : un container d'injection de dépendances

`exercice.ts` contient un container d'injection de dépendances **entièrement fonctionnel mais sans aucun type**.
Ton travail : le typer, sans jamais toucher à la logique runtime.

**Prérequis** : Node ≥ 23.6 (`.nvmrc` : 24), car `npm start` lance `node exercice.ts` (types retirés
nativement ; en cas de Node plus ancien, `npm run start:tsx`). Connaissances utiles : génériques et
contraintes (`extends`), `keyof`, accès indexé (`T[K]`), *mapped types*, *conditional types*.
Deux règles : « ne pas toucher à la logique » signifie que seuls les types changent (annotations,
arguments de type, et au besoin un cast ou une variable locale, comme indiqué à l'étape 3) ;
et `exercice.ts` doit rester un script global : **n'y ajoute ni `import` ni `export`**, les tests
y accèdent directement par leurs noms.

```bash
npm install          # une seule fois, au début

npm run check        # vérifier les types (4 erreurs au départ)
npm start            # vérifier que le comportement ne change pas
npm run test:1       # les tests de l'étape 1 (puis test:2, test:3, test:4)
npm test             # état d'avancement global
```

Sous VS Code, accepte le pop-up « utiliser la version TypeScript de l'espace de travail » : sinon
l'éditeur survole avec le TS embarqué de l'extension, qui peut différer de celui installé par
`npm install` — or les critères de réussite ci-dessous se lisent au survol. Avec un autre éditeur,
pointe-le vers `node_modules/typescript/lib`.

Chaque étape a ses **tests de typage** dans `tests/`. Ils ne s'exécutent pas : ils passent, ou ne
compilent pas. Une étape est terminée quand son test sort sans aucune erreur.
**Attention** : ils ne vérifient qu'une partie du travail (par exemple, `test:1` ne contrôle pas
les annotations des champs ni de `jsonParser`). Termine aussi la liste « À annoter » de chaque étape.

Lire un échec : l'erreur pointe une ligne de `tests/etape-N.test-d.ts`. `Type 'false' does not
satisfy the constraint 'true'` signifie qu'un `Expect<Equal<A, B>>` échoue (A et B diffèrent) ;
`Unused '@ts-expect-error' directive` signifie qu'une ligne qui devrait être refusée est acceptée ;
`Cannot find name` signifie qu'un nom imposé manque. Une erreur dans `exercice.ts` est ta propre erreur de typage.

Les tests d'une étape ignorent volontairement les `implicit any` restants, pour ne mesurer que
l'étape en cours — c'est `npm run check` qui te guide sur ceux-là. Ils sont cumulatifs :
`test:3` suppose les étapes 1 et 2 faites.

La sortie de `node` doit rester identique du début à la fin :

```
singleton : true
transient : false
Connected! { ok: true }
```

L'objectif final (avec le bonus de l'étape 4 pour le troisième point) est que ces trois choses soient vraies :

- au survol, `database` est de type `Database` — pas `any`
- au survol, `parse` est de type `(input: string) => any`
- les deux dernières lignes commentées du fichier, une fois décommentées, ne compilent plus
  (la première grâce à l'étape 4, la seconde grâce à l'étape 3). **Recommente-les ensuite** :
  `retrieve("mailer")` lèverait une erreur à l'exécution et casserait `npm start`

## Noms imposés

Les tests cherchent ces noms précis. S'ils ne correspondent pas, tu resteras rouge avec un
`Cannot find name ...` même si ta solution est juste.

| nom | étape | ce que c'est |
|---|---|---|
| `Factory<TService>` | 1 | le type d'une factory, avec un paramètre de type |
| `ProviderRecord` | 1 | une entrée du registre, avec les champs `factory` et `isSingleton` |
| `DependenciesContainer<TServices>` | 2 | la classe existe déjà : tu lui ajoutes son **premier** paramètre de type, le registre |

Tout le reste est libre et vérifié par aucun test : le nom de tes paramètres de type
(`TService` au singulier pour une factory, `TServices` au pluriel pour le registre : ne les confonds pas)
comme celui des types intermédiaires des étapes 2 et 4.

---

## Étape 1 — les briques de base

**À créer** :

- `Factory<TService>` — une fonction qui reçoit le container et renvoie un `TService`
- `ProviderRecord` — un objet à deux champs, `factory` et `isSingleton`

**À annoter ensuite** : les deux champs de la classe (`providers` : `Map<string, ProviderRecord>`,
`singletons` : `Map<string, any>`), les paramètres du constructeur (ils n'ont pas d'erreur, mais sans
annotation ils restent des `Map<any, any>`), le paramètre `factory` de `add()`, et le paramètre
`input` de `jsonParser` en bas du fichier (`string`).

Dans `ProviderRecord`, le champ `factory` stocke des factories de services différents : `Factory<any>`
est le choix pragmatique. De même `any` pour les valeurs des singletons : le registre
(étapes 2-3) porte la précision, pas les `Map`.

Une factory reçoit le container (pour résoudre ses propres dépendances) et renvoie un service.
Le type du service change d'une factory à l'autre : il te faut un générique.

Pour le container reçu en paramètre, `any` est acceptable ici — on ne peut pas encore le typer sans tourner en rond.

<details><summary>Pas à pas</summary>

Vérifie avec `npm run check` après chaque point.


1. En haut du fichier, écris `type Factory<TService> = ...` : une fonction à un paramètre `container`
   (typé `any`) qui renvoie `TService`. Relance `npm run test:1` : les erreurs liées à `Factory` doivent disparaître.
2. Juste en dessous, écris `ProviderRecord` : un objet (`interface` ou `type`) avec `factory` et `isSingleton`.
   Relance `npm run test:1` : il doit passer entièrement.
3. Dans la classe, type les champs `providers` et `singletons`, puis les deux paramètres du constructeur
   avec les mêmes types.
4. Dans `add()`, type le paramètre `factory` avec ta `Factory`. Il n'a pas encore de service précis :
   pour l'instant, `Factory<unknown>` ou `Factory<any>`. L'erreur sur `factory` disparaît.
5. En bas du fichier, type `input` de `jsonParser`. L'erreur sur `input` disparaît.

</details>

<details><summary>Coup de pouce : forme de <code>Factory</code> et <code>ProviderRecord</code></summary>

```ts
type Factory<TService> = (container: ???) => ???;

interface ProviderRecord {
  factory: ???;
  isSingleton: ???;
}
```

Remplace chaque `???` : il y en a un par information donnée plus haut (le container, le service renvoyé,
la factory stockée — hétérogène, donc `Factory<any>` —, et un booléen).

</details>

**Vérification** : `npm run test:1` passe, et `npm run check` n'affiche plus d'erreur sur `factory` ni
sur `input`. Il reste deux erreurs sur `name` (dans `add()` : étape 2, dans `retrieve()` : étape 3).

## Étape 2 — le registre qui grossit

**À créer** : le premier paramètre de type de la classe — appelle-le `TServices`. Et, si tu veux garder
la signature de `add()` lisible, un type intermédiaire « registre + une entrée de plus », par exemple
`WithService<TServices, TName, TService>` : ce nom est libre, tu peux aussi tout écrire dans la signature.

Ce paramètre de type représente le registre : un type objet dont chaque clé est un nom de service et
chaque valeur le type du service, par exemple `{ database: Database; count: number }`. Sa valeur par
défaut est `{}` (un container neuf ne connaît rien). Pas besoin d'autre paramètre de type sur la classe.

Puis fais en sorte que `add()` renvoie un container dont le registre contient **une entrée de plus** que le précédent.
C'est le cœur de l'exercice.

<details><summary>Pistes</summary>

un générique capture le nom passé en argument ; le contraindre par `extends string` demande
à TypeScript d'inférer le littéral `"database"` plutôt que `string`. Un autre capture le type produit par la factory.
Dans `add()`, `new DependenciesContainer(...)` ne devine pas le nouveau registre : donne-lui-le
explicitement (`new DependenciesContainer<...>(...)`).
Pour fabriquer un objet dont la clé est ce nom, regarde du côté des *mapped types* (`{ [K in TName]: ... }`).
Pour combiner l'ancien registre et la nouvelle entrée, pense à l'intersection (`&`).

</details>

<details><summary>Pas à pas</summary>

1. Ajoute le paramètre de type à la classe : `class DependenciesContainer<TServices ... = {}>`.
   `npm run check` ne dit rien de plus, c'est normal : le test 2 va lui commencer à avoir un sens.
2. Écris le type « registre + une entrée » (`WithService`). Ses trois paramètres : l'ancien registre,
   le nom, le type du service. Il vaut l'ancien registre `&` un objet qui n'a qu'une clé, le nom.
3. Dans `add()`, déclare deux paramètres de type propres à la méthode : `TName` (contraint à `string`)
   et `TService`. Utilise `TName` pour `name` et `Factory<TService>` pour `factory`.
4. Déclare le type de retour : `DependenciesContainer<WithService<TServices, TName, TService>>`.
5. Le `return new DependenciesContainer(...)` est maintenant en erreur : le compilateur ne devine pas le
   nouveau registre. Donne-le-lui entre chevrons (`new DependenciesContainer<...>(...)`).
6. `npm run test:2`. Puis survole `container` en bas du fichier.

</details>

<details><summary>Coup de pouce : le type « une entrée de plus »</summary>

```ts
type WithService<TServices, TName extends string, TService> = TServices & {
  [K in ???]: ???;
};
```

Un *mapped type* sur `TName` ne produit qu'une seule clé, puisque `TName` est un littéral comme `"database"`.

</details>

<details><summary>Coup de pouce : si le test 2 ne passe pas</summary>

- Si `keyof` donne `string` au lieu de `"database" | "count"`, c'est que `TName` n'est pas contraint par
  `extends string`, ou qu'il n'est pas utilisé comme type du paramètre `name`.
- Si le type d'un service est `unknown`, c'est que `factory` n'est pas typée avec `Factory<TService>`.

</details>

**Vérification** : `npm run test:2` passe. Survole aussi `container` : tu dois retrouver tes trois services
(`database`, `transientDatabase`, `jsonParser`) avec leurs types, accumulés au fil des `.add()` — sous forme
d'intersections `{} & {...} & {...}`, c'est normal. Pour lire un type précis, survole le résultat
de `retrieve()`.

## Étape 3 — lire dans le registre

**À créer** : aucun type nouveau. Tout se joue dans la signature de `retrieve()`, avec un paramètre
de type local (`TName`) contraint aux clés du registre.

`retrieve()` ne doit accepter qu'un nom présent dans le registre, et renvoyer le type exact du service correspondant.

<details><summary>Pistes</summary>

`keyof` pour contraindre le nom aux clés du registre, et un *accès indexé* (`TServices[TName]`) pour en tirer le type.

Tu vas buter sur les appels à la `Map`, qui attend une clé `string` : `keyof` donne en effet
`string | number | symbol`, pas forcément une `string`. Deux solutions : contraindre en plus
`TName extends keyof TServices & string` (aucun cast), ou écrire `const key = name as string;` en haut de la méthode
et utiliser `key` ensuite (seule modification de corps de méthode tolérée de l'exercice).

</details>

<details><summary>Pas à pas</summary>

1. Dans `retrieve(name)`, ajoute un paramètre de type `TName` contraint aux clés du registre
   (`keyof TServices`) et type `name` avec. `npm run check` : l'erreur sur `name` disparaît, mais
   des erreurs apparaissent sur les appels à la `Map` (clé de type `string | number | symbol`).
2. Règle ces erreurs avec une des deux solutions ci-dessus.
3. Ajoute le type de retour : le type du service pour ce nom, par accès indexé.
4. Si le `return` est en erreur, rappelle-toi que les `Map` stockent `any` (étape 1) : il ne devrait pas l'être.
5. `npm run test:3`, puis `npm start` : la sortie doit être inchangée.

</details>

<details><summary>Coup de pouce : la signature complète</summary>

```ts
retrieve<TName extends keyof TServices & string>(name: TName): TServices[???] { ... }
```

</details>

**Vérification** : `npm run test:3` passe — `database.connect()` est autorisé, et `container.retrieve("mailer")` ne compile plus.

## Étape 4 (bonus) — interdire un doublon

**À créer** : un type conditionnel, par exemple `AvailableName<TName, TServices>`. Nom libre là aussi.

Enregistrer deux fois le même nom devrait être une erreur de compilation.

<details><summary>Pistes</summary>

Piste : un *conditional type* sur le paramètre `name`. Si le nom est déjà une clé du registre, fais-le se résoudre
en `never` — un type qu'aucune valeur ne peut satisfaire, ce qui rend l'argument impossible à fournir.

</details>

<details><summary>Pas à pas</summary>

1. Écris un type conditionnel `AvailableName<TName extends string, TServices>` : si `TName` est une clé
   de `TServices` (`TName extends keyof TServices`), il vaut `never`, sinon il vaut `TName`.
2. Dans `add()`, remplace le type de `name` (aujourd'hui `TName`) par `AvailableName<TName, TServices>`.
3. `npm run test:4`. Si c'est rouge sur « l'inférence de l'étape 2 », relis l'étape 1 de ce pas-à-pas :
   le *else* du conditionnel doit renvoyer `TName`, pas `string`.

</details>

<details><summary>Coup de pouce : forme du type</summary>

```ts
type AvailableName<TName extends string, TServices> =
  TName extends keyof TServices ? ??? : ???;
```

</details>

<details><summary>Pourquoi `TName` reste inférable alors que `name` n'est plus de type `TName` ?</summary>

TypeScript sait inférer `TName` à travers un type conditionnel qui renvoie `TName` dans une de ses branches :
il en déduit que `TName` est le littéral passé en argument, puis évalue le conditionnel.

</details>

**Vérification** : `npm run test:4` passe. `container.add("database", () => new Database())` ne compile plus,
et le message d'erreur parle de `never` (à vérifier toi-même : le test accepte n'importe quelle erreur).
Le test vérifie aussi que ton garde-fou n'a pas cassé l'inférence de l'étape 2 — c'est le piège classique
de cette étape : si `TName` n'est plus inféré comme littéral, c'est que le paramètre `name` n'est plus
un simple `TName` ; il faut que `TName` reste inférable depuis `name` tout en étant filtré par ton type conditionnel.

---

## Pour aller plus loin

- Ajoute `readonly` aux entrées du registre. Que peut ou ne peut plus faire un code qui reçoit le
  type `TServices[...]` ou le registre lui-même ?
- `add()` renvoie un nouveau container (mais partage la `Map` `singletons` avec l'ancien : quel effet ?).
  Pourquoi le type de retour doit-il différer du type de `this` pour que l'accumulation fonctionne ?
- Le `container: any` de l'étape 1 est un trou : une factory peut appeler `container.retrieve("n'importe quoi")`.
  Que se passe-t-il si tu essaies de le typer correctement ?
- `providers` et `singletons` peuvent aussi devenir `private readonly` sur la classe, en plus d'être
  annotés. Qu'est-ce que ça interdit à l'appelant que la simple annotation n'interdisait pas ?
  (Les réponses se discutent en groupe ; le corrigé de référence est fourni en fin d'atelier.)

## Où tu reverras ce pattern

Un container d'injection de dépendances est le cas d'école du problème « la forme de mon objet
dépend de ce que l'appelant y a mis ». Le même mécanisme fait tourner tRPC (le routeur connaît
toutes tes procédures), Zod (`z.object()` en déduit un type TS), et n'importe quel query builder SQL
typé. Ce pattern s'appelle couramment *builder typé* (ou *type-state builder*) : accumulation de types.

Le coût est réel : signatures denses, messages d'erreur parfois obscurs (`not assignable to type
'never'` ne dit pas *pourquoi*), temps de compilation. On paie ça pour une API que les utilisateurs
ne peuvent pas mal utiliser — à réserver aux frontières très réutilisées d'un codebase, pas à
généraliser partout.
