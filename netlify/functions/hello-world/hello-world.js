console.log("Klar til å motta webhooks!")

import algoliasearch from 'algoliasearch';
import sanityClient from '@sanity/client';
import indexer from 'sanity-algolia';
import dotenv from "dotenv";

dotenv.config();

const algolia = algoliasearch(
  process.env.ALGOLIA_APP_ID,
  process.env.ALGOLIA_API_KEY
);

const sanity = sanityClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  apiVersion: '2022-09-25',
  useCdn: false,
});

// Docs on event and context https://docs.netlify.com/functions/build/#code-your-function-2
const handler = async (event, context) => {
  console.log({ req: event, res: context })
  if (event.headers['content-type'] !== 'application/json') {
    context.status(400)
    context.json({ message: 'Bad request' })
    return
  }

  const algoliaIndex = algolia.initIndex(process.env.ALGOLIA_INDEX_NAME);

  const sanityAlgolia = indexer(
    {
      post: {
        index: algoliaIndex,
        // projection: `{
        //   title,
        //   "path": slug.current,
        //   "body": pt::text(body)
        // }`,
      },
      article: {
        index: algoliaIndex,
        // projection: `{
        //   heading,
        //   "body": pt::text(body),
        //   "authorNames": authors[]->name
        // }`,
      },
    },

    (document) => {
      switch (document._type) {
        case 'standard-article':
          return {
            title: document.heading || {},
            body: document.body || {},
            authorNames: document.authorNames || {},
          }
        default:
          return document
      }
    }
  )

  return sanityAlgolia.webhookSync(sanity, event.body)
    .then(() => context.status(200).send("ok"))
}

export { handler };
