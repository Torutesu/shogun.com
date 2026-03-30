declare module "better-sqlite3" {
  namespace Database {
    interface Statement {
      run(...params: unknown[]): { changes: number; lastInsertRowid: number | bigint };
      get(...params: unknown[]): unknown;
      all(...params: unknown[]): unknown[];
    }
    interface Database {
      prepare(sql: string): Statement;
      exec(sql: string): void;
      close(): void;
      pragma(pragma: string): unknown;
    }
  }

  class Database {
    constructor(filename: string);
    prepare(sql: string): Database.Statement;
    exec(sql: string): void;
    close(): void;
    pragma(pragma: string): unknown;
  }

  export = Database;
}

declare module "electron-store" {
  class Store {
    get(key: string): unknown;
    set(key: string, value: unknown): void;
    delete(key: string): void;
  }
  export default Store;
}
