# Atelier — typage avancé : un container d'injection de dépendances

`exercice.ts` contient un container d'injection de dépendances **entièrement fonctionnel mais sans aucun type**.
Ton travail : le typer, sans jamais toucher à la logique runtime.

```bash
npm install          # une seule fois, au début

npm run check        # vérifier les types (4 erreurs au départ)
npm start            # vérifier que le comportement ne change pas
npm run test:1       # les tests de l'étape 1 (puis test:2, test:3, test:4)
```

Sous VS Code, accepte le pop-up « utiliser la version TypeScript de l'espace de travail » : sinon
l'éditeur survole avec le TS embarqué de l'extension, qui peut différer de celui installé par
`npm install` — or les critères de réussite ci-dessous se lisent au survol.

Chaque étape a ses **tests de typage** dans `tests/`. Ils ne s'exécutent pas : ils passent, ou ne
compilent pas. Une étape est terminée quand son test sort sans aucune erreur.

Les tests d'une étape ignorent volontairement les `implicit any` restants, pour ne mesurer que
l'étape en cours — c'est `npm run check` qui te guide sur ceux-là. Ils sont cumulatifs :
`test:3` suppose les étapes 1 et 2 faites.

La sortie de `node` doit rester identique du début à la fin :

```
singleton : true
transient : false
Connected! { ok: true }
```

L'objectif final est que ces trois choses soient vraies :

- au survol, `database` est de type `Database` — pas `any`
- au survol, `parse` est de type `(input: string) => any`
- les deux dernières lignes commentées du fichier, une fois décommentées, ne compilent plus

## Noms imposés

Les tests cherchent ces noms précis. S'ils ne correspondent pas, tu resteras rouge avec un
`Cannot find name ...` même si ta solution est juste.

| nom | étape | ce que c'est |
|---|---|---|
| `Factory<TService>` | 1 | le type d'une factory, avec un paramètre de type |
| `ProviderRecord` | 1 | une entrée du registre, avec les champs `factory` et `isSingleton` |
| `DependenciesContainer<TServices>` | 2 | la classe existe déjà : tu lui ajoutes son **premier** paramètre de type, le registre |

Tout le reste est libre et vérifié par aucun test : le nom de tes paramètres de type
(`TService`, `TName`, `TServices`…) comme celui des types intermédiaires des étapes 2 et 4.

---

## Étape 1 — les briques de base

**À créer** :

- `Factory<TService>` — une fonction qui reçoit le container et renvoie un `TService`
- `ProviderRecord` — un objet à deux champs, `factory` et `isSingleton`

**À annoter ensuite** : les deux champs de la classe (`providers` et `singletons`), le paramètre
`factory` de `add()`, et le paramètre `input` de `jsonParser` en bas du fichier.

Une factory reçoit le container (pour résoudre ses propres dépendances) et renvoie un service.
Le type du service change d'une factory à l'autre : il te faut un générique.

Pour le container reçu en paramètre, `any` est acceptable ici — on ne peut pas encore le typer sans tourner en rond.

**Vérification** : `npm run test:1` passe, et `npm run check` n'affiche plus d'erreur sur `factory`.

## Étape 2 — le registre qui grossit

**À créer** : le premier paramètre de type de la classe — appelle-le `TServices`. Et, si tu veux garder
la signature de `add()` lisible, un type intermédiaire « registre + une entrée de plus », par exemple
`WithService<TServices, TName, TService>` : ce nom est libre, tu peux aussi tout écrire dans la signature.

Ce paramètre de type représente le registre, sous la forme `{ nom → type du service }`,
avec `{}` comme valeur par défaut (un container neuf ne connaît rien).

Puis fais en sorte que `add()` renvoie un container dont le registre contient **une entrée de plus** que le précédent.
C'est le cœur de l'exercice.

Pistes : un générique capture le nom passé en argument (`extends string`), un autre capture le type produit par la factory.
Pour fabriquer un objet dont la clé est ce nom, regarde du côté des *mapped types* (`{ [K in TName]: ... }`).
Pour combiner l'ancien registre et la nouvelle entrée, pense à l'intersection (`&`).

**Vérification** : `npm run test:2` passe. Survole aussi `container` : tu dois voir tes trois services
(`database`, `transientDatabase`, `jsonParser`) avec leurs types respectifs, accumulés au fil des `.add()`.

## Étape 3 — lire dans le registre

**À créer** : aucun type nouveau. Tout se joue dans la signature de `retrieve()`, avec un paramètre
de type local (`TName`) contraint aux clés du registre.

`retrieve()` ne doit accepter qu'un nom présent dans le registre, et renvoyer le type exact du service correspondant.

Pistes : `keyof` pour contraindre le nom aux clés du registre, et un *accès indexé* (`TServices[TName]`) pour en tirer le type.

Tu vas buter sur les appels à la `Map`, qui attend une clé `string` alors que ton nom est d'un type plus précis.
Un `as string` est la réponse pragmatique ici : place-le une seule fois, en haut de la méthode.

**Vérification** : `npm run test:3` passe — `database.connect()` est autorisé, et `container.retrieve("mailer")` ne compile plus.

## Étape 4 (bonus) — interdire un doublon

**À créer** : un type conditionnel, par exemple `AvailableName<TName, TServices>`. Nom libre là aussi.

Enregistrer deux fois le même nom devrait être une erreur de compilation.

Piste : un *conditional type* sur le paramètre `name`. Si le nom est déjà une clé du registre, fais-le se résoudre
en `never` — un type qu'aucune valeur ne peut satisfaire, ce qui rend l'argument impossible à fournir.

**Vérification** : `npm run test:4` passe. `container.add("database", () => new Database())` ne compile plus,
et le message d'erreur parle bien de `never`. Le test vérifie aussi que ton garde-fou n'a pas cassé
l'inférence de l'étape 2 — c'est le piège classique de cette étape.

---

## Pour aller plus loin

- Ajoute `readonly` aux entrées du registre. Qu'est-ce que ça change concrètement pour l'appelant ?
- `add()` ne mute jamais le container : il en renvoie un nouveau. Pourquoi est-ce indispensable
  pour que l'accumulation de types fonctionne ?
- Le `container: any` de l'étape 1 : que se passe-t-il si tu essaies de le typer correctement ?
- `providers` et `singletons` peuvent aussi devenir `private readonly` sur la classe, en plus d'être
  annotés. Qu'est-ce que ça interdit à l'appelant que la simple annotation n'interdisait pas ?

## Où tu reverras ce pattern

Un container d'injection de dépendances est le cas d'école du problème « la forme de mon objet
dépend de ce que l'appelant y a mis ». Le même mécanisme fait tourner tRPC (le routeur connaît
toutes tes procédures), Zod (`z.object()` en déduit un type TS), et n'importe quel query builder SQL
typé. Le nom du pattern que tu viens de construire : *builder typé* / accumulation de types.

Le coût est réel : signatures denses, messages d'erreur parfois obscurs (`not assignable to type
'never'` ne dit pas *pourquoi*), temps de compilation. On paie ça pour une API que les utilisateurs
ne peuvent pas mal utiliser — à réserver aux frontières très réutilisées d'un codebase, pas à
généraliser partout.
