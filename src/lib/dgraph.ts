import { Dgraph } from 'easy-dgraph';
import { map, pipe, subscribe } from "wonka";

import { client } from "./urql";
export { EnumType } from 'easy-dgraph';


// extend the original dgraph module
export class dgraph extends Dgraph {

    private _urlOpts: any;
    private _devMode: boolean;
    private _client: any;
    private _error: string;
    private _prefix: string;

    private _url: string;
    private _fetch: any;
    private _headers: any;
    private _mutationURL: any;

    /**
     * @param
     *   url - api endpoint url
     *   type? - node name
     *   isDevMode? - boolean for Developer Mode
     *   fetch? - fetch function
     *   headers? - headers function, can be async
     *   prefix? - the prefix name for the type
     */
    constructor({
        type,
        isDevMode = false,
        url,
        mutationURL,
        headers,
        fetch,
        prefix = ''
    }: {
        type?: string,
        isDevMode?: boolean,
        url: string,
        mutationURL?: string,
        headers?: () => any,
        fetch?: any,
        prefix?: string
    }) {
        super(type);
        this._devMode = isDevMode;
        this._prefix = prefix;

        this._url = url;
        this._mutationURL = mutationURL;
        this._headers = headers;
        this._fetch = fetch;
    }

    type(type: string, alias?: string, prefix = this._prefix) {
        super.type(type, alias, prefix);
        return this;
    }

    networkOnly(): this {
        this._urlOpts = { requestPolicy: 'network-only' };
        return this;
    }

    async build(): Promise<{ error?: any, data?: any }> {
        const op = this._operation;
        this._client = client({
            url: op === 'mutation' && this._mutationURL ? this._mutationURL : this._url,
            headers: this._headers,
            fetch: this._fetch
        });
        const gq = super.build();
        if (this._devMode) {
            console.log(gq);
        }
        if (op === 'mutation') {
            return await this._client.mutation(gq, this._urlOpts).toPromise()
                .then((r: any) => {
                    if (r.error) {
                        this._error = r.error;
                    }
                    if (typeof r.data === 'string') {
                        return r.data;
                    }
                    const r1 = r.data ? Object.keys(r.data)[0] : '';
                    if (r.data) {
                        if (r.data[r1]) {
                            if (typeof r.data[r1] === 'string') {
                                return r.data[r1];
                            }
                            if (r.data[r1].numUids === 0) {
                                return r.data[r1];
                            }
                            const r2 = r.data[r1][Object.keys(r.data[r1])[0]];
                            if (r2[0]) {
                                return r2[0];
                            }
                            return r2;
                        }
                    }
                    return null;
                }).then((r: any) => {
                    if (this._devMode) {
                        console.log(r);
                    }
                    r = this._error ? { error: this._error } : { data: r };
                    this._error = undefined;
                    return r;
                });
        }
        return await this._client.query(gq, undefined, this._urlOpts).toPromise()
            .then((r: any) => {
                if (r.error) {
                    this._error = r.error;
                }
                return r.data ? r.data[Object.keys(r.data)[0]] : null;
            }).then((r: any) => {
                if (this._devMode) {
                    console.log(r);
                }
                r = this._error ? { error: this._error } : { data: r };
                this._error = undefined;
                return r;
            });
    }
    buildSubscription() {
        this.operation('subscription');
        this._client = client({ url: this._url, headers: this._headers, fetch: this._fetch });
        const gq = super.build();
        if (this._devMode) {
            console.log(gq);
        }
        const p = pipe(
            this._client.subscription(gq),
            map((r: any) => {
                if (r.error) {
                    this._error = r.error;
                }
                return r.data ? r.data[Object.keys(r.data)[0]] : null;
            }),
            map((r: any) => {
                if (this._devMode) {
                    console.log(r);
                }
                this._error = undefined;
                return r;
            })
        );
        return {
            subscribe: (next: any, onError?: (error: any) => void) => {
                pipe(
                    p,
                    subscribe(next)
                );
                this._error ? onError(this._error) : null;
            }
        };
    }
}
