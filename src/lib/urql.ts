import {
    cacheExchange,
    createClient,
    dedupExchange,
    fetchExchange,
    makeOperation,
    subscriptionExchange
} from "@urql/core";
import type { Exchange, Operation } from '@urql/core';
import ifetch from 'isomorphic-unfetch';
import { SubscriptionClient } from "subscriptions-transport-ws";
import { fromPromise, fromValue, map, mergeMap, pipe } from 'wonka';

export function client({ url, headers = {}, fetch = ifetch }: { url: string, headers?: (() => any | Promise<any>) | Record<string, string>, fetch?: any }) {

    url = url.replace(/^https?:\/\//, '');

    // allow for async headers...
    const fetchOptionsExchange = (fn: any): Exchange => ({ forward }) => ops$ => {
        return pipe(
            ops$,
            mergeMap((operation: Operation) => {
                const result = fn(operation.context.fetchOptions);
                return pipe(
                    typeof result.then === 'function' ? fromPromise(result) : fromValue(result) as any,
                    map((fetchOptions: RequestInit | (() => RequestInit)) => {
                        return makeOperation(operation.kind, operation, {
                            ...operation.context,
                            fetchOptions
                        });
                    })
                );
            }),
            forward
        );
    };

    const client = createClient({
        fetch,
        url: `https://${url}`,
        exchanges: [
            dedupExchange,
            cacheExchange,
            fetchOptionsExchange(async (fetchOptions: any) => {
                return {
                    ...fetchOptions,
                    headers: typeof headers === 'function' ? await headers() : headers
                };
            }),
            subscriptionExchange({
                forwardSubscription(operation) {
                    return new SubscriptionClient(`wss://${url}`, {
                        reconnect: true,
                        lazy: true,
                        connectionParams: typeof headers === 'function' ? async () => await headers() : headers
                    }).request(operation);
                },
            }),
            fetchExchange
        ]
    });
    return client;
}
