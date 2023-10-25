// @ts-ignore
import { Config } from "payload/generated-types";
import payload from "payload";

type Collections = keyof Config["collections"]
type CollectionData<T extends Collections> = Config["collections"][T]

/**
 * Retrieves the id of a specified document. Payload sometimes represents documents
 * just by their ID as a string, but other times the full document is returned,
 * in which case you have to get the id via the "id" property. This will return
 * the id in either of these cases.
 *
 * @param doc The document which may just be a string id
 * @returns The id of the document
 */
export function getDocumentId(doc: string | { id: string } ) {
    return typeof(doc) === "string" ? doc : doc.id
}

/**
 * Given a Payload ID or document, resolves into a document.
 *
 * @param doc The document to resolve
 * @param collection The collection that it originates from
 * @param forceResolve Whether to always resolve the document
 * @returns The resolved document
 */
export async function resolveDocument<T extends Collections>(doc: string | CollectionData<T>, collection: T) {
    // Find the requested document.
    let resolvedDoc = await payload.findByID({
        id: getDocumentId(doc),
        collection: collection,
        showHiddenFields: true,
        overrideAccess: true
    })

    return resolvedDoc;
}
