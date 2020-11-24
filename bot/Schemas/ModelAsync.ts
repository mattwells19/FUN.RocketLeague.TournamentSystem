import { Model, MongooseFilterQuery, Types, Document, MongooseUpdateQuery } from "mongoose";

type QueryOptions = MongooseFilterQuery<Pick<Document, "_id">>;

export class ModelAsync<T> {
  private model: Model<Document>;

  constructor(model: Model<Document>) {
    this.model = model;
  }

  private convertAll = (docs: Document[]): Array<T> =>
    docs.map((doc) => this.convert(doc)).filter((value): value is T => value !== null);

  private convert = (doc: Document | null): T | null => doc?.toJSON() ?? null;

  public async get(options: QueryOptions): Promise<T[]> {
    return this.convertAll(await this.model.find(options));
  }

  public async getOne(options: QueryOptions): Promise<T | null> {
    return this.convert(await this.model.findOne(options));
  }

  public async getWithId(id: Types.ObjectId): Promise<T | null> {
    return this.convert(await this.model.findById(id));
  }

  public async insert(initialFields: Partial<T>): Promise<T | null> {
    return this.convert(await new this.model(initialFields).save());
  }

  public async insertMany(values: T[]): Promise<T[]> {
    return this.convertAll(await this.model.insertMany(values));
  }

  public async remove(options: QueryOptions): Promise<T | null> {
    return this.convert(await this.model.findOneAndDelete(options));
  }

  public async removeWithId(id: Types.ObjectId): Promise<T | null> {
    return this.convert(await this.model.findByIdAndDelete(id));
  }

  public async update(
    options: QueryOptions,
    updates: Partial<T> | MongooseUpdateQuery<Pick<Document, "_id">>
  ): Promise<T[]> {
    return this.convertAll(await this.model.updateMany(options, updates));
  }

  public async updateOne(
    options: QueryOptions,
    updates: Partial<T> | MongooseUpdateQuery<Pick<Document, "_id">>
  ): Promise<T | null> {
    return this.convert(await this.model.findOneAndUpdate(options, updates));
  }

  public async updateWithId(
    id: Types.ObjectId,
    updates: Partial<T> | MongooseUpdateQuery<Pick<Document, "_id">>
  ): Promise<T | null> {
    return this.convert(await this.model.findByIdAndUpdate(id, updates));
  }

  public async count(): Promise<number> {
    return await this.model.countDocuments();
  }
}
