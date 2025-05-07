
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Category
 * 
 */
export type Category = $Result.DefaultSelection<Prisma.$CategoryPayload>
/**
 * Model InventoryItem
 * 
 */
export type InventoryItem = $Result.DefaultSelection<Prisma.$InventoryItemPayload>
/**
 * Model StockMovement
 * 
 */
export type StockMovement = $Result.DefaultSelection<Prisma.$StockMovementPayload>
/**
 * Model Sale
 * 
 */
export type Sale = $Result.DefaultSelection<Prisma.$SalePayload>
/**
 * Model SaleTransaction
 * 
 */
export type SaleTransaction = $Result.DefaultSelection<Prisma.$SaleTransactionPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const MovementType: {
  STOCK_IN: 'STOCK_IN',
  STOCK_OUT: 'STOCK_OUT',
  ADJUSTMENT: 'ADJUSTMENT',
  INITIAL: 'INITIAL'
};

export type MovementType = (typeof MovementType)[keyof typeof MovementType]


export const SaleStatus: {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

export type SaleStatus = (typeof SaleStatus)[keyof typeof SaleStatus]

}

export type MovementType = $Enums.MovementType

export const MovementType: typeof $Enums.MovementType

export type SaleStatus = $Enums.SaleStatus

export const SaleStatus: typeof $Enums.SaleStatus

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Categories
 * const categories = await prisma.category.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Categories
   * const categories = await prisma.category.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.category`: Exposes CRUD operations for the **Category** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Categories
    * const categories = await prisma.category.findMany()
    * ```
    */
  get category(): Prisma.CategoryDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.inventoryItem`: Exposes CRUD operations for the **InventoryItem** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more InventoryItems
    * const inventoryItems = await prisma.inventoryItem.findMany()
    * ```
    */
  get inventoryItem(): Prisma.InventoryItemDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.stockMovement`: Exposes CRUD operations for the **StockMovement** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more StockMovements
    * const stockMovements = await prisma.stockMovement.findMany()
    * ```
    */
  get stockMovement(): Prisma.StockMovementDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.sale`: Exposes CRUD operations for the **Sale** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Sales
    * const sales = await prisma.sale.findMany()
    * ```
    */
  get sale(): Prisma.SaleDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.saleTransaction`: Exposes CRUD operations for the **SaleTransaction** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SaleTransactions
    * const saleTransactions = await prisma.saleTransaction.findMany()
    * ```
    */
  get saleTransaction(): Prisma.SaleTransactionDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.7.0
   * Query Engine version: 3cff47a7f5d65c3ea74883f1d736e41d68ce91ed
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Category: 'Category',
    InventoryItem: 'InventoryItem',
    StockMovement: 'StockMovement',
    Sale: 'Sale',
    SaleTransaction: 'SaleTransaction'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "category" | "inventoryItem" | "stockMovement" | "sale" | "saleTransaction"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Category: {
        payload: Prisma.$CategoryPayload<ExtArgs>
        fields: Prisma.CategoryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CategoryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CategoryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          findFirst: {
            args: Prisma.CategoryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CategoryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          findMany: {
            args: Prisma.CategoryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>[]
          }
          create: {
            args: Prisma.CategoryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          createMany: {
            args: Prisma.CategoryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CategoryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>[]
          }
          delete: {
            args: Prisma.CategoryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          update: {
            args: Prisma.CategoryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          deleteMany: {
            args: Prisma.CategoryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CategoryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CategoryUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>[]
          }
          upsert: {
            args: Prisma.CategoryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          aggregate: {
            args: Prisma.CategoryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCategory>
          }
          groupBy: {
            args: Prisma.CategoryGroupByArgs<ExtArgs>
            result: $Utils.Optional<CategoryGroupByOutputType>[]
          }
          count: {
            args: Prisma.CategoryCountArgs<ExtArgs>
            result: $Utils.Optional<CategoryCountAggregateOutputType> | number
          }
        }
      }
      InventoryItem: {
        payload: Prisma.$InventoryItemPayload<ExtArgs>
        fields: Prisma.InventoryItemFieldRefs
        operations: {
          findUnique: {
            args: Prisma.InventoryItemFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryItemPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.InventoryItemFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryItemPayload>
          }
          findFirst: {
            args: Prisma.InventoryItemFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryItemPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.InventoryItemFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryItemPayload>
          }
          findMany: {
            args: Prisma.InventoryItemFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryItemPayload>[]
          }
          create: {
            args: Prisma.InventoryItemCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryItemPayload>
          }
          createMany: {
            args: Prisma.InventoryItemCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.InventoryItemCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryItemPayload>[]
          }
          delete: {
            args: Prisma.InventoryItemDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryItemPayload>
          }
          update: {
            args: Prisma.InventoryItemUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryItemPayload>
          }
          deleteMany: {
            args: Prisma.InventoryItemDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.InventoryItemUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.InventoryItemUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryItemPayload>[]
          }
          upsert: {
            args: Prisma.InventoryItemUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryItemPayload>
          }
          aggregate: {
            args: Prisma.InventoryItemAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateInventoryItem>
          }
          groupBy: {
            args: Prisma.InventoryItemGroupByArgs<ExtArgs>
            result: $Utils.Optional<InventoryItemGroupByOutputType>[]
          }
          count: {
            args: Prisma.InventoryItemCountArgs<ExtArgs>
            result: $Utils.Optional<InventoryItemCountAggregateOutputType> | number
          }
        }
      }
      StockMovement: {
        payload: Prisma.$StockMovementPayload<ExtArgs>
        fields: Prisma.StockMovementFieldRefs
        operations: {
          findUnique: {
            args: Prisma.StockMovementFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockMovementPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.StockMovementFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockMovementPayload>
          }
          findFirst: {
            args: Prisma.StockMovementFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockMovementPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.StockMovementFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockMovementPayload>
          }
          findMany: {
            args: Prisma.StockMovementFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockMovementPayload>[]
          }
          create: {
            args: Prisma.StockMovementCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockMovementPayload>
          }
          createMany: {
            args: Prisma.StockMovementCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.StockMovementCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockMovementPayload>[]
          }
          delete: {
            args: Prisma.StockMovementDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockMovementPayload>
          }
          update: {
            args: Prisma.StockMovementUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockMovementPayload>
          }
          deleteMany: {
            args: Prisma.StockMovementDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.StockMovementUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.StockMovementUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockMovementPayload>[]
          }
          upsert: {
            args: Prisma.StockMovementUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockMovementPayload>
          }
          aggregate: {
            args: Prisma.StockMovementAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateStockMovement>
          }
          groupBy: {
            args: Prisma.StockMovementGroupByArgs<ExtArgs>
            result: $Utils.Optional<StockMovementGroupByOutputType>[]
          }
          count: {
            args: Prisma.StockMovementCountArgs<ExtArgs>
            result: $Utils.Optional<StockMovementCountAggregateOutputType> | number
          }
        }
      }
      Sale: {
        payload: Prisma.$SalePayload<ExtArgs>
        fields: Prisma.SaleFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SaleFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SaleFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalePayload>
          }
          findFirst: {
            args: Prisma.SaleFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SaleFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalePayload>
          }
          findMany: {
            args: Prisma.SaleFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalePayload>[]
          }
          create: {
            args: Prisma.SaleCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalePayload>
          }
          createMany: {
            args: Prisma.SaleCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SaleCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalePayload>[]
          }
          delete: {
            args: Prisma.SaleDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalePayload>
          }
          update: {
            args: Prisma.SaleUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalePayload>
          }
          deleteMany: {
            args: Prisma.SaleDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SaleUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SaleUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalePayload>[]
          }
          upsert: {
            args: Prisma.SaleUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalePayload>
          }
          aggregate: {
            args: Prisma.SaleAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSale>
          }
          groupBy: {
            args: Prisma.SaleGroupByArgs<ExtArgs>
            result: $Utils.Optional<SaleGroupByOutputType>[]
          }
          count: {
            args: Prisma.SaleCountArgs<ExtArgs>
            result: $Utils.Optional<SaleCountAggregateOutputType> | number
          }
        }
      }
      SaleTransaction: {
        payload: Prisma.$SaleTransactionPayload<ExtArgs>
        fields: Prisma.SaleTransactionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SaleTransactionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SaleTransactionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SaleTransactionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SaleTransactionPayload>
          }
          findFirst: {
            args: Prisma.SaleTransactionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SaleTransactionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SaleTransactionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SaleTransactionPayload>
          }
          findMany: {
            args: Prisma.SaleTransactionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SaleTransactionPayload>[]
          }
          create: {
            args: Prisma.SaleTransactionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SaleTransactionPayload>
          }
          createMany: {
            args: Prisma.SaleTransactionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SaleTransactionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SaleTransactionPayload>[]
          }
          delete: {
            args: Prisma.SaleTransactionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SaleTransactionPayload>
          }
          update: {
            args: Prisma.SaleTransactionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SaleTransactionPayload>
          }
          deleteMany: {
            args: Prisma.SaleTransactionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SaleTransactionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SaleTransactionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SaleTransactionPayload>[]
          }
          upsert: {
            args: Prisma.SaleTransactionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SaleTransactionPayload>
          }
          aggregate: {
            args: Prisma.SaleTransactionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSaleTransaction>
          }
          groupBy: {
            args: Prisma.SaleTransactionGroupByArgs<ExtArgs>
            result: $Utils.Optional<SaleTransactionGroupByOutputType>[]
          }
          count: {
            args: Prisma.SaleTransactionCountArgs<ExtArgs>
            result: $Utils.Optional<SaleTransactionCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory | null
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    category?: CategoryOmit
    inventoryItem?: InventoryItemOmit
    stockMovement?: StockMovementOmit
    sale?: SaleOmit
    saleTransaction?: SaleTransactionOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type CategoryCountOutputType
   */

  export type CategoryCountOutputType = {
    inventory: number
  }

  export type CategoryCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    inventory?: boolean | CategoryCountOutputTypeCountInventoryArgs
  }

  // Custom InputTypes
  /**
   * CategoryCountOutputType without action
   */
  export type CategoryCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategoryCountOutputType
     */
    select?: CategoryCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * CategoryCountOutputType without action
   */
  export type CategoryCountOutputTypeCountInventoryArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: InventoryItemWhereInput
  }


  /**
   * Count Type InventoryItemCountOutputType
   */

  export type InventoryItemCountOutputType = {
    transactions: number
    stockMovements: number
  }

  export type InventoryItemCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    transactions?: boolean | InventoryItemCountOutputTypeCountTransactionsArgs
    stockMovements?: boolean | InventoryItemCountOutputTypeCountStockMovementsArgs
  }

  // Custom InputTypes
  /**
   * InventoryItemCountOutputType without action
   */
  export type InventoryItemCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryItemCountOutputType
     */
    select?: InventoryItemCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * InventoryItemCountOutputType without action
   */
  export type InventoryItemCountOutputTypeCountTransactionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SaleTransactionWhereInput
  }

  /**
   * InventoryItemCountOutputType without action
   */
  export type InventoryItemCountOutputTypeCountStockMovementsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: StockMovementWhereInput
  }


  /**
   * Count Type SaleCountOutputType
   */

  export type SaleCountOutputType = {
    transactions: number
  }

  export type SaleCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    transactions?: boolean | SaleCountOutputTypeCountTransactionsArgs
  }

  // Custom InputTypes
  /**
   * SaleCountOutputType without action
   */
  export type SaleCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SaleCountOutputType
     */
    select?: SaleCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * SaleCountOutputType without action
   */
  export type SaleCountOutputTypeCountTransactionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SaleTransactionWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Category
   */

  export type AggregateCategory = {
    _count: CategoryCountAggregateOutputType | null
    _min: CategoryMinAggregateOutputType | null
    _max: CategoryMaxAggregateOutputType | null
  }

  export type CategoryMinAggregateOutputType = {
    id: string | null
    name: string | null
    description: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CategoryMaxAggregateOutputType = {
    id: string | null
    name: string | null
    description: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CategoryCountAggregateOutputType = {
    id: number
    name: number
    description: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type CategoryMinAggregateInputType = {
    id?: true
    name?: true
    description?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CategoryMaxAggregateInputType = {
    id?: true
    name?: true
    description?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CategoryCountAggregateInputType = {
    id?: true
    name?: true
    description?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type CategoryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Category to aggregate.
     */
    where?: CategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Categories to fetch.
     */
    orderBy?: CategoryOrderByWithRelationInput | CategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Categories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Categories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Categories
    **/
    _count?: true | CategoryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CategoryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CategoryMaxAggregateInputType
  }

  export type GetCategoryAggregateType<T extends CategoryAggregateArgs> = {
        [P in keyof T & keyof AggregateCategory]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCategory[P]>
      : GetScalarType<T[P], AggregateCategory[P]>
  }




  export type CategoryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CategoryWhereInput
    orderBy?: CategoryOrderByWithAggregationInput | CategoryOrderByWithAggregationInput[]
    by: CategoryScalarFieldEnum[] | CategoryScalarFieldEnum
    having?: CategoryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CategoryCountAggregateInputType | true
    _min?: CategoryMinAggregateInputType
    _max?: CategoryMaxAggregateInputType
  }

  export type CategoryGroupByOutputType = {
    id: string
    name: string
    description: string | null
    createdAt: Date
    updatedAt: Date
    _count: CategoryCountAggregateOutputType | null
    _min: CategoryMinAggregateOutputType | null
    _max: CategoryMaxAggregateOutputType | null
  }

  type GetCategoryGroupByPayload<T extends CategoryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CategoryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CategoryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CategoryGroupByOutputType[P]>
            : GetScalarType<T[P], CategoryGroupByOutputType[P]>
        }
      >
    >


  export type CategorySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    description?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    inventory?: boolean | Category$inventoryArgs<ExtArgs>
    _count?: boolean | CategoryCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["category"]>

  export type CategorySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    description?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["category"]>

  export type CategorySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    description?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["category"]>

  export type CategorySelectScalar = {
    id?: boolean
    name?: boolean
    description?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type CategoryOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "description" | "createdAt" | "updatedAt", ExtArgs["result"]["category"]>
  export type CategoryInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    inventory?: boolean | Category$inventoryArgs<ExtArgs>
    _count?: boolean | CategoryCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type CategoryIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type CategoryIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $CategoryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Category"
    objects: {
      inventory: Prisma.$InventoryItemPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      description: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["category"]>
    composites: {}
  }

  type CategoryGetPayload<S extends boolean | null | undefined | CategoryDefaultArgs> = $Result.GetResult<Prisma.$CategoryPayload, S>

  type CategoryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CategoryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CategoryCountAggregateInputType | true
    }

  export interface CategoryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Category'], meta: { name: 'Category' } }
    /**
     * Find zero or one Category that matches the filter.
     * @param {CategoryFindUniqueArgs} args - Arguments to find a Category
     * @example
     * // Get one Category
     * const category = await prisma.category.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CategoryFindUniqueArgs>(args: SelectSubset<T, CategoryFindUniqueArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Category that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CategoryFindUniqueOrThrowArgs} args - Arguments to find a Category
     * @example
     * // Get one Category
     * const category = await prisma.category.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CategoryFindUniqueOrThrowArgs>(args: SelectSubset<T, CategoryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Category that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryFindFirstArgs} args - Arguments to find a Category
     * @example
     * // Get one Category
     * const category = await prisma.category.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CategoryFindFirstArgs>(args?: SelectSubset<T, CategoryFindFirstArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Category that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryFindFirstOrThrowArgs} args - Arguments to find a Category
     * @example
     * // Get one Category
     * const category = await prisma.category.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CategoryFindFirstOrThrowArgs>(args?: SelectSubset<T, CategoryFindFirstOrThrowArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Categories that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Categories
     * const categories = await prisma.category.findMany()
     * 
     * // Get first 10 Categories
     * const categories = await prisma.category.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const categoryWithIdOnly = await prisma.category.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CategoryFindManyArgs>(args?: SelectSubset<T, CategoryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Category.
     * @param {CategoryCreateArgs} args - Arguments to create a Category.
     * @example
     * // Create one Category
     * const Category = await prisma.category.create({
     *   data: {
     *     // ... data to create a Category
     *   }
     * })
     * 
     */
    create<T extends CategoryCreateArgs>(args: SelectSubset<T, CategoryCreateArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Categories.
     * @param {CategoryCreateManyArgs} args - Arguments to create many Categories.
     * @example
     * // Create many Categories
     * const category = await prisma.category.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CategoryCreateManyArgs>(args?: SelectSubset<T, CategoryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Categories and returns the data saved in the database.
     * @param {CategoryCreateManyAndReturnArgs} args - Arguments to create many Categories.
     * @example
     * // Create many Categories
     * const category = await prisma.category.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Categories and only return the `id`
     * const categoryWithIdOnly = await prisma.category.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CategoryCreateManyAndReturnArgs>(args?: SelectSubset<T, CategoryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Category.
     * @param {CategoryDeleteArgs} args - Arguments to delete one Category.
     * @example
     * // Delete one Category
     * const Category = await prisma.category.delete({
     *   where: {
     *     // ... filter to delete one Category
     *   }
     * })
     * 
     */
    delete<T extends CategoryDeleteArgs>(args: SelectSubset<T, CategoryDeleteArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Category.
     * @param {CategoryUpdateArgs} args - Arguments to update one Category.
     * @example
     * // Update one Category
     * const category = await prisma.category.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CategoryUpdateArgs>(args: SelectSubset<T, CategoryUpdateArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Categories.
     * @param {CategoryDeleteManyArgs} args - Arguments to filter Categories to delete.
     * @example
     * // Delete a few Categories
     * const { count } = await prisma.category.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CategoryDeleteManyArgs>(args?: SelectSubset<T, CategoryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Categories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Categories
     * const category = await prisma.category.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CategoryUpdateManyArgs>(args: SelectSubset<T, CategoryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Categories and returns the data updated in the database.
     * @param {CategoryUpdateManyAndReturnArgs} args - Arguments to update many Categories.
     * @example
     * // Update many Categories
     * const category = await prisma.category.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Categories and only return the `id`
     * const categoryWithIdOnly = await prisma.category.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CategoryUpdateManyAndReturnArgs>(args: SelectSubset<T, CategoryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Category.
     * @param {CategoryUpsertArgs} args - Arguments to update or create a Category.
     * @example
     * // Update or create a Category
     * const category = await prisma.category.upsert({
     *   create: {
     *     // ... data to create a Category
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Category we want to update
     *   }
     * })
     */
    upsert<T extends CategoryUpsertArgs>(args: SelectSubset<T, CategoryUpsertArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Categories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryCountArgs} args - Arguments to filter Categories to count.
     * @example
     * // Count the number of Categories
     * const count = await prisma.category.count({
     *   where: {
     *     // ... the filter for the Categories we want to count
     *   }
     * })
    **/
    count<T extends CategoryCountArgs>(
      args?: Subset<T, CategoryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CategoryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Category.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CategoryAggregateArgs>(args: Subset<T, CategoryAggregateArgs>): Prisma.PrismaPromise<GetCategoryAggregateType<T>>

    /**
     * Group by Category.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CategoryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CategoryGroupByArgs['orderBy'] }
        : { orderBy?: CategoryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CategoryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCategoryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Category model
   */
  readonly fields: CategoryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Category.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CategoryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    inventory<T extends Category$inventoryArgs<ExtArgs> = {}>(args?: Subset<T, Category$inventoryArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InventoryItemPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Category model
   */
  interface CategoryFieldRefs {
    readonly id: FieldRef<"Category", 'String'>
    readonly name: FieldRef<"Category", 'String'>
    readonly description: FieldRef<"Category", 'String'>
    readonly createdAt: FieldRef<"Category", 'DateTime'>
    readonly updatedAt: FieldRef<"Category", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Category findUnique
   */
  export type CategoryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter, which Category to fetch.
     */
    where: CategoryWhereUniqueInput
  }

  /**
   * Category findUniqueOrThrow
   */
  export type CategoryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter, which Category to fetch.
     */
    where: CategoryWhereUniqueInput
  }

  /**
   * Category findFirst
   */
  export type CategoryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter, which Category to fetch.
     */
    where?: CategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Categories to fetch.
     */
    orderBy?: CategoryOrderByWithRelationInput | CategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Categories.
     */
    cursor?: CategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Categories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Categories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Categories.
     */
    distinct?: CategoryScalarFieldEnum | CategoryScalarFieldEnum[]
  }

  /**
   * Category findFirstOrThrow
   */
  export type CategoryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter, which Category to fetch.
     */
    where?: CategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Categories to fetch.
     */
    orderBy?: CategoryOrderByWithRelationInput | CategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Categories.
     */
    cursor?: CategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Categories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Categories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Categories.
     */
    distinct?: CategoryScalarFieldEnum | CategoryScalarFieldEnum[]
  }

  /**
   * Category findMany
   */
  export type CategoryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter, which Categories to fetch.
     */
    where?: CategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Categories to fetch.
     */
    orderBy?: CategoryOrderByWithRelationInput | CategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Categories.
     */
    cursor?: CategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Categories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Categories.
     */
    skip?: number
    distinct?: CategoryScalarFieldEnum | CategoryScalarFieldEnum[]
  }

  /**
   * Category create
   */
  export type CategoryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * The data needed to create a Category.
     */
    data: XOR<CategoryCreateInput, CategoryUncheckedCreateInput>
  }

  /**
   * Category createMany
   */
  export type CategoryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Categories.
     */
    data: CategoryCreateManyInput | CategoryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Category createManyAndReturn
   */
  export type CategoryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * The data used to create many Categories.
     */
    data: CategoryCreateManyInput | CategoryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Category update
   */
  export type CategoryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * The data needed to update a Category.
     */
    data: XOR<CategoryUpdateInput, CategoryUncheckedUpdateInput>
    /**
     * Choose, which Category to update.
     */
    where: CategoryWhereUniqueInput
  }

  /**
   * Category updateMany
   */
  export type CategoryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Categories.
     */
    data: XOR<CategoryUpdateManyMutationInput, CategoryUncheckedUpdateManyInput>
    /**
     * Filter which Categories to update
     */
    where?: CategoryWhereInput
    /**
     * Limit how many Categories to update.
     */
    limit?: number
  }

  /**
   * Category updateManyAndReturn
   */
  export type CategoryUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * The data used to update Categories.
     */
    data: XOR<CategoryUpdateManyMutationInput, CategoryUncheckedUpdateManyInput>
    /**
     * Filter which Categories to update
     */
    where?: CategoryWhereInput
    /**
     * Limit how many Categories to update.
     */
    limit?: number
  }

  /**
   * Category upsert
   */
  export type CategoryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * The filter to search for the Category to update in case it exists.
     */
    where: CategoryWhereUniqueInput
    /**
     * In case the Category found by the `where` argument doesn't exist, create a new Category with this data.
     */
    create: XOR<CategoryCreateInput, CategoryUncheckedCreateInput>
    /**
     * In case the Category was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CategoryUpdateInput, CategoryUncheckedUpdateInput>
  }

  /**
   * Category delete
   */
  export type CategoryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter which Category to delete.
     */
    where: CategoryWhereUniqueInput
  }

  /**
   * Category deleteMany
   */
  export type CategoryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Categories to delete
     */
    where?: CategoryWhereInput
    /**
     * Limit how many Categories to delete.
     */
    limit?: number
  }

  /**
   * Category.inventory
   */
  export type Category$inventoryArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryItem
     */
    select?: InventoryItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InventoryItem
     */
    omit?: InventoryItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryItemInclude<ExtArgs> | null
    where?: InventoryItemWhereInput
    orderBy?: InventoryItemOrderByWithRelationInput | InventoryItemOrderByWithRelationInput[]
    cursor?: InventoryItemWhereUniqueInput
    take?: number
    skip?: number
    distinct?: InventoryItemScalarFieldEnum | InventoryItemScalarFieldEnum[]
  }

  /**
   * Category without action
   */
  export type CategoryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
  }


  /**
   * Model InventoryItem
   */

  export type AggregateInventoryItem = {
    _count: InventoryItemCountAggregateOutputType | null
    _avg: InventoryItemAvgAggregateOutputType | null
    _sum: InventoryItemSumAggregateOutputType | null
    _min: InventoryItemMinAggregateOutputType | null
    _max: InventoryItemMaxAggregateOutputType | null
  }

  export type InventoryItemAvgAggregateOutputType = {
    quantity: number | null
    minStockLevel: number | null
    cost: Decimal | null
    margin: Decimal | null
    price: Decimal | null
  }

  export type InventoryItemSumAggregateOutputType = {
    quantity: number | null
    minStockLevel: number | null
    cost: Decimal | null
    margin: Decimal | null
    price: Decimal | null
  }

  export type InventoryItemMinAggregateOutputType = {
    id: string | null
    quantity: number | null
    minStockLevel: number | null
    location: string | null
    lastUpdated: Date | null
    active: boolean | null
    categoryId: string | null
    cost: Decimal | null
    createdAt: Date | null
    description: string | null
    imageUrl: string | null
    margin: Decimal | null
    name: string | null
    price: Decimal | null
    sku: string | null
    updatedAt: Date | null
  }

  export type InventoryItemMaxAggregateOutputType = {
    id: string | null
    quantity: number | null
    minStockLevel: number | null
    location: string | null
    lastUpdated: Date | null
    active: boolean | null
    categoryId: string | null
    cost: Decimal | null
    createdAt: Date | null
    description: string | null
    imageUrl: string | null
    margin: Decimal | null
    name: string | null
    price: Decimal | null
    sku: string | null
    updatedAt: Date | null
  }

  export type InventoryItemCountAggregateOutputType = {
    id: number
    quantity: number
    minStockLevel: number
    location: number
    lastUpdated: number
    active: number
    categoryId: number
    cost: number
    createdAt: number
    description: number
    imageUrl: number
    margin: number
    name: number
    price: number
    sku: number
    updatedAt: number
    _all: number
  }


  export type InventoryItemAvgAggregateInputType = {
    quantity?: true
    minStockLevel?: true
    cost?: true
    margin?: true
    price?: true
  }

  export type InventoryItemSumAggregateInputType = {
    quantity?: true
    minStockLevel?: true
    cost?: true
    margin?: true
    price?: true
  }

  export type InventoryItemMinAggregateInputType = {
    id?: true
    quantity?: true
    minStockLevel?: true
    location?: true
    lastUpdated?: true
    active?: true
    categoryId?: true
    cost?: true
    createdAt?: true
    description?: true
    imageUrl?: true
    margin?: true
    name?: true
    price?: true
    sku?: true
    updatedAt?: true
  }

  export type InventoryItemMaxAggregateInputType = {
    id?: true
    quantity?: true
    minStockLevel?: true
    location?: true
    lastUpdated?: true
    active?: true
    categoryId?: true
    cost?: true
    createdAt?: true
    description?: true
    imageUrl?: true
    margin?: true
    name?: true
    price?: true
    sku?: true
    updatedAt?: true
  }

  export type InventoryItemCountAggregateInputType = {
    id?: true
    quantity?: true
    minStockLevel?: true
    location?: true
    lastUpdated?: true
    active?: true
    categoryId?: true
    cost?: true
    createdAt?: true
    description?: true
    imageUrl?: true
    margin?: true
    name?: true
    price?: true
    sku?: true
    updatedAt?: true
    _all?: true
  }

  export type InventoryItemAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which InventoryItem to aggregate.
     */
    where?: InventoryItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of InventoryItems to fetch.
     */
    orderBy?: InventoryItemOrderByWithRelationInput | InventoryItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: InventoryItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` InventoryItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` InventoryItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned InventoryItems
    **/
    _count?: true | InventoryItemCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: InventoryItemAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: InventoryItemSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: InventoryItemMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: InventoryItemMaxAggregateInputType
  }

  export type GetInventoryItemAggregateType<T extends InventoryItemAggregateArgs> = {
        [P in keyof T & keyof AggregateInventoryItem]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateInventoryItem[P]>
      : GetScalarType<T[P], AggregateInventoryItem[P]>
  }




  export type InventoryItemGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: InventoryItemWhereInput
    orderBy?: InventoryItemOrderByWithAggregationInput | InventoryItemOrderByWithAggregationInput[]
    by: InventoryItemScalarFieldEnum[] | InventoryItemScalarFieldEnum
    having?: InventoryItemScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: InventoryItemCountAggregateInputType | true
    _avg?: InventoryItemAvgAggregateInputType
    _sum?: InventoryItemSumAggregateInputType
    _min?: InventoryItemMinAggregateInputType
    _max?: InventoryItemMaxAggregateInputType
  }

  export type InventoryItemGroupByOutputType = {
    id: string
    quantity: number
    minStockLevel: number
    location: string | null
    lastUpdated: Date
    active: boolean
    categoryId: string | null
    cost: Decimal
    createdAt: Date
    description: string | null
    imageUrl: string | null
    margin: Decimal
    name: string
    price: Decimal
    sku: string
    updatedAt: Date
    _count: InventoryItemCountAggregateOutputType | null
    _avg: InventoryItemAvgAggregateOutputType | null
    _sum: InventoryItemSumAggregateOutputType | null
    _min: InventoryItemMinAggregateOutputType | null
    _max: InventoryItemMaxAggregateOutputType | null
  }

  type GetInventoryItemGroupByPayload<T extends InventoryItemGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<InventoryItemGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof InventoryItemGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], InventoryItemGroupByOutputType[P]>
            : GetScalarType<T[P], InventoryItemGroupByOutputType[P]>
        }
      >
    >


  export type InventoryItemSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    quantity?: boolean
    minStockLevel?: boolean
    location?: boolean
    lastUpdated?: boolean
    active?: boolean
    categoryId?: boolean
    cost?: boolean
    createdAt?: boolean
    description?: boolean
    imageUrl?: boolean
    margin?: boolean
    name?: boolean
    price?: boolean
    sku?: boolean
    updatedAt?: boolean
    category?: boolean | InventoryItem$categoryArgs<ExtArgs>
    transactions?: boolean | InventoryItem$transactionsArgs<ExtArgs>
    stockMovements?: boolean | InventoryItem$stockMovementsArgs<ExtArgs>
    _count?: boolean | InventoryItemCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["inventoryItem"]>

  export type InventoryItemSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    quantity?: boolean
    minStockLevel?: boolean
    location?: boolean
    lastUpdated?: boolean
    active?: boolean
    categoryId?: boolean
    cost?: boolean
    createdAt?: boolean
    description?: boolean
    imageUrl?: boolean
    margin?: boolean
    name?: boolean
    price?: boolean
    sku?: boolean
    updatedAt?: boolean
    category?: boolean | InventoryItem$categoryArgs<ExtArgs>
  }, ExtArgs["result"]["inventoryItem"]>

  export type InventoryItemSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    quantity?: boolean
    minStockLevel?: boolean
    location?: boolean
    lastUpdated?: boolean
    active?: boolean
    categoryId?: boolean
    cost?: boolean
    createdAt?: boolean
    description?: boolean
    imageUrl?: boolean
    margin?: boolean
    name?: boolean
    price?: boolean
    sku?: boolean
    updatedAt?: boolean
    category?: boolean | InventoryItem$categoryArgs<ExtArgs>
  }, ExtArgs["result"]["inventoryItem"]>

  export type InventoryItemSelectScalar = {
    id?: boolean
    quantity?: boolean
    minStockLevel?: boolean
    location?: boolean
    lastUpdated?: boolean
    active?: boolean
    categoryId?: boolean
    cost?: boolean
    createdAt?: boolean
    description?: boolean
    imageUrl?: boolean
    margin?: boolean
    name?: boolean
    price?: boolean
    sku?: boolean
    updatedAt?: boolean
  }

  export type InventoryItemOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "quantity" | "minStockLevel" | "location" | "lastUpdated" | "active" | "categoryId" | "cost" | "createdAt" | "description" | "imageUrl" | "margin" | "name" | "price" | "sku" | "updatedAt", ExtArgs["result"]["inventoryItem"]>
  export type InventoryItemInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    category?: boolean | InventoryItem$categoryArgs<ExtArgs>
    transactions?: boolean | InventoryItem$transactionsArgs<ExtArgs>
    stockMovements?: boolean | InventoryItem$stockMovementsArgs<ExtArgs>
    _count?: boolean | InventoryItemCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type InventoryItemIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    category?: boolean | InventoryItem$categoryArgs<ExtArgs>
  }
  export type InventoryItemIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    category?: boolean | InventoryItem$categoryArgs<ExtArgs>
  }

  export type $InventoryItemPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "InventoryItem"
    objects: {
      category: Prisma.$CategoryPayload<ExtArgs> | null
      transactions: Prisma.$SaleTransactionPayload<ExtArgs>[]
      stockMovements: Prisma.$StockMovementPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      quantity: number
      minStockLevel: number
      location: string | null
      lastUpdated: Date
      active: boolean
      categoryId: string | null
      cost: Prisma.Decimal
      createdAt: Date
      description: string | null
      imageUrl: string | null
      margin: Prisma.Decimal
      name: string
      price: Prisma.Decimal
      sku: string
      updatedAt: Date
    }, ExtArgs["result"]["inventoryItem"]>
    composites: {}
  }

  type InventoryItemGetPayload<S extends boolean | null | undefined | InventoryItemDefaultArgs> = $Result.GetResult<Prisma.$InventoryItemPayload, S>

  type InventoryItemCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<InventoryItemFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: InventoryItemCountAggregateInputType | true
    }

  export interface InventoryItemDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['InventoryItem'], meta: { name: 'InventoryItem' } }
    /**
     * Find zero or one InventoryItem that matches the filter.
     * @param {InventoryItemFindUniqueArgs} args - Arguments to find a InventoryItem
     * @example
     * // Get one InventoryItem
     * const inventoryItem = await prisma.inventoryItem.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends InventoryItemFindUniqueArgs>(args: SelectSubset<T, InventoryItemFindUniqueArgs<ExtArgs>>): Prisma__InventoryItemClient<$Result.GetResult<Prisma.$InventoryItemPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one InventoryItem that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {InventoryItemFindUniqueOrThrowArgs} args - Arguments to find a InventoryItem
     * @example
     * // Get one InventoryItem
     * const inventoryItem = await prisma.inventoryItem.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends InventoryItemFindUniqueOrThrowArgs>(args: SelectSubset<T, InventoryItemFindUniqueOrThrowArgs<ExtArgs>>): Prisma__InventoryItemClient<$Result.GetResult<Prisma.$InventoryItemPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first InventoryItem that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryItemFindFirstArgs} args - Arguments to find a InventoryItem
     * @example
     * // Get one InventoryItem
     * const inventoryItem = await prisma.inventoryItem.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends InventoryItemFindFirstArgs>(args?: SelectSubset<T, InventoryItemFindFirstArgs<ExtArgs>>): Prisma__InventoryItemClient<$Result.GetResult<Prisma.$InventoryItemPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first InventoryItem that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryItemFindFirstOrThrowArgs} args - Arguments to find a InventoryItem
     * @example
     * // Get one InventoryItem
     * const inventoryItem = await prisma.inventoryItem.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends InventoryItemFindFirstOrThrowArgs>(args?: SelectSubset<T, InventoryItemFindFirstOrThrowArgs<ExtArgs>>): Prisma__InventoryItemClient<$Result.GetResult<Prisma.$InventoryItemPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more InventoryItems that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryItemFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all InventoryItems
     * const inventoryItems = await prisma.inventoryItem.findMany()
     * 
     * // Get first 10 InventoryItems
     * const inventoryItems = await prisma.inventoryItem.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const inventoryItemWithIdOnly = await prisma.inventoryItem.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends InventoryItemFindManyArgs>(args?: SelectSubset<T, InventoryItemFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InventoryItemPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a InventoryItem.
     * @param {InventoryItemCreateArgs} args - Arguments to create a InventoryItem.
     * @example
     * // Create one InventoryItem
     * const InventoryItem = await prisma.inventoryItem.create({
     *   data: {
     *     // ... data to create a InventoryItem
     *   }
     * })
     * 
     */
    create<T extends InventoryItemCreateArgs>(args: SelectSubset<T, InventoryItemCreateArgs<ExtArgs>>): Prisma__InventoryItemClient<$Result.GetResult<Prisma.$InventoryItemPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many InventoryItems.
     * @param {InventoryItemCreateManyArgs} args - Arguments to create many InventoryItems.
     * @example
     * // Create many InventoryItems
     * const inventoryItem = await prisma.inventoryItem.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends InventoryItemCreateManyArgs>(args?: SelectSubset<T, InventoryItemCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many InventoryItems and returns the data saved in the database.
     * @param {InventoryItemCreateManyAndReturnArgs} args - Arguments to create many InventoryItems.
     * @example
     * // Create many InventoryItems
     * const inventoryItem = await prisma.inventoryItem.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many InventoryItems and only return the `id`
     * const inventoryItemWithIdOnly = await prisma.inventoryItem.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends InventoryItemCreateManyAndReturnArgs>(args?: SelectSubset<T, InventoryItemCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InventoryItemPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a InventoryItem.
     * @param {InventoryItemDeleteArgs} args - Arguments to delete one InventoryItem.
     * @example
     * // Delete one InventoryItem
     * const InventoryItem = await prisma.inventoryItem.delete({
     *   where: {
     *     // ... filter to delete one InventoryItem
     *   }
     * })
     * 
     */
    delete<T extends InventoryItemDeleteArgs>(args: SelectSubset<T, InventoryItemDeleteArgs<ExtArgs>>): Prisma__InventoryItemClient<$Result.GetResult<Prisma.$InventoryItemPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one InventoryItem.
     * @param {InventoryItemUpdateArgs} args - Arguments to update one InventoryItem.
     * @example
     * // Update one InventoryItem
     * const inventoryItem = await prisma.inventoryItem.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends InventoryItemUpdateArgs>(args: SelectSubset<T, InventoryItemUpdateArgs<ExtArgs>>): Prisma__InventoryItemClient<$Result.GetResult<Prisma.$InventoryItemPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more InventoryItems.
     * @param {InventoryItemDeleteManyArgs} args - Arguments to filter InventoryItems to delete.
     * @example
     * // Delete a few InventoryItems
     * const { count } = await prisma.inventoryItem.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends InventoryItemDeleteManyArgs>(args?: SelectSubset<T, InventoryItemDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more InventoryItems.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryItemUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many InventoryItems
     * const inventoryItem = await prisma.inventoryItem.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends InventoryItemUpdateManyArgs>(args: SelectSubset<T, InventoryItemUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more InventoryItems and returns the data updated in the database.
     * @param {InventoryItemUpdateManyAndReturnArgs} args - Arguments to update many InventoryItems.
     * @example
     * // Update many InventoryItems
     * const inventoryItem = await prisma.inventoryItem.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more InventoryItems and only return the `id`
     * const inventoryItemWithIdOnly = await prisma.inventoryItem.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends InventoryItemUpdateManyAndReturnArgs>(args: SelectSubset<T, InventoryItemUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InventoryItemPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one InventoryItem.
     * @param {InventoryItemUpsertArgs} args - Arguments to update or create a InventoryItem.
     * @example
     * // Update or create a InventoryItem
     * const inventoryItem = await prisma.inventoryItem.upsert({
     *   create: {
     *     // ... data to create a InventoryItem
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the InventoryItem we want to update
     *   }
     * })
     */
    upsert<T extends InventoryItemUpsertArgs>(args: SelectSubset<T, InventoryItemUpsertArgs<ExtArgs>>): Prisma__InventoryItemClient<$Result.GetResult<Prisma.$InventoryItemPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of InventoryItems.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryItemCountArgs} args - Arguments to filter InventoryItems to count.
     * @example
     * // Count the number of InventoryItems
     * const count = await prisma.inventoryItem.count({
     *   where: {
     *     // ... the filter for the InventoryItems we want to count
     *   }
     * })
    **/
    count<T extends InventoryItemCountArgs>(
      args?: Subset<T, InventoryItemCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], InventoryItemCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a InventoryItem.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryItemAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends InventoryItemAggregateArgs>(args: Subset<T, InventoryItemAggregateArgs>): Prisma.PrismaPromise<GetInventoryItemAggregateType<T>>

    /**
     * Group by InventoryItem.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryItemGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends InventoryItemGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: InventoryItemGroupByArgs['orderBy'] }
        : { orderBy?: InventoryItemGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, InventoryItemGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetInventoryItemGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the InventoryItem model
   */
  readonly fields: InventoryItemFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for InventoryItem.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__InventoryItemClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    category<T extends InventoryItem$categoryArgs<ExtArgs> = {}>(args?: Subset<T, InventoryItem$categoryArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    transactions<T extends InventoryItem$transactionsArgs<ExtArgs> = {}>(args?: Subset<T, InventoryItem$transactionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SaleTransactionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    stockMovements<T extends InventoryItem$stockMovementsArgs<ExtArgs> = {}>(args?: Subset<T, InventoryItem$stockMovementsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StockMovementPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the InventoryItem model
   */
  interface InventoryItemFieldRefs {
    readonly id: FieldRef<"InventoryItem", 'String'>
    readonly quantity: FieldRef<"InventoryItem", 'Int'>
    readonly minStockLevel: FieldRef<"InventoryItem", 'Int'>
    readonly location: FieldRef<"InventoryItem", 'String'>
    readonly lastUpdated: FieldRef<"InventoryItem", 'DateTime'>
    readonly active: FieldRef<"InventoryItem", 'Boolean'>
    readonly categoryId: FieldRef<"InventoryItem", 'String'>
    readonly cost: FieldRef<"InventoryItem", 'Decimal'>
    readonly createdAt: FieldRef<"InventoryItem", 'DateTime'>
    readonly description: FieldRef<"InventoryItem", 'String'>
    readonly imageUrl: FieldRef<"InventoryItem", 'String'>
    readonly margin: FieldRef<"InventoryItem", 'Decimal'>
    readonly name: FieldRef<"InventoryItem", 'String'>
    readonly price: FieldRef<"InventoryItem", 'Decimal'>
    readonly sku: FieldRef<"InventoryItem", 'String'>
    readonly updatedAt: FieldRef<"InventoryItem", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * InventoryItem findUnique
   */
  export type InventoryItemFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryItem
     */
    select?: InventoryItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InventoryItem
     */
    omit?: InventoryItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryItemInclude<ExtArgs> | null
    /**
     * Filter, which InventoryItem to fetch.
     */
    where: InventoryItemWhereUniqueInput
  }

  /**
   * InventoryItem findUniqueOrThrow
   */
  export type InventoryItemFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryItem
     */
    select?: InventoryItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InventoryItem
     */
    omit?: InventoryItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryItemInclude<ExtArgs> | null
    /**
     * Filter, which InventoryItem to fetch.
     */
    where: InventoryItemWhereUniqueInput
  }

  /**
   * InventoryItem findFirst
   */
  export type InventoryItemFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryItem
     */
    select?: InventoryItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InventoryItem
     */
    omit?: InventoryItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryItemInclude<ExtArgs> | null
    /**
     * Filter, which InventoryItem to fetch.
     */
    where?: InventoryItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of InventoryItems to fetch.
     */
    orderBy?: InventoryItemOrderByWithRelationInput | InventoryItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for InventoryItems.
     */
    cursor?: InventoryItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` InventoryItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` InventoryItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of InventoryItems.
     */
    distinct?: InventoryItemScalarFieldEnum | InventoryItemScalarFieldEnum[]
  }

  /**
   * InventoryItem findFirstOrThrow
   */
  export type InventoryItemFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryItem
     */
    select?: InventoryItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InventoryItem
     */
    omit?: InventoryItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryItemInclude<ExtArgs> | null
    /**
     * Filter, which InventoryItem to fetch.
     */
    where?: InventoryItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of InventoryItems to fetch.
     */
    orderBy?: InventoryItemOrderByWithRelationInput | InventoryItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for InventoryItems.
     */
    cursor?: InventoryItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` InventoryItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` InventoryItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of InventoryItems.
     */
    distinct?: InventoryItemScalarFieldEnum | InventoryItemScalarFieldEnum[]
  }

  /**
   * InventoryItem findMany
   */
  export type InventoryItemFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryItem
     */
    select?: InventoryItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InventoryItem
     */
    omit?: InventoryItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryItemInclude<ExtArgs> | null
    /**
     * Filter, which InventoryItems to fetch.
     */
    where?: InventoryItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of InventoryItems to fetch.
     */
    orderBy?: InventoryItemOrderByWithRelationInput | InventoryItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing InventoryItems.
     */
    cursor?: InventoryItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` InventoryItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` InventoryItems.
     */
    skip?: number
    distinct?: InventoryItemScalarFieldEnum | InventoryItemScalarFieldEnum[]
  }

  /**
   * InventoryItem create
   */
  export type InventoryItemCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryItem
     */
    select?: InventoryItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InventoryItem
     */
    omit?: InventoryItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryItemInclude<ExtArgs> | null
    /**
     * The data needed to create a InventoryItem.
     */
    data: XOR<InventoryItemCreateInput, InventoryItemUncheckedCreateInput>
  }

  /**
   * InventoryItem createMany
   */
  export type InventoryItemCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many InventoryItems.
     */
    data: InventoryItemCreateManyInput | InventoryItemCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * InventoryItem createManyAndReturn
   */
  export type InventoryItemCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryItem
     */
    select?: InventoryItemSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the InventoryItem
     */
    omit?: InventoryItemOmit<ExtArgs> | null
    /**
     * The data used to create many InventoryItems.
     */
    data: InventoryItemCreateManyInput | InventoryItemCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryItemIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * InventoryItem update
   */
  export type InventoryItemUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryItem
     */
    select?: InventoryItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InventoryItem
     */
    omit?: InventoryItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryItemInclude<ExtArgs> | null
    /**
     * The data needed to update a InventoryItem.
     */
    data: XOR<InventoryItemUpdateInput, InventoryItemUncheckedUpdateInput>
    /**
     * Choose, which InventoryItem to update.
     */
    where: InventoryItemWhereUniqueInput
  }

  /**
   * InventoryItem updateMany
   */
  export type InventoryItemUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update InventoryItems.
     */
    data: XOR<InventoryItemUpdateManyMutationInput, InventoryItemUncheckedUpdateManyInput>
    /**
     * Filter which InventoryItems to update
     */
    where?: InventoryItemWhereInput
    /**
     * Limit how many InventoryItems to update.
     */
    limit?: number
  }

  /**
   * InventoryItem updateManyAndReturn
   */
  export type InventoryItemUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryItem
     */
    select?: InventoryItemSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the InventoryItem
     */
    omit?: InventoryItemOmit<ExtArgs> | null
    /**
     * The data used to update InventoryItems.
     */
    data: XOR<InventoryItemUpdateManyMutationInput, InventoryItemUncheckedUpdateManyInput>
    /**
     * Filter which InventoryItems to update
     */
    where?: InventoryItemWhereInput
    /**
     * Limit how many InventoryItems to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryItemIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * InventoryItem upsert
   */
  export type InventoryItemUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryItem
     */
    select?: InventoryItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InventoryItem
     */
    omit?: InventoryItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryItemInclude<ExtArgs> | null
    /**
     * The filter to search for the InventoryItem to update in case it exists.
     */
    where: InventoryItemWhereUniqueInput
    /**
     * In case the InventoryItem found by the `where` argument doesn't exist, create a new InventoryItem with this data.
     */
    create: XOR<InventoryItemCreateInput, InventoryItemUncheckedCreateInput>
    /**
     * In case the InventoryItem was found with the provided `where` argument, update it with this data.
     */
    update: XOR<InventoryItemUpdateInput, InventoryItemUncheckedUpdateInput>
  }

  /**
   * InventoryItem delete
   */
  export type InventoryItemDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryItem
     */
    select?: InventoryItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InventoryItem
     */
    omit?: InventoryItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryItemInclude<ExtArgs> | null
    /**
     * Filter which InventoryItem to delete.
     */
    where: InventoryItemWhereUniqueInput
  }

  /**
   * InventoryItem deleteMany
   */
  export type InventoryItemDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which InventoryItems to delete
     */
    where?: InventoryItemWhereInput
    /**
     * Limit how many InventoryItems to delete.
     */
    limit?: number
  }

  /**
   * InventoryItem.category
   */
  export type InventoryItem$categoryArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    where?: CategoryWhereInput
  }

  /**
   * InventoryItem.transactions
   */
  export type InventoryItem$transactionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SaleTransaction
     */
    select?: SaleTransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SaleTransaction
     */
    omit?: SaleTransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SaleTransactionInclude<ExtArgs> | null
    where?: SaleTransactionWhereInput
    orderBy?: SaleTransactionOrderByWithRelationInput | SaleTransactionOrderByWithRelationInput[]
    cursor?: SaleTransactionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SaleTransactionScalarFieldEnum | SaleTransactionScalarFieldEnum[]
  }

  /**
   * InventoryItem.stockMovements
   */
  export type InventoryItem$stockMovementsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockMovement
     */
    select?: StockMovementSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StockMovement
     */
    omit?: StockMovementOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockMovementInclude<ExtArgs> | null
    where?: StockMovementWhereInput
    orderBy?: StockMovementOrderByWithRelationInput | StockMovementOrderByWithRelationInput[]
    cursor?: StockMovementWhereUniqueInput
    take?: number
    skip?: number
    distinct?: StockMovementScalarFieldEnum | StockMovementScalarFieldEnum[]
  }

  /**
   * InventoryItem without action
   */
  export type InventoryItemDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryItem
     */
    select?: InventoryItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InventoryItem
     */
    omit?: InventoryItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryItemInclude<ExtArgs> | null
  }


  /**
   * Model StockMovement
   */

  export type AggregateStockMovement = {
    _count: StockMovementCountAggregateOutputType | null
    _avg: StockMovementAvgAggregateOutputType | null
    _sum: StockMovementSumAggregateOutputType | null
    _min: StockMovementMinAggregateOutputType | null
    _max: StockMovementMaxAggregateOutputType | null
  }

  export type StockMovementAvgAggregateOutputType = {
    quantity: number | null
  }

  export type StockMovementSumAggregateOutputType = {
    quantity: number | null
  }

  export type StockMovementMinAggregateOutputType = {
    id: string | null
    inventoryItemId: string | null
    quantity: number | null
    type: $Enums.MovementType | null
    date: Date | null
    notes: string | null
    createdBy: string | null
  }

  export type StockMovementMaxAggregateOutputType = {
    id: string | null
    inventoryItemId: string | null
    quantity: number | null
    type: $Enums.MovementType | null
    date: Date | null
    notes: string | null
    createdBy: string | null
  }

  export type StockMovementCountAggregateOutputType = {
    id: number
    inventoryItemId: number
    quantity: number
    type: number
    date: number
    notes: number
    createdBy: number
    _all: number
  }


  export type StockMovementAvgAggregateInputType = {
    quantity?: true
  }

  export type StockMovementSumAggregateInputType = {
    quantity?: true
  }

  export type StockMovementMinAggregateInputType = {
    id?: true
    inventoryItemId?: true
    quantity?: true
    type?: true
    date?: true
    notes?: true
    createdBy?: true
  }

  export type StockMovementMaxAggregateInputType = {
    id?: true
    inventoryItemId?: true
    quantity?: true
    type?: true
    date?: true
    notes?: true
    createdBy?: true
  }

  export type StockMovementCountAggregateInputType = {
    id?: true
    inventoryItemId?: true
    quantity?: true
    type?: true
    date?: true
    notes?: true
    createdBy?: true
    _all?: true
  }

  export type StockMovementAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which StockMovement to aggregate.
     */
    where?: StockMovementWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StockMovements to fetch.
     */
    orderBy?: StockMovementOrderByWithRelationInput | StockMovementOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: StockMovementWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StockMovements from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StockMovements.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned StockMovements
    **/
    _count?: true | StockMovementCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: StockMovementAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: StockMovementSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: StockMovementMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: StockMovementMaxAggregateInputType
  }

  export type GetStockMovementAggregateType<T extends StockMovementAggregateArgs> = {
        [P in keyof T & keyof AggregateStockMovement]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateStockMovement[P]>
      : GetScalarType<T[P], AggregateStockMovement[P]>
  }




  export type StockMovementGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: StockMovementWhereInput
    orderBy?: StockMovementOrderByWithAggregationInput | StockMovementOrderByWithAggregationInput[]
    by: StockMovementScalarFieldEnum[] | StockMovementScalarFieldEnum
    having?: StockMovementScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: StockMovementCountAggregateInputType | true
    _avg?: StockMovementAvgAggregateInputType
    _sum?: StockMovementSumAggregateInputType
    _min?: StockMovementMinAggregateInputType
    _max?: StockMovementMaxAggregateInputType
  }

  export type StockMovementGroupByOutputType = {
    id: string
    inventoryItemId: string
    quantity: number
    type: $Enums.MovementType
    date: Date
    notes: string | null
    createdBy: string | null
    _count: StockMovementCountAggregateOutputType | null
    _avg: StockMovementAvgAggregateOutputType | null
    _sum: StockMovementSumAggregateOutputType | null
    _min: StockMovementMinAggregateOutputType | null
    _max: StockMovementMaxAggregateOutputType | null
  }

  type GetStockMovementGroupByPayload<T extends StockMovementGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<StockMovementGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof StockMovementGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], StockMovementGroupByOutputType[P]>
            : GetScalarType<T[P], StockMovementGroupByOutputType[P]>
        }
      >
    >


  export type StockMovementSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    inventoryItemId?: boolean
    quantity?: boolean
    type?: boolean
    date?: boolean
    notes?: boolean
    createdBy?: boolean
    inventoryItem?: boolean | InventoryItemDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["stockMovement"]>

  export type StockMovementSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    inventoryItemId?: boolean
    quantity?: boolean
    type?: boolean
    date?: boolean
    notes?: boolean
    createdBy?: boolean
    inventoryItem?: boolean | InventoryItemDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["stockMovement"]>

  export type StockMovementSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    inventoryItemId?: boolean
    quantity?: boolean
    type?: boolean
    date?: boolean
    notes?: boolean
    createdBy?: boolean
    inventoryItem?: boolean | InventoryItemDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["stockMovement"]>

  export type StockMovementSelectScalar = {
    id?: boolean
    inventoryItemId?: boolean
    quantity?: boolean
    type?: boolean
    date?: boolean
    notes?: boolean
    createdBy?: boolean
  }

  export type StockMovementOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "inventoryItemId" | "quantity" | "type" | "date" | "notes" | "createdBy", ExtArgs["result"]["stockMovement"]>
  export type StockMovementInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    inventoryItem?: boolean | InventoryItemDefaultArgs<ExtArgs>
  }
  export type StockMovementIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    inventoryItem?: boolean | InventoryItemDefaultArgs<ExtArgs>
  }
  export type StockMovementIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    inventoryItem?: boolean | InventoryItemDefaultArgs<ExtArgs>
  }

  export type $StockMovementPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "StockMovement"
    objects: {
      inventoryItem: Prisma.$InventoryItemPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      inventoryItemId: string
      quantity: number
      type: $Enums.MovementType
      date: Date
      notes: string | null
      createdBy: string | null
    }, ExtArgs["result"]["stockMovement"]>
    composites: {}
  }

  type StockMovementGetPayload<S extends boolean | null | undefined | StockMovementDefaultArgs> = $Result.GetResult<Prisma.$StockMovementPayload, S>

  type StockMovementCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<StockMovementFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: StockMovementCountAggregateInputType | true
    }

  export interface StockMovementDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['StockMovement'], meta: { name: 'StockMovement' } }
    /**
     * Find zero or one StockMovement that matches the filter.
     * @param {StockMovementFindUniqueArgs} args - Arguments to find a StockMovement
     * @example
     * // Get one StockMovement
     * const stockMovement = await prisma.stockMovement.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends StockMovementFindUniqueArgs>(args: SelectSubset<T, StockMovementFindUniqueArgs<ExtArgs>>): Prisma__StockMovementClient<$Result.GetResult<Prisma.$StockMovementPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one StockMovement that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {StockMovementFindUniqueOrThrowArgs} args - Arguments to find a StockMovement
     * @example
     * // Get one StockMovement
     * const stockMovement = await prisma.stockMovement.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends StockMovementFindUniqueOrThrowArgs>(args: SelectSubset<T, StockMovementFindUniqueOrThrowArgs<ExtArgs>>): Prisma__StockMovementClient<$Result.GetResult<Prisma.$StockMovementPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first StockMovement that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StockMovementFindFirstArgs} args - Arguments to find a StockMovement
     * @example
     * // Get one StockMovement
     * const stockMovement = await prisma.stockMovement.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends StockMovementFindFirstArgs>(args?: SelectSubset<T, StockMovementFindFirstArgs<ExtArgs>>): Prisma__StockMovementClient<$Result.GetResult<Prisma.$StockMovementPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first StockMovement that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StockMovementFindFirstOrThrowArgs} args - Arguments to find a StockMovement
     * @example
     * // Get one StockMovement
     * const stockMovement = await prisma.stockMovement.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends StockMovementFindFirstOrThrowArgs>(args?: SelectSubset<T, StockMovementFindFirstOrThrowArgs<ExtArgs>>): Prisma__StockMovementClient<$Result.GetResult<Prisma.$StockMovementPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more StockMovements that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StockMovementFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all StockMovements
     * const stockMovements = await prisma.stockMovement.findMany()
     * 
     * // Get first 10 StockMovements
     * const stockMovements = await prisma.stockMovement.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const stockMovementWithIdOnly = await prisma.stockMovement.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends StockMovementFindManyArgs>(args?: SelectSubset<T, StockMovementFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StockMovementPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a StockMovement.
     * @param {StockMovementCreateArgs} args - Arguments to create a StockMovement.
     * @example
     * // Create one StockMovement
     * const StockMovement = await prisma.stockMovement.create({
     *   data: {
     *     // ... data to create a StockMovement
     *   }
     * })
     * 
     */
    create<T extends StockMovementCreateArgs>(args: SelectSubset<T, StockMovementCreateArgs<ExtArgs>>): Prisma__StockMovementClient<$Result.GetResult<Prisma.$StockMovementPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many StockMovements.
     * @param {StockMovementCreateManyArgs} args - Arguments to create many StockMovements.
     * @example
     * // Create many StockMovements
     * const stockMovement = await prisma.stockMovement.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends StockMovementCreateManyArgs>(args?: SelectSubset<T, StockMovementCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many StockMovements and returns the data saved in the database.
     * @param {StockMovementCreateManyAndReturnArgs} args - Arguments to create many StockMovements.
     * @example
     * // Create many StockMovements
     * const stockMovement = await prisma.stockMovement.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many StockMovements and only return the `id`
     * const stockMovementWithIdOnly = await prisma.stockMovement.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends StockMovementCreateManyAndReturnArgs>(args?: SelectSubset<T, StockMovementCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StockMovementPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a StockMovement.
     * @param {StockMovementDeleteArgs} args - Arguments to delete one StockMovement.
     * @example
     * // Delete one StockMovement
     * const StockMovement = await prisma.stockMovement.delete({
     *   where: {
     *     // ... filter to delete one StockMovement
     *   }
     * })
     * 
     */
    delete<T extends StockMovementDeleteArgs>(args: SelectSubset<T, StockMovementDeleteArgs<ExtArgs>>): Prisma__StockMovementClient<$Result.GetResult<Prisma.$StockMovementPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one StockMovement.
     * @param {StockMovementUpdateArgs} args - Arguments to update one StockMovement.
     * @example
     * // Update one StockMovement
     * const stockMovement = await prisma.stockMovement.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends StockMovementUpdateArgs>(args: SelectSubset<T, StockMovementUpdateArgs<ExtArgs>>): Prisma__StockMovementClient<$Result.GetResult<Prisma.$StockMovementPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more StockMovements.
     * @param {StockMovementDeleteManyArgs} args - Arguments to filter StockMovements to delete.
     * @example
     * // Delete a few StockMovements
     * const { count } = await prisma.stockMovement.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends StockMovementDeleteManyArgs>(args?: SelectSubset<T, StockMovementDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more StockMovements.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StockMovementUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many StockMovements
     * const stockMovement = await prisma.stockMovement.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends StockMovementUpdateManyArgs>(args: SelectSubset<T, StockMovementUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more StockMovements and returns the data updated in the database.
     * @param {StockMovementUpdateManyAndReturnArgs} args - Arguments to update many StockMovements.
     * @example
     * // Update many StockMovements
     * const stockMovement = await prisma.stockMovement.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more StockMovements and only return the `id`
     * const stockMovementWithIdOnly = await prisma.stockMovement.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends StockMovementUpdateManyAndReturnArgs>(args: SelectSubset<T, StockMovementUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StockMovementPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one StockMovement.
     * @param {StockMovementUpsertArgs} args - Arguments to update or create a StockMovement.
     * @example
     * // Update or create a StockMovement
     * const stockMovement = await prisma.stockMovement.upsert({
     *   create: {
     *     // ... data to create a StockMovement
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the StockMovement we want to update
     *   }
     * })
     */
    upsert<T extends StockMovementUpsertArgs>(args: SelectSubset<T, StockMovementUpsertArgs<ExtArgs>>): Prisma__StockMovementClient<$Result.GetResult<Prisma.$StockMovementPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of StockMovements.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StockMovementCountArgs} args - Arguments to filter StockMovements to count.
     * @example
     * // Count the number of StockMovements
     * const count = await prisma.stockMovement.count({
     *   where: {
     *     // ... the filter for the StockMovements we want to count
     *   }
     * })
    **/
    count<T extends StockMovementCountArgs>(
      args?: Subset<T, StockMovementCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], StockMovementCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a StockMovement.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StockMovementAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends StockMovementAggregateArgs>(args: Subset<T, StockMovementAggregateArgs>): Prisma.PrismaPromise<GetStockMovementAggregateType<T>>

    /**
     * Group by StockMovement.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StockMovementGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends StockMovementGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: StockMovementGroupByArgs['orderBy'] }
        : { orderBy?: StockMovementGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, StockMovementGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetStockMovementGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the StockMovement model
   */
  readonly fields: StockMovementFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for StockMovement.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__StockMovementClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    inventoryItem<T extends InventoryItemDefaultArgs<ExtArgs> = {}>(args?: Subset<T, InventoryItemDefaultArgs<ExtArgs>>): Prisma__InventoryItemClient<$Result.GetResult<Prisma.$InventoryItemPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the StockMovement model
   */
  interface StockMovementFieldRefs {
    readonly id: FieldRef<"StockMovement", 'String'>
    readonly inventoryItemId: FieldRef<"StockMovement", 'String'>
    readonly quantity: FieldRef<"StockMovement", 'Int'>
    readonly type: FieldRef<"StockMovement", 'MovementType'>
    readonly date: FieldRef<"StockMovement", 'DateTime'>
    readonly notes: FieldRef<"StockMovement", 'String'>
    readonly createdBy: FieldRef<"StockMovement", 'String'>
  }
    

  // Custom InputTypes
  /**
   * StockMovement findUnique
   */
  export type StockMovementFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockMovement
     */
    select?: StockMovementSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StockMovement
     */
    omit?: StockMovementOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockMovementInclude<ExtArgs> | null
    /**
     * Filter, which StockMovement to fetch.
     */
    where: StockMovementWhereUniqueInput
  }

  /**
   * StockMovement findUniqueOrThrow
   */
  export type StockMovementFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockMovement
     */
    select?: StockMovementSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StockMovement
     */
    omit?: StockMovementOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockMovementInclude<ExtArgs> | null
    /**
     * Filter, which StockMovement to fetch.
     */
    where: StockMovementWhereUniqueInput
  }

  /**
   * StockMovement findFirst
   */
  export type StockMovementFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockMovement
     */
    select?: StockMovementSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StockMovement
     */
    omit?: StockMovementOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockMovementInclude<ExtArgs> | null
    /**
     * Filter, which StockMovement to fetch.
     */
    where?: StockMovementWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StockMovements to fetch.
     */
    orderBy?: StockMovementOrderByWithRelationInput | StockMovementOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for StockMovements.
     */
    cursor?: StockMovementWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StockMovements from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StockMovements.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of StockMovements.
     */
    distinct?: StockMovementScalarFieldEnum | StockMovementScalarFieldEnum[]
  }

  /**
   * StockMovement findFirstOrThrow
   */
  export type StockMovementFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockMovement
     */
    select?: StockMovementSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StockMovement
     */
    omit?: StockMovementOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockMovementInclude<ExtArgs> | null
    /**
     * Filter, which StockMovement to fetch.
     */
    where?: StockMovementWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StockMovements to fetch.
     */
    orderBy?: StockMovementOrderByWithRelationInput | StockMovementOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for StockMovements.
     */
    cursor?: StockMovementWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StockMovements from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StockMovements.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of StockMovements.
     */
    distinct?: StockMovementScalarFieldEnum | StockMovementScalarFieldEnum[]
  }

  /**
   * StockMovement findMany
   */
  export type StockMovementFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockMovement
     */
    select?: StockMovementSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StockMovement
     */
    omit?: StockMovementOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockMovementInclude<ExtArgs> | null
    /**
     * Filter, which StockMovements to fetch.
     */
    where?: StockMovementWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StockMovements to fetch.
     */
    orderBy?: StockMovementOrderByWithRelationInput | StockMovementOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing StockMovements.
     */
    cursor?: StockMovementWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StockMovements from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StockMovements.
     */
    skip?: number
    distinct?: StockMovementScalarFieldEnum | StockMovementScalarFieldEnum[]
  }

  /**
   * StockMovement create
   */
  export type StockMovementCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockMovement
     */
    select?: StockMovementSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StockMovement
     */
    omit?: StockMovementOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockMovementInclude<ExtArgs> | null
    /**
     * The data needed to create a StockMovement.
     */
    data: XOR<StockMovementCreateInput, StockMovementUncheckedCreateInput>
  }

  /**
   * StockMovement createMany
   */
  export type StockMovementCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many StockMovements.
     */
    data: StockMovementCreateManyInput | StockMovementCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * StockMovement createManyAndReturn
   */
  export type StockMovementCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockMovement
     */
    select?: StockMovementSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the StockMovement
     */
    omit?: StockMovementOmit<ExtArgs> | null
    /**
     * The data used to create many StockMovements.
     */
    data: StockMovementCreateManyInput | StockMovementCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockMovementIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * StockMovement update
   */
  export type StockMovementUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockMovement
     */
    select?: StockMovementSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StockMovement
     */
    omit?: StockMovementOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockMovementInclude<ExtArgs> | null
    /**
     * The data needed to update a StockMovement.
     */
    data: XOR<StockMovementUpdateInput, StockMovementUncheckedUpdateInput>
    /**
     * Choose, which StockMovement to update.
     */
    where: StockMovementWhereUniqueInput
  }

  /**
   * StockMovement updateMany
   */
  export type StockMovementUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update StockMovements.
     */
    data: XOR<StockMovementUpdateManyMutationInput, StockMovementUncheckedUpdateManyInput>
    /**
     * Filter which StockMovements to update
     */
    where?: StockMovementWhereInput
    /**
     * Limit how many StockMovements to update.
     */
    limit?: number
  }

  /**
   * StockMovement updateManyAndReturn
   */
  export type StockMovementUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockMovement
     */
    select?: StockMovementSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the StockMovement
     */
    omit?: StockMovementOmit<ExtArgs> | null
    /**
     * The data used to update StockMovements.
     */
    data: XOR<StockMovementUpdateManyMutationInput, StockMovementUncheckedUpdateManyInput>
    /**
     * Filter which StockMovements to update
     */
    where?: StockMovementWhereInput
    /**
     * Limit how many StockMovements to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockMovementIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * StockMovement upsert
   */
  export type StockMovementUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockMovement
     */
    select?: StockMovementSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StockMovement
     */
    omit?: StockMovementOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockMovementInclude<ExtArgs> | null
    /**
     * The filter to search for the StockMovement to update in case it exists.
     */
    where: StockMovementWhereUniqueInput
    /**
     * In case the StockMovement found by the `where` argument doesn't exist, create a new StockMovement with this data.
     */
    create: XOR<StockMovementCreateInput, StockMovementUncheckedCreateInput>
    /**
     * In case the StockMovement was found with the provided `where` argument, update it with this data.
     */
    update: XOR<StockMovementUpdateInput, StockMovementUncheckedUpdateInput>
  }

  /**
   * StockMovement delete
   */
  export type StockMovementDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockMovement
     */
    select?: StockMovementSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StockMovement
     */
    omit?: StockMovementOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockMovementInclude<ExtArgs> | null
    /**
     * Filter which StockMovement to delete.
     */
    where: StockMovementWhereUniqueInput
  }

  /**
   * StockMovement deleteMany
   */
  export type StockMovementDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which StockMovements to delete
     */
    where?: StockMovementWhereInput
    /**
     * Limit how many StockMovements to delete.
     */
    limit?: number
  }

  /**
   * StockMovement without action
   */
  export type StockMovementDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockMovement
     */
    select?: StockMovementSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StockMovement
     */
    omit?: StockMovementOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StockMovementInclude<ExtArgs> | null
  }


  /**
   * Model Sale
   */

  export type AggregateSale = {
    _count: SaleCountAggregateOutputType | null
    _avg: SaleAvgAggregateOutputType | null
    _sum: SaleSumAggregateOutputType | null
    _min: SaleMinAggregateOutputType | null
    _max: SaleMaxAggregateOutputType | null
  }

  export type SaleAvgAggregateOutputType = {
    total: Decimal | null
    subtotal: Decimal | null
    tax: Decimal | null
  }

  export type SaleSumAggregateOutputType = {
    total: Decimal | null
    subtotal: Decimal | null
    tax: Decimal | null
  }

  export type SaleMinAggregateOutputType = {
    id: string | null
    date: Date | null
    total: Decimal | null
    subtotal: Decimal | null
    tax: Decimal | null
    status: $Enums.SaleStatus | null
    notes: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SaleMaxAggregateOutputType = {
    id: string | null
    date: Date | null
    total: Decimal | null
    subtotal: Decimal | null
    tax: Decimal | null
    status: $Enums.SaleStatus | null
    notes: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SaleCountAggregateOutputType = {
    id: number
    date: number
    total: number
    subtotal: number
    tax: number
    status: number
    notes: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type SaleAvgAggregateInputType = {
    total?: true
    subtotal?: true
    tax?: true
  }

  export type SaleSumAggregateInputType = {
    total?: true
    subtotal?: true
    tax?: true
  }

  export type SaleMinAggregateInputType = {
    id?: true
    date?: true
    total?: true
    subtotal?: true
    tax?: true
    status?: true
    notes?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SaleMaxAggregateInputType = {
    id?: true
    date?: true
    total?: true
    subtotal?: true
    tax?: true
    status?: true
    notes?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SaleCountAggregateInputType = {
    id?: true
    date?: true
    total?: true
    subtotal?: true
    tax?: true
    status?: true
    notes?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type SaleAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Sale to aggregate.
     */
    where?: SaleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Sales to fetch.
     */
    orderBy?: SaleOrderByWithRelationInput | SaleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SaleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Sales from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Sales.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Sales
    **/
    _count?: true | SaleCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: SaleAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: SaleSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SaleMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SaleMaxAggregateInputType
  }

  export type GetSaleAggregateType<T extends SaleAggregateArgs> = {
        [P in keyof T & keyof AggregateSale]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSale[P]>
      : GetScalarType<T[P], AggregateSale[P]>
  }




  export type SaleGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SaleWhereInput
    orderBy?: SaleOrderByWithAggregationInput | SaleOrderByWithAggregationInput[]
    by: SaleScalarFieldEnum[] | SaleScalarFieldEnum
    having?: SaleScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SaleCountAggregateInputType | true
    _avg?: SaleAvgAggregateInputType
    _sum?: SaleSumAggregateInputType
    _min?: SaleMinAggregateInputType
    _max?: SaleMaxAggregateInputType
  }

  export type SaleGroupByOutputType = {
    id: string
    date: Date
    total: Decimal
    subtotal: Decimal
    tax: Decimal
    status: $Enums.SaleStatus
    notes: string | null
    createdAt: Date
    updatedAt: Date
    _count: SaleCountAggregateOutputType | null
    _avg: SaleAvgAggregateOutputType | null
    _sum: SaleSumAggregateOutputType | null
    _min: SaleMinAggregateOutputType | null
    _max: SaleMaxAggregateOutputType | null
  }

  type GetSaleGroupByPayload<T extends SaleGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SaleGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SaleGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SaleGroupByOutputType[P]>
            : GetScalarType<T[P], SaleGroupByOutputType[P]>
        }
      >
    >


  export type SaleSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    date?: boolean
    total?: boolean
    subtotal?: boolean
    tax?: boolean
    status?: boolean
    notes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    transactions?: boolean | Sale$transactionsArgs<ExtArgs>
    _count?: boolean | SaleCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["sale"]>

  export type SaleSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    date?: boolean
    total?: boolean
    subtotal?: boolean
    tax?: boolean
    status?: boolean
    notes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["sale"]>

  export type SaleSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    date?: boolean
    total?: boolean
    subtotal?: boolean
    tax?: boolean
    status?: boolean
    notes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["sale"]>

  export type SaleSelectScalar = {
    id?: boolean
    date?: boolean
    total?: boolean
    subtotal?: boolean
    tax?: boolean
    status?: boolean
    notes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type SaleOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "date" | "total" | "subtotal" | "tax" | "status" | "notes" | "createdAt" | "updatedAt", ExtArgs["result"]["sale"]>
  export type SaleInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    transactions?: boolean | Sale$transactionsArgs<ExtArgs>
    _count?: boolean | SaleCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type SaleIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type SaleIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $SalePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Sale"
    objects: {
      transactions: Prisma.$SaleTransactionPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      date: Date
      total: Prisma.Decimal
      subtotal: Prisma.Decimal
      tax: Prisma.Decimal
      status: $Enums.SaleStatus
      notes: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["sale"]>
    composites: {}
  }

  type SaleGetPayload<S extends boolean | null | undefined | SaleDefaultArgs> = $Result.GetResult<Prisma.$SalePayload, S>

  type SaleCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SaleFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SaleCountAggregateInputType | true
    }

  export interface SaleDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Sale'], meta: { name: 'Sale' } }
    /**
     * Find zero or one Sale that matches the filter.
     * @param {SaleFindUniqueArgs} args - Arguments to find a Sale
     * @example
     * // Get one Sale
     * const sale = await prisma.sale.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SaleFindUniqueArgs>(args: SelectSubset<T, SaleFindUniqueArgs<ExtArgs>>): Prisma__SaleClient<$Result.GetResult<Prisma.$SalePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Sale that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SaleFindUniqueOrThrowArgs} args - Arguments to find a Sale
     * @example
     * // Get one Sale
     * const sale = await prisma.sale.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SaleFindUniqueOrThrowArgs>(args: SelectSubset<T, SaleFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SaleClient<$Result.GetResult<Prisma.$SalePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Sale that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SaleFindFirstArgs} args - Arguments to find a Sale
     * @example
     * // Get one Sale
     * const sale = await prisma.sale.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SaleFindFirstArgs>(args?: SelectSubset<T, SaleFindFirstArgs<ExtArgs>>): Prisma__SaleClient<$Result.GetResult<Prisma.$SalePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Sale that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SaleFindFirstOrThrowArgs} args - Arguments to find a Sale
     * @example
     * // Get one Sale
     * const sale = await prisma.sale.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SaleFindFirstOrThrowArgs>(args?: SelectSubset<T, SaleFindFirstOrThrowArgs<ExtArgs>>): Prisma__SaleClient<$Result.GetResult<Prisma.$SalePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Sales that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SaleFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Sales
     * const sales = await prisma.sale.findMany()
     * 
     * // Get first 10 Sales
     * const sales = await prisma.sale.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const saleWithIdOnly = await prisma.sale.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SaleFindManyArgs>(args?: SelectSubset<T, SaleFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Sale.
     * @param {SaleCreateArgs} args - Arguments to create a Sale.
     * @example
     * // Create one Sale
     * const Sale = await prisma.sale.create({
     *   data: {
     *     // ... data to create a Sale
     *   }
     * })
     * 
     */
    create<T extends SaleCreateArgs>(args: SelectSubset<T, SaleCreateArgs<ExtArgs>>): Prisma__SaleClient<$Result.GetResult<Prisma.$SalePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Sales.
     * @param {SaleCreateManyArgs} args - Arguments to create many Sales.
     * @example
     * // Create many Sales
     * const sale = await prisma.sale.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SaleCreateManyArgs>(args?: SelectSubset<T, SaleCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Sales and returns the data saved in the database.
     * @param {SaleCreateManyAndReturnArgs} args - Arguments to create many Sales.
     * @example
     * // Create many Sales
     * const sale = await prisma.sale.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Sales and only return the `id`
     * const saleWithIdOnly = await prisma.sale.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SaleCreateManyAndReturnArgs>(args?: SelectSubset<T, SaleCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Sale.
     * @param {SaleDeleteArgs} args - Arguments to delete one Sale.
     * @example
     * // Delete one Sale
     * const Sale = await prisma.sale.delete({
     *   where: {
     *     // ... filter to delete one Sale
     *   }
     * })
     * 
     */
    delete<T extends SaleDeleteArgs>(args: SelectSubset<T, SaleDeleteArgs<ExtArgs>>): Prisma__SaleClient<$Result.GetResult<Prisma.$SalePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Sale.
     * @param {SaleUpdateArgs} args - Arguments to update one Sale.
     * @example
     * // Update one Sale
     * const sale = await prisma.sale.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SaleUpdateArgs>(args: SelectSubset<T, SaleUpdateArgs<ExtArgs>>): Prisma__SaleClient<$Result.GetResult<Prisma.$SalePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Sales.
     * @param {SaleDeleteManyArgs} args - Arguments to filter Sales to delete.
     * @example
     * // Delete a few Sales
     * const { count } = await prisma.sale.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SaleDeleteManyArgs>(args?: SelectSubset<T, SaleDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sales.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SaleUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Sales
     * const sale = await prisma.sale.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SaleUpdateManyArgs>(args: SelectSubset<T, SaleUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sales and returns the data updated in the database.
     * @param {SaleUpdateManyAndReturnArgs} args - Arguments to update many Sales.
     * @example
     * // Update many Sales
     * const sale = await prisma.sale.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Sales and only return the `id`
     * const saleWithIdOnly = await prisma.sale.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SaleUpdateManyAndReturnArgs>(args: SelectSubset<T, SaleUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Sale.
     * @param {SaleUpsertArgs} args - Arguments to update or create a Sale.
     * @example
     * // Update or create a Sale
     * const sale = await prisma.sale.upsert({
     *   create: {
     *     // ... data to create a Sale
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Sale we want to update
     *   }
     * })
     */
    upsert<T extends SaleUpsertArgs>(args: SelectSubset<T, SaleUpsertArgs<ExtArgs>>): Prisma__SaleClient<$Result.GetResult<Prisma.$SalePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Sales.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SaleCountArgs} args - Arguments to filter Sales to count.
     * @example
     * // Count the number of Sales
     * const count = await prisma.sale.count({
     *   where: {
     *     // ... the filter for the Sales we want to count
     *   }
     * })
    **/
    count<T extends SaleCountArgs>(
      args?: Subset<T, SaleCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SaleCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Sale.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SaleAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SaleAggregateArgs>(args: Subset<T, SaleAggregateArgs>): Prisma.PrismaPromise<GetSaleAggregateType<T>>

    /**
     * Group by Sale.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SaleGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SaleGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SaleGroupByArgs['orderBy'] }
        : { orderBy?: SaleGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SaleGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSaleGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Sale model
   */
  readonly fields: SaleFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Sale.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SaleClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    transactions<T extends Sale$transactionsArgs<ExtArgs> = {}>(args?: Subset<T, Sale$transactionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SaleTransactionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Sale model
   */
  interface SaleFieldRefs {
    readonly id: FieldRef<"Sale", 'String'>
    readonly date: FieldRef<"Sale", 'DateTime'>
    readonly total: FieldRef<"Sale", 'Decimal'>
    readonly subtotal: FieldRef<"Sale", 'Decimal'>
    readonly tax: FieldRef<"Sale", 'Decimal'>
    readonly status: FieldRef<"Sale", 'SaleStatus'>
    readonly notes: FieldRef<"Sale", 'String'>
    readonly createdAt: FieldRef<"Sale", 'DateTime'>
    readonly updatedAt: FieldRef<"Sale", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Sale findUnique
   */
  export type SaleFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Sale
     */
    select?: SaleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Sale
     */
    omit?: SaleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SaleInclude<ExtArgs> | null
    /**
     * Filter, which Sale to fetch.
     */
    where: SaleWhereUniqueInput
  }

  /**
   * Sale findUniqueOrThrow
   */
  export type SaleFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Sale
     */
    select?: SaleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Sale
     */
    omit?: SaleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SaleInclude<ExtArgs> | null
    /**
     * Filter, which Sale to fetch.
     */
    where: SaleWhereUniqueInput
  }

  /**
   * Sale findFirst
   */
  export type SaleFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Sale
     */
    select?: SaleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Sale
     */
    omit?: SaleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SaleInclude<ExtArgs> | null
    /**
     * Filter, which Sale to fetch.
     */
    where?: SaleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Sales to fetch.
     */
    orderBy?: SaleOrderByWithRelationInput | SaleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Sales.
     */
    cursor?: SaleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Sales from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Sales.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Sales.
     */
    distinct?: SaleScalarFieldEnum | SaleScalarFieldEnum[]
  }

  /**
   * Sale findFirstOrThrow
   */
  export type SaleFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Sale
     */
    select?: SaleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Sale
     */
    omit?: SaleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SaleInclude<ExtArgs> | null
    /**
     * Filter, which Sale to fetch.
     */
    where?: SaleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Sales to fetch.
     */
    orderBy?: SaleOrderByWithRelationInput | SaleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Sales.
     */
    cursor?: SaleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Sales from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Sales.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Sales.
     */
    distinct?: SaleScalarFieldEnum | SaleScalarFieldEnum[]
  }

  /**
   * Sale findMany
   */
  export type SaleFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Sale
     */
    select?: SaleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Sale
     */
    omit?: SaleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SaleInclude<ExtArgs> | null
    /**
     * Filter, which Sales to fetch.
     */
    where?: SaleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Sales to fetch.
     */
    orderBy?: SaleOrderByWithRelationInput | SaleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Sales.
     */
    cursor?: SaleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Sales from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Sales.
     */
    skip?: number
    distinct?: SaleScalarFieldEnum | SaleScalarFieldEnum[]
  }

  /**
   * Sale create
   */
  export type SaleCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Sale
     */
    select?: SaleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Sale
     */
    omit?: SaleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SaleInclude<ExtArgs> | null
    /**
     * The data needed to create a Sale.
     */
    data: XOR<SaleCreateInput, SaleUncheckedCreateInput>
  }

  /**
   * Sale createMany
   */
  export type SaleCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Sales.
     */
    data: SaleCreateManyInput | SaleCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Sale createManyAndReturn
   */
  export type SaleCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Sale
     */
    select?: SaleSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Sale
     */
    omit?: SaleOmit<ExtArgs> | null
    /**
     * The data used to create many Sales.
     */
    data: SaleCreateManyInput | SaleCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Sale update
   */
  export type SaleUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Sale
     */
    select?: SaleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Sale
     */
    omit?: SaleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SaleInclude<ExtArgs> | null
    /**
     * The data needed to update a Sale.
     */
    data: XOR<SaleUpdateInput, SaleUncheckedUpdateInput>
    /**
     * Choose, which Sale to update.
     */
    where: SaleWhereUniqueInput
  }

  /**
   * Sale updateMany
   */
  export type SaleUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Sales.
     */
    data: XOR<SaleUpdateManyMutationInput, SaleUncheckedUpdateManyInput>
    /**
     * Filter which Sales to update
     */
    where?: SaleWhereInput
    /**
     * Limit how many Sales to update.
     */
    limit?: number
  }

  /**
   * Sale updateManyAndReturn
   */
  export type SaleUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Sale
     */
    select?: SaleSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Sale
     */
    omit?: SaleOmit<ExtArgs> | null
    /**
     * The data used to update Sales.
     */
    data: XOR<SaleUpdateManyMutationInput, SaleUncheckedUpdateManyInput>
    /**
     * Filter which Sales to update
     */
    where?: SaleWhereInput
    /**
     * Limit how many Sales to update.
     */
    limit?: number
  }

  /**
   * Sale upsert
   */
  export type SaleUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Sale
     */
    select?: SaleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Sale
     */
    omit?: SaleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SaleInclude<ExtArgs> | null
    /**
     * The filter to search for the Sale to update in case it exists.
     */
    where: SaleWhereUniqueInput
    /**
     * In case the Sale found by the `where` argument doesn't exist, create a new Sale with this data.
     */
    create: XOR<SaleCreateInput, SaleUncheckedCreateInput>
    /**
     * In case the Sale was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SaleUpdateInput, SaleUncheckedUpdateInput>
  }

  /**
   * Sale delete
   */
  export type SaleDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Sale
     */
    select?: SaleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Sale
     */
    omit?: SaleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SaleInclude<ExtArgs> | null
    /**
     * Filter which Sale to delete.
     */
    where: SaleWhereUniqueInput
  }

  /**
   * Sale deleteMany
   */
  export type SaleDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Sales to delete
     */
    where?: SaleWhereInput
    /**
     * Limit how many Sales to delete.
     */
    limit?: number
  }

  /**
   * Sale.transactions
   */
  export type Sale$transactionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SaleTransaction
     */
    select?: SaleTransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SaleTransaction
     */
    omit?: SaleTransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SaleTransactionInclude<ExtArgs> | null
    where?: SaleTransactionWhereInput
    orderBy?: SaleTransactionOrderByWithRelationInput | SaleTransactionOrderByWithRelationInput[]
    cursor?: SaleTransactionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SaleTransactionScalarFieldEnum | SaleTransactionScalarFieldEnum[]
  }

  /**
   * Sale without action
   */
  export type SaleDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Sale
     */
    select?: SaleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Sale
     */
    omit?: SaleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SaleInclude<ExtArgs> | null
  }


  /**
   * Model SaleTransaction
   */

  export type AggregateSaleTransaction = {
    _count: SaleTransactionCountAggregateOutputType | null
    _avg: SaleTransactionAvgAggregateOutputType | null
    _sum: SaleTransactionSumAggregateOutputType | null
    _min: SaleTransactionMinAggregateOutputType | null
    _max: SaleTransactionMaxAggregateOutputType | null
  }

  export type SaleTransactionAvgAggregateOutputType = {
    quantity: number | null
    unitPrice: Decimal | null
    subtotal: Decimal | null
  }

  export type SaleTransactionSumAggregateOutputType = {
    quantity: number | null
    unitPrice: Decimal | null
    subtotal: Decimal | null
  }

  export type SaleTransactionMinAggregateOutputType = {
    id: string | null
    saleId: string | null
    quantity: number | null
    unitPrice: Decimal | null
    subtotal: Decimal | null
    createdAt: Date | null
    inventoryItemId: string | null
  }

  export type SaleTransactionMaxAggregateOutputType = {
    id: string | null
    saleId: string | null
    quantity: number | null
    unitPrice: Decimal | null
    subtotal: Decimal | null
    createdAt: Date | null
    inventoryItemId: string | null
  }

  export type SaleTransactionCountAggregateOutputType = {
    id: number
    saleId: number
    quantity: number
    unitPrice: number
    subtotal: number
    createdAt: number
    inventoryItemId: number
    _all: number
  }


  export type SaleTransactionAvgAggregateInputType = {
    quantity?: true
    unitPrice?: true
    subtotal?: true
  }

  export type SaleTransactionSumAggregateInputType = {
    quantity?: true
    unitPrice?: true
    subtotal?: true
  }

  export type SaleTransactionMinAggregateInputType = {
    id?: true
    saleId?: true
    quantity?: true
    unitPrice?: true
    subtotal?: true
    createdAt?: true
    inventoryItemId?: true
  }

  export type SaleTransactionMaxAggregateInputType = {
    id?: true
    saleId?: true
    quantity?: true
    unitPrice?: true
    subtotal?: true
    createdAt?: true
    inventoryItemId?: true
  }

  export type SaleTransactionCountAggregateInputType = {
    id?: true
    saleId?: true
    quantity?: true
    unitPrice?: true
    subtotal?: true
    createdAt?: true
    inventoryItemId?: true
    _all?: true
  }

  export type SaleTransactionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SaleTransaction to aggregate.
     */
    where?: SaleTransactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SaleTransactions to fetch.
     */
    orderBy?: SaleTransactionOrderByWithRelationInput | SaleTransactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SaleTransactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SaleTransactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SaleTransactions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SaleTransactions
    **/
    _count?: true | SaleTransactionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: SaleTransactionAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: SaleTransactionSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SaleTransactionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SaleTransactionMaxAggregateInputType
  }

  export type GetSaleTransactionAggregateType<T extends SaleTransactionAggregateArgs> = {
        [P in keyof T & keyof AggregateSaleTransaction]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSaleTransaction[P]>
      : GetScalarType<T[P], AggregateSaleTransaction[P]>
  }




  export type SaleTransactionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SaleTransactionWhereInput
    orderBy?: SaleTransactionOrderByWithAggregationInput | SaleTransactionOrderByWithAggregationInput[]
    by: SaleTransactionScalarFieldEnum[] | SaleTransactionScalarFieldEnum
    having?: SaleTransactionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SaleTransactionCountAggregateInputType | true
    _avg?: SaleTransactionAvgAggregateInputType
    _sum?: SaleTransactionSumAggregateInputType
    _min?: SaleTransactionMinAggregateInputType
    _max?: SaleTransactionMaxAggregateInputType
  }

  export type SaleTransactionGroupByOutputType = {
    id: string
    saleId: string
    quantity: number
    unitPrice: Decimal
    subtotal: Decimal
    createdAt: Date
    inventoryItemId: string
    _count: SaleTransactionCountAggregateOutputType | null
    _avg: SaleTransactionAvgAggregateOutputType | null
    _sum: SaleTransactionSumAggregateOutputType | null
    _min: SaleTransactionMinAggregateOutputType | null
    _max: SaleTransactionMaxAggregateOutputType | null
  }

  type GetSaleTransactionGroupByPayload<T extends SaleTransactionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SaleTransactionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SaleTransactionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SaleTransactionGroupByOutputType[P]>
            : GetScalarType<T[P], SaleTransactionGroupByOutputType[P]>
        }
      >
    >


  export type SaleTransactionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    saleId?: boolean
    quantity?: boolean
    unitPrice?: boolean
    subtotal?: boolean
    createdAt?: boolean
    inventoryItemId?: boolean
    inventoryItem?: boolean | InventoryItemDefaultArgs<ExtArgs>
    sale?: boolean | SaleDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["saleTransaction"]>

  export type SaleTransactionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    saleId?: boolean
    quantity?: boolean
    unitPrice?: boolean
    subtotal?: boolean
    createdAt?: boolean
    inventoryItemId?: boolean
    inventoryItem?: boolean | InventoryItemDefaultArgs<ExtArgs>
    sale?: boolean | SaleDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["saleTransaction"]>

  export type SaleTransactionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    saleId?: boolean
    quantity?: boolean
    unitPrice?: boolean
    subtotal?: boolean
    createdAt?: boolean
    inventoryItemId?: boolean
    inventoryItem?: boolean | InventoryItemDefaultArgs<ExtArgs>
    sale?: boolean | SaleDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["saleTransaction"]>

  export type SaleTransactionSelectScalar = {
    id?: boolean
    saleId?: boolean
    quantity?: boolean
    unitPrice?: boolean
    subtotal?: boolean
    createdAt?: boolean
    inventoryItemId?: boolean
  }

  export type SaleTransactionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "saleId" | "quantity" | "unitPrice" | "subtotal" | "createdAt" | "inventoryItemId", ExtArgs["result"]["saleTransaction"]>
  export type SaleTransactionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    inventoryItem?: boolean | InventoryItemDefaultArgs<ExtArgs>
    sale?: boolean | SaleDefaultArgs<ExtArgs>
  }
  export type SaleTransactionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    inventoryItem?: boolean | InventoryItemDefaultArgs<ExtArgs>
    sale?: boolean | SaleDefaultArgs<ExtArgs>
  }
  export type SaleTransactionIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    inventoryItem?: boolean | InventoryItemDefaultArgs<ExtArgs>
    sale?: boolean | SaleDefaultArgs<ExtArgs>
  }

  export type $SaleTransactionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SaleTransaction"
    objects: {
      inventoryItem: Prisma.$InventoryItemPayload<ExtArgs>
      sale: Prisma.$SalePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      saleId: string
      quantity: number
      unitPrice: Prisma.Decimal
      subtotal: Prisma.Decimal
      createdAt: Date
      inventoryItemId: string
    }, ExtArgs["result"]["saleTransaction"]>
    composites: {}
  }

  type SaleTransactionGetPayload<S extends boolean | null | undefined | SaleTransactionDefaultArgs> = $Result.GetResult<Prisma.$SaleTransactionPayload, S>

  type SaleTransactionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SaleTransactionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SaleTransactionCountAggregateInputType | true
    }

  export interface SaleTransactionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SaleTransaction'], meta: { name: 'SaleTransaction' } }
    /**
     * Find zero or one SaleTransaction that matches the filter.
     * @param {SaleTransactionFindUniqueArgs} args - Arguments to find a SaleTransaction
     * @example
     * // Get one SaleTransaction
     * const saleTransaction = await prisma.saleTransaction.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SaleTransactionFindUniqueArgs>(args: SelectSubset<T, SaleTransactionFindUniqueArgs<ExtArgs>>): Prisma__SaleTransactionClient<$Result.GetResult<Prisma.$SaleTransactionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one SaleTransaction that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SaleTransactionFindUniqueOrThrowArgs} args - Arguments to find a SaleTransaction
     * @example
     * // Get one SaleTransaction
     * const saleTransaction = await prisma.saleTransaction.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SaleTransactionFindUniqueOrThrowArgs>(args: SelectSubset<T, SaleTransactionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SaleTransactionClient<$Result.GetResult<Prisma.$SaleTransactionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SaleTransaction that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SaleTransactionFindFirstArgs} args - Arguments to find a SaleTransaction
     * @example
     * // Get one SaleTransaction
     * const saleTransaction = await prisma.saleTransaction.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SaleTransactionFindFirstArgs>(args?: SelectSubset<T, SaleTransactionFindFirstArgs<ExtArgs>>): Prisma__SaleTransactionClient<$Result.GetResult<Prisma.$SaleTransactionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SaleTransaction that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SaleTransactionFindFirstOrThrowArgs} args - Arguments to find a SaleTransaction
     * @example
     * // Get one SaleTransaction
     * const saleTransaction = await prisma.saleTransaction.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SaleTransactionFindFirstOrThrowArgs>(args?: SelectSubset<T, SaleTransactionFindFirstOrThrowArgs<ExtArgs>>): Prisma__SaleTransactionClient<$Result.GetResult<Prisma.$SaleTransactionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more SaleTransactions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SaleTransactionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SaleTransactions
     * const saleTransactions = await prisma.saleTransaction.findMany()
     * 
     * // Get first 10 SaleTransactions
     * const saleTransactions = await prisma.saleTransaction.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const saleTransactionWithIdOnly = await prisma.saleTransaction.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SaleTransactionFindManyArgs>(args?: SelectSubset<T, SaleTransactionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SaleTransactionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a SaleTransaction.
     * @param {SaleTransactionCreateArgs} args - Arguments to create a SaleTransaction.
     * @example
     * // Create one SaleTransaction
     * const SaleTransaction = await prisma.saleTransaction.create({
     *   data: {
     *     // ... data to create a SaleTransaction
     *   }
     * })
     * 
     */
    create<T extends SaleTransactionCreateArgs>(args: SelectSubset<T, SaleTransactionCreateArgs<ExtArgs>>): Prisma__SaleTransactionClient<$Result.GetResult<Prisma.$SaleTransactionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many SaleTransactions.
     * @param {SaleTransactionCreateManyArgs} args - Arguments to create many SaleTransactions.
     * @example
     * // Create many SaleTransactions
     * const saleTransaction = await prisma.saleTransaction.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SaleTransactionCreateManyArgs>(args?: SelectSubset<T, SaleTransactionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SaleTransactions and returns the data saved in the database.
     * @param {SaleTransactionCreateManyAndReturnArgs} args - Arguments to create many SaleTransactions.
     * @example
     * // Create many SaleTransactions
     * const saleTransaction = await prisma.saleTransaction.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SaleTransactions and only return the `id`
     * const saleTransactionWithIdOnly = await prisma.saleTransaction.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SaleTransactionCreateManyAndReturnArgs>(args?: SelectSubset<T, SaleTransactionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SaleTransactionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a SaleTransaction.
     * @param {SaleTransactionDeleteArgs} args - Arguments to delete one SaleTransaction.
     * @example
     * // Delete one SaleTransaction
     * const SaleTransaction = await prisma.saleTransaction.delete({
     *   where: {
     *     // ... filter to delete one SaleTransaction
     *   }
     * })
     * 
     */
    delete<T extends SaleTransactionDeleteArgs>(args: SelectSubset<T, SaleTransactionDeleteArgs<ExtArgs>>): Prisma__SaleTransactionClient<$Result.GetResult<Prisma.$SaleTransactionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one SaleTransaction.
     * @param {SaleTransactionUpdateArgs} args - Arguments to update one SaleTransaction.
     * @example
     * // Update one SaleTransaction
     * const saleTransaction = await prisma.saleTransaction.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SaleTransactionUpdateArgs>(args: SelectSubset<T, SaleTransactionUpdateArgs<ExtArgs>>): Prisma__SaleTransactionClient<$Result.GetResult<Prisma.$SaleTransactionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more SaleTransactions.
     * @param {SaleTransactionDeleteManyArgs} args - Arguments to filter SaleTransactions to delete.
     * @example
     * // Delete a few SaleTransactions
     * const { count } = await prisma.saleTransaction.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SaleTransactionDeleteManyArgs>(args?: SelectSubset<T, SaleTransactionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SaleTransactions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SaleTransactionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SaleTransactions
     * const saleTransaction = await prisma.saleTransaction.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SaleTransactionUpdateManyArgs>(args: SelectSubset<T, SaleTransactionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SaleTransactions and returns the data updated in the database.
     * @param {SaleTransactionUpdateManyAndReturnArgs} args - Arguments to update many SaleTransactions.
     * @example
     * // Update many SaleTransactions
     * const saleTransaction = await prisma.saleTransaction.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more SaleTransactions and only return the `id`
     * const saleTransactionWithIdOnly = await prisma.saleTransaction.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SaleTransactionUpdateManyAndReturnArgs>(args: SelectSubset<T, SaleTransactionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SaleTransactionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one SaleTransaction.
     * @param {SaleTransactionUpsertArgs} args - Arguments to update or create a SaleTransaction.
     * @example
     * // Update or create a SaleTransaction
     * const saleTransaction = await prisma.saleTransaction.upsert({
     *   create: {
     *     // ... data to create a SaleTransaction
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SaleTransaction we want to update
     *   }
     * })
     */
    upsert<T extends SaleTransactionUpsertArgs>(args: SelectSubset<T, SaleTransactionUpsertArgs<ExtArgs>>): Prisma__SaleTransactionClient<$Result.GetResult<Prisma.$SaleTransactionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of SaleTransactions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SaleTransactionCountArgs} args - Arguments to filter SaleTransactions to count.
     * @example
     * // Count the number of SaleTransactions
     * const count = await prisma.saleTransaction.count({
     *   where: {
     *     // ... the filter for the SaleTransactions we want to count
     *   }
     * })
    **/
    count<T extends SaleTransactionCountArgs>(
      args?: Subset<T, SaleTransactionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SaleTransactionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SaleTransaction.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SaleTransactionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SaleTransactionAggregateArgs>(args: Subset<T, SaleTransactionAggregateArgs>): Prisma.PrismaPromise<GetSaleTransactionAggregateType<T>>

    /**
     * Group by SaleTransaction.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SaleTransactionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SaleTransactionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SaleTransactionGroupByArgs['orderBy'] }
        : { orderBy?: SaleTransactionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SaleTransactionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSaleTransactionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SaleTransaction model
   */
  readonly fields: SaleTransactionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SaleTransaction.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SaleTransactionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    inventoryItem<T extends InventoryItemDefaultArgs<ExtArgs> = {}>(args?: Subset<T, InventoryItemDefaultArgs<ExtArgs>>): Prisma__InventoryItemClient<$Result.GetResult<Prisma.$InventoryItemPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    sale<T extends SaleDefaultArgs<ExtArgs> = {}>(args?: Subset<T, SaleDefaultArgs<ExtArgs>>): Prisma__SaleClient<$Result.GetResult<Prisma.$SalePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SaleTransaction model
   */
  interface SaleTransactionFieldRefs {
    readonly id: FieldRef<"SaleTransaction", 'String'>
    readonly saleId: FieldRef<"SaleTransaction", 'String'>
    readonly quantity: FieldRef<"SaleTransaction", 'Int'>
    readonly unitPrice: FieldRef<"SaleTransaction", 'Decimal'>
    readonly subtotal: FieldRef<"SaleTransaction", 'Decimal'>
    readonly createdAt: FieldRef<"SaleTransaction", 'DateTime'>
    readonly inventoryItemId: FieldRef<"SaleTransaction", 'String'>
  }
    

  // Custom InputTypes
  /**
   * SaleTransaction findUnique
   */
  export type SaleTransactionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SaleTransaction
     */
    select?: SaleTransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SaleTransaction
     */
    omit?: SaleTransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SaleTransactionInclude<ExtArgs> | null
    /**
     * Filter, which SaleTransaction to fetch.
     */
    where: SaleTransactionWhereUniqueInput
  }

  /**
   * SaleTransaction findUniqueOrThrow
   */
  export type SaleTransactionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SaleTransaction
     */
    select?: SaleTransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SaleTransaction
     */
    omit?: SaleTransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SaleTransactionInclude<ExtArgs> | null
    /**
     * Filter, which SaleTransaction to fetch.
     */
    where: SaleTransactionWhereUniqueInput
  }

  /**
   * SaleTransaction findFirst
   */
  export type SaleTransactionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SaleTransaction
     */
    select?: SaleTransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SaleTransaction
     */
    omit?: SaleTransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SaleTransactionInclude<ExtArgs> | null
    /**
     * Filter, which SaleTransaction to fetch.
     */
    where?: SaleTransactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SaleTransactions to fetch.
     */
    orderBy?: SaleTransactionOrderByWithRelationInput | SaleTransactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SaleTransactions.
     */
    cursor?: SaleTransactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SaleTransactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SaleTransactions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SaleTransactions.
     */
    distinct?: SaleTransactionScalarFieldEnum | SaleTransactionScalarFieldEnum[]
  }

  /**
   * SaleTransaction findFirstOrThrow
   */
  export type SaleTransactionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SaleTransaction
     */
    select?: SaleTransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SaleTransaction
     */
    omit?: SaleTransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SaleTransactionInclude<ExtArgs> | null
    /**
     * Filter, which SaleTransaction to fetch.
     */
    where?: SaleTransactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SaleTransactions to fetch.
     */
    orderBy?: SaleTransactionOrderByWithRelationInput | SaleTransactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SaleTransactions.
     */
    cursor?: SaleTransactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SaleTransactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SaleTransactions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SaleTransactions.
     */
    distinct?: SaleTransactionScalarFieldEnum | SaleTransactionScalarFieldEnum[]
  }

  /**
   * SaleTransaction findMany
   */
  export type SaleTransactionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SaleTransaction
     */
    select?: SaleTransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SaleTransaction
     */
    omit?: SaleTransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SaleTransactionInclude<ExtArgs> | null
    /**
     * Filter, which SaleTransactions to fetch.
     */
    where?: SaleTransactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SaleTransactions to fetch.
     */
    orderBy?: SaleTransactionOrderByWithRelationInput | SaleTransactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SaleTransactions.
     */
    cursor?: SaleTransactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SaleTransactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SaleTransactions.
     */
    skip?: number
    distinct?: SaleTransactionScalarFieldEnum | SaleTransactionScalarFieldEnum[]
  }

  /**
   * SaleTransaction create
   */
  export type SaleTransactionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SaleTransaction
     */
    select?: SaleTransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SaleTransaction
     */
    omit?: SaleTransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SaleTransactionInclude<ExtArgs> | null
    /**
     * The data needed to create a SaleTransaction.
     */
    data: XOR<SaleTransactionCreateInput, SaleTransactionUncheckedCreateInput>
  }

  /**
   * SaleTransaction createMany
   */
  export type SaleTransactionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SaleTransactions.
     */
    data: SaleTransactionCreateManyInput | SaleTransactionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SaleTransaction createManyAndReturn
   */
  export type SaleTransactionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SaleTransaction
     */
    select?: SaleTransactionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SaleTransaction
     */
    omit?: SaleTransactionOmit<ExtArgs> | null
    /**
     * The data used to create many SaleTransactions.
     */
    data: SaleTransactionCreateManyInput | SaleTransactionCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SaleTransactionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * SaleTransaction update
   */
  export type SaleTransactionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SaleTransaction
     */
    select?: SaleTransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SaleTransaction
     */
    omit?: SaleTransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SaleTransactionInclude<ExtArgs> | null
    /**
     * The data needed to update a SaleTransaction.
     */
    data: XOR<SaleTransactionUpdateInput, SaleTransactionUncheckedUpdateInput>
    /**
     * Choose, which SaleTransaction to update.
     */
    where: SaleTransactionWhereUniqueInput
  }

  /**
   * SaleTransaction updateMany
   */
  export type SaleTransactionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SaleTransactions.
     */
    data: XOR<SaleTransactionUpdateManyMutationInput, SaleTransactionUncheckedUpdateManyInput>
    /**
     * Filter which SaleTransactions to update
     */
    where?: SaleTransactionWhereInput
    /**
     * Limit how many SaleTransactions to update.
     */
    limit?: number
  }

  /**
   * SaleTransaction updateManyAndReturn
   */
  export type SaleTransactionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SaleTransaction
     */
    select?: SaleTransactionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SaleTransaction
     */
    omit?: SaleTransactionOmit<ExtArgs> | null
    /**
     * The data used to update SaleTransactions.
     */
    data: XOR<SaleTransactionUpdateManyMutationInput, SaleTransactionUncheckedUpdateManyInput>
    /**
     * Filter which SaleTransactions to update
     */
    where?: SaleTransactionWhereInput
    /**
     * Limit how many SaleTransactions to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SaleTransactionIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * SaleTransaction upsert
   */
  export type SaleTransactionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SaleTransaction
     */
    select?: SaleTransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SaleTransaction
     */
    omit?: SaleTransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SaleTransactionInclude<ExtArgs> | null
    /**
     * The filter to search for the SaleTransaction to update in case it exists.
     */
    where: SaleTransactionWhereUniqueInput
    /**
     * In case the SaleTransaction found by the `where` argument doesn't exist, create a new SaleTransaction with this data.
     */
    create: XOR<SaleTransactionCreateInput, SaleTransactionUncheckedCreateInput>
    /**
     * In case the SaleTransaction was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SaleTransactionUpdateInput, SaleTransactionUncheckedUpdateInput>
  }

  /**
   * SaleTransaction delete
   */
  export type SaleTransactionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SaleTransaction
     */
    select?: SaleTransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SaleTransaction
     */
    omit?: SaleTransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SaleTransactionInclude<ExtArgs> | null
    /**
     * Filter which SaleTransaction to delete.
     */
    where: SaleTransactionWhereUniqueInput
  }

  /**
   * SaleTransaction deleteMany
   */
  export type SaleTransactionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SaleTransactions to delete
     */
    where?: SaleTransactionWhereInput
    /**
     * Limit how many SaleTransactions to delete.
     */
    limit?: number
  }

  /**
   * SaleTransaction without action
   */
  export type SaleTransactionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SaleTransaction
     */
    select?: SaleTransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SaleTransaction
     */
    omit?: SaleTransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SaleTransactionInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const CategoryScalarFieldEnum: {
    id: 'id',
    name: 'name',
    description: 'description',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type CategoryScalarFieldEnum = (typeof CategoryScalarFieldEnum)[keyof typeof CategoryScalarFieldEnum]


  export const InventoryItemScalarFieldEnum: {
    id: 'id',
    quantity: 'quantity',
    minStockLevel: 'minStockLevel',
    location: 'location',
    lastUpdated: 'lastUpdated',
    active: 'active',
    categoryId: 'categoryId',
    cost: 'cost',
    createdAt: 'createdAt',
    description: 'description',
    imageUrl: 'imageUrl',
    margin: 'margin',
    name: 'name',
    price: 'price',
    sku: 'sku',
    updatedAt: 'updatedAt'
  };

  export type InventoryItemScalarFieldEnum = (typeof InventoryItemScalarFieldEnum)[keyof typeof InventoryItemScalarFieldEnum]


  export const StockMovementScalarFieldEnum: {
    id: 'id',
    inventoryItemId: 'inventoryItemId',
    quantity: 'quantity',
    type: 'type',
    date: 'date',
    notes: 'notes',
    createdBy: 'createdBy'
  };

  export type StockMovementScalarFieldEnum = (typeof StockMovementScalarFieldEnum)[keyof typeof StockMovementScalarFieldEnum]


  export const SaleScalarFieldEnum: {
    id: 'id',
    date: 'date',
    total: 'total',
    subtotal: 'subtotal',
    tax: 'tax',
    status: 'status',
    notes: 'notes',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type SaleScalarFieldEnum = (typeof SaleScalarFieldEnum)[keyof typeof SaleScalarFieldEnum]


  export const SaleTransactionScalarFieldEnum: {
    id: 'id',
    saleId: 'saleId',
    quantity: 'quantity',
    unitPrice: 'unitPrice',
    subtotal: 'subtotal',
    createdAt: 'createdAt',
    inventoryItemId: 'inventoryItemId'
  };

  export type SaleTransactionScalarFieldEnum = (typeof SaleTransactionScalarFieldEnum)[keyof typeof SaleTransactionScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Decimal'
   */
  export type DecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal'>
    


  /**
   * Reference to a field of type 'Decimal[]'
   */
  export type ListDecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal[]'>
    


  /**
   * Reference to a field of type 'MovementType'
   */
  export type EnumMovementTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'MovementType'>
    


  /**
   * Reference to a field of type 'MovementType[]'
   */
  export type ListEnumMovementTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'MovementType[]'>
    


  /**
   * Reference to a field of type 'SaleStatus'
   */
  export type EnumSaleStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SaleStatus'>
    


  /**
   * Reference to a field of type 'SaleStatus[]'
   */
  export type ListEnumSaleStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SaleStatus[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type CategoryWhereInput = {
    AND?: CategoryWhereInput | CategoryWhereInput[]
    OR?: CategoryWhereInput[]
    NOT?: CategoryWhereInput | CategoryWhereInput[]
    id?: StringFilter<"Category"> | string
    name?: StringFilter<"Category"> | string
    description?: StringNullableFilter<"Category"> | string | null
    createdAt?: DateTimeFilter<"Category"> | Date | string
    updatedAt?: DateTimeFilter<"Category"> | Date | string
    inventory?: InventoryItemListRelationFilter
  }

  export type CategoryOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    inventory?: InventoryItemOrderByRelationAggregateInput
  }

  export type CategoryWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: CategoryWhereInput | CategoryWhereInput[]
    OR?: CategoryWhereInput[]
    NOT?: CategoryWhereInput | CategoryWhereInput[]
    name?: StringFilter<"Category"> | string
    description?: StringNullableFilter<"Category"> | string | null
    createdAt?: DateTimeFilter<"Category"> | Date | string
    updatedAt?: DateTimeFilter<"Category"> | Date | string
    inventory?: InventoryItemListRelationFilter
  }, "id">

  export type CategoryOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: CategoryCountOrderByAggregateInput
    _max?: CategoryMaxOrderByAggregateInput
    _min?: CategoryMinOrderByAggregateInput
  }

  export type CategoryScalarWhereWithAggregatesInput = {
    AND?: CategoryScalarWhereWithAggregatesInput | CategoryScalarWhereWithAggregatesInput[]
    OR?: CategoryScalarWhereWithAggregatesInput[]
    NOT?: CategoryScalarWhereWithAggregatesInput | CategoryScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Category"> | string
    name?: StringWithAggregatesFilter<"Category"> | string
    description?: StringNullableWithAggregatesFilter<"Category"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Category"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Category"> | Date | string
  }

  export type InventoryItemWhereInput = {
    AND?: InventoryItemWhereInput | InventoryItemWhereInput[]
    OR?: InventoryItemWhereInput[]
    NOT?: InventoryItemWhereInput | InventoryItemWhereInput[]
    id?: StringFilter<"InventoryItem"> | string
    quantity?: IntFilter<"InventoryItem"> | number
    minStockLevel?: IntFilter<"InventoryItem"> | number
    location?: StringNullableFilter<"InventoryItem"> | string | null
    lastUpdated?: DateTimeFilter<"InventoryItem"> | Date | string
    active?: BoolFilter<"InventoryItem"> | boolean
    categoryId?: StringNullableFilter<"InventoryItem"> | string | null
    cost?: DecimalFilter<"InventoryItem"> | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFilter<"InventoryItem"> | Date | string
    description?: StringNullableFilter<"InventoryItem"> | string | null
    imageUrl?: StringNullableFilter<"InventoryItem"> | string | null
    margin?: DecimalFilter<"InventoryItem"> | Decimal | DecimalJsLike | number | string
    name?: StringFilter<"InventoryItem"> | string
    price?: DecimalFilter<"InventoryItem"> | Decimal | DecimalJsLike | number | string
    sku?: StringFilter<"InventoryItem"> | string
    updatedAt?: DateTimeFilter<"InventoryItem"> | Date | string
    category?: XOR<CategoryNullableScalarRelationFilter, CategoryWhereInput> | null
    transactions?: SaleTransactionListRelationFilter
    stockMovements?: StockMovementListRelationFilter
  }

  export type InventoryItemOrderByWithRelationInput = {
    id?: SortOrder
    quantity?: SortOrder
    minStockLevel?: SortOrder
    location?: SortOrderInput | SortOrder
    lastUpdated?: SortOrder
    active?: SortOrder
    categoryId?: SortOrderInput | SortOrder
    cost?: SortOrder
    createdAt?: SortOrder
    description?: SortOrderInput | SortOrder
    imageUrl?: SortOrderInput | SortOrder
    margin?: SortOrder
    name?: SortOrder
    price?: SortOrder
    sku?: SortOrder
    updatedAt?: SortOrder
    category?: CategoryOrderByWithRelationInput
    transactions?: SaleTransactionOrderByRelationAggregateInput
    stockMovements?: StockMovementOrderByRelationAggregateInput
  }

  export type InventoryItemWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    sku?: string
    AND?: InventoryItemWhereInput | InventoryItemWhereInput[]
    OR?: InventoryItemWhereInput[]
    NOT?: InventoryItemWhereInput | InventoryItemWhereInput[]
    quantity?: IntFilter<"InventoryItem"> | number
    minStockLevel?: IntFilter<"InventoryItem"> | number
    location?: StringNullableFilter<"InventoryItem"> | string | null
    lastUpdated?: DateTimeFilter<"InventoryItem"> | Date | string
    active?: BoolFilter<"InventoryItem"> | boolean
    categoryId?: StringNullableFilter<"InventoryItem"> | string | null
    cost?: DecimalFilter<"InventoryItem"> | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFilter<"InventoryItem"> | Date | string
    description?: StringNullableFilter<"InventoryItem"> | string | null
    imageUrl?: StringNullableFilter<"InventoryItem"> | string | null
    margin?: DecimalFilter<"InventoryItem"> | Decimal | DecimalJsLike | number | string
    name?: StringFilter<"InventoryItem"> | string
    price?: DecimalFilter<"InventoryItem"> | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeFilter<"InventoryItem"> | Date | string
    category?: XOR<CategoryNullableScalarRelationFilter, CategoryWhereInput> | null
    transactions?: SaleTransactionListRelationFilter
    stockMovements?: StockMovementListRelationFilter
  }, "id" | "sku">

  export type InventoryItemOrderByWithAggregationInput = {
    id?: SortOrder
    quantity?: SortOrder
    minStockLevel?: SortOrder
    location?: SortOrderInput | SortOrder
    lastUpdated?: SortOrder
    active?: SortOrder
    categoryId?: SortOrderInput | SortOrder
    cost?: SortOrder
    createdAt?: SortOrder
    description?: SortOrderInput | SortOrder
    imageUrl?: SortOrderInput | SortOrder
    margin?: SortOrder
    name?: SortOrder
    price?: SortOrder
    sku?: SortOrder
    updatedAt?: SortOrder
    _count?: InventoryItemCountOrderByAggregateInput
    _avg?: InventoryItemAvgOrderByAggregateInput
    _max?: InventoryItemMaxOrderByAggregateInput
    _min?: InventoryItemMinOrderByAggregateInput
    _sum?: InventoryItemSumOrderByAggregateInput
  }

  export type InventoryItemScalarWhereWithAggregatesInput = {
    AND?: InventoryItemScalarWhereWithAggregatesInput | InventoryItemScalarWhereWithAggregatesInput[]
    OR?: InventoryItemScalarWhereWithAggregatesInput[]
    NOT?: InventoryItemScalarWhereWithAggregatesInput | InventoryItemScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"InventoryItem"> | string
    quantity?: IntWithAggregatesFilter<"InventoryItem"> | number
    minStockLevel?: IntWithAggregatesFilter<"InventoryItem"> | number
    location?: StringNullableWithAggregatesFilter<"InventoryItem"> | string | null
    lastUpdated?: DateTimeWithAggregatesFilter<"InventoryItem"> | Date | string
    active?: BoolWithAggregatesFilter<"InventoryItem"> | boolean
    categoryId?: StringNullableWithAggregatesFilter<"InventoryItem"> | string | null
    cost?: DecimalWithAggregatesFilter<"InventoryItem"> | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeWithAggregatesFilter<"InventoryItem"> | Date | string
    description?: StringNullableWithAggregatesFilter<"InventoryItem"> | string | null
    imageUrl?: StringNullableWithAggregatesFilter<"InventoryItem"> | string | null
    margin?: DecimalWithAggregatesFilter<"InventoryItem"> | Decimal | DecimalJsLike | number | string
    name?: StringWithAggregatesFilter<"InventoryItem"> | string
    price?: DecimalWithAggregatesFilter<"InventoryItem"> | Decimal | DecimalJsLike | number | string
    sku?: StringWithAggregatesFilter<"InventoryItem"> | string
    updatedAt?: DateTimeWithAggregatesFilter<"InventoryItem"> | Date | string
  }

  export type StockMovementWhereInput = {
    AND?: StockMovementWhereInput | StockMovementWhereInput[]
    OR?: StockMovementWhereInput[]
    NOT?: StockMovementWhereInput | StockMovementWhereInput[]
    id?: StringFilter<"StockMovement"> | string
    inventoryItemId?: StringFilter<"StockMovement"> | string
    quantity?: IntFilter<"StockMovement"> | number
    type?: EnumMovementTypeFilter<"StockMovement"> | $Enums.MovementType
    date?: DateTimeFilter<"StockMovement"> | Date | string
    notes?: StringNullableFilter<"StockMovement"> | string | null
    createdBy?: StringNullableFilter<"StockMovement"> | string | null
    inventoryItem?: XOR<InventoryItemScalarRelationFilter, InventoryItemWhereInput>
  }

  export type StockMovementOrderByWithRelationInput = {
    id?: SortOrder
    inventoryItemId?: SortOrder
    quantity?: SortOrder
    type?: SortOrder
    date?: SortOrder
    notes?: SortOrderInput | SortOrder
    createdBy?: SortOrderInput | SortOrder
    inventoryItem?: InventoryItemOrderByWithRelationInput
  }

  export type StockMovementWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: StockMovementWhereInput | StockMovementWhereInput[]
    OR?: StockMovementWhereInput[]
    NOT?: StockMovementWhereInput | StockMovementWhereInput[]
    inventoryItemId?: StringFilter<"StockMovement"> | string
    quantity?: IntFilter<"StockMovement"> | number
    type?: EnumMovementTypeFilter<"StockMovement"> | $Enums.MovementType
    date?: DateTimeFilter<"StockMovement"> | Date | string
    notes?: StringNullableFilter<"StockMovement"> | string | null
    createdBy?: StringNullableFilter<"StockMovement"> | string | null
    inventoryItem?: XOR<InventoryItemScalarRelationFilter, InventoryItemWhereInput>
  }, "id">

  export type StockMovementOrderByWithAggregationInput = {
    id?: SortOrder
    inventoryItemId?: SortOrder
    quantity?: SortOrder
    type?: SortOrder
    date?: SortOrder
    notes?: SortOrderInput | SortOrder
    createdBy?: SortOrderInput | SortOrder
    _count?: StockMovementCountOrderByAggregateInput
    _avg?: StockMovementAvgOrderByAggregateInput
    _max?: StockMovementMaxOrderByAggregateInput
    _min?: StockMovementMinOrderByAggregateInput
    _sum?: StockMovementSumOrderByAggregateInput
  }

  export type StockMovementScalarWhereWithAggregatesInput = {
    AND?: StockMovementScalarWhereWithAggregatesInput | StockMovementScalarWhereWithAggregatesInput[]
    OR?: StockMovementScalarWhereWithAggregatesInput[]
    NOT?: StockMovementScalarWhereWithAggregatesInput | StockMovementScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"StockMovement"> | string
    inventoryItemId?: StringWithAggregatesFilter<"StockMovement"> | string
    quantity?: IntWithAggregatesFilter<"StockMovement"> | number
    type?: EnumMovementTypeWithAggregatesFilter<"StockMovement"> | $Enums.MovementType
    date?: DateTimeWithAggregatesFilter<"StockMovement"> | Date | string
    notes?: StringNullableWithAggregatesFilter<"StockMovement"> | string | null
    createdBy?: StringNullableWithAggregatesFilter<"StockMovement"> | string | null
  }

  export type SaleWhereInput = {
    AND?: SaleWhereInput | SaleWhereInput[]
    OR?: SaleWhereInput[]
    NOT?: SaleWhereInput | SaleWhereInput[]
    id?: StringFilter<"Sale"> | string
    date?: DateTimeFilter<"Sale"> | Date | string
    total?: DecimalFilter<"Sale"> | Decimal | DecimalJsLike | number | string
    subtotal?: DecimalFilter<"Sale"> | Decimal | DecimalJsLike | number | string
    tax?: DecimalFilter<"Sale"> | Decimal | DecimalJsLike | number | string
    status?: EnumSaleStatusFilter<"Sale"> | $Enums.SaleStatus
    notes?: StringNullableFilter<"Sale"> | string | null
    createdAt?: DateTimeFilter<"Sale"> | Date | string
    updatedAt?: DateTimeFilter<"Sale"> | Date | string
    transactions?: SaleTransactionListRelationFilter
  }

  export type SaleOrderByWithRelationInput = {
    id?: SortOrder
    date?: SortOrder
    total?: SortOrder
    subtotal?: SortOrder
    tax?: SortOrder
    status?: SortOrder
    notes?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    transactions?: SaleTransactionOrderByRelationAggregateInput
  }

  export type SaleWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: SaleWhereInput | SaleWhereInput[]
    OR?: SaleWhereInput[]
    NOT?: SaleWhereInput | SaleWhereInput[]
    date?: DateTimeFilter<"Sale"> | Date | string
    total?: DecimalFilter<"Sale"> | Decimal | DecimalJsLike | number | string
    subtotal?: DecimalFilter<"Sale"> | Decimal | DecimalJsLike | number | string
    tax?: DecimalFilter<"Sale"> | Decimal | DecimalJsLike | number | string
    status?: EnumSaleStatusFilter<"Sale"> | $Enums.SaleStatus
    notes?: StringNullableFilter<"Sale"> | string | null
    createdAt?: DateTimeFilter<"Sale"> | Date | string
    updatedAt?: DateTimeFilter<"Sale"> | Date | string
    transactions?: SaleTransactionListRelationFilter
  }, "id">

  export type SaleOrderByWithAggregationInput = {
    id?: SortOrder
    date?: SortOrder
    total?: SortOrder
    subtotal?: SortOrder
    tax?: SortOrder
    status?: SortOrder
    notes?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: SaleCountOrderByAggregateInput
    _avg?: SaleAvgOrderByAggregateInput
    _max?: SaleMaxOrderByAggregateInput
    _min?: SaleMinOrderByAggregateInput
    _sum?: SaleSumOrderByAggregateInput
  }

  export type SaleScalarWhereWithAggregatesInput = {
    AND?: SaleScalarWhereWithAggregatesInput | SaleScalarWhereWithAggregatesInput[]
    OR?: SaleScalarWhereWithAggregatesInput[]
    NOT?: SaleScalarWhereWithAggregatesInput | SaleScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Sale"> | string
    date?: DateTimeWithAggregatesFilter<"Sale"> | Date | string
    total?: DecimalWithAggregatesFilter<"Sale"> | Decimal | DecimalJsLike | number | string
    subtotal?: DecimalWithAggregatesFilter<"Sale"> | Decimal | DecimalJsLike | number | string
    tax?: DecimalWithAggregatesFilter<"Sale"> | Decimal | DecimalJsLike | number | string
    status?: EnumSaleStatusWithAggregatesFilter<"Sale"> | $Enums.SaleStatus
    notes?: StringNullableWithAggregatesFilter<"Sale"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Sale"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Sale"> | Date | string
  }

  export type SaleTransactionWhereInput = {
    AND?: SaleTransactionWhereInput | SaleTransactionWhereInput[]
    OR?: SaleTransactionWhereInput[]
    NOT?: SaleTransactionWhereInput | SaleTransactionWhereInput[]
    id?: StringFilter<"SaleTransaction"> | string
    saleId?: StringFilter<"SaleTransaction"> | string
    quantity?: IntFilter<"SaleTransaction"> | number
    unitPrice?: DecimalFilter<"SaleTransaction"> | Decimal | DecimalJsLike | number | string
    subtotal?: DecimalFilter<"SaleTransaction"> | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFilter<"SaleTransaction"> | Date | string
    inventoryItemId?: StringFilter<"SaleTransaction"> | string
    inventoryItem?: XOR<InventoryItemScalarRelationFilter, InventoryItemWhereInput>
    sale?: XOR<SaleScalarRelationFilter, SaleWhereInput>
  }

  export type SaleTransactionOrderByWithRelationInput = {
    id?: SortOrder
    saleId?: SortOrder
    quantity?: SortOrder
    unitPrice?: SortOrder
    subtotal?: SortOrder
    createdAt?: SortOrder
    inventoryItemId?: SortOrder
    inventoryItem?: InventoryItemOrderByWithRelationInput
    sale?: SaleOrderByWithRelationInput
  }

  export type SaleTransactionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: SaleTransactionWhereInput | SaleTransactionWhereInput[]
    OR?: SaleTransactionWhereInput[]
    NOT?: SaleTransactionWhereInput | SaleTransactionWhereInput[]
    saleId?: StringFilter<"SaleTransaction"> | string
    quantity?: IntFilter<"SaleTransaction"> | number
    unitPrice?: DecimalFilter<"SaleTransaction"> | Decimal | DecimalJsLike | number | string
    subtotal?: DecimalFilter<"SaleTransaction"> | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFilter<"SaleTransaction"> | Date | string
    inventoryItemId?: StringFilter<"SaleTransaction"> | string
    inventoryItem?: XOR<InventoryItemScalarRelationFilter, InventoryItemWhereInput>
    sale?: XOR<SaleScalarRelationFilter, SaleWhereInput>
  }, "id">

  export type SaleTransactionOrderByWithAggregationInput = {
    id?: SortOrder
    saleId?: SortOrder
    quantity?: SortOrder
    unitPrice?: SortOrder
    subtotal?: SortOrder
    createdAt?: SortOrder
    inventoryItemId?: SortOrder
    _count?: SaleTransactionCountOrderByAggregateInput
    _avg?: SaleTransactionAvgOrderByAggregateInput
    _max?: SaleTransactionMaxOrderByAggregateInput
    _min?: SaleTransactionMinOrderByAggregateInput
    _sum?: SaleTransactionSumOrderByAggregateInput
  }

  export type SaleTransactionScalarWhereWithAggregatesInput = {
    AND?: SaleTransactionScalarWhereWithAggregatesInput | SaleTransactionScalarWhereWithAggregatesInput[]
    OR?: SaleTransactionScalarWhereWithAggregatesInput[]
    NOT?: SaleTransactionScalarWhereWithAggregatesInput | SaleTransactionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"SaleTransaction"> | string
    saleId?: StringWithAggregatesFilter<"SaleTransaction"> | string
    quantity?: IntWithAggregatesFilter<"SaleTransaction"> | number
    unitPrice?: DecimalWithAggregatesFilter<"SaleTransaction"> | Decimal | DecimalJsLike | number | string
    subtotal?: DecimalWithAggregatesFilter<"SaleTransaction"> | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeWithAggregatesFilter<"SaleTransaction"> | Date | string
    inventoryItemId?: StringWithAggregatesFilter<"SaleTransaction"> | string
  }

  export type CategoryCreateInput = {
    id?: string
    name: string
    description?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    inventory?: InventoryItemCreateNestedManyWithoutCategoryInput
  }

  export type CategoryUncheckedCreateInput = {
    id?: string
    name: string
    description?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    inventory?: InventoryItemUncheckedCreateNestedManyWithoutCategoryInput
  }

  export type CategoryUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    inventory?: InventoryItemUpdateManyWithoutCategoryNestedInput
  }

  export type CategoryUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    inventory?: InventoryItemUncheckedUpdateManyWithoutCategoryNestedInput
  }

  export type CategoryCreateManyInput = {
    id?: string
    name: string
    description?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CategoryUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CategoryUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InventoryItemCreateInput = {
    id?: string
    quantity?: number
    minStockLevel?: number
    location?: string | null
    lastUpdated?: Date | string
    active?: boolean
    cost?: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    description?: string | null
    imageUrl?: string | null
    margin?: Decimal | DecimalJsLike | number | string
    name: string
    price: Decimal | DecimalJsLike | number | string
    sku: string
    updatedAt?: Date | string
    category?: CategoryCreateNestedOneWithoutInventoryInput
    transactions?: SaleTransactionCreateNestedManyWithoutInventoryItemInput
    stockMovements?: StockMovementCreateNestedManyWithoutInventoryItemInput
  }

  export type InventoryItemUncheckedCreateInput = {
    id?: string
    quantity?: number
    minStockLevel?: number
    location?: string | null
    lastUpdated?: Date | string
    active?: boolean
    categoryId?: string | null
    cost?: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    description?: string | null
    imageUrl?: string | null
    margin?: Decimal | DecimalJsLike | number | string
    name: string
    price: Decimal | DecimalJsLike | number | string
    sku: string
    updatedAt?: Date | string
    transactions?: SaleTransactionUncheckedCreateNestedManyWithoutInventoryItemInput
    stockMovements?: StockMovementUncheckedCreateNestedManyWithoutInventoryItemInput
  }

  export type InventoryItemUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    minStockLevel?: IntFieldUpdateOperationsInput | number
    location?: NullableStringFieldUpdateOperationsInput | string | null
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    active?: BoolFieldUpdateOperationsInput | boolean
    cost?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    margin?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    name?: StringFieldUpdateOperationsInput | string
    price?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    sku?: StringFieldUpdateOperationsInput | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    category?: CategoryUpdateOneWithoutInventoryNestedInput
    transactions?: SaleTransactionUpdateManyWithoutInventoryItemNestedInput
    stockMovements?: StockMovementUpdateManyWithoutInventoryItemNestedInput
  }

  export type InventoryItemUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    minStockLevel?: IntFieldUpdateOperationsInput | number
    location?: NullableStringFieldUpdateOperationsInput | string | null
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    active?: BoolFieldUpdateOperationsInput | boolean
    categoryId?: NullableStringFieldUpdateOperationsInput | string | null
    cost?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    margin?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    name?: StringFieldUpdateOperationsInput | string
    price?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    sku?: StringFieldUpdateOperationsInput | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    transactions?: SaleTransactionUncheckedUpdateManyWithoutInventoryItemNestedInput
    stockMovements?: StockMovementUncheckedUpdateManyWithoutInventoryItemNestedInput
  }

  export type InventoryItemCreateManyInput = {
    id?: string
    quantity?: number
    minStockLevel?: number
    location?: string | null
    lastUpdated?: Date | string
    active?: boolean
    categoryId?: string | null
    cost?: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    description?: string | null
    imageUrl?: string | null
    margin?: Decimal | DecimalJsLike | number | string
    name: string
    price: Decimal | DecimalJsLike | number | string
    sku: string
    updatedAt?: Date | string
  }

  export type InventoryItemUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    minStockLevel?: IntFieldUpdateOperationsInput | number
    location?: NullableStringFieldUpdateOperationsInput | string | null
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    active?: BoolFieldUpdateOperationsInput | boolean
    cost?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    margin?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    name?: StringFieldUpdateOperationsInput | string
    price?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    sku?: StringFieldUpdateOperationsInput | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InventoryItemUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    minStockLevel?: IntFieldUpdateOperationsInput | number
    location?: NullableStringFieldUpdateOperationsInput | string | null
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    active?: BoolFieldUpdateOperationsInput | boolean
    categoryId?: NullableStringFieldUpdateOperationsInput | string | null
    cost?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    margin?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    name?: StringFieldUpdateOperationsInput | string
    price?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    sku?: StringFieldUpdateOperationsInput | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StockMovementCreateInput = {
    id?: string
    quantity: number
    type: $Enums.MovementType
    date?: Date | string
    notes?: string | null
    createdBy?: string | null
    inventoryItem: InventoryItemCreateNestedOneWithoutStockMovementsInput
  }

  export type StockMovementUncheckedCreateInput = {
    id?: string
    inventoryItemId: string
    quantity: number
    type: $Enums.MovementType
    date?: Date | string
    notes?: string | null
    createdBy?: string | null
  }

  export type StockMovementUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    type?: EnumMovementTypeFieldUpdateOperationsInput | $Enums.MovementType
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    inventoryItem?: InventoryItemUpdateOneRequiredWithoutStockMovementsNestedInput
  }

  export type StockMovementUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    inventoryItemId?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    type?: EnumMovementTypeFieldUpdateOperationsInput | $Enums.MovementType
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type StockMovementCreateManyInput = {
    id?: string
    inventoryItemId: string
    quantity: number
    type: $Enums.MovementType
    date?: Date | string
    notes?: string | null
    createdBy?: string | null
  }

  export type StockMovementUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    type?: EnumMovementTypeFieldUpdateOperationsInput | $Enums.MovementType
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type StockMovementUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    inventoryItemId?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    type?: EnumMovementTypeFieldUpdateOperationsInput | $Enums.MovementType
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type SaleCreateInput = {
    id?: string
    date?: Date | string
    total: Decimal | DecimalJsLike | number | string
    subtotal: Decimal | DecimalJsLike | number | string
    tax: Decimal | DecimalJsLike | number | string
    status?: $Enums.SaleStatus
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    transactions?: SaleTransactionCreateNestedManyWithoutSaleInput
  }

  export type SaleUncheckedCreateInput = {
    id?: string
    date?: Date | string
    total: Decimal | DecimalJsLike | number | string
    subtotal: Decimal | DecimalJsLike | number | string
    tax: Decimal | DecimalJsLike | number | string
    status?: $Enums.SaleStatus
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    transactions?: SaleTransactionUncheckedCreateNestedManyWithoutSaleInput
  }

  export type SaleUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    total?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    tax?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    status?: EnumSaleStatusFieldUpdateOperationsInput | $Enums.SaleStatus
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    transactions?: SaleTransactionUpdateManyWithoutSaleNestedInput
  }

  export type SaleUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    total?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    tax?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    status?: EnumSaleStatusFieldUpdateOperationsInput | $Enums.SaleStatus
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    transactions?: SaleTransactionUncheckedUpdateManyWithoutSaleNestedInput
  }

  export type SaleCreateManyInput = {
    id?: string
    date?: Date | string
    total: Decimal | DecimalJsLike | number | string
    subtotal: Decimal | DecimalJsLike | number | string
    tax: Decimal | DecimalJsLike | number | string
    status?: $Enums.SaleStatus
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SaleUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    total?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    tax?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    status?: EnumSaleStatusFieldUpdateOperationsInput | $Enums.SaleStatus
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SaleUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    total?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    tax?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    status?: EnumSaleStatusFieldUpdateOperationsInput | $Enums.SaleStatus
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SaleTransactionCreateInput = {
    id?: string
    quantity: number
    unitPrice: Decimal | DecimalJsLike | number | string
    subtotal: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    inventoryItem: InventoryItemCreateNestedOneWithoutTransactionsInput
    sale: SaleCreateNestedOneWithoutTransactionsInput
  }

  export type SaleTransactionUncheckedCreateInput = {
    id?: string
    saleId: string
    quantity: number
    unitPrice: Decimal | DecimalJsLike | number | string
    subtotal: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    inventoryItemId: string
  }

  export type SaleTransactionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    unitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    inventoryItem?: InventoryItemUpdateOneRequiredWithoutTransactionsNestedInput
    sale?: SaleUpdateOneRequiredWithoutTransactionsNestedInput
  }

  export type SaleTransactionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    saleId?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    unitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    inventoryItemId?: StringFieldUpdateOperationsInput | string
  }

  export type SaleTransactionCreateManyInput = {
    id?: string
    saleId: string
    quantity: number
    unitPrice: Decimal | DecimalJsLike | number | string
    subtotal: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    inventoryItemId: string
  }

  export type SaleTransactionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    unitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SaleTransactionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    saleId?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    unitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    inventoryItemId?: StringFieldUpdateOperationsInput | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type InventoryItemListRelationFilter = {
    every?: InventoryItemWhereInput
    some?: InventoryItemWhereInput
    none?: InventoryItemWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type InventoryItemOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type CategoryCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CategoryMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CategoryMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type DecimalFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
  }

  export type CategoryNullableScalarRelationFilter = {
    is?: CategoryWhereInput | null
    isNot?: CategoryWhereInput | null
  }

  export type SaleTransactionListRelationFilter = {
    every?: SaleTransactionWhereInput
    some?: SaleTransactionWhereInput
    none?: SaleTransactionWhereInput
  }

  export type StockMovementListRelationFilter = {
    every?: StockMovementWhereInput
    some?: StockMovementWhereInput
    none?: StockMovementWhereInput
  }

  export type SaleTransactionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type StockMovementOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type InventoryItemCountOrderByAggregateInput = {
    id?: SortOrder
    quantity?: SortOrder
    minStockLevel?: SortOrder
    location?: SortOrder
    lastUpdated?: SortOrder
    active?: SortOrder
    categoryId?: SortOrder
    cost?: SortOrder
    createdAt?: SortOrder
    description?: SortOrder
    imageUrl?: SortOrder
    margin?: SortOrder
    name?: SortOrder
    price?: SortOrder
    sku?: SortOrder
    updatedAt?: SortOrder
  }

  export type InventoryItemAvgOrderByAggregateInput = {
    quantity?: SortOrder
    minStockLevel?: SortOrder
    cost?: SortOrder
    margin?: SortOrder
    price?: SortOrder
  }

  export type InventoryItemMaxOrderByAggregateInput = {
    id?: SortOrder
    quantity?: SortOrder
    minStockLevel?: SortOrder
    location?: SortOrder
    lastUpdated?: SortOrder
    active?: SortOrder
    categoryId?: SortOrder
    cost?: SortOrder
    createdAt?: SortOrder
    description?: SortOrder
    imageUrl?: SortOrder
    margin?: SortOrder
    name?: SortOrder
    price?: SortOrder
    sku?: SortOrder
    updatedAt?: SortOrder
  }

  export type InventoryItemMinOrderByAggregateInput = {
    id?: SortOrder
    quantity?: SortOrder
    minStockLevel?: SortOrder
    location?: SortOrder
    lastUpdated?: SortOrder
    active?: SortOrder
    categoryId?: SortOrder
    cost?: SortOrder
    createdAt?: SortOrder
    description?: SortOrder
    imageUrl?: SortOrder
    margin?: SortOrder
    name?: SortOrder
    price?: SortOrder
    sku?: SortOrder
    updatedAt?: SortOrder
  }

  export type InventoryItemSumOrderByAggregateInput = {
    quantity?: SortOrder
    minStockLevel?: SortOrder
    cost?: SortOrder
    margin?: SortOrder
    price?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type DecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedDecimalFilter<$PrismaModel>
    _sum?: NestedDecimalFilter<$PrismaModel>
    _min?: NestedDecimalFilter<$PrismaModel>
    _max?: NestedDecimalFilter<$PrismaModel>
  }

  export type EnumMovementTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.MovementType | EnumMovementTypeFieldRefInput<$PrismaModel>
    in?: $Enums.MovementType[] | ListEnumMovementTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.MovementType[] | ListEnumMovementTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumMovementTypeFilter<$PrismaModel> | $Enums.MovementType
  }

  export type InventoryItemScalarRelationFilter = {
    is?: InventoryItemWhereInput
    isNot?: InventoryItemWhereInput
  }

  export type StockMovementCountOrderByAggregateInput = {
    id?: SortOrder
    inventoryItemId?: SortOrder
    quantity?: SortOrder
    type?: SortOrder
    date?: SortOrder
    notes?: SortOrder
    createdBy?: SortOrder
  }

  export type StockMovementAvgOrderByAggregateInput = {
    quantity?: SortOrder
  }

  export type StockMovementMaxOrderByAggregateInput = {
    id?: SortOrder
    inventoryItemId?: SortOrder
    quantity?: SortOrder
    type?: SortOrder
    date?: SortOrder
    notes?: SortOrder
    createdBy?: SortOrder
  }

  export type StockMovementMinOrderByAggregateInput = {
    id?: SortOrder
    inventoryItemId?: SortOrder
    quantity?: SortOrder
    type?: SortOrder
    date?: SortOrder
    notes?: SortOrder
    createdBy?: SortOrder
  }

  export type StockMovementSumOrderByAggregateInput = {
    quantity?: SortOrder
  }

  export type EnumMovementTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.MovementType | EnumMovementTypeFieldRefInput<$PrismaModel>
    in?: $Enums.MovementType[] | ListEnumMovementTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.MovementType[] | ListEnumMovementTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumMovementTypeWithAggregatesFilter<$PrismaModel> | $Enums.MovementType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumMovementTypeFilter<$PrismaModel>
    _max?: NestedEnumMovementTypeFilter<$PrismaModel>
  }

  export type EnumSaleStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.SaleStatus | EnumSaleStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SaleStatus[] | ListEnumSaleStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SaleStatus[] | ListEnumSaleStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSaleStatusFilter<$PrismaModel> | $Enums.SaleStatus
  }

  export type SaleCountOrderByAggregateInput = {
    id?: SortOrder
    date?: SortOrder
    total?: SortOrder
    subtotal?: SortOrder
    tax?: SortOrder
    status?: SortOrder
    notes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SaleAvgOrderByAggregateInput = {
    total?: SortOrder
    subtotal?: SortOrder
    tax?: SortOrder
  }

  export type SaleMaxOrderByAggregateInput = {
    id?: SortOrder
    date?: SortOrder
    total?: SortOrder
    subtotal?: SortOrder
    tax?: SortOrder
    status?: SortOrder
    notes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SaleMinOrderByAggregateInput = {
    id?: SortOrder
    date?: SortOrder
    total?: SortOrder
    subtotal?: SortOrder
    tax?: SortOrder
    status?: SortOrder
    notes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SaleSumOrderByAggregateInput = {
    total?: SortOrder
    subtotal?: SortOrder
    tax?: SortOrder
  }

  export type EnumSaleStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SaleStatus | EnumSaleStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SaleStatus[] | ListEnumSaleStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SaleStatus[] | ListEnumSaleStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSaleStatusWithAggregatesFilter<$PrismaModel> | $Enums.SaleStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSaleStatusFilter<$PrismaModel>
    _max?: NestedEnumSaleStatusFilter<$PrismaModel>
  }

  export type SaleScalarRelationFilter = {
    is?: SaleWhereInput
    isNot?: SaleWhereInput
  }

  export type SaleTransactionCountOrderByAggregateInput = {
    id?: SortOrder
    saleId?: SortOrder
    quantity?: SortOrder
    unitPrice?: SortOrder
    subtotal?: SortOrder
    createdAt?: SortOrder
    inventoryItemId?: SortOrder
  }

  export type SaleTransactionAvgOrderByAggregateInput = {
    quantity?: SortOrder
    unitPrice?: SortOrder
    subtotal?: SortOrder
  }

  export type SaleTransactionMaxOrderByAggregateInput = {
    id?: SortOrder
    saleId?: SortOrder
    quantity?: SortOrder
    unitPrice?: SortOrder
    subtotal?: SortOrder
    createdAt?: SortOrder
    inventoryItemId?: SortOrder
  }

  export type SaleTransactionMinOrderByAggregateInput = {
    id?: SortOrder
    saleId?: SortOrder
    quantity?: SortOrder
    unitPrice?: SortOrder
    subtotal?: SortOrder
    createdAt?: SortOrder
    inventoryItemId?: SortOrder
  }

  export type SaleTransactionSumOrderByAggregateInput = {
    quantity?: SortOrder
    unitPrice?: SortOrder
    subtotal?: SortOrder
  }

  export type InventoryItemCreateNestedManyWithoutCategoryInput = {
    create?: XOR<InventoryItemCreateWithoutCategoryInput, InventoryItemUncheckedCreateWithoutCategoryInput> | InventoryItemCreateWithoutCategoryInput[] | InventoryItemUncheckedCreateWithoutCategoryInput[]
    connectOrCreate?: InventoryItemCreateOrConnectWithoutCategoryInput | InventoryItemCreateOrConnectWithoutCategoryInput[]
    createMany?: InventoryItemCreateManyCategoryInputEnvelope
    connect?: InventoryItemWhereUniqueInput | InventoryItemWhereUniqueInput[]
  }

  export type InventoryItemUncheckedCreateNestedManyWithoutCategoryInput = {
    create?: XOR<InventoryItemCreateWithoutCategoryInput, InventoryItemUncheckedCreateWithoutCategoryInput> | InventoryItemCreateWithoutCategoryInput[] | InventoryItemUncheckedCreateWithoutCategoryInput[]
    connectOrCreate?: InventoryItemCreateOrConnectWithoutCategoryInput | InventoryItemCreateOrConnectWithoutCategoryInput[]
    createMany?: InventoryItemCreateManyCategoryInputEnvelope
    connect?: InventoryItemWhereUniqueInput | InventoryItemWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type InventoryItemUpdateManyWithoutCategoryNestedInput = {
    create?: XOR<InventoryItemCreateWithoutCategoryInput, InventoryItemUncheckedCreateWithoutCategoryInput> | InventoryItemCreateWithoutCategoryInput[] | InventoryItemUncheckedCreateWithoutCategoryInput[]
    connectOrCreate?: InventoryItemCreateOrConnectWithoutCategoryInput | InventoryItemCreateOrConnectWithoutCategoryInput[]
    upsert?: InventoryItemUpsertWithWhereUniqueWithoutCategoryInput | InventoryItemUpsertWithWhereUniqueWithoutCategoryInput[]
    createMany?: InventoryItemCreateManyCategoryInputEnvelope
    set?: InventoryItemWhereUniqueInput | InventoryItemWhereUniqueInput[]
    disconnect?: InventoryItemWhereUniqueInput | InventoryItemWhereUniqueInput[]
    delete?: InventoryItemWhereUniqueInput | InventoryItemWhereUniqueInput[]
    connect?: InventoryItemWhereUniqueInput | InventoryItemWhereUniqueInput[]
    update?: InventoryItemUpdateWithWhereUniqueWithoutCategoryInput | InventoryItemUpdateWithWhereUniqueWithoutCategoryInput[]
    updateMany?: InventoryItemUpdateManyWithWhereWithoutCategoryInput | InventoryItemUpdateManyWithWhereWithoutCategoryInput[]
    deleteMany?: InventoryItemScalarWhereInput | InventoryItemScalarWhereInput[]
  }

  export type InventoryItemUncheckedUpdateManyWithoutCategoryNestedInput = {
    create?: XOR<InventoryItemCreateWithoutCategoryInput, InventoryItemUncheckedCreateWithoutCategoryInput> | InventoryItemCreateWithoutCategoryInput[] | InventoryItemUncheckedCreateWithoutCategoryInput[]
    connectOrCreate?: InventoryItemCreateOrConnectWithoutCategoryInput | InventoryItemCreateOrConnectWithoutCategoryInput[]
    upsert?: InventoryItemUpsertWithWhereUniqueWithoutCategoryInput | InventoryItemUpsertWithWhereUniqueWithoutCategoryInput[]
    createMany?: InventoryItemCreateManyCategoryInputEnvelope
    set?: InventoryItemWhereUniqueInput | InventoryItemWhereUniqueInput[]
    disconnect?: InventoryItemWhereUniqueInput | InventoryItemWhereUniqueInput[]
    delete?: InventoryItemWhereUniqueInput | InventoryItemWhereUniqueInput[]
    connect?: InventoryItemWhereUniqueInput | InventoryItemWhereUniqueInput[]
    update?: InventoryItemUpdateWithWhereUniqueWithoutCategoryInput | InventoryItemUpdateWithWhereUniqueWithoutCategoryInput[]
    updateMany?: InventoryItemUpdateManyWithWhereWithoutCategoryInput | InventoryItemUpdateManyWithWhereWithoutCategoryInput[]
    deleteMany?: InventoryItemScalarWhereInput | InventoryItemScalarWhereInput[]
  }

  export type CategoryCreateNestedOneWithoutInventoryInput = {
    create?: XOR<CategoryCreateWithoutInventoryInput, CategoryUncheckedCreateWithoutInventoryInput>
    connectOrCreate?: CategoryCreateOrConnectWithoutInventoryInput
    connect?: CategoryWhereUniqueInput
  }

  export type SaleTransactionCreateNestedManyWithoutInventoryItemInput = {
    create?: XOR<SaleTransactionCreateWithoutInventoryItemInput, SaleTransactionUncheckedCreateWithoutInventoryItemInput> | SaleTransactionCreateWithoutInventoryItemInput[] | SaleTransactionUncheckedCreateWithoutInventoryItemInput[]
    connectOrCreate?: SaleTransactionCreateOrConnectWithoutInventoryItemInput | SaleTransactionCreateOrConnectWithoutInventoryItemInput[]
    createMany?: SaleTransactionCreateManyInventoryItemInputEnvelope
    connect?: SaleTransactionWhereUniqueInput | SaleTransactionWhereUniqueInput[]
  }

  export type StockMovementCreateNestedManyWithoutInventoryItemInput = {
    create?: XOR<StockMovementCreateWithoutInventoryItemInput, StockMovementUncheckedCreateWithoutInventoryItemInput> | StockMovementCreateWithoutInventoryItemInput[] | StockMovementUncheckedCreateWithoutInventoryItemInput[]
    connectOrCreate?: StockMovementCreateOrConnectWithoutInventoryItemInput | StockMovementCreateOrConnectWithoutInventoryItemInput[]
    createMany?: StockMovementCreateManyInventoryItemInputEnvelope
    connect?: StockMovementWhereUniqueInput | StockMovementWhereUniqueInput[]
  }

  export type SaleTransactionUncheckedCreateNestedManyWithoutInventoryItemInput = {
    create?: XOR<SaleTransactionCreateWithoutInventoryItemInput, SaleTransactionUncheckedCreateWithoutInventoryItemInput> | SaleTransactionCreateWithoutInventoryItemInput[] | SaleTransactionUncheckedCreateWithoutInventoryItemInput[]
    connectOrCreate?: SaleTransactionCreateOrConnectWithoutInventoryItemInput | SaleTransactionCreateOrConnectWithoutInventoryItemInput[]
    createMany?: SaleTransactionCreateManyInventoryItemInputEnvelope
    connect?: SaleTransactionWhereUniqueInput | SaleTransactionWhereUniqueInput[]
  }

  export type StockMovementUncheckedCreateNestedManyWithoutInventoryItemInput = {
    create?: XOR<StockMovementCreateWithoutInventoryItemInput, StockMovementUncheckedCreateWithoutInventoryItemInput> | StockMovementCreateWithoutInventoryItemInput[] | StockMovementUncheckedCreateWithoutInventoryItemInput[]
    connectOrCreate?: StockMovementCreateOrConnectWithoutInventoryItemInput | StockMovementCreateOrConnectWithoutInventoryItemInput[]
    createMany?: StockMovementCreateManyInventoryItemInputEnvelope
    connect?: StockMovementWhereUniqueInput | StockMovementWhereUniqueInput[]
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type DecimalFieldUpdateOperationsInput = {
    set?: Decimal | DecimalJsLike | number | string
    increment?: Decimal | DecimalJsLike | number | string
    decrement?: Decimal | DecimalJsLike | number | string
    multiply?: Decimal | DecimalJsLike | number | string
    divide?: Decimal | DecimalJsLike | number | string
  }

  export type CategoryUpdateOneWithoutInventoryNestedInput = {
    create?: XOR<CategoryCreateWithoutInventoryInput, CategoryUncheckedCreateWithoutInventoryInput>
    connectOrCreate?: CategoryCreateOrConnectWithoutInventoryInput
    upsert?: CategoryUpsertWithoutInventoryInput
    disconnect?: CategoryWhereInput | boolean
    delete?: CategoryWhereInput | boolean
    connect?: CategoryWhereUniqueInput
    update?: XOR<XOR<CategoryUpdateToOneWithWhereWithoutInventoryInput, CategoryUpdateWithoutInventoryInput>, CategoryUncheckedUpdateWithoutInventoryInput>
  }

  export type SaleTransactionUpdateManyWithoutInventoryItemNestedInput = {
    create?: XOR<SaleTransactionCreateWithoutInventoryItemInput, SaleTransactionUncheckedCreateWithoutInventoryItemInput> | SaleTransactionCreateWithoutInventoryItemInput[] | SaleTransactionUncheckedCreateWithoutInventoryItemInput[]
    connectOrCreate?: SaleTransactionCreateOrConnectWithoutInventoryItemInput | SaleTransactionCreateOrConnectWithoutInventoryItemInput[]
    upsert?: SaleTransactionUpsertWithWhereUniqueWithoutInventoryItemInput | SaleTransactionUpsertWithWhereUniqueWithoutInventoryItemInput[]
    createMany?: SaleTransactionCreateManyInventoryItemInputEnvelope
    set?: SaleTransactionWhereUniqueInput | SaleTransactionWhereUniqueInput[]
    disconnect?: SaleTransactionWhereUniqueInput | SaleTransactionWhereUniqueInput[]
    delete?: SaleTransactionWhereUniqueInput | SaleTransactionWhereUniqueInput[]
    connect?: SaleTransactionWhereUniqueInput | SaleTransactionWhereUniqueInput[]
    update?: SaleTransactionUpdateWithWhereUniqueWithoutInventoryItemInput | SaleTransactionUpdateWithWhereUniqueWithoutInventoryItemInput[]
    updateMany?: SaleTransactionUpdateManyWithWhereWithoutInventoryItemInput | SaleTransactionUpdateManyWithWhereWithoutInventoryItemInput[]
    deleteMany?: SaleTransactionScalarWhereInput | SaleTransactionScalarWhereInput[]
  }

  export type StockMovementUpdateManyWithoutInventoryItemNestedInput = {
    create?: XOR<StockMovementCreateWithoutInventoryItemInput, StockMovementUncheckedCreateWithoutInventoryItemInput> | StockMovementCreateWithoutInventoryItemInput[] | StockMovementUncheckedCreateWithoutInventoryItemInput[]
    connectOrCreate?: StockMovementCreateOrConnectWithoutInventoryItemInput | StockMovementCreateOrConnectWithoutInventoryItemInput[]
    upsert?: StockMovementUpsertWithWhereUniqueWithoutInventoryItemInput | StockMovementUpsertWithWhereUniqueWithoutInventoryItemInput[]
    createMany?: StockMovementCreateManyInventoryItemInputEnvelope
    set?: StockMovementWhereUniqueInput | StockMovementWhereUniqueInput[]
    disconnect?: StockMovementWhereUniqueInput | StockMovementWhereUniqueInput[]
    delete?: StockMovementWhereUniqueInput | StockMovementWhereUniqueInput[]
    connect?: StockMovementWhereUniqueInput | StockMovementWhereUniqueInput[]
    update?: StockMovementUpdateWithWhereUniqueWithoutInventoryItemInput | StockMovementUpdateWithWhereUniqueWithoutInventoryItemInput[]
    updateMany?: StockMovementUpdateManyWithWhereWithoutInventoryItemInput | StockMovementUpdateManyWithWhereWithoutInventoryItemInput[]
    deleteMany?: StockMovementScalarWhereInput | StockMovementScalarWhereInput[]
  }

  export type SaleTransactionUncheckedUpdateManyWithoutInventoryItemNestedInput = {
    create?: XOR<SaleTransactionCreateWithoutInventoryItemInput, SaleTransactionUncheckedCreateWithoutInventoryItemInput> | SaleTransactionCreateWithoutInventoryItemInput[] | SaleTransactionUncheckedCreateWithoutInventoryItemInput[]
    connectOrCreate?: SaleTransactionCreateOrConnectWithoutInventoryItemInput | SaleTransactionCreateOrConnectWithoutInventoryItemInput[]
    upsert?: SaleTransactionUpsertWithWhereUniqueWithoutInventoryItemInput | SaleTransactionUpsertWithWhereUniqueWithoutInventoryItemInput[]
    createMany?: SaleTransactionCreateManyInventoryItemInputEnvelope
    set?: SaleTransactionWhereUniqueInput | SaleTransactionWhereUniqueInput[]
    disconnect?: SaleTransactionWhereUniqueInput | SaleTransactionWhereUniqueInput[]
    delete?: SaleTransactionWhereUniqueInput | SaleTransactionWhereUniqueInput[]
    connect?: SaleTransactionWhereUniqueInput | SaleTransactionWhereUniqueInput[]
    update?: SaleTransactionUpdateWithWhereUniqueWithoutInventoryItemInput | SaleTransactionUpdateWithWhereUniqueWithoutInventoryItemInput[]
    updateMany?: SaleTransactionUpdateManyWithWhereWithoutInventoryItemInput | SaleTransactionUpdateManyWithWhereWithoutInventoryItemInput[]
    deleteMany?: SaleTransactionScalarWhereInput | SaleTransactionScalarWhereInput[]
  }

  export type StockMovementUncheckedUpdateManyWithoutInventoryItemNestedInput = {
    create?: XOR<StockMovementCreateWithoutInventoryItemInput, StockMovementUncheckedCreateWithoutInventoryItemInput> | StockMovementCreateWithoutInventoryItemInput[] | StockMovementUncheckedCreateWithoutInventoryItemInput[]
    connectOrCreate?: StockMovementCreateOrConnectWithoutInventoryItemInput | StockMovementCreateOrConnectWithoutInventoryItemInput[]
    upsert?: StockMovementUpsertWithWhereUniqueWithoutInventoryItemInput | StockMovementUpsertWithWhereUniqueWithoutInventoryItemInput[]
    createMany?: StockMovementCreateManyInventoryItemInputEnvelope
    set?: StockMovementWhereUniqueInput | StockMovementWhereUniqueInput[]
    disconnect?: StockMovementWhereUniqueInput | StockMovementWhereUniqueInput[]
    delete?: StockMovementWhereUniqueInput | StockMovementWhereUniqueInput[]
    connect?: StockMovementWhereUniqueInput | StockMovementWhereUniqueInput[]
    update?: StockMovementUpdateWithWhereUniqueWithoutInventoryItemInput | StockMovementUpdateWithWhereUniqueWithoutInventoryItemInput[]
    updateMany?: StockMovementUpdateManyWithWhereWithoutInventoryItemInput | StockMovementUpdateManyWithWhereWithoutInventoryItemInput[]
    deleteMany?: StockMovementScalarWhereInput | StockMovementScalarWhereInput[]
  }

  export type InventoryItemCreateNestedOneWithoutStockMovementsInput = {
    create?: XOR<InventoryItemCreateWithoutStockMovementsInput, InventoryItemUncheckedCreateWithoutStockMovementsInput>
    connectOrCreate?: InventoryItemCreateOrConnectWithoutStockMovementsInput
    connect?: InventoryItemWhereUniqueInput
  }

  export type EnumMovementTypeFieldUpdateOperationsInput = {
    set?: $Enums.MovementType
  }

  export type InventoryItemUpdateOneRequiredWithoutStockMovementsNestedInput = {
    create?: XOR<InventoryItemCreateWithoutStockMovementsInput, InventoryItemUncheckedCreateWithoutStockMovementsInput>
    connectOrCreate?: InventoryItemCreateOrConnectWithoutStockMovementsInput
    upsert?: InventoryItemUpsertWithoutStockMovementsInput
    connect?: InventoryItemWhereUniqueInput
    update?: XOR<XOR<InventoryItemUpdateToOneWithWhereWithoutStockMovementsInput, InventoryItemUpdateWithoutStockMovementsInput>, InventoryItemUncheckedUpdateWithoutStockMovementsInput>
  }

  export type SaleTransactionCreateNestedManyWithoutSaleInput = {
    create?: XOR<SaleTransactionCreateWithoutSaleInput, SaleTransactionUncheckedCreateWithoutSaleInput> | SaleTransactionCreateWithoutSaleInput[] | SaleTransactionUncheckedCreateWithoutSaleInput[]
    connectOrCreate?: SaleTransactionCreateOrConnectWithoutSaleInput | SaleTransactionCreateOrConnectWithoutSaleInput[]
    createMany?: SaleTransactionCreateManySaleInputEnvelope
    connect?: SaleTransactionWhereUniqueInput | SaleTransactionWhereUniqueInput[]
  }

  export type SaleTransactionUncheckedCreateNestedManyWithoutSaleInput = {
    create?: XOR<SaleTransactionCreateWithoutSaleInput, SaleTransactionUncheckedCreateWithoutSaleInput> | SaleTransactionCreateWithoutSaleInput[] | SaleTransactionUncheckedCreateWithoutSaleInput[]
    connectOrCreate?: SaleTransactionCreateOrConnectWithoutSaleInput | SaleTransactionCreateOrConnectWithoutSaleInput[]
    createMany?: SaleTransactionCreateManySaleInputEnvelope
    connect?: SaleTransactionWhereUniqueInput | SaleTransactionWhereUniqueInput[]
  }

  export type EnumSaleStatusFieldUpdateOperationsInput = {
    set?: $Enums.SaleStatus
  }

  export type SaleTransactionUpdateManyWithoutSaleNestedInput = {
    create?: XOR<SaleTransactionCreateWithoutSaleInput, SaleTransactionUncheckedCreateWithoutSaleInput> | SaleTransactionCreateWithoutSaleInput[] | SaleTransactionUncheckedCreateWithoutSaleInput[]
    connectOrCreate?: SaleTransactionCreateOrConnectWithoutSaleInput | SaleTransactionCreateOrConnectWithoutSaleInput[]
    upsert?: SaleTransactionUpsertWithWhereUniqueWithoutSaleInput | SaleTransactionUpsertWithWhereUniqueWithoutSaleInput[]
    createMany?: SaleTransactionCreateManySaleInputEnvelope
    set?: SaleTransactionWhereUniqueInput | SaleTransactionWhereUniqueInput[]
    disconnect?: SaleTransactionWhereUniqueInput | SaleTransactionWhereUniqueInput[]
    delete?: SaleTransactionWhereUniqueInput | SaleTransactionWhereUniqueInput[]
    connect?: SaleTransactionWhereUniqueInput | SaleTransactionWhereUniqueInput[]
    update?: SaleTransactionUpdateWithWhereUniqueWithoutSaleInput | SaleTransactionUpdateWithWhereUniqueWithoutSaleInput[]
    updateMany?: SaleTransactionUpdateManyWithWhereWithoutSaleInput | SaleTransactionUpdateManyWithWhereWithoutSaleInput[]
    deleteMany?: SaleTransactionScalarWhereInput | SaleTransactionScalarWhereInput[]
  }

  export type SaleTransactionUncheckedUpdateManyWithoutSaleNestedInput = {
    create?: XOR<SaleTransactionCreateWithoutSaleInput, SaleTransactionUncheckedCreateWithoutSaleInput> | SaleTransactionCreateWithoutSaleInput[] | SaleTransactionUncheckedCreateWithoutSaleInput[]
    connectOrCreate?: SaleTransactionCreateOrConnectWithoutSaleInput | SaleTransactionCreateOrConnectWithoutSaleInput[]
    upsert?: SaleTransactionUpsertWithWhereUniqueWithoutSaleInput | SaleTransactionUpsertWithWhereUniqueWithoutSaleInput[]
    createMany?: SaleTransactionCreateManySaleInputEnvelope
    set?: SaleTransactionWhereUniqueInput | SaleTransactionWhereUniqueInput[]
    disconnect?: SaleTransactionWhereUniqueInput | SaleTransactionWhereUniqueInput[]
    delete?: SaleTransactionWhereUniqueInput | SaleTransactionWhereUniqueInput[]
    connect?: SaleTransactionWhereUniqueInput | SaleTransactionWhereUniqueInput[]
    update?: SaleTransactionUpdateWithWhereUniqueWithoutSaleInput | SaleTransactionUpdateWithWhereUniqueWithoutSaleInput[]
    updateMany?: SaleTransactionUpdateManyWithWhereWithoutSaleInput | SaleTransactionUpdateManyWithWhereWithoutSaleInput[]
    deleteMany?: SaleTransactionScalarWhereInput | SaleTransactionScalarWhereInput[]
  }

  export type InventoryItemCreateNestedOneWithoutTransactionsInput = {
    create?: XOR<InventoryItemCreateWithoutTransactionsInput, InventoryItemUncheckedCreateWithoutTransactionsInput>
    connectOrCreate?: InventoryItemCreateOrConnectWithoutTransactionsInput
    connect?: InventoryItemWhereUniqueInput
  }

  export type SaleCreateNestedOneWithoutTransactionsInput = {
    create?: XOR<SaleCreateWithoutTransactionsInput, SaleUncheckedCreateWithoutTransactionsInput>
    connectOrCreate?: SaleCreateOrConnectWithoutTransactionsInput
    connect?: SaleWhereUniqueInput
  }

  export type InventoryItemUpdateOneRequiredWithoutTransactionsNestedInput = {
    create?: XOR<InventoryItemCreateWithoutTransactionsInput, InventoryItemUncheckedCreateWithoutTransactionsInput>
    connectOrCreate?: InventoryItemCreateOrConnectWithoutTransactionsInput
    upsert?: InventoryItemUpsertWithoutTransactionsInput
    connect?: InventoryItemWhereUniqueInput
    update?: XOR<XOR<InventoryItemUpdateToOneWithWhereWithoutTransactionsInput, InventoryItemUpdateWithoutTransactionsInput>, InventoryItemUncheckedUpdateWithoutTransactionsInput>
  }

  export type SaleUpdateOneRequiredWithoutTransactionsNestedInput = {
    create?: XOR<SaleCreateWithoutTransactionsInput, SaleUncheckedCreateWithoutTransactionsInput>
    connectOrCreate?: SaleCreateOrConnectWithoutTransactionsInput
    upsert?: SaleUpsertWithoutTransactionsInput
    connect?: SaleWhereUniqueInput
    update?: XOR<XOR<SaleUpdateToOneWithWhereWithoutTransactionsInput, SaleUpdateWithoutTransactionsInput>, SaleUncheckedUpdateWithoutTransactionsInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedDecimalFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedDecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedDecimalFilter<$PrismaModel>
    _sum?: NestedDecimalFilter<$PrismaModel>
    _min?: NestedDecimalFilter<$PrismaModel>
    _max?: NestedDecimalFilter<$PrismaModel>
  }

  export type NestedEnumMovementTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.MovementType | EnumMovementTypeFieldRefInput<$PrismaModel>
    in?: $Enums.MovementType[] | ListEnumMovementTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.MovementType[] | ListEnumMovementTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumMovementTypeFilter<$PrismaModel> | $Enums.MovementType
  }

  export type NestedEnumMovementTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.MovementType | EnumMovementTypeFieldRefInput<$PrismaModel>
    in?: $Enums.MovementType[] | ListEnumMovementTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.MovementType[] | ListEnumMovementTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumMovementTypeWithAggregatesFilter<$PrismaModel> | $Enums.MovementType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumMovementTypeFilter<$PrismaModel>
    _max?: NestedEnumMovementTypeFilter<$PrismaModel>
  }

  export type NestedEnumSaleStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.SaleStatus | EnumSaleStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SaleStatus[] | ListEnumSaleStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SaleStatus[] | ListEnumSaleStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSaleStatusFilter<$PrismaModel> | $Enums.SaleStatus
  }

  export type NestedEnumSaleStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SaleStatus | EnumSaleStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SaleStatus[] | ListEnumSaleStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SaleStatus[] | ListEnumSaleStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSaleStatusWithAggregatesFilter<$PrismaModel> | $Enums.SaleStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSaleStatusFilter<$PrismaModel>
    _max?: NestedEnumSaleStatusFilter<$PrismaModel>
  }

  export type InventoryItemCreateWithoutCategoryInput = {
    id?: string
    quantity?: number
    minStockLevel?: number
    location?: string | null
    lastUpdated?: Date | string
    active?: boolean
    cost?: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    description?: string | null
    imageUrl?: string | null
    margin?: Decimal | DecimalJsLike | number | string
    name: string
    price: Decimal | DecimalJsLike | number | string
    sku: string
    updatedAt?: Date | string
    transactions?: SaleTransactionCreateNestedManyWithoutInventoryItemInput
    stockMovements?: StockMovementCreateNestedManyWithoutInventoryItemInput
  }

  export type InventoryItemUncheckedCreateWithoutCategoryInput = {
    id?: string
    quantity?: number
    minStockLevel?: number
    location?: string | null
    lastUpdated?: Date | string
    active?: boolean
    cost?: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    description?: string | null
    imageUrl?: string | null
    margin?: Decimal | DecimalJsLike | number | string
    name: string
    price: Decimal | DecimalJsLike | number | string
    sku: string
    updatedAt?: Date | string
    transactions?: SaleTransactionUncheckedCreateNestedManyWithoutInventoryItemInput
    stockMovements?: StockMovementUncheckedCreateNestedManyWithoutInventoryItemInput
  }

  export type InventoryItemCreateOrConnectWithoutCategoryInput = {
    where: InventoryItemWhereUniqueInput
    create: XOR<InventoryItemCreateWithoutCategoryInput, InventoryItemUncheckedCreateWithoutCategoryInput>
  }

  export type InventoryItemCreateManyCategoryInputEnvelope = {
    data: InventoryItemCreateManyCategoryInput | InventoryItemCreateManyCategoryInput[]
    skipDuplicates?: boolean
  }

  export type InventoryItemUpsertWithWhereUniqueWithoutCategoryInput = {
    where: InventoryItemWhereUniqueInput
    update: XOR<InventoryItemUpdateWithoutCategoryInput, InventoryItemUncheckedUpdateWithoutCategoryInput>
    create: XOR<InventoryItemCreateWithoutCategoryInput, InventoryItemUncheckedCreateWithoutCategoryInput>
  }

  export type InventoryItemUpdateWithWhereUniqueWithoutCategoryInput = {
    where: InventoryItemWhereUniqueInput
    data: XOR<InventoryItemUpdateWithoutCategoryInput, InventoryItemUncheckedUpdateWithoutCategoryInput>
  }

  export type InventoryItemUpdateManyWithWhereWithoutCategoryInput = {
    where: InventoryItemScalarWhereInput
    data: XOR<InventoryItemUpdateManyMutationInput, InventoryItemUncheckedUpdateManyWithoutCategoryInput>
  }

  export type InventoryItemScalarWhereInput = {
    AND?: InventoryItemScalarWhereInput | InventoryItemScalarWhereInput[]
    OR?: InventoryItemScalarWhereInput[]
    NOT?: InventoryItemScalarWhereInput | InventoryItemScalarWhereInput[]
    id?: StringFilter<"InventoryItem"> | string
    quantity?: IntFilter<"InventoryItem"> | number
    minStockLevel?: IntFilter<"InventoryItem"> | number
    location?: StringNullableFilter<"InventoryItem"> | string | null
    lastUpdated?: DateTimeFilter<"InventoryItem"> | Date | string
    active?: BoolFilter<"InventoryItem"> | boolean
    categoryId?: StringNullableFilter<"InventoryItem"> | string | null
    cost?: DecimalFilter<"InventoryItem"> | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFilter<"InventoryItem"> | Date | string
    description?: StringNullableFilter<"InventoryItem"> | string | null
    imageUrl?: StringNullableFilter<"InventoryItem"> | string | null
    margin?: DecimalFilter<"InventoryItem"> | Decimal | DecimalJsLike | number | string
    name?: StringFilter<"InventoryItem"> | string
    price?: DecimalFilter<"InventoryItem"> | Decimal | DecimalJsLike | number | string
    sku?: StringFilter<"InventoryItem"> | string
    updatedAt?: DateTimeFilter<"InventoryItem"> | Date | string
  }

  export type CategoryCreateWithoutInventoryInput = {
    id?: string
    name: string
    description?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CategoryUncheckedCreateWithoutInventoryInput = {
    id?: string
    name: string
    description?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CategoryCreateOrConnectWithoutInventoryInput = {
    where: CategoryWhereUniqueInput
    create: XOR<CategoryCreateWithoutInventoryInput, CategoryUncheckedCreateWithoutInventoryInput>
  }

  export type SaleTransactionCreateWithoutInventoryItemInput = {
    id?: string
    quantity: number
    unitPrice: Decimal | DecimalJsLike | number | string
    subtotal: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    sale: SaleCreateNestedOneWithoutTransactionsInput
  }

  export type SaleTransactionUncheckedCreateWithoutInventoryItemInput = {
    id?: string
    saleId: string
    quantity: number
    unitPrice: Decimal | DecimalJsLike | number | string
    subtotal: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
  }

  export type SaleTransactionCreateOrConnectWithoutInventoryItemInput = {
    where: SaleTransactionWhereUniqueInput
    create: XOR<SaleTransactionCreateWithoutInventoryItemInput, SaleTransactionUncheckedCreateWithoutInventoryItemInput>
  }

  export type SaleTransactionCreateManyInventoryItemInputEnvelope = {
    data: SaleTransactionCreateManyInventoryItemInput | SaleTransactionCreateManyInventoryItemInput[]
    skipDuplicates?: boolean
  }

  export type StockMovementCreateWithoutInventoryItemInput = {
    id?: string
    quantity: number
    type: $Enums.MovementType
    date?: Date | string
    notes?: string | null
    createdBy?: string | null
  }

  export type StockMovementUncheckedCreateWithoutInventoryItemInput = {
    id?: string
    quantity: number
    type: $Enums.MovementType
    date?: Date | string
    notes?: string | null
    createdBy?: string | null
  }

  export type StockMovementCreateOrConnectWithoutInventoryItemInput = {
    where: StockMovementWhereUniqueInput
    create: XOR<StockMovementCreateWithoutInventoryItemInput, StockMovementUncheckedCreateWithoutInventoryItemInput>
  }

  export type StockMovementCreateManyInventoryItemInputEnvelope = {
    data: StockMovementCreateManyInventoryItemInput | StockMovementCreateManyInventoryItemInput[]
    skipDuplicates?: boolean
  }

  export type CategoryUpsertWithoutInventoryInput = {
    update: XOR<CategoryUpdateWithoutInventoryInput, CategoryUncheckedUpdateWithoutInventoryInput>
    create: XOR<CategoryCreateWithoutInventoryInput, CategoryUncheckedCreateWithoutInventoryInput>
    where?: CategoryWhereInput
  }

  export type CategoryUpdateToOneWithWhereWithoutInventoryInput = {
    where?: CategoryWhereInput
    data: XOR<CategoryUpdateWithoutInventoryInput, CategoryUncheckedUpdateWithoutInventoryInput>
  }

  export type CategoryUpdateWithoutInventoryInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CategoryUncheckedUpdateWithoutInventoryInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SaleTransactionUpsertWithWhereUniqueWithoutInventoryItemInput = {
    where: SaleTransactionWhereUniqueInput
    update: XOR<SaleTransactionUpdateWithoutInventoryItemInput, SaleTransactionUncheckedUpdateWithoutInventoryItemInput>
    create: XOR<SaleTransactionCreateWithoutInventoryItemInput, SaleTransactionUncheckedCreateWithoutInventoryItemInput>
  }

  export type SaleTransactionUpdateWithWhereUniqueWithoutInventoryItemInput = {
    where: SaleTransactionWhereUniqueInput
    data: XOR<SaleTransactionUpdateWithoutInventoryItemInput, SaleTransactionUncheckedUpdateWithoutInventoryItemInput>
  }

  export type SaleTransactionUpdateManyWithWhereWithoutInventoryItemInput = {
    where: SaleTransactionScalarWhereInput
    data: XOR<SaleTransactionUpdateManyMutationInput, SaleTransactionUncheckedUpdateManyWithoutInventoryItemInput>
  }

  export type SaleTransactionScalarWhereInput = {
    AND?: SaleTransactionScalarWhereInput | SaleTransactionScalarWhereInput[]
    OR?: SaleTransactionScalarWhereInput[]
    NOT?: SaleTransactionScalarWhereInput | SaleTransactionScalarWhereInput[]
    id?: StringFilter<"SaleTransaction"> | string
    saleId?: StringFilter<"SaleTransaction"> | string
    quantity?: IntFilter<"SaleTransaction"> | number
    unitPrice?: DecimalFilter<"SaleTransaction"> | Decimal | DecimalJsLike | number | string
    subtotal?: DecimalFilter<"SaleTransaction"> | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFilter<"SaleTransaction"> | Date | string
    inventoryItemId?: StringFilter<"SaleTransaction"> | string
  }

  export type StockMovementUpsertWithWhereUniqueWithoutInventoryItemInput = {
    where: StockMovementWhereUniqueInput
    update: XOR<StockMovementUpdateWithoutInventoryItemInput, StockMovementUncheckedUpdateWithoutInventoryItemInput>
    create: XOR<StockMovementCreateWithoutInventoryItemInput, StockMovementUncheckedCreateWithoutInventoryItemInput>
  }

  export type StockMovementUpdateWithWhereUniqueWithoutInventoryItemInput = {
    where: StockMovementWhereUniqueInput
    data: XOR<StockMovementUpdateWithoutInventoryItemInput, StockMovementUncheckedUpdateWithoutInventoryItemInput>
  }

  export type StockMovementUpdateManyWithWhereWithoutInventoryItemInput = {
    where: StockMovementScalarWhereInput
    data: XOR<StockMovementUpdateManyMutationInput, StockMovementUncheckedUpdateManyWithoutInventoryItemInput>
  }

  export type StockMovementScalarWhereInput = {
    AND?: StockMovementScalarWhereInput | StockMovementScalarWhereInput[]
    OR?: StockMovementScalarWhereInput[]
    NOT?: StockMovementScalarWhereInput | StockMovementScalarWhereInput[]
    id?: StringFilter<"StockMovement"> | string
    inventoryItemId?: StringFilter<"StockMovement"> | string
    quantity?: IntFilter<"StockMovement"> | number
    type?: EnumMovementTypeFilter<"StockMovement"> | $Enums.MovementType
    date?: DateTimeFilter<"StockMovement"> | Date | string
    notes?: StringNullableFilter<"StockMovement"> | string | null
    createdBy?: StringNullableFilter<"StockMovement"> | string | null
  }

  export type InventoryItemCreateWithoutStockMovementsInput = {
    id?: string
    quantity?: number
    minStockLevel?: number
    location?: string | null
    lastUpdated?: Date | string
    active?: boolean
    cost?: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    description?: string | null
    imageUrl?: string | null
    margin?: Decimal | DecimalJsLike | number | string
    name: string
    price: Decimal | DecimalJsLike | number | string
    sku: string
    updatedAt?: Date | string
    category?: CategoryCreateNestedOneWithoutInventoryInput
    transactions?: SaleTransactionCreateNestedManyWithoutInventoryItemInput
  }

  export type InventoryItemUncheckedCreateWithoutStockMovementsInput = {
    id?: string
    quantity?: number
    minStockLevel?: number
    location?: string | null
    lastUpdated?: Date | string
    active?: boolean
    categoryId?: string | null
    cost?: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    description?: string | null
    imageUrl?: string | null
    margin?: Decimal | DecimalJsLike | number | string
    name: string
    price: Decimal | DecimalJsLike | number | string
    sku: string
    updatedAt?: Date | string
    transactions?: SaleTransactionUncheckedCreateNestedManyWithoutInventoryItemInput
  }

  export type InventoryItemCreateOrConnectWithoutStockMovementsInput = {
    where: InventoryItemWhereUniqueInput
    create: XOR<InventoryItemCreateWithoutStockMovementsInput, InventoryItemUncheckedCreateWithoutStockMovementsInput>
  }

  export type InventoryItemUpsertWithoutStockMovementsInput = {
    update: XOR<InventoryItemUpdateWithoutStockMovementsInput, InventoryItemUncheckedUpdateWithoutStockMovementsInput>
    create: XOR<InventoryItemCreateWithoutStockMovementsInput, InventoryItemUncheckedCreateWithoutStockMovementsInput>
    where?: InventoryItemWhereInput
  }

  export type InventoryItemUpdateToOneWithWhereWithoutStockMovementsInput = {
    where?: InventoryItemWhereInput
    data: XOR<InventoryItemUpdateWithoutStockMovementsInput, InventoryItemUncheckedUpdateWithoutStockMovementsInput>
  }

  export type InventoryItemUpdateWithoutStockMovementsInput = {
    id?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    minStockLevel?: IntFieldUpdateOperationsInput | number
    location?: NullableStringFieldUpdateOperationsInput | string | null
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    active?: BoolFieldUpdateOperationsInput | boolean
    cost?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    margin?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    name?: StringFieldUpdateOperationsInput | string
    price?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    sku?: StringFieldUpdateOperationsInput | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    category?: CategoryUpdateOneWithoutInventoryNestedInput
    transactions?: SaleTransactionUpdateManyWithoutInventoryItemNestedInput
  }

  export type InventoryItemUncheckedUpdateWithoutStockMovementsInput = {
    id?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    minStockLevel?: IntFieldUpdateOperationsInput | number
    location?: NullableStringFieldUpdateOperationsInput | string | null
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    active?: BoolFieldUpdateOperationsInput | boolean
    categoryId?: NullableStringFieldUpdateOperationsInput | string | null
    cost?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    margin?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    name?: StringFieldUpdateOperationsInput | string
    price?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    sku?: StringFieldUpdateOperationsInput | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    transactions?: SaleTransactionUncheckedUpdateManyWithoutInventoryItemNestedInput
  }

  export type SaleTransactionCreateWithoutSaleInput = {
    id?: string
    quantity: number
    unitPrice: Decimal | DecimalJsLike | number | string
    subtotal: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    inventoryItem: InventoryItemCreateNestedOneWithoutTransactionsInput
  }

  export type SaleTransactionUncheckedCreateWithoutSaleInput = {
    id?: string
    quantity: number
    unitPrice: Decimal | DecimalJsLike | number | string
    subtotal: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    inventoryItemId: string
  }

  export type SaleTransactionCreateOrConnectWithoutSaleInput = {
    where: SaleTransactionWhereUniqueInput
    create: XOR<SaleTransactionCreateWithoutSaleInput, SaleTransactionUncheckedCreateWithoutSaleInput>
  }

  export type SaleTransactionCreateManySaleInputEnvelope = {
    data: SaleTransactionCreateManySaleInput | SaleTransactionCreateManySaleInput[]
    skipDuplicates?: boolean
  }

  export type SaleTransactionUpsertWithWhereUniqueWithoutSaleInput = {
    where: SaleTransactionWhereUniqueInput
    update: XOR<SaleTransactionUpdateWithoutSaleInput, SaleTransactionUncheckedUpdateWithoutSaleInput>
    create: XOR<SaleTransactionCreateWithoutSaleInput, SaleTransactionUncheckedCreateWithoutSaleInput>
  }

  export type SaleTransactionUpdateWithWhereUniqueWithoutSaleInput = {
    where: SaleTransactionWhereUniqueInput
    data: XOR<SaleTransactionUpdateWithoutSaleInput, SaleTransactionUncheckedUpdateWithoutSaleInput>
  }

  export type SaleTransactionUpdateManyWithWhereWithoutSaleInput = {
    where: SaleTransactionScalarWhereInput
    data: XOR<SaleTransactionUpdateManyMutationInput, SaleTransactionUncheckedUpdateManyWithoutSaleInput>
  }

  export type InventoryItemCreateWithoutTransactionsInput = {
    id?: string
    quantity?: number
    minStockLevel?: number
    location?: string | null
    lastUpdated?: Date | string
    active?: boolean
    cost?: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    description?: string | null
    imageUrl?: string | null
    margin?: Decimal | DecimalJsLike | number | string
    name: string
    price: Decimal | DecimalJsLike | number | string
    sku: string
    updatedAt?: Date | string
    category?: CategoryCreateNestedOneWithoutInventoryInput
    stockMovements?: StockMovementCreateNestedManyWithoutInventoryItemInput
  }

  export type InventoryItemUncheckedCreateWithoutTransactionsInput = {
    id?: string
    quantity?: number
    minStockLevel?: number
    location?: string | null
    lastUpdated?: Date | string
    active?: boolean
    categoryId?: string | null
    cost?: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    description?: string | null
    imageUrl?: string | null
    margin?: Decimal | DecimalJsLike | number | string
    name: string
    price: Decimal | DecimalJsLike | number | string
    sku: string
    updatedAt?: Date | string
    stockMovements?: StockMovementUncheckedCreateNestedManyWithoutInventoryItemInput
  }

  export type InventoryItemCreateOrConnectWithoutTransactionsInput = {
    where: InventoryItemWhereUniqueInput
    create: XOR<InventoryItemCreateWithoutTransactionsInput, InventoryItemUncheckedCreateWithoutTransactionsInput>
  }

  export type SaleCreateWithoutTransactionsInput = {
    id?: string
    date?: Date | string
    total: Decimal | DecimalJsLike | number | string
    subtotal: Decimal | DecimalJsLike | number | string
    tax: Decimal | DecimalJsLike | number | string
    status?: $Enums.SaleStatus
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SaleUncheckedCreateWithoutTransactionsInput = {
    id?: string
    date?: Date | string
    total: Decimal | DecimalJsLike | number | string
    subtotal: Decimal | DecimalJsLike | number | string
    tax: Decimal | DecimalJsLike | number | string
    status?: $Enums.SaleStatus
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SaleCreateOrConnectWithoutTransactionsInput = {
    where: SaleWhereUniqueInput
    create: XOR<SaleCreateWithoutTransactionsInput, SaleUncheckedCreateWithoutTransactionsInput>
  }

  export type InventoryItemUpsertWithoutTransactionsInput = {
    update: XOR<InventoryItemUpdateWithoutTransactionsInput, InventoryItemUncheckedUpdateWithoutTransactionsInput>
    create: XOR<InventoryItemCreateWithoutTransactionsInput, InventoryItemUncheckedCreateWithoutTransactionsInput>
    where?: InventoryItemWhereInput
  }

  export type InventoryItemUpdateToOneWithWhereWithoutTransactionsInput = {
    where?: InventoryItemWhereInput
    data: XOR<InventoryItemUpdateWithoutTransactionsInput, InventoryItemUncheckedUpdateWithoutTransactionsInput>
  }

  export type InventoryItemUpdateWithoutTransactionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    minStockLevel?: IntFieldUpdateOperationsInput | number
    location?: NullableStringFieldUpdateOperationsInput | string | null
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    active?: BoolFieldUpdateOperationsInput | boolean
    cost?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    margin?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    name?: StringFieldUpdateOperationsInput | string
    price?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    sku?: StringFieldUpdateOperationsInput | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    category?: CategoryUpdateOneWithoutInventoryNestedInput
    stockMovements?: StockMovementUpdateManyWithoutInventoryItemNestedInput
  }

  export type InventoryItemUncheckedUpdateWithoutTransactionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    minStockLevel?: IntFieldUpdateOperationsInput | number
    location?: NullableStringFieldUpdateOperationsInput | string | null
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    active?: BoolFieldUpdateOperationsInput | boolean
    categoryId?: NullableStringFieldUpdateOperationsInput | string | null
    cost?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    margin?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    name?: StringFieldUpdateOperationsInput | string
    price?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    sku?: StringFieldUpdateOperationsInput | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    stockMovements?: StockMovementUncheckedUpdateManyWithoutInventoryItemNestedInput
  }

  export type SaleUpsertWithoutTransactionsInput = {
    update: XOR<SaleUpdateWithoutTransactionsInput, SaleUncheckedUpdateWithoutTransactionsInput>
    create: XOR<SaleCreateWithoutTransactionsInput, SaleUncheckedCreateWithoutTransactionsInput>
    where?: SaleWhereInput
  }

  export type SaleUpdateToOneWithWhereWithoutTransactionsInput = {
    where?: SaleWhereInput
    data: XOR<SaleUpdateWithoutTransactionsInput, SaleUncheckedUpdateWithoutTransactionsInput>
  }

  export type SaleUpdateWithoutTransactionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    total?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    tax?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    status?: EnumSaleStatusFieldUpdateOperationsInput | $Enums.SaleStatus
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SaleUncheckedUpdateWithoutTransactionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    total?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    tax?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    status?: EnumSaleStatusFieldUpdateOperationsInput | $Enums.SaleStatus
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InventoryItemCreateManyCategoryInput = {
    id?: string
    quantity?: number
    minStockLevel?: number
    location?: string | null
    lastUpdated?: Date | string
    active?: boolean
    cost?: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    description?: string | null
    imageUrl?: string | null
    margin?: Decimal | DecimalJsLike | number | string
    name: string
    price: Decimal | DecimalJsLike | number | string
    sku: string
    updatedAt?: Date | string
  }

  export type InventoryItemUpdateWithoutCategoryInput = {
    id?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    minStockLevel?: IntFieldUpdateOperationsInput | number
    location?: NullableStringFieldUpdateOperationsInput | string | null
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    active?: BoolFieldUpdateOperationsInput | boolean
    cost?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    margin?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    name?: StringFieldUpdateOperationsInput | string
    price?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    sku?: StringFieldUpdateOperationsInput | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    transactions?: SaleTransactionUpdateManyWithoutInventoryItemNestedInput
    stockMovements?: StockMovementUpdateManyWithoutInventoryItemNestedInput
  }

  export type InventoryItemUncheckedUpdateWithoutCategoryInput = {
    id?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    minStockLevel?: IntFieldUpdateOperationsInput | number
    location?: NullableStringFieldUpdateOperationsInput | string | null
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    active?: BoolFieldUpdateOperationsInput | boolean
    cost?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    margin?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    name?: StringFieldUpdateOperationsInput | string
    price?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    sku?: StringFieldUpdateOperationsInput | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    transactions?: SaleTransactionUncheckedUpdateManyWithoutInventoryItemNestedInput
    stockMovements?: StockMovementUncheckedUpdateManyWithoutInventoryItemNestedInput
  }

  export type InventoryItemUncheckedUpdateManyWithoutCategoryInput = {
    id?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    minStockLevel?: IntFieldUpdateOperationsInput | number
    location?: NullableStringFieldUpdateOperationsInput | string | null
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    active?: BoolFieldUpdateOperationsInput | boolean
    cost?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    margin?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    name?: StringFieldUpdateOperationsInput | string
    price?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    sku?: StringFieldUpdateOperationsInput | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SaleTransactionCreateManyInventoryItemInput = {
    id?: string
    saleId: string
    quantity: number
    unitPrice: Decimal | DecimalJsLike | number | string
    subtotal: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
  }

  export type StockMovementCreateManyInventoryItemInput = {
    id?: string
    quantity: number
    type: $Enums.MovementType
    date?: Date | string
    notes?: string | null
    createdBy?: string | null
  }

  export type SaleTransactionUpdateWithoutInventoryItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    unitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sale?: SaleUpdateOneRequiredWithoutTransactionsNestedInput
  }

  export type SaleTransactionUncheckedUpdateWithoutInventoryItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    saleId?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    unitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SaleTransactionUncheckedUpdateManyWithoutInventoryItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    saleId?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    unitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StockMovementUpdateWithoutInventoryItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    type?: EnumMovementTypeFieldUpdateOperationsInput | $Enums.MovementType
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type StockMovementUncheckedUpdateWithoutInventoryItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    type?: EnumMovementTypeFieldUpdateOperationsInput | $Enums.MovementType
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type StockMovementUncheckedUpdateManyWithoutInventoryItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    type?: EnumMovementTypeFieldUpdateOperationsInput | $Enums.MovementType
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type SaleTransactionCreateManySaleInput = {
    id?: string
    quantity: number
    unitPrice: Decimal | DecimalJsLike | number | string
    subtotal: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    inventoryItemId: string
  }

  export type SaleTransactionUpdateWithoutSaleInput = {
    id?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    unitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    inventoryItem?: InventoryItemUpdateOneRequiredWithoutTransactionsNestedInput
  }

  export type SaleTransactionUncheckedUpdateWithoutSaleInput = {
    id?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    unitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    inventoryItemId?: StringFieldUpdateOperationsInput | string
  }

  export type SaleTransactionUncheckedUpdateManyWithoutSaleInput = {
    id?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    unitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    subtotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    inventoryItemId?: StringFieldUpdateOperationsInput | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}