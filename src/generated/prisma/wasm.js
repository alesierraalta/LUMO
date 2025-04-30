
Object.defineProperty(exports, "__esModule", { value: true });

const {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientRustPanicError,
  PrismaClientInitializationError,
  PrismaClientValidationError,
  getPrismaClient,
  sqltag,
  empty,
  join,
  raw,
  skip,
  Decimal,
  Debug,
  objectEnumValues,
  makeStrictEnum,
  Extensions,
  warnOnce,
  defineDmmfProperty,
  Public,
  getRuntime,
  createParam,
} = require('./runtime/wasm.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.6.0
 * Query Engine version: f676762280b54cd07c770017ed3711ddde35f37a
 */
Prisma.prismaVersion = {
  client: "6.6.0",
  engine: "f676762280b54cd07c770017ed3711ddde35f37a"
}

Prisma.PrismaClientKnownRequestError = PrismaClientKnownRequestError;
Prisma.PrismaClientUnknownRequestError = PrismaClientUnknownRequestError
Prisma.PrismaClientRustPanicError = PrismaClientRustPanicError
Prisma.PrismaClientInitializationError = PrismaClientInitializationError
Prisma.PrismaClientValidationError = PrismaClientValidationError
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = sqltag
Prisma.empty = empty
Prisma.join = join
Prisma.raw = raw
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = Extensions.getExtensionContext
Prisma.defineExtension = Extensions.defineExtension

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}





/**
 * Enums
 */
exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.CategoryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProductScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  sku: 'sku',
  cost: 'cost',
  price: 'price',
  margin: 'margin',
  categoryId: 'categoryId',
  imageUrl: 'imageUrl',
  active: 'active',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InventoryItemScalarFieldEnum = {
  id: 'id',
  productId: 'productId',
  quantity: 'quantity',
  minStockLevel: 'minStockLevel',
  location: 'location',
  lastUpdated: 'lastUpdated'
};

exports.Prisma.StockMovementScalarFieldEnum = {
  id: 'id',
  inventoryItemId: 'inventoryItemId',
  quantity: 'quantity',
  type: 'type',
  date: 'date',
  notes: 'notes',
  createdBy: 'createdBy'
};

exports.Prisma.SaleScalarFieldEnum = {
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

exports.Prisma.SaleTransactionScalarFieldEnum = {
  id: 'id',
  saleId: 'saleId',
  productId: 'productId',
  quantity: 'quantity',
  unitPrice: 'unitPrice',
  subtotal: 'subtotal',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};
exports.MovementType = exports.$Enums.MovementType = {
  STOCK_IN: 'STOCK_IN',
  STOCK_OUT: 'STOCK_OUT',
  ADJUSTMENT: 'ADJUSTMENT',
  INITIAL: 'INITIAL'
};

exports.SaleStatus = exports.$Enums.SaleStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

exports.Prisma.ModelName = {
  Category: 'Category',
  Product: 'Product',
  InventoryItem: 'InventoryItem',
  StockMovement: 'StockMovement',
  Sale: 'Sale',
  SaleTransaction: 'SaleTransaction'
};
/**
 * Create the Client
 */
const config = {
  "generator": {
    "name": "client",
    "provider": {
      "fromEnvVar": null,
      "value": "prisma-client-js"
    },
    "output": {
      "value": "C:\\Users\\alesierraalta\\Documents\\python\\new-inventory-app\\src\\generated\\prisma",
      "fromEnvVar": null
    },
    "config": {
      "engineType": "library"
    },
    "binaryTargets": [
      {
        "fromEnvVar": null,
        "value": "windows",
        "native": true
      }
    ],
    "previewFeatures": [
      "driverAdapters"
    ],
    "sourceFilePath": "C:\\Users\\alesierraalta\\Documents\\python\\new-inventory-app\\prisma\\schema.prisma",
    "isCustomOutput": true
  },
  "relativeEnvPaths": {
    "rootEnvPath": null,
    "schemaEnvPath": "../../../.env"
  },
  "relativePath": "../../../prisma",
  "clientVersion": "6.6.0",
  "engineVersion": "f676762280b54cd07c770017ed3711ddde35f37a",
  "datasourceNames": [
    "db"
  ],
  "activeProvider": "postgresql",
  "inlineDatasources": {
    "db": {
      "url": {
        "fromEnvVar": "DATABASE_URL",
        "value": "postgresql://neondb_owner:npg_U56jCTFfzKtH@ep-jolly-feather-a5zw59mq-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
      }
    }
  },
  "inlineSchema": "// This is your Prisma schema file,\n// learn more about it in the docs: https://pris.ly/d/prisma-schema\n\n// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?\n// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init\n\ngenerator client {\n  provider        = \"prisma-client-js\"\n  output          = \"../src/generated/prisma\"\n  previewFeatures = [\"driverAdapters\"]\n}\n\ndatasource db {\n  provider = \"postgresql\"\n  url      = env(\"DATABASE_URL\")\n}\n\n// Modelos para el sistema de inventario\n\nmodel Category {\n  id          String    @id @default(cuid())\n  name        String\n  description String?\n  createdAt   DateTime  @default(now())\n  updatedAt   DateTime  @updatedAt\n  products    Product[]\n\n  @@map(\"categories\")\n}\n\nmodel Product {\n  id           String            @id @default(cuid())\n  name         String\n  description  String?\n  sku          String            @unique\n  cost         Decimal           @default(0) @db.Decimal(10, 2) // Precio de compra\n  price        Decimal           @db.Decimal(10, 2) // Precio de venta\n  margin       Decimal           @default(0) @db.Decimal(10, 2) // Margen de ganancia\n  categoryId   String?\n  category     Category?         @relation(fields: [categoryId], references: [id], onDelete: SetNull)\n  imageUrl     String?\n  active       Boolean           @default(true)\n  createdAt    DateTime          @default(now())\n  updatedAt    DateTime          @updatedAt\n  inventory    InventoryItem?\n  transactions SaleTransaction[]\n\n  @@map(\"products\")\n}\n\nmodel InventoryItem {\n  id             String          @id @default(cuid())\n  productId      String          @unique\n  product        Product         @relation(fields: [productId], references: [id], onDelete: Cascade)\n  quantity       Int             @default(0)\n  minStockLevel  Int             @default(5)\n  location       String?\n  lastUpdated    DateTime        @updatedAt\n  stockMovements StockMovement[]\n\n  @@map(\"inventory_items\")\n}\n\nenum MovementType {\n  STOCK_IN\n  STOCK_OUT\n  ADJUSTMENT\n  INITIAL\n}\n\nmodel StockMovement {\n  id              String        @id @default(cuid())\n  inventoryItemId String\n  inventoryItem   InventoryItem @relation(fields: [inventoryItemId], references: [id], onDelete: Cascade)\n  quantity        Int\n  type            MovementType\n  date            DateTime      @default(now())\n  notes           String?\n  createdBy       String?\n\n  @@map(\"stock_movements\")\n}\n\nmodel Sale {\n  id           String            @id @default(cuid())\n  date         DateTime          @default(now())\n  total        Decimal           @db.Decimal(10, 2)\n  subtotal     Decimal           @db.Decimal(10, 2)\n  tax          Decimal           @db.Decimal(10, 2)\n  transactions SaleTransaction[]\n  status       SaleStatus        @default(COMPLETED)\n  notes        String?\n  createdAt    DateTime          @default(now())\n  updatedAt    DateTime          @updatedAt\n\n  @@map(\"sales\")\n}\n\nenum SaleStatus {\n  PENDING\n  COMPLETED\n  CANCELLED\n}\n\nmodel SaleTransaction {\n  id        String   @id @default(cuid())\n  saleId    String\n  sale      Sale     @relation(fields: [saleId], references: [id], onDelete: Cascade)\n  productId String\n  product   Product  @relation(fields: [productId], references: [id], onDelete: Restrict)\n  quantity  Int\n  unitPrice Decimal  @db.Decimal(10, 2)\n  subtotal  Decimal  @db.Decimal(10, 2)\n  createdAt DateTime @default(now())\n\n  @@map(\"sale_transactions\")\n}\n",
  "inlineSchemaHash": "f5812ef45c75ab11da44c63ff6397b894f260e18553fa523ea13b593d4be353c",
  "copyEngine": true
}
config.dirname = '/'

config.runtimeDataModel = JSON.parse("{\"models\":{\"Category\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"description\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"products\",\"kind\":\"object\",\"type\":\"Product\",\"relationName\":\"CategoryToProduct\"}],\"dbName\":\"categories\"},\"Product\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"description\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"sku\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"cost\",\"kind\":\"scalar\",\"type\":\"Decimal\"},{\"name\":\"price\",\"kind\":\"scalar\",\"type\":\"Decimal\"},{\"name\":\"margin\",\"kind\":\"scalar\",\"type\":\"Decimal\"},{\"name\":\"categoryId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"category\",\"kind\":\"object\",\"type\":\"Category\",\"relationName\":\"CategoryToProduct\"},{\"name\":\"imageUrl\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"active\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"inventory\",\"kind\":\"object\",\"type\":\"InventoryItem\",\"relationName\":\"InventoryItemToProduct\"},{\"name\":\"transactions\",\"kind\":\"object\",\"type\":\"SaleTransaction\",\"relationName\":\"ProductToSaleTransaction\"}],\"dbName\":\"products\"},\"InventoryItem\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"productId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"product\",\"kind\":\"object\",\"type\":\"Product\",\"relationName\":\"InventoryItemToProduct\"},{\"name\":\"quantity\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"minStockLevel\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"location\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"lastUpdated\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"stockMovements\",\"kind\":\"object\",\"type\":\"StockMovement\",\"relationName\":\"InventoryItemToStockMovement\"}],\"dbName\":\"inventory_items\"},\"StockMovement\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"inventoryItemId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"inventoryItem\",\"kind\":\"object\",\"type\":\"InventoryItem\",\"relationName\":\"InventoryItemToStockMovement\"},{\"name\":\"quantity\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"type\",\"kind\":\"enum\",\"type\":\"MovementType\"},{\"name\":\"date\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"notes\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdBy\",\"kind\":\"scalar\",\"type\":\"String\"}],\"dbName\":\"stock_movements\"},\"Sale\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"date\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"total\",\"kind\":\"scalar\",\"type\":\"Decimal\"},{\"name\":\"subtotal\",\"kind\":\"scalar\",\"type\":\"Decimal\"},{\"name\":\"tax\",\"kind\":\"scalar\",\"type\":\"Decimal\"},{\"name\":\"transactions\",\"kind\":\"object\",\"type\":\"SaleTransaction\",\"relationName\":\"SaleToSaleTransaction\"},{\"name\":\"status\",\"kind\":\"enum\",\"type\":\"SaleStatus\"},{\"name\":\"notes\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":\"sales\"},\"SaleTransaction\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"saleId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"sale\",\"kind\":\"object\",\"type\":\"Sale\",\"relationName\":\"SaleToSaleTransaction\"},{\"name\":\"productId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"product\",\"kind\":\"object\",\"type\":\"Product\",\"relationName\":\"ProductToSaleTransaction\"},{\"name\":\"quantity\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"unitPrice\",\"kind\":\"scalar\",\"type\":\"Decimal\"},{\"name\":\"subtotal\",\"kind\":\"scalar\",\"type\":\"Decimal\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":\"sale_transactions\"}},\"enums\":{},\"types\":{}}")
defineDmmfProperty(exports.Prisma, config.runtimeDataModel)
config.engineWasm = {
  getRuntime: async () => require('./query_engine_bg.js'),
  getQueryEngineWasmModule: async () => {
    const loader = (await import('#wasm-engine-loader')).default
    const engine = (await loader).default
    return engine
  }
}
config.compilerWasm = undefined

config.injectableEdgeEnv = () => ({
  parsed: {
    DATABASE_URL: typeof globalThis !== 'undefined' && globalThis['DATABASE_URL'] || typeof process !== 'undefined' && process.env && process.env.DATABASE_URL || undefined
  }
})

if (typeof globalThis !== 'undefined' && globalThis['DEBUG'] || typeof process !== 'undefined' && process.env && process.env.DEBUG || undefined) {
  Debug.enable(typeof globalThis !== 'undefined' && globalThis['DEBUG'] || typeof process !== 'undefined' && process.env && process.env.DEBUG || undefined)
}

const PrismaClient = getPrismaClient(config)
exports.PrismaClient = PrismaClient
Object.assign(exports, Prisma)

