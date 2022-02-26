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

    /**
     * @param
     *   url - api endpoint url
     *   type? - node name
     *   isDevMode? - boolean for Developer Mode
     *   fetch? - fetch function
     *   headers? - headers function, can be async
     */
    constructor({ type, isDevMode = false, url, headers }: { type?: string, isDevMode?: boolean, url: string, headers?: () => any, fetch?: any }) {
        super(type);
        this._devMode = isDevMode;
        this._client = client({ url, headers, fetch });
    }

    reset(): this {
        this._error = undefined;
        return this;
    }

    networkOnly(): this {
        this._urlOpts = { requestPolicy: 'network-only' };
        return this;
    }

    private saveData() {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem('j-dgraph', JSON.stringify(this));
        }
    }

    getData() {
        if (typeof window !== 'undefined') {
            return JSON.parse(window.localStorage.getItem('j-dgraph'));
        }
        return this;
    }

    async build(): Promise<{ error?: any, data?: any }> {
        const gq = super.build();
        if (this._devMode) {
            console.log(gq);
        }
        if (this._operation === 'mutation') {
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
                    this.reset();

                    // save data for cache on client
                    this.saveData();

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
                this.reset();

                // save data for cache on client
                this.saveData();

                return r;
            });
    }
    buildSubscription() {
        this.operation('subscription');
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
                r = this._error ? { error: this._error } : { data: r };
                this.reset();
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
