import { GraphQLClient } from "graphql-request";
import { ApolloClient, InMemoryCache } from '@apollo/client';

export const client = new ApolloClient({
  uri: 'http://10.34.112.53:5000/',
  cache: new InMemoryCache(),
});

export function GraphQLClientConnector() {
    const endpoint = 'http://10.34.112.53:5000/';
    const graphQLClient = new GraphQLClient(endpoint);

    return graphQLClient;
}