# j-dgraph

The easy-to-use package to query dgraph without GraphQL.  So far it has been tested on Angular, Angular Universal, and Sveltekit.  It should, however, work in almost any javascript framework both server side and client side. 

Let me know if you have problems in the issue section.

It uses GraphQL, Urql, and my [easy-dgraph](https://github.com/jdgamble555/easy-dgraph) package under-the-hood!

# Installation

```typescript
npm i j-dgraph
```

# Example 1

A basic query with headers...

```typescript
import { dgraph } from 'j-dgraph';

const _dgraph = new dgraph({ 
  url: 'https://your-endpoint/graphql', 
  headers: { "X-Auth-Token": localStorage.getItem('X-Auth-Token') }
});

const { data, error } = await _dgraph.type('post').filter('0x1').query({ id: 1, name: 1 }).build();

if (error) {
  console.error(error);
}

console.log(data);
```

# Example 2

Pretty print errors, use headers, and a custom query...

```typescript
import { dgraph } from 'j-dgraph';

...

const dg = new dgraph({
    url: 'https://your-dgraph-endpoint/graphql',
    headers: async () => ({ "X-Auth-Token": await this.getToken() }),
    isDevMode: isDevMode(),
    prefix: 'blog_'
}).pretty();

const { data, error } = await dg.type('queryFeatureSortedByVotes')
      .customQuery({
        id: 1,
        name: 1,
        url: 1,
        author: { id: 1 },
        totalVotes: 1,
        description: 1,
        votes: {
          id: 1
        }
      })
      .build()

if (error) {
  console.error(error);
}

console.log(data);
```

# Example 3

Subscriptions work out-of-the-box with error handling!

```typescript
import { dgraph } from 'j-dgraph';

const _dgraph = new dgraph({ url: 'https://your-endpoint/graphql' });

const sub = _dgraph.type('post').filter('0x1').query({ id: 1, name: 1 })
  .buildSubscription()
  .subscribe(
    (snapshot: any) => {

    console.log(snapshot);

  }, (error: string) => {

    console.error(snapshot);

  });
...

onDestroy(() => 
    sub.unsubscribe();
);

```

# Constructor Options

```typescript
/**
 * @param 
 *   url - api endpoint url
 *   type? - node name
 *   isDevMode? - boolean for Developer Mode
 *   fetch? - fetch function
 *   headers? - headers function, can be async
 *   prefix? - the prefix name for the type
 */
```

**Note:** In development mode, all GraphQL queries and results are printed to the console.  I have simplified all messages in DGraph to be easily readable, including errors.

You can also import the EnumType from easy-dgraph like so:

```typescript
import { dgraph, EnumType } from 'j-dgraph';
```

- Errors are thrown, so use try / catch blocks to catch them.
- use .networkOnly() if you want to skip graphql caching

Every single thing you can do in Dgraph's GraphQL, you can do with no configuration with this package.

J
________

For All Easy-DGraph Documentation, see: [dev.to: easy-dgraph](https://dev.to/jdgamble555/easy-dgraph-create-dgraph-graphql-on-the-fly-10bm)

For Examples, see: [Test File](https://github.com/jdgamble555/easy-dgraph/blob/master/src/lib/easy-dgraph.test.ts)
