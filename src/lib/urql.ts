import {
    cacheExchange,
    createClient,
    dedupExchange,
    fetchExchange,
    makeOperation,
    subscriptionExchange
} from "@urql/core";
import type { Exchange, Operation } from '@urql/core';
import fetch from 'node-fetch';
import { SubscriptionClient } from "subscriptions-transport-ws";
import { fromPromise, fromValue, map, mergeMap, pipe } from 'wonka';
import * as ws from 'ws';

export function client(_opts: { url: string, headers?: () => any | Promise<any>, fetch?: any }) {

    const _url = _opts.url.replace(/^https?:\/\//, '');
    const _headers = _opts.headers;
    const _fetch = _opts.fetch || fetch;

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

    return createClient({
        fetch: _fetch,
        url: `https://${_url}`,
        exchanges: [
            dedupExchange,
            cacheExchange,
            fetchOptionsExchange(async (fetchOptions: any) => {
                return {
                    ...fetchOptions,
                    headers: await _headers()
                };
            }),
            subscriptionExchange({
                forwardSubscription(operation) {
                    return new SubscriptionClient(`wss://${_url}`, {
                        reconnect: true,
                        lazy: true,
                        connectionParams: async () => await _headers()
                    }, typeof window === 'undefined' ? ws : null).request(operation);
                },
            }),
            fetchExchange
        ]
    });
}
