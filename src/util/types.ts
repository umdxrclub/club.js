export type Either<T, U> =
  | {
      [P in keyof (T & Partial<U>)]: P extends keyof T ? T[P] : never;
    }
  | {
      [P in keyof (Partial<T> & U)]: P extends keyof U ? U[P] : never;
    };
