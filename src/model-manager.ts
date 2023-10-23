export type Identifiable = {
    id: string
}
export type WithoutIdentifiable<T extends Identifiable> = Omit<T, "id">

export type ModelCreator<T extends Identifiable> = (data: WithoutIdentifiable<T>) => Promise<T>
export type ModelHandler<T extends Identifiable> = (model: T) => Promise<void>
export type ModelTransformer<T extends Identifiable> = (model: T, prevModel: T | undefined) => Promise<T>

export interface ModelConfig<T extends Identifiable> {
    creator: ModelCreator<T>,
    serializer: ModelHandler<T>
}

export interface ModelExtension<T extends Identifiable> {
    transformer: ModelTransformer<T>,
    destroyer: ModelHandler<T>
}

export class ModelManager<T extends Identifiable> {
    private _config: ModelConfig<T>
    private _extensions: ModelExtension<T>[] = []

    constructor(config: ModelConfig<T>) {
        this._config = config;
    }

    public async transform(model: T, prevModel: T | undefined): Promise<T> {
        let initialPromise: Promise<T> = Promise.resolve(model);

        let transformedModel = this._extensions.reduce(async (p, e) => {
            let model = await p;
            let newModelPromise = e.transformer(model, prevModel)

            return newModelPromise;
        }, initialPromise);

        return transformedModel;
    }

    public async destroy(model: T) {
        await Promise.all(this._extensions.map(async e => e.destroyer(model)))
    }

    public addExtension(extension: ModelExtension<T>) {
        this._extensions.push(extension);
    }
}