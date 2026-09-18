// Outils d'assertion de types, sans aucune dépendance : tout est vérifié à la compilation.

// Compare deux types à l'identique, et pas seulement leur compatibilité.
type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
  ? true
  : false;

// Ne compile que si T vaut exactement `true`.
type Expect<T extends true> = T;
