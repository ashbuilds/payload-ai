/**
 * Updates an object based on a Payload-style schemaPath.
 * schemaPath example: "posts.content.0.children.1.text"
 */
export function setPayloadFieldValue(doc: any, schemaPath: string, value: any): any {
  const pathParts = schemaPath.split('.');

  if (pathParts.length < 2) {
    throw new Error(`Invalid schemaPath: "${schemaPath}". Must include at least one field after collection.`);
  }

  const fieldPath = pathParts.slice(1); // drop the collection name
  let current = doc;

  for (let i = 0; i < fieldPath.length - 1; i++) {
    const key = fieldPath[i];
    const nextKey = fieldPath[i + 1];

    const isNextIndex = /^\d+$/.test(nextKey);
    const isCurrentIndex = /^\d+$/.test(key);

    if (isCurrentIndex) {
      const index = parseInt(key, 10);
      if (!Array.isArray(current)) {
        throw new Error(`Expected array at "${fieldPath.slice(0, i).join('.')}", but got non-array.`);
      }
      if (!current[index]) current[index] = {};
      current = current[index];
    } else {
      if (!current[key]) {
        current[key] = isNextIndex ? [] : {};
      }
      current = current[key];
    }
  }

  const finalKey = fieldPath[fieldPath.length - 1];
  current[finalKey] = value;

  return doc;
}