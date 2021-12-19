import { Dgraph } from 'easy-dgraph';
import { map, Observable } from 'rxjs';
import { pipe, toObservable } from "wonka";

import { client } from "./urql";
export { EnumType } from 'easy-dgraph';


// extend the original dgraph module
export class dgraph extends Dgraph {

    private _urlOpts: any;
    private _devMode: boolean;
    private _client: any;

    constructor(_opts: { _type?: string, isDevMode?: boolean, url: string, headers?: () => any, fetch?: any }) {
        super(_opts._type);
        this._devMode = _opts.isDevMode || false;
        this._client = client({ url: _opts.url, headers: _opts.headers, fetch: _opts.fetch });
    }

    networkOnly(): this {
        this._urlOpts = { requestPolicy: 'network-only' };
        return this;
    }

    async build() {
        const gq = super.build();
        if (this._devMode) {
            console.log(gq);
        }
        if (this._operation === 'mutation') {
            return await this._client.mutation(gq, this._urlOpts).toPromise()
                .then((r: any) => {
                    if (typeof r.data === 'string') {
                        return r.data;
                    }
                    if (r.error) {
                        console.log(r.error.message);
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
                    return r;
                });
        }
        return await this._client.query(gq, undefined, this._urlOpts).toPromise()
            .then((r: any) => {
                if (r.error) {
                    console.log(r.error.message);
                }
                return r.data ? r.data[Object.keys(r.data)[0]] : null;
            }).then((r: any) => {
                if (this._devMode) {
                    console.log(r);
                }
                return r;
            });
    }
    buildSubscription() {
        this.operation('subscription');
        const gq = super.build();
        if (this._devMode) {
            console.log(gq);
        }
        return new Observable((observable: any) => {
            pipe(
                this._client.subscription(gq),
                toObservable
            ).subscribe(observable);
        }).pipe(
            map((r: any) => {
                if (r.error) {
                    console.log(r.error.message);
                }
                return r.data ? r.data[Object.keys(r.data)[0]] : null;
            }),
            map((r) => {
                if (this._devMode) {
                    console.log(r);
                }
                return r;
            })
        );
    }
}
