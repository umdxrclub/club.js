export type Identifiable = {
  id: string;
};
export type WithoutIdentifiable<T extends Identifiable> = Omit<T, "id">;
export type ModelCreator<T extends Identifiable> = (
  data: WithoutIdentifiable<T>
) => Promise<T>;
export type ModelHandler<T extends Identifiable> = (model: T) => Promise<void>;
export type ModelTransformer<T extends Identifiable> = (
  model: T,
  prevModel: T | undefined
) => Promise<T>;

export interface ModelExtension<T extends Identifiable> {
  transform: ModelTransformer<T>;
  destroy: ModelHandler<T>;
}

export class ModelManager<T extends Identifiable> implements ModelExtension<T> {
  private _extensions: ModelExtension<T>[] = [];

  public async transform(model: T, prevModel: T | undefined): Promise<T> {
    let initialPromise: Promise<T> = Promise.resolve(model);

    let transformPromise = this._extensions.reduce(async (p, e) => {
      let model = await p;

      let newModelPromise = e.transform(model, prevModel);

      return newModelPromise;
    }, initialPromise);

    return transformPromise;
  }

  public async destroy(model: T) {
    await Promise.all(this._extensions.map(async (e) => e.destroy(model)));
  }

  public addExtension(extension: ModelExtension<T>) {
    this._extensions.push(extension);
  }
}
