# Plan d'animation — 2h

Document pour l'animateur. L'énoncé participant est dans `ENONCE.md`. Le corrigé n'est pas secret —
`corriges/etape-1.ts` à `etape-4.ts` sont distribués comme filet de rattrapage — mais
`dependencies-container.ts` (même code final, commenté pour la démo) reste fermé jusqu'à la clôture :
c'est lui que tu ouvres à 0:10 pour montrer le résultat, pas avant.

**Format recommandé** : binômes, un seul clavier, on tourne à chaque étape.
Le typage avancé se discute mieux à deux, et ça divise par deux le nombre de personnes bloquées en silence.

**Chaque étape a son test** (`npm run test:1` … `test:4`), et une étape est finie quand son test est vert.
Ça change deux choses pour toi : les participants savent seuls où ils en sont plutôt que de te demander,
et quand tu passes derrière un binôme tu lances la commande au lieu de relire son code.
La progression est vérifiée : chaque test passe au vert exactement à son étape, jamais avant.

---

## Déroulé

| Créneau | Durée | Séquence | Format |
|---|---|---|---|
| 0:00 | 10 min | Accueil + vérification de l'environnement | tous |
| 0:10 | 15 min | Cadrage : la démo du résultat, et pourquoi ce pattern existe | animateur |
| 0:25 | 15 min | **Étape 1** — les briques de base (10 min + 5 debrief) | binômes |
| 0:40 | 35 min | **Étape 2** — le registre qui grossit (25 min + 10 debrief) | binômes |
| 1:15 | 5 min | Pause | — |
| 1:20 | 20 min | **Étape 3** — lire dans le registre (14 min + 6 debrief) | binômes |
| 1:40 | 15 min | **Étape 4** — interdire un doublon (bonus) | binômes |
| 1:55 | 5 min | Clôture : où ce pattern vit en vraie vie | tous |

**Variable d'ajustement : l'étape 4.** Si tu es en retard à 1:40, ne la lance pas en autonomie —
fais-la en démo commentée en 8 minutes. C'est la seule étape sacrifiable sans casser la progression.

---

## 0:00 — Environnement (10 min)

Ne saute pas ce créneau : c'est toujours lui qui déborde, et un participant qui n'a pas `tsc` est perdu pour 2h.

Fais lancer ces commandes à tout le monde, et attends la confirmation de chacun :

```bash
npm install          # indispensable, et à faire en premier
npm start            # doit afficher singleton : true / transient : false / Connected! { ok: true }
npm run check        # doit afficher exactement 4 erreurs, toutes des TS7006
npm run test:1       # doit être rouge : c'est la cible de la première étape
```

Le `npm install` n'est pas cosmétique : sans lui, chaque commande passe par `npx`, qui retélécharge
TypeScript. À douze personnes sur le wifi de la salle, c'est une source de lenteurs et d'échecs
intermittents qui n'ont rien à voir avec l'exercice.

Sur VS Code, un pop-up propose « utiliser la version TypeScript de l'espace de travail » — fais-le
accepter : sinon l'éditeur survole avec le TS embarqué de l'extension, qui peut différer de celui
qu'installe `npm install`, et le critère de réussite n°1 de l'atelier est un survol.

`npm run verify` (nouveau) rejoue toute la progression — les 5 états (départ, étape 1 à 4), leurs
comptes d'erreurs et la couleur des 4 tests — dans une copie temporaire, et échoue au moindre écart.
Lance-le une fois avant la séance : c'est la source de vérité pour tous les chiffres cités plus bas.

`node --version` : `node exercice.ts` sans flag demande Node 23.6+. En dessous, ou en cas de doute,
`npm run start:tsx` fait la même chose via `tsx`, installé en dépendance de dev — donc sans réseau
pendant la séance.

Insiste sur un point qui évite beaucoup de confusion plus tard : **le code fonctionne déjà**.
L'exercice ne consiste pas à réparer un bug, mais à décrire à TypeScript ce que le code fait déjà.
La sortie de `node` doit rester identique jusqu'à la fin — c'est leur filet de sécurité.

## 0:10 — Cadrage (15 min)

Trois temps, courts. Ne fais pas de cours sur les types : ils vont les découvrir en les écrivant.

**1. Montre le résultat (5 min).** Ouvre le corrigé et fais deux gestes à l'écran :
tape `container.retrieve("` et laisse l'autocomplétion proposer les trois noms enregistrés ;
puis survole `database` pour montrer `Database`. Personne n'a écrit `Database` dans un type :
l'information a voyagé de la factory jusqu'au point d'appel. C'est ça qu'on va construire.

**2. Pourquoi (5 min).** Un container d'injection de dépendances est le cas d'école du problème
« la forme de mon objet dépend de ce que l'appelant y a mis ». Le même mécanisme fait tourner
tRPC (le routeur connaît toutes tes procédures), Zod (`z.object()` en déduit un type TS),
et n'importe quel query builder SQL typé. C'est le seul vrai intérêt du typage avancé :
transformer une convention (« passe le bon nom ») en garantie de compilation.

**3. La boîte à outils (5 min).** Annonce les quatre outils, un par étape, sans les détailler :
generics (étape 1), mapped types + intersection (étape 2), `keyof` + accès indexé (étape 3),
conditional types (étape 4). Ils sauront ainsi quoi chercher.

## 0:25 — Étape 1 : les briques de base (15 min)

**Objectif** : `Factory<TService>`, `ProviderRecord`, et les deux champs de classe annotés.
**Sortie** : il reste 2 erreurs — les deux `name` (`add()` et `retrieve()`). Chiffre confirmé par
`npm run verify`, qui rejoue cet état à partir de `corriges/etape-1.ts`.

Blocages à surveiller :

- **Une factory typée sans générique** (`(container: any) => any`). C'est l'erreur qui coûte le plus cher,
  car elle rend les étapes 2 et 3 impossibles sans que la cause soit visible. Passe dans les rangs
  pendant cette étape uniquement pour vérifier ça. Indice : « qu'est-ce qui change entre la factory
  de `database` et celle de `jsonParser` ? »
- **Le `container: any` les gêne.** Assume-le à voix haute dès le début : typer ce paramètre correctement
  demande de référencer le container depuis l'intérieur de sa propre définition. On y revient en clôture.
- **`Map<string, unknown>` pour les singletons.** Piège gentil : ça compile ici, mais ça explosera
  à l'étape 3 sur `return this.singletons.get(key)`. Laisse-les le découvrir, c'est une belle
  illustration de `any` comme concession assumée plutôt que comme paresse.

## 0:40 — Étape 2 : le registre qui grossit (35 min)

**C'est le cœur de l'atelier.** Prévois 25 min de travail, et annonce dès le départ que
cette étape est la difficile : ça évite le découragement.

**Objectif** : le paramètre de type `TServices` sur la classe, et `add()` qui renvoie un container enrichi.
**Vérification** : au survol de `container`, on voit les trois services accumulés.

Blocages à surveiller, dans l'ordre de fréquence :

- **`return this`, ou muter `this.providers`.** Le blocage conceptuel majeur, et le plus intéressant.
  Un objet ne peut pas changer de type en cours de vie : si `add()` renvoie `this`, le type ne peut pas grossir.
  L'immutabilité n'est pas un choix de style ici, c'est ce qui **rend l'accumulation de types possible**.
  Si plusieurs binômes bloquent là, arrête tout et fais-en une explication collective de 3 minutes.
- **`{ [TName]: TService }`** au lieu de `{ [K in TName]: TService }`. Confusion très courante entre
  propriété calculée (valeur) et mapped type (type). Indice : « en position de type, `[X]` n'existe pas, `[K in X]` oui ».
- **Un seul générique sur `add`.** Il en faut deux : un pour le nom, un pour ce que produit la factory.
- **L'argument de type oublié à l'instanciation** : `new DependenciesContainer(...)` sans `<...>` retombe
  sur la valeur par défaut `{}` et le type de retour annoncé devient un mensonge silencieux.
  Fais-leur écrire l'instanciation explicitement.
- **Le survol affiche une intersection illisible** du genre `DependenciesContainer<{ readonly database: Database; } & { readonly ... }>`.
  Rassure : c'est normal et correct, l'intersection n'est pas « aplatie » à l'affichage. À garder pour la clôture.

Debrief (10 min) : fais présenter une solution par un binôme, puis pose la question qui fixe la leçon —
« pourquoi est-ce que ça n'aurait pas pu marcher avec un container mutable ? ».

**Deux angles morts que les tests ne voient pas** — les seuls de tout l'atelier, donc les seuls
endroits où tu dois regarder le code plutôt que lancer une commande :
- *La mutation.* `E2_BaseUntouched` (dans `etape-2.test-d.ts`) compare des **types**, pas des valeurs :
  un binôme qui mute `this.providers` et renvoie `this` avec le bon type de retour annoncé reste vert
  sur les quatre tests, et `npm start` ne bronche pas non plus. Si tu vois `return this` ou une
  mutation de `this.providers` dans `add()`, c'est un problème même si tout est vert.
- *L'argument de type oublié.* `new DependenciesContainer(...)` sans `<...>` à l'intérieur de `add()`
  compile en silence et **`test:2` passe quand même** — la valeur par défaut `{}` masque l'erreur.
  D'où la consigne plus haut : fais-leur écrire l'instanciation explicitement, ne te fie pas au vert.

## 1:20 — Étape 3 : lire dans le registre (20 min)

**Objectif** : `retrieve<TName extends keyof TServices>(name: TName): TServices[TName]`.
**Vérification** : `database.connect()` passe, `retrieve("mailer")` ne compile plus.

Après l'étape 2, celle-ci est vécue comme une récompense : c'est là que l'autocomplétion s'allume.
Fais-le remarquer, c'est le moment le plus gratifiant de l'atelier.

Blocages à surveiller :

- **La bagarre avec la `Map`.** Elle attend une clé `string`, ils ont un type plus précis.
  Le `as string` posé une seule fois en tête de méthode est la bonne réponse. Profites-en pour dire
  quand une assertion est légitime : à la frontière entre un type précis et une structure de stockage
  volontairement non typée, quand c'est *nous* qui garantissons l'invariant.
- **Tester sur un container vide.** Sur `new DependenciesContainer()`, `keyof {}` vaut `never` :
  tout appel à `retrieve` est refusé. Ce n'est pas un bug, c'est la bonne réponse — un container vide
  n'a rien à fournir.

## 1:40 — Étape 4 : interdire un doublon (bonus, 15 min)

**Objectif** : `TName extends keyof TServices ? never : TName` en position de paramètre.

- **La question qui va tomber** — et elle est excellente : « TypeScript arrive-t-il encore à inférer `TName`
  si le paramètre est un type conditionnel ? » Réponse vérifiée : oui. L'inférence se fait bien,
  le registre reste correct, et un doublon produit `Argument of type '"database"' is not assignable to parameter of type 'never'`.
  Si quelqu'un doute, faites-le tester en direct plutôt que de le croire.
- **Conditional en position de retour** plutôt que de paramètre : ça marche aussi, mais l'erreur
  se manifeste au mauvais endroit (à l'usage du résultat, pas sur l'argument fautif).
  Bonne occasion de parler du *lieu* où une erreur apparaît comme critère de qualité d'une API.
- **Le message d'erreur est cryptique.** `not assignable to 'never'` ne dit pas *pourquoi*.
  Question ouverte à lancer si le temps le permet : comment feriez-vous porter le message par le type lui-même ?

## 1:55 — Clôture (5 min)

Trois choses à laisser en tête :

- Le pattern a un nom : *builder typé* / accumulation de types. Ils le reverront dans tRPC, Zod, Drizzle, Awilix.
- Le coût est réel : signatures denses, messages d'erreur obscurs, temps de compilation. On paie ça
  pour une API que les utilisateurs ne peuvent pas mal utiliser. À réserver aux frontières très réutilisées.
- Les deux fils laissés en suspens, comme pistes perso : aplatir l'affichage des intersections
  avec un type utilitaire (`Prettify`), et typer le `container: any` de la factory.

---

## À faire par toi avant chaque séance

- [ ] Faire l'exercice toi-même une fois en conditions réelles, montre en main. C'est le seul moyen fiable de valider les timeboxes sur ton public.
- [ ] Lancer `npm run verify` : il doit terminer sur « La matrice de progression est conforme ». Sinon, les chiffres de ce document ne sont plus fiables — corrige-le avant la séance, pas pendant.
- [ ] Vérifier `node --version` sur les postes. `node exercice.ts` sans flag demande Node 23.6+ ; sur Node 22.6+ il faut `node --experimental-strip-types exercice.ts`. En dessous, ou en cas de doute, `npm run start:tsx` marche partout (via `tsx`, en dépendance de dev — pas de réseau pendant la séance) : annonce-la d'emblée pour ne pas trier les cas à la volée.

## Ce qui est déjà en place

- **Fichiers de rattrapage** : `corriges/etape-1.ts` à `etape-4.ts`, chacun l'état d'arrivée de l'étape correspondante. Un binôme bloqué copie le fichier par-dessus son `exercice.ts` et repart avec le groupe — sans eux, il est perdu pour les 40 minutes restantes.
- `dependencies-container.ts` est la même solution finale que `corriges/etape-4.ts`, mais commentée pour la démo de cadrage de 0:10 — ce n'est pas un fichier distinct à maintenir en parallèle.
