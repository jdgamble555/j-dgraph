# j-dgraph

The easy-to-use package to query dgraph easily, without GraphQL.  So far it has been tested on Angular, Angular Universal, and Sveltekit.  It should, however, work in almost any javascript framework both server side and client side. 

Let me know if you have problems in the issue section.

It uses GraphQL, Urql, and my [easy-dgraph](https://github.com/jdgamble555/easy-dgraph) package under-the-hood!

# Installation

`npm i j-dgraph`

# Example Usage

```typescript
import { dgraph } from 'j-dgraph';

...

const dg = new dgraph({
    url: 'https://your-endpoint/graphql',
    headers: async () => ({ "X-Auth-Token": await this.getToken() }),
    isDevMode: isDevMode()
}).pretty();

const r = dg.type('queryFeatureSortedByVotes')
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

console.log(r);
```

# Constructor Options

```typescript
/**
 * @param _opts 
 *   url - api endpoint url
 *   type? - node name
 *   isDevMode? - boolean for Developer Mode
 *   fetch? - fetch function
 *   headers? - headers function, can be async
 */
```

You can also import the EnumType from easy-dgraph like so:

`import { dgraph, EnumType } from 'j-dgraph';`

Every single thing you can do in Dgraph's GraphQL, you can do with no configuration with this package.

See easy-dgraph below for how to query.

J
________

For Documentation, see: [dev.to: easy-dgraph](https://dev.to/jdgamble555/easy-dgraph-create-dgraph-graphql-on-the-fly-10bm)

For Examples, see: [Test File](https://github.com/jdgamble555/easy-dgraph/blob/master/src/lib/easy-dgraph.test.ts)
