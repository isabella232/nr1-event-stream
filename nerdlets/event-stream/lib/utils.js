import { NerdGraphQuery, UserStorageQuery, UserStorageMutation } from 'nr1';
import gql from 'graphql-tag';

export const nrdbQuery = async (accountId, query, timeout) => {
  let q = gqlNrqlQuery(accountId, query, timeout);
  let result = await NerdGraphQuery.query({ query: q });
  let nrqlResult =
    (((((result || {}).data || {}).actor || {}).account || {}).nrql || {})
      .results || [];
  return nrqlResult;
};

export const gqlNrqlQuery = (accountId, query, timeout) => {
  return gql`{
    actor {
      account(id: ${accountId}) {
        nrql(query: "${query}", timeout: ${timeout || 30000}) {
          results
        }
      }
    }
  }`;
};

export const nerdGraphQuery = async query => {
  let nerdGraphData = await NerdGraphQuery.query({
    query: gql`
      ${query}
    `,
  });
  return nerdGraphData.data;
};

export const eventStreamQuery = (
  entityGuid,
  accountId,
  query,
  timestamp,
  timeout
) => {
  return gql`{
    actor {
      account(id: ${accountId}) {
        nrdbEvents: nrql(query: "${query} AND timestamp >= ${timestamp} LIMIT 2000", timeout: ${timeout ||
    30000}) {
          results
        },
        stats: nrql(query: "SELECT count(*) FROM Transaction, TransactionError WHERE entityGuid='${entityGuid}' WHERE timestamp >= ${timestamp}", timeout: ${timeout ||
    30000}) {
          results
        }
      }
    }
  }`;
};

export const apmQuery = (entityGuid, query) => `{
  actor {
    entity(guid: "${entityGuid}") {
      nrdbEvents: nrdbQuery(nrql: "${query}") {
        results
      }
      ... on ApmApplicationEntity {
        apmSummary {
          throughput
          errorRate
          hostCount
          instanceCount
          nonWebResponseTimeAverage
          nonWebThroughput
          responseTimeAverage
          webResponseTimeAverage
          webThroughput
          apdexScore
        }
        alertSeverity
      }
    }
  }
}`;

export const uniqByPropMap = prop => arr =>
  Array.from(
    arr
      .reduce(
        (acc, item) => (item && item[prop] && acc.set(item[prop], item), acc), // using map (preserves ordering)
        new Map()
      )
      .values()
  );

export const getCollection = async collection => {
  let result = await UserStorageQuery.query({ collection: collection });
  let collectionResult = (result || {}).data || [];
  return collectionResult;
};

export const writeDocument = async (collection, documentId, payload) => {
  let result = await UserStorageMutation.mutate({
    actionType: UserStorageMutation.ACTION_TYPE.WRITE_DOCUMENT,
    collection: collection,
    documentId: documentId,
    document: payload,
  });
  return result;
};

export const deleteDocument = async (collection, documentId) => {
  let result = await UserStorageMutation.mutate({
    actionType: UserStorageMutation.ACTION_TYPE.DELETE_DOCUMENT,
    collection: collection,
    documentId: documentId,
  });
  return result;
};
