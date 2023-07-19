#!/usr/bin/env node

const fs = require('fs');
const yaml = require('yaml');

const inputFiles = process.argv.slice(2);
const outputFile = inputFiles.pop();

console.log(
  `Input files: ${inputFiles.join(', ')}\nOutput file: ${outputFile}`,
);

if (inputFiles.length < 2) {
  console.log('You need at least 2 input files');
  process.exit(1);
}

const parsedFiles = inputFiles.map((file) =>
  yaml.parse(fs.readFileSync(file, 'utf-8')),
);

const result = { collections: [], fields: [], relations: [] };

function mergeCollection(newCollection) {
  if (newCollection && newCollection.collection) {
    const previousCollectionIndex = result.collections.findIndex(
      (collection) => collection.collection === newCollection.collection,
    );
    if (previousCollectionIndex > -1) {
      result.collections[previousCollectionIndex] = {
        ...result.collections[previousCollectionIndex],
        ...newCollection,
      };
    } else {
      result.collections.push(newCollection);
    }
  }
}

function mergeCollections(newCollectionsArray) {
  for (let i = 0, l = newCollectionsArray.length; i < l; i += 1) {
    mergeCollection(newCollectionsArray[i]);
  }
}

function mergeField(newField) {
  if (newField && newField.collection && newField.field) {
    const previousFieldIndex = result.fields.findIndex(
      (field) =>
        field.collection === newField.collection &&
        field.field === newField.field,
    );
    if (previousFieldIndex > -1) {
      result.fields[previousFieldIndex] = {
        ...result.fields[previousFieldIndex],
        ...newField,
      };
    } else {
      result.fields.push(newField);
    }
  }
}

function mergeFields(newFieldsArray) {
  for (let i = 0, l = newFieldsArray.length; i < l; i += 1) {
    mergeField(newFieldsArray[i]);
  }
}

function mergeRelation(newRelation) {
  if (
    newRelation &&
    newRelation.collection &&
    newRelation.field &&
    newRelation.related_collection
  ) {
    const previousRelationIndex = result.relations.findIndex(
      (relation) =>
        relation.collection === newRelation.collection &&
        relation.field === newRelation.field &&
        relation.related_collection === newRelation.related_collection,
    );
    if (previousRelationIndex > -1) {
      result.relations[previousRelationIndex] = {
        ...result.relations[previousRelationIndex],
        ...newRelation,
      };
    } else {
      result.relations.push(newRelation);
    }
  }
}

function mergeRelations(newRelationsArray) {
  for (let i = 0, l = newRelationsArray.length; i < l; i += 1) {
    mergeRelation(newRelationsArray[i]);
  }
}

for (let i = 0; i < parsedFiles.length; i += 1) {
  const json = parsedFiles[i];
  mergeCollections(json.collections);
  mergeFields(json.fields);
  mergeRelations(json.relations);
}

function sort(a, b) {
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
}

result.collections.sort((a, b) => {
  return sort(a.collection, b.collection);
});
result.fields.sort((a, b) => {
  const collectionComparison = sort(a.collection, b.collection);
  if (collectionComparison === 0) {
    return sort(a.field, b.field);
  }
  return collectionComparison;
});
result.relations.sort((a, b) => {
  const collectionComparison = sort(a.collection, b.collection);
  if (collectionComparison === 0) {
    const fieldComparison = sort(a.field, b.field);
    if (fieldComparison === 0) {
      return sort(a.related_collection, b.related_collection);
    }
    return fieldComparison;
  }
  return collectionComparison;
});

fs.writeFileSync(outputFile, yaml.stringify(result), 'utf-8');
